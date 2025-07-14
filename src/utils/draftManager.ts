import type { Draft } from '../types/logs';

/**
 * 下書き保存マネージャー
 */
export class DraftManager {
  private static readonly DRAFT_KEY_PREFIX = 'memo_app_draft_';
  private static readonly AUTO_SAVE_INTERVAL = 5000; // 5秒間隔
  private static readonly DRAFT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7日間

  /**
   * 下書きを保存
   */
  static saveDraft(draft: Omit<Draft, 'lastSaved'>): void {
    try {
      const fullDraft: Draft = {
        ...draft,
        lastSaved: Date.now()
      };
      
      const key = this.getDraftKey(draft.type, draft.id);
      localStorage.setItem(key, JSON.stringify(fullDraft));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  /**
   * 下書きを取得
   */
  static getDraft(type: 'note' | 'thread', id: string): Draft | null {
    try {
      const key = this.getDraftKey(type, id);
      const draftData = localStorage.getItem(key);
      
      if (!draftData) return null;
      
      const draft: Draft = JSON.parse(draftData);
      
      // 期限切れチェック
      if (Date.now() - draft.lastSaved > this.DRAFT_EXPIRY) {
        this.deleteDraft(type, id);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.error('Failed to get draft:', error);
      return null;
    }
  }

  /**
   * 下書きを削除
   */
  static deleteDraft(type: 'note' | 'thread', id: string): void {
    try {
      const key = this.getDraftKey(type, id);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }

  /**
   * すべての下書きを取得
   */
  static getAllDrafts(): Draft[] {
    try {
      const drafts: Draft[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.DRAFT_KEY_PREFIX)) {
          const draftData = localStorage.getItem(key);
          if (draftData) {
            try {
              const draft: Draft = JSON.parse(draftData);
              
              // 期限切れチェック
              if (Date.now() - draft.lastSaved <= this.DRAFT_EXPIRY) {
                drafts.push(draft);
              } else {
                localStorage.removeItem(key);
              }
            } catch {
              // 無効なデータは削除
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      return drafts.sort((a, b) => b.lastSaved - a.lastSaved);
    } catch (error) {
      console.error('Failed to get all drafts:', error);
      return [];
    }
  }

  /**
   * 期限切れの下書きをクリーンアップ
   */
  static cleanupExpiredDrafts(): number {
    try {
      let cleanedCount = 0;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.DRAFT_KEY_PREFIX)) {
          const draftData = localStorage.getItem(key);
          if (draftData) {
            try {
              const draft: Draft = JSON.parse(draftData);
              
              if (Date.now() - draft.lastSaved > this.DRAFT_EXPIRY) {
                keysToRemove.push(key);
              }
            } catch {
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleanedCount++;
      });
      
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired drafts:', error);
      return 0;
    }
  }

  /**
   * 自動保存を開始
   */
  static startAutoSave(
    type: 'note' | 'thread',
    id: string,
    getContent: () => { title?: string; content?: string; color?: string; threadId?: string },
    options: { enabled: boolean } = { enabled: true }
  ): () => void {
    if (!options.enabled) {
      return () => {};
    }

    const interval = setInterval(() => {
      try {
        const content = getContent();
        
        // 空の場合は保存しない
        if (!content.title?.trim() && !content.content?.trim()) {
          return;
        }
        
        const draft: Omit<Draft, 'lastSaved'> = {
          id,
          type,
          threadId: content.threadId,
          title: content.title,
          content: content.content,
          color: content.color,
          autoSaved: true
        };
        
        this.saveDraft(draft);
      } catch (error) {
        console.error('Auto save error:', error);
      }
    }, this.AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }

  /**
   * 下書きキーを生成
   */
  private static getDraftKey(type: 'note' | 'thread', id: string): string {
    return `${this.DRAFT_KEY_PREFIX}${type}_${id}`;
  }

  /**
   * 下書きの概要テキストを生成
   */
  static getDraftSummary(draft: Draft): string {
    const title = draft.title?.trim();
    const content = draft.content?.trim();
    
    if (title && content) {
      return `${title} - ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
    } else if (title) {
      return title;
    } else if (content) {
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    } else {
      return '空の下書き';
    }
  }

  /**
   * 下書きの最終保存時刻を人間が読める形式で取得
   */
  static getLastSavedText(draft: Draft): string {
    const now = Date.now();
    const diff = now - draft.lastSaved;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days}日前`;
    } else if (hours > 0) {
      return `${hours}時間前`;
    } else if (minutes > 0) {
      return `${minutes}分前`;
    } else {
      return '今';
    }
  }
}
