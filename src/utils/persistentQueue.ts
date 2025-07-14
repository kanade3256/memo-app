import type { QueueItem } from '../types/logs';

/**
 * オフライン対応の永続化キューマネージャー
 */
export class PersistentQueueManager {
  private static readonly QUEUE_KEY = 'memo_app_queue';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1秒

  /**
   * キューにアイテムを追加
   */
  static async addToQueue(type: QueueItem['type'], data: any): Promise<string> {
    const queueItem: QueueItem = {
      id: this.generateId(),
      type,
      data,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      status: 'pending'
    };

    const queue = this.getQueue();
    queue.push(queueItem);
    this.saveQueue(queue);

    return queueItem.id;
  }

  /**
   * キューの処理を開始
   */
  static async processQueue(
    processor: (item: QueueItem) => Promise<boolean>
  ): Promise<{ processed: number; failed: number }> {
    const queue = this.getQueue();
    let processed = 0;
    let failed = 0;

    for (const item of queue.filter(i => i.status === 'pending')) {
      try {
        // アイテムを処理中に変更
        this.updateItemStatus(item.id, 'processing');

        const success = await processor(item);

        if (success) {
          this.updateItemStatus(item.id, 'completed');
          processed++;
        } else {
          await this.handleRetry(item);
          if (item.status === 'failed') {
            failed++;
          }
        }
      } catch (error) {
        await this.handleRetry(item, error instanceof Error ? error.message : 'Unknown error');
        if (item.status === 'failed') {
          failed++;
        }
      }
    }

    // 完了したアイテムを削除
    this.cleanupCompletedItems();

    return { processed, failed };
  }

  /**
   * リトライ処理
   */
  private static async handleRetry(item: QueueItem, errorMessage?: string): Promise<void> {
    item.retryCount++;
    item.errorMessage = errorMessage;

    if (item.retryCount >= item.maxRetries) {
      this.updateItemStatus(item.id, 'failed');
    } else {
      this.updateItemStatus(item.id, 'pending');
      // 指数バックオフでリトライ
      setTimeout(() => {
        // 次回処理で再試行される
      }, this.RETRY_DELAY * Math.pow(2, item.retryCount - 1));
    }
  }

  /**
   * キューの状態を取得
   */
  static getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    items: QueueItem[];
  } {
    const queue = this.getQueue();
    
    return {
      pending: queue.filter(i => i.status === 'pending').length,
      processing: queue.filter(i => i.status === 'processing').length,
      completed: queue.filter(i => i.status === 'completed').length,
      failed: queue.filter(i => i.status === 'failed').length,
      items: queue
    };
  }

  /**
   * 失敗したアイテムを再試行
   */
  static retryFailedItems(): number {
    const queue = this.getQueue();
    const failedItems = queue.filter(i => i.status === 'failed');
    
    failedItems.forEach(item => {
      item.status = 'pending';
      item.retryCount = 0;
      item.errorMessage = undefined;
    });

    this.saveQueue(queue);
    return failedItems.length;
  }

  /**
   * キューをクリア
   */
  static clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  /**
   * 特定のアイテムを削除
   */
  static removeItem(itemId: string): boolean {
    const queue = this.getQueue();
    const initialLength = queue.length;
    const updatedQueue = queue.filter(item => item.id !== itemId);
    
    if (updatedQueue.length !== initialLength) {
      this.saveQueue(updatedQueue);
      return true;
    }
    return false;
  }

  /**
   * キューを取得
   */
  private static getQueue(): QueueItem[] {
    try {
      const queueData = localStorage.getItem(this.QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch {
      return [];
    }
  }

  /**
   * キューを保存
   */
  private static saveQueue(queue: QueueItem[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  /**
   * アイテムのステータスを更新
   */
  private static updateItemStatus(itemId: string, status: QueueItem['status']): void {
    const queue = this.getQueue();
    const item = queue.find(i => i.id === itemId);
    if (item) {
      item.status = status;
      this.saveQueue(queue);
    }
  }

  /**
   * 完了したアイテムをクリーンアップ
   */
  private static cleanupCompletedItems(): void {
    const queue = this.getQueue();
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24時間前

    const cleanedQueue = queue.filter(item => 
      item.status !== 'completed' || item.createdAt > cutoffTime
    );

    if (cleanedQueue.length !== queue.length) {
      this.saveQueue(cleanedQueue);
    }
  }

  /**
   * ユニークIDを生成
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ネットワーク状態を監視してキューを自動処理
   */
  static startAutoProcessing(
    processor: (item: QueueItem) => Promise<boolean>,
    interval: number = 30000 // 30秒間隔
  ): () => void {
    let isProcessing = false;
    
    const processQueueInterval = setInterval(async () => {
      if (isProcessing || !navigator.onLine) return;
      
      isProcessing = true;
      try {
        await this.processQueue(processor);
      } catch (error) {
        console.error('Auto queue processing error:', error);
      } finally {
        isProcessing = false;
      }
    }, interval);

    // ネットワーク復旧時の処理
    const handleOnline = async () => {
      if (isProcessing) return;
      
      isProcessing = true;
      try {
        await this.processQueue(processor);
      } catch (error) {
        console.error('Online queue processing error:', error);
      } finally {
        isProcessing = false;
      }
    };

    window.addEventListener('online', handleOnline);

    // クリーンアップ関数を返す
    return () => {
      clearInterval(processQueueInterval);
      window.removeEventListener('online', handleOnline);
    };
  }
}
