import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp,
  orderBy,
  limit,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AnomalyDetection, AnomalyDetectionConfig } from '../types/logs';

/**
 * 異常アクセス検知システム
 */
export class AnomalyDetectionSystem {

  /**
   * IPアドレスベースの異常検知
   */
  static async detectIpAnomaly(ip: string, config: AnomalyDetectionConfig): Promise<AnomalyDetection | null> {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - config.ipTimeWindowMinutes);
    const timeWindowTimestamp = Timestamp.fromDate(timeWindow);

    // 指定時間内の同一IPからのアクセス数をカウント
    const q = query(
      collection(db, 'accessAttempts'),
      where('sourceIp', '==', ip),
      where('createdAt', '>=', timeWindowTimestamp),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const accessCount = snapshot.size;

    if (accessCount >= config.ipAccessThreshold) {
      const anomaly: Omit<AnomalyDetection, 'id'> = {
        type: 'ip_flood',
        detectedAt: Timestamp.now(),
        sourceIp: ip,
        count: accessCount,
        timeWindow: config.ipTimeWindowMinutes,
        severity: this.calculateSeverity(accessCount, config.ipAccessThreshold),
        notified: false,
        resolved: false
      };

      const docRef = await addDoc(collection(db, 'anomalyDetections'), anomaly);
      
      const result = { id: docRef.id, ...anomaly };
      
      // 通知が有効な場合は送信
      if (config.notificationEnabled) {
        await this.sendNotification(result, config);
      }

      return result;
    }

    return null;
  }

  /**
   * UID（ユーザー）ベースの異常検知
   */
  static async detectUidAnomaly(uid: string, eventType: 'login_failure' | 'session_abuse', config: AnomalyDetectionConfig): Promise<AnomalyDetection | null> {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - config.uidTimeWindowMinutes);
    const timeWindowTimestamp = Timestamp.fromDate(timeWindow);

    let collectionName = '';
    let threshold = 0;
    let anomalyType: AnomalyDetection['type'] = 'uid_failure';

    if (eventType === 'login_failure') {
      collectionName = 'loginHistory';
      threshold = config.uidFailureThreshold;
      anomalyType = 'uid_failure';
    } else if (eventType === 'session_abuse') {
      collectionName = 'sessions';
      threshold = 10; // セッション乱発の閾値
      anomalyType = 'session_abuse';
    }

    // 指定時間内のイベント数をカウント
    const q = query(
      collection(db, collectionName),
      where('uid', '==', uid),
      where('createdAt', '>=', timeWindowTimestamp),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    // ログイン失敗の場合は失敗のみをカウント
    let eventCount = 0;
    if (eventType === 'login_failure') {
      eventCount = snapshot.docs.filter(doc => doc.data().status === 'denied').length;
    } else {
      eventCount = snapshot.size;
    }

    if (eventCount >= threshold) {
      const anomaly: Omit<AnomalyDetection, 'id'> = {
        type: anomalyType,
        detectedAt: Timestamp.now(),
        sourceUid: uid,
        count: eventCount,
        timeWindow: config.uidTimeWindowMinutes,
        severity: this.calculateSeverity(eventCount, threshold),
        notified: false,
        resolved: false
      };

      const docRef = await addDoc(collection(db, 'anomalyDetections'), anomaly);
      
      const result = { id: docRef.id, ...anomaly };
      
      // 通知が有効な場合は送信
      if (config.notificationEnabled) {
        await this.sendNotification(result, config);
      }

      return result;
    }

    return null;
  }

