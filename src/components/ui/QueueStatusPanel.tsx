import React, { useState, useEffect } from 'react';
import { 
  QueueListIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { PersistentQueueManager } from '../../utils/persistentQueue';
import type { QueueItem } from '../../types/logs';

interface QueueStatusPanelProps {
  className?: string;
}

const QueueStatusPanel: React.FC<QueueStatusPanelProps> = ({ className = '' }) => {
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    items: [] as QueueItem[]
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // 初期状態を取得
    updateQueueStatus();

    // ネットワーク状態監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期的な状態更新
    const interval = setInterval(updateQueueStatus, 5000); // 5秒間隔

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateQueueStatus = () => {
    const status = PersistentQueueManager.getQueueStatus();
    setQueueStatus(status);
  };

  const handleRetryFailed = () => {
    const retryCount = PersistentQueueManager.retryFailedItems();
    if (retryCount > 0) {
      updateQueueStatus();
    }
  };

  const handleClearCompleted = () => {
    const completedItems = queueStatus.items.filter(item => item.status === 'completed');
    completedItems.forEach(item => {
      PersistentQueueManager.removeItem(item.id);
    });
    updateQueueStatus();
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return '待機中';
      case 'processing': return '処理中';
      case 'completed': return '完了';
      case 'failed': return '失敗';
      default: return '不明';
    }
  };

  const getTypeText = (type: QueueItem['type']) => {
    switch (type) {
      case 'create_note': return 'メモ作成';
      case 'update_note': return 'メモ更新';
      case 'delete_note': return 'メモ削除';
      case 'create_thread': return 'スレッド作成';
      case 'update_thread': return 'スレッド更新';
      default: return type;
    }
  };

  const hasActiveItems = queueStatus.pending > 0 || queueStatus.processing > 0 || queueStatus.failed > 0;

  if (!hasActiveItems && queueStatus.completed === 0) {
    return null; // キューが空の場合は非表示
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QueueListIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">同期状態</span>
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <WifiIcon className="h-4 w-4 text-green-500" />
              ) : (
                <SignalSlashIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'オンライン' : 'オフライン'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {queueStatus.failed > 0 && (
              <button
                onClick={handleRetryFailed}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                再試行
              </button>
            )}
            {queueStatus.completed > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                完了をクリア
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-yellow-600">{queueStatus.pending}</div>
            <div className="text-xs text-gray-600">待機中</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-blue-600">{queueStatus.processing}</div>
            <div className="text-xs text-gray-600">処理中</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-green-600">{queueStatus.completed}</div>
            <div className="text-xs text-gray-600">完了</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-red-600">{queueStatus.failed}</div>
            <div className="text-xs text-gray-600">失敗</div>
          </div>
        </div>
      </div>

      {/* アイテム詳細（アクティブなもののみ表示） */}
      {hasActiveItems && (
        <div className="border-t border-gray-200">
          <div className="max-h-32 overflow-y-auto">
            {queueStatus.items
              .filter(item => item.status !== 'completed')
              .slice(0, 5) // 最大5件まで表示
              .map((item) => (
                <div key={item.id} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm text-gray-900">{getTypeText(item.type)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {getStatusText(item.status)}
                      </span>
                      {item.retryCount > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">
                          {item.retryCount}回目
                        </span>
                      )}
                    </div>
                  </div>
                  {item.errorMessage && (
                    <div className="mt-1 text-xs text-red-600 truncate">
                      {item.errorMessage}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueStatusPanel;
