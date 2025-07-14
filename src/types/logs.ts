import type { Timestamp } from 'firebase/firestore';

// ログ保持期間設定
export interface LogRetentionConfig {
  id: string;
  logType: 'loginHistory' | 'errorLogs' | 'sessions' | 'accessAttempts';
  retentionDays: number;
  lastCleanup?: Timestamp;
  enabled: boolean;
}

// 異常アクセス検知設定
export interface AnomalyDetectionConfig {
  id: string;
  enabled: boolean;
  ipAccessThreshold: number; // 同一IPからの短時間アクセス数制限
  ipTimeWindowMinutes: number; // 時間窓（分）
  uidFailureThreshold: number; // 同一UIDの連続ログイン失敗回数制限
  uidTimeWindowMinutes: number; // 時間窓（分）
  notificationEnabled: boolean;
  slackWebhookUrl?: string;
}

// 異常アクセス検知結果
export interface AnomalyDetection {
  id: string;
  type: 'ip_flood' | 'uid_failure' | 'session_abuse';
  detectedAt: Timestamp;
  sourceIp?: string;
  sourceUid?: string;
  count: number;
  timeWindow: number;
  severity: 'low' | 'medium' | 'high';
  notified: boolean;
  resolved: boolean;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
}

// バックアップログ
export interface BackupLog {
  id: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  status: 'running' | 'success' | 'failed';
  collections: string[];
  exportFormat: 'json' | 'csv';
  fileSize?: number;
  errorMessage?: string;
  initiatedBy: string;
}

// エクスポート設定
export interface ExportConfig {
  id: string;
  name: string;
  collections: string[];
  format: 'json' | 'csv';
  includeMetadata: boolean;
  dateRange?: {
    from: Timestamp;
    to: Timestamp;
  };
  createdBy: string;
  createdAt: Timestamp;
}

// キューアイテム（オフライン対応）
export interface QueueItem {
  id: string;
  type: 'create_note' | 'update_note' | 'delete_note' | 'create_thread' | 'update_thread';
  data: any;
  createdAt: number; // timestamp
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// 重複データ防止記録
export interface DuplicationRecord {
  id: string;
  type: 'note' | 'thread';
  contentHash: string;
  createdBy: string;
  createdAt: Timestamp;
  originalId: string;
}

// 下書き保存
export interface Draft {
  id: string;
  type: 'note' | 'thread';
  threadId?: string;
  title?: string;
  content?: string;
  color?: string;
  lastSaved: number; // timestamp
  autoSaved: boolean;
}

// 一括操作選択項目
export interface SelectionItem {
  id: string;
  type: 'note' | 'thread';
  selected: boolean;
  data: any;
}

// 一括操作結果
export interface BulkOperationResult {
  operation: 'delete' | 'update';
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}
