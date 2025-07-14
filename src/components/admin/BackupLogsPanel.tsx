import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { 
  CloudArrowDownIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { BackupLog } from '../../types/logs';

const BackupLogsPanel: React.FC = () => {
  const { userData } = useAuth();
  const { showToast } = useToast();
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // 権限チェック
  if (!userData || !['professor', 'developer'].includes(userData.role)) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <CloudArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">バックアップ機能は教授または開発者のみ利用できます</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadBackupLogs();
  }, []);

  const loadBackupLogs = async () => {
    try {
      const q = query(
        collection(db, 'backupLogs'),
        orderBy('startedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BackupLog));
      setBackupLogs(logs);
    } catch (error) {
      showToast('バックアップログの読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeBackup = async (collections: string[], format: 'json' | 'csv') => {
    if (isBackingUp) return;
    
    setIsBackingUp(true);
    
    // バックアップログエントリを作成
    const backupLog: Omit<BackupLog, 'id'> = {
      startedAt: Timestamp.now(),
      status: 'running',
      collections,
      exportFormat: format,
      initiatedBy: userData!.email
    };

    try {
      const docRef = await addDoc(collection(db, 'backupLogs'), backupLog);
      
      // 実際のバックアップ処理を実行
      const result = await performBackup(collections, format);
      
      // バックアップ完了の更新
      const updateData = {
        completedAt: Timestamp.now(),
        status: result.success ? 'success' : 'failed',
        fileSize: result.fileSize,
        errorMessage: result.error
      };

      await updateDoc(doc(db, 'backupLogs', docRef.id), updateData);
      
      // ログリストを再読み込み
      await loadBackupLogs();
      
      if (result.success) {
        showToast('バックアップが完了しました', 'success');
        
        // ファイルダウンロード
        if (result.blob) {
          const url = URL.createObjectURL(result.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `backup_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        showToast(`バックアップに失敗しました: ${result.error}`, 'error');
      }
      
    } catch (error) {
      showToast('バックアップ処理でエラーが発生しました', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const performBackup = async (collections: string[], format: 'json' | 'csv'): Promise<{
    success: boolean;
    fileSize?: number;
    blob?: Blob;
    error?: string;
  }> => {
    try {
      const data: { [key: string]: any[] } = {};
      
      // 各コレクションのデータを取得
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        data[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Timestampを文字列に変換
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || doc.data().updatedAt
        }));
      }

      let blob: Blob;
      
      if (format === 'json') {
        const jsonString = JSON.stringify(data, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
      } else {
        // CSV形式での出力
        let csvContent = '';
        
        for (const [collectionName, items] of Object.entries(data)) {
          csvContent += `\n=== ${collectionName} ===\n`;
          
          if (items.length > 0) {
            // ヘッダー行
            const headers = Object.keys(items[0]);
            csvContent += headers.join(',') + '\n';
            
            // データ行
            items.forEach(item => {
              const row = headers.map(header => {
                const value = item[header];
                if (typeof value === 'string' && value.includes(',')) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
              });
              csvContent += row.join(',') + '\n';
            });
          }
          csvContent += '\n';
        }
        
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      }

      return {
        success: true,
        fileSize: blob.size,
        blob
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const getStatusIcon = (status: BackupLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: BackupLog['status']) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失敗';
      case 'running': return '実行中';
      default: return '不明';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CloudArrowDownIcon className="h-6 w-6 text-blue-500 mr-2" />
              バックアップ管理
            </h2>
            <p className="text-gray-600 mt-1">データのバックアップ実行と履歴管理</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => executeBackup(['notes', 'threads', 'users'], 'json')}
              disabled={isBackingUp}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {isBackingUp ? 'バックアップ中...' : 'JSON バックアップ'}
            </button>
            
            <button
              onClick={() => executeBackup(['notes', 'threads', 'users'], 'csv')}
              disabled={isBackingUp}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {isBackingUp ? 'バックアップ中...' : 'CSV バックアップ'}
            </button>
          </div>
        </div>
      </div>

      {/* バックアップ履歴 */}
      <div className="p-6">
        {backupLogs.length === 0 ? (
          <div className="text-center py-8">
            <CloudArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">バックアップ履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {backupLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {getStatusText(log.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.exportFormat.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        開始: {log.startedAt.toDate().toLocaleString('ja-JP')}
                        {log.completedAt && ` | 完了: ${log.completedAt.toDate().toLocaleString('ja-JP')}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      実行者: {log.initiatedBy}
                    </p>
                    <p className="text-sm text-gray-500">
                      サイズ: {formatFileSize(log.fileSize)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    対象: {log.collections.join(', ')}
                  </p>
                  {log.errorMessage && (
                    <p className="text-sm text-red-600 mt-1">
                      エラー: {log.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupLogsPanel;
