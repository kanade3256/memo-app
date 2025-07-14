import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  Timestamp,
  writeBatch,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { LogRetentionConfig } from '../types/logs';

/**
 * ログ保持期間制御ユーティリティ
 */
export class LogRetentionManager {
  
  /**
   * 古いログを削除する
   */
  static async cleanupOldLogs(config: LogRetentionConfig): Promise<{ deleted: number; errors: string[] }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const errors: string[] = [];
    let totalDeleted = 0;

    try {
      // コレクション名を決定
      const collectionName = this.getCollectionName(config.logType);
      
      // 古いドキュメントを取得
      const q = query(
        collection(db, collectionName),
        where('createdAt', '<', cutoffTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { deleted: 0, errors: [] };
      }

      // バッチ削除（最大500件ずつ）
      const batches: any[][] = [];
      let currentBatch: any[] = [];
      
      snapshot.docs.forEach((doc) => {
        currentBatch.push(doc);
        if (currentBatch.length === 500) {
          batches.push([...currentBatch]);
          currentBatch = [];
        }
      });
      
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      // バッチごとに削除実行
      for (const batch of batches) {
        const writeBatchRef = writeBatch(db);
        
        batch.forEach((docRef) => {
          writeBatchRef.delete(docRef.ref);
        });
        
        try {
          await writeBatchRef.commit();
          totalDeleted += batch.length;
        } catch (error) {
          errors.push(`バッチ削除エラー: ${error}`);
        }
      }

      // 最終クリーンアップ時刻を更新
      await this.updateLastCleanup(config.id);

    } catch (error) {
      errors.push(`ログクリーンアップエラー: ${error}`);
    }

    return { deleted: totalDeleted, errors };
  }

  /**
   * すべての有効な設定でクリーンアップを実行
   */
  static async cleanupAllLogs(): Promise<{ [key: string]: { deleted: number; errors: string[] } }> {
    const configs = await this.getLogRetentionConfigs();
    const results: { [key: string]: { deleted: number; errors: string[] } } = {};

    for (const config of configs) {
      if (config.enabled) {
        results[config.logType] = await this.cleanupOldLogs(config);
      }
    }

    return results;
  }

  /**
   * ログ保持設定を取得
   */
  static async getLogRetentionConfigs(): Promise<LogRetentionConfig[]> {
    const snapshot = await getDocs(collection(db, 'logRetentionConfigs'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LogRetentionConfig));
  }

  /**
   * ログ保持設定を作成または更新
   */
  static async saveLogRetentionConfig(config: Omit<LogRetentionConfig, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'logRetentionConfigs'), config);
    return docRef.id;
  }

  /**
   * ログ保持設定を更新
   */
  static async updateLogRetentionConfig(configId: string, updates: Partial<LogRetentionConfig>): Promise<void> {
    await updateDoc(doc(db, 'logRetentionConfigs', configId), updates);
  }

  /**
   * 最終クリーンアップ時刻を更新
   */
  private static async updateLastCleanup(configId: string): Promise<void> {
    await updateDoc(doc(db, 'logRetentionConfigs', configId), {
      lastCleanup: Timestamp.now()
    });
  }

  /**
   * ログタイプからコレクション名を取得
   */
  private static getCollectionName(logType: LogRetentionConfig['logType']): string {
    const collectionMap = {
      'loginHistory': 'loginHistory',
      'errorLogs': 'errorLogs',
      'sessions': 'sessions',
      'accessAttempts': 'accessAttempts'
    };
    return collectionMap[logType];
  }

  /**
   * ログ統計情報を取得
   */
  static async getLogStats(): Promise<{ [key: string]: { total: number; oldCount: number } }> {
    const configs = await this.getLogRetentionConfigs();
    const stats: { [key: string]: { total: number; oldCount: number } } = {};

    for (const config of configs) {
      const collectionName = this.getCollectionName(config.logType);
      
      // 総数を取得
      const totalSnapshot = await getDocs(collection(db, collectionName));
      
      // 古いログ数を取得
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
      
      const oldSnapshot = await getDocs(
        query(
          collection(db, collectionName),
          where('createdAt', '<', cutoffTimestamp)
        )
      );

      stats[config.logType] = {
        total: totalSnapshot.size,
        oldCount: oldSnapshot.size
      };
    }

    return stats;
  }
}
