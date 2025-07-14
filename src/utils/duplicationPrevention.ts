import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { DuplicationRecord } from '../types/logs';

/**
 * 重複データ防止システム
 */
export class DuplicationPreventionSystem {
  private static readonly DUPLICATE_WINDOW_SECONDS = 10; // 10秒以内の重複をチェック

  /**
   * コンテンツのハッシュを生成
   */
  private static generateContentHash(content: any): string {
    // シンプルなハッシュ関数（本格的にはcrypto.subtle.digestを使用推奨）
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 重複チェックを実行
   */
  static async checkDuplication(
    type: 'note' | 'thread',
    content: any,
    createdBy: string
  ): Promise<{ isDuplicate: boolean; originalId?: string; message?: string }> {
    try {
      const contentHash = this.generateContentHash(content);
      const timeWindow = new Date();
      timeWindow.setSeconds(timeWindow.getSeconds() - this.DUPLICATE_WINDOW_SECONDS);
      const timeWindowTimestamp = Timestamp.fromDate(timeWindow);

      // 重複記録をチェック
      const q = query(
        collection(db, 'duplicationRecords'),
        where('type', '==', type),
        where('contentHash', '==', contentHash),
        where('createdBy', '==', createdBy),
        where('createdAt', '>=', timeWindowTimestamp)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const duplicateRecord = snapshot.docs[0].data() as DuplicationRecord;
        return {
          isDuplicate: true,
          originalId: duplicateRecord.originalId,
          message: `${this.DUPLICATE_WINDOW_SECONDS}秒以内に同じ内容が作成されています`
        };
      }

      return { isDuplicate: false };

    } catch (error) {
      console.error('Duplication check error:', error);
      // エラーの場合は重複なしとして処理を続行
      return { isDuplicate: false };
    }
  }

  /**
   * 重複記録を保存
   */
  static async recordCreation(
    type: 'note' | 'thread',
    content: any,
    createdBy: string,
    originalId: string
  ): Promise<void> {
    try {
      const contentHash = this.generateContentHash(content);
      
      const duplicationRecord: Omit<DuplicationRecord, 'id'> = {
        type,
        contentHash,
        createdBy,
        createdAt: Timestamp.now(),
        originalId
      };

      await addDoc(collection(db, 'duplicationRecords'), duplicationRecord);
    } catch (error) {
      console.error('Failed to record creation:', error);
      // 記録に失敗してもメイン処理は続行
    }
  }

  /**
   * 古い重複記録をクリーンアップ
   */
  static async cleanupOldRecords(): Promise<number> {
    try {
      // 1日以上古い記録を削除
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 1);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

      const q = query(
        collection(db, 'duplicationRecords'),
        where('createdAt', '<', cutoffTimestamp)
      );

      const snapshot = await getDocs(q);
      
      // バッチ削除で実装する場合
      // const batch = writeBatch(db);
      // snapshot.docs.forEach(doc => batch.delete(doc.ref));
      // await batch.commit();

      return snapshot.size;
    } catch (error) {
      console.error('Failed to cleanup old records:', error);
      return 0;
    }
  }

  /**
   * ノート作成時の重複チェック
   */
  static async checkNoteContent(
    title: string,
    text: string,
    createdBy: string
  ): Promise<{ isDuplicate: boolean; originalId?: string; message?: string }> {
    const content = { title: title.trim(), text: text.trim() };
    return this.checkDuplication('note', content, createdBy);
  }

  /**
   * スレッド作成時の重複チェック
   */
  static async checkThreadContent(
    title: string,
    description: string,
    createdBy: string
  ): Promise<{ isDuplicate: boolean; originalId?: string; message?: string }> {
    const content = { title: title.trim(), description: description.trim() };
    return this.checkDuplication('thread', content, createdBy);
  }

  /**
   * 高度な重複チェック（類似度ベース）
   */
  static calculateSimilarity(text1: string, text2: string): number {
    // シンプルな類似度計算（Jaccard係数）
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 類似コンテンツの検出
   */
  static async findSimilarContent(
    type: 'note' | 'thread',
    content: string,
    createdBy: string,
    similarityThreshold: number = 0.8
  ): Promise<{ isSimilar: boolean; similarItems: any[]; message?: string }> {
    try {
      // 最近の同じユーザーのコンテンツを取得
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - 30); // 30分以内
      const timeWindowTimestamp = Timestamp.fromDate(timeWindow);

      const collectionName = type === 'note' ? 'notes' : 'threads';
      const q = query(
        collection(db, collectionName),
        where('createdBy', '==', createdBy),
        where('createdAt', '>=', timeWindowTimestamp)
      );

      const snapshot = await getDocs(q);
      const similarItems: any[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const existingContent = type === 'note' 
          ? `${data.title} ${data.text}` 
          : `${data.title} ${data.description || ''}`;
        
        const similarity = this.calculateSimilarity(content, existingContent);
        
        if (similarity >= similarityThreshold) {
          similarItems.push({
            id: doc.id,
            similarity,
            ...data
          });
        }
      });

      return {
        isSimilar: similarItems.length > 0,
        similarItems,
        message: similarItems.length > 0 
          ? `類似したコンテンツが${similarItems.length}件見つかりました` 
          : undefined
      };

    } catch (error) {
      console.error('Similar content check error:', error);
      return { isSimilar: false, similarItems: [] };
    }
  }
}