  /**
   * 包括的な異常検知を実行
   */
  static async runAnomalyDetection(): Promise<AnomalyDetection[]> {
    const config = await this.getAnomalyDetectionConfig();
    if (!config?.enabled) {
      return [];
    }

    const detectedAnomalies: AnomalyDetection[] = [];

    // 最近のアクセス試行を取得
    const recentAttempts = await this.getRecentAccessAttempts(config.ipTimeWindowMinutes);
    
    // IPごとの異常検知
    const ipCounts = new Map<string, number>();
    for (const attempt of recentAttempts) {
      if (attempt.sourceIp) {
        ipCounts.set(attempt.sourceIp, (ipCounts.get(attempt.sourceIp) || 0) + 1);
      }
    }

    for (const [ip, count] of ipCounts) {
      if (count >= config.ipAccessThreshold) {
        const anomaly = await this.detectIpAnomaly(ip, config);
        if (anomaly) {
          detectedAnomalies.push(anomaly);
        }
      }
    }

    // UID別の異常検知（ログイン失敗）
    const recentFailures = await this.getRecentLoginFailures(config.uidTimeWindowMinutes);
    const uidFailureCounts = new Map<string, number>();
    
    for (const failure of recentFailures) {
      if (failure.uid) {
        uidFailureCounts.set(failure.uid, (uidFailureCounts.get(failure.uid) || 0) + 1);
      }
    }

    for (const [uid, count] of uidFailureCounts) {
      if (count >= config.uidFailureThreshold) {
        const anomaly = await this.detectUidAnomaly(uid, 'login_failure', config);
        if (anomaly) {
          detectedAnomalies.push(anomaly);
        }
      }
    }

    return detectedAnomalies;
  }

  /**
   * 異常を解決済みにマーク
   */
  static async resolveAnomaly(anomalyId: string, resolvedBy: string): Promise<void> {
    await updateDoc(doc(db, 'anomalyDetections', anomalyId), {
      resolved: true,
      resolvedAt: Timestamp.now(),
      resolvedBy
    });
  }

  /**
   * 未解決の異常を取得
   */
  static async getUnresolvedAnomalies(): Promise<AnomalyDetection[]> {
    const q = query(
      collection(db, 'anomalyDetections'),
      where('resolved', '==', false),
      orderBy('detectedAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AnomalyDetection));
  }

  /**
   * 設定を取得
   */
  private static async getAnomalyDetectionConfig(): Promise<AnomalyDetectionConfig | null> {
    const snapshot = await getDocs(collection(db, 'anomalyDetectionConfigs'));
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AnomalyDetectionConfig;
  }

  /**
   * 最近のアクセス試行を取得
   */
  private static async getRecentAccessAttempts(timeWindowMinutes: number): Promise<any[]> {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);
    const timeWindowTimestamp = Timestamp.fromDate(timeWindow);

    const q = query(
      collection(db, 'accessAttempts'),
      where('createdAt', '>=', timeWindowTimestamp),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * 最近のログイン失敗を取得
   */
  private static async getRecentLoginFailures(timeWindowMinutes: number): Promise<any[]> {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);
    const timeWindowTimestamp = Timestamp.fromDate(timeWindow);

    const q = query(
      collection(db, 'loginHistory'),
      where('status', '==', 'denied'),
      where('createdAt', '>=', timeWindowTimestamp),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * 深刻度を計算
   */
  private static calculateSeverity(count: number, threshold: number): AnomalyDetection['severity'] {
    const ratio = count / threshold;
    if (ratio >= 3) return 'high';
    if (ratio >= 2) return 'medium';
    return 'low';
  }

  /**
   * 通知を送信
   */
  private static async sendNotification(anomaly: AnomalyDetection, config: AnomalyDetectionConfig): Promise<void> {
    if (!config.slackWebhookUrl) return;

    const message = {
      text: `🚨 異常アクセス検知`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*異常アクセス検知*\n種類: ${anomaly.type}\n深刻度: ${anomaly.severity}\n検知時刻: ${anomaly.detectedAt.toDate().toLocaleString('ja-JP')}`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*ソース IP*\n${anomaly.sourceIp || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*ソース UID*\n${anomaly.sourceUid || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*イベント数*\n${anomaly.count}`
            },
            {
              type: "mrkdwn",
              text: `*時間窓*\n${anomaly.timeWindow}分`
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(config.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        // 通知済みフラグを更新
        await updateDoc(doc(db, 'anomalyDetections', anomaly.id), {
          notified: true
        });
      }
    } catch (error) {
      console.error('Slack通知エラー:', error);
    }
  }
}
