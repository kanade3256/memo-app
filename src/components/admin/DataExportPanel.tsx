import React, { useState } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { 
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ExportOptions {
  collections: string[];
  format: 'json' | 'csv';
  includeMetadata: boolean;
  dateRange: {
    enabled: boolean;
    from: string;
    to: string;
  };
}

const DataExportPanel: React.FC = () => {
  const { userData } = useAuth();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    collections: ['notes', 'threads'],
    format: 'json',
    includeMetadata: true,
    dateRange: {
      enabled: false,
      from: '',
      to: ''
    }
  });

  // 権限チェック
  if (!userData || !['professor', 'developer'].includes(userData.role)) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">エクスポート機能は教授または開発者のみ利用できます</p>
        </div>
      </div>
    );
  }

  const availableCollections = [
    { id: 'notes', name: 'メモ', description: 'すべてのメモデータ' },
    { id: 'threads', name: 'スレッド', description: 'スレッド情報' },
    { id: 'users', name: 'ユーザー', description: 'ユーザー情報' },
    { id: 'loginHistory', name: 'ログイン履歴', description: 'ログイン・ログアウト記録' },
    { id: 'errorLogs', name: 'エラーログ', description: 'システムエラー記録' },
    { id: 'sessions', name: 'セッション', description: 'ユーザーセッション情報' }
  ];

  const handleCollectionChange = (collectionId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      collections: checked 
        ? [...prev.collections, collectionId]
        : prev.collections.filter(id => id !== collectionId)
    }));
  };

  const executeExport = async () => {
    if (exportOptions.collections.length === 0) {
      showToast('エクスポートするコレクションを選択してください', 'error');
      return;
    }

    setIsExporting(true);

    try {
      const data: { [key: string]: any[] } = {};
      
      // 日付範囲の設定
      let dateFilter: { from?: Timestamp; to?: Timestamp } | null = null;
      if (exportOptions.dateRange.enabled && exportOptions.dateRange.from && exportOptions.dateRange.to) {
        dateFilter = {
          from: Timestamp.fromDate(new Date(exportOptions.dateRange.from)),
          to: Timestamp.fromDate(new Date(exportOptions.dateRange.to))
        };
      }

      // 各コレクションのデータを取得
      for (const collectionId of exportOptions.collections) {
        let collectionQuery = collection(db, collectionId);
        
        // 日付フィルターがある場合は適用
        if (dateFilter) {
          collectionQuery = query(
            collection(db, collectionId),
            where('createdAt', '>=', dateFilter.from),
            where('createdAt', '<=', dateFilter.to)
          ) as any;
        }

        const snapshot = await getDocs(collectionQuery);
        
        data[collectionId] = snapshot.docs.map(doc => {
          const docData = doc.data();
          const result: any = { id: doc.id };

          // メタデータの処理
          if (exportOptions.includeMetadata) {
            // Timestampを文字列に変換
            Object.keys(docData).forEach(key => {
              if (docData[key]?.toDate) {
                result[key] = docData[key].toDate().toISOString();
              } else {
                result[key] = docData[key];
              }
            });
          } else {
            // メタデータ以外のフィールドのみ
            const excludeFields = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
            Object.keys(docData).forEach(key => {
              if (!excludeFields.includes(key)) {
                if (docData[key]?.toDate) {
                  result[key] = docData[key].toDate().toISOString();
                } else {
                  result[key] = docData[key];
                }
              }
            });
          }

          return result;
        });
      }

      // ファイル生成
      let blob: Blob;
      let fileName: string;
      const timestamp = new Date().toISOString().split('T')[0];

      if (exportOptions.format === 'json') {
        const exportData = {
          exportInfo: {
            exportedAt: new Date().toISOString(),
            exportedBy: userData.email,
            collections: exportOptions.collections,
            includeMetadata: exportOptions.includeMetadata,
            dateRange: exportOptions.dateRange.enabled ? exportOptions.dateRange : null,
            totalRecords: Object.values(data).reduce((sum, items) => sum + items.length, 0)
          },
          data
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
        fileName = `export_${timestamp}.json`;
      } else {
        // CSV形式
        let csvContent = `# エクスポート情報\n`;
        csvContent += `# 日時: ${new Date().toLocaleString('ja-JP')}\n`;
        csvContent += `# 実行者: ${userData.email}\n`;
        csvContent += `# コレクション: ${exportOptions.collections.join(', ')}\n\n`;

        for (const [collectionName, items] of Object.entries(data)) {
          csvContent += `\n=== ${collectionName} (${items.length}件) ===\n`;
          
          if (items.length > 0) {
            // ヘッダー行
            const headers = Object.keys(items[0]);
            csvContent += headers.join(',') + '\n';
            
            // データ行
            items.forEach(item => {
              const row = headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) return '';
                
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              });
              csvContent += row.join(',') + '\n';
            });
          }
          csvContent += '\n';
        }
        
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        fileName = `export_${timestamp}.csv`;
      }

      // ファイルダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`データを ${fileName} としてエクスポートしました`, 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      showToast('エクスポート処理でエラーが発生しました', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <DocumentArrowDownIcon className="h-6 w-6 text-green-500 mr-2" />
          データエクスポート
        </h2>
        <p className="text-gray-600 mt-1">選択したデータをCSVまたはJSON形式でダウンロード</p>
      </div>

      <div className="p-6 space-y-6">
        {/* コレクション選択 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">エクスポート対象</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCollections.map((collection) => (
              <label key={collection.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.collections.includes(collection.id)}
                  onChange={(e) => handleCollectionChange(collection.id, e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{collection.name}</div>
                  <div className="text-sm text-gray-500">{collection.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* フォーマット選択 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">出力形式</h3>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportOptions.format === 'json'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
                className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-gray-900">JSON形式</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportOptions.format === 'csv'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
                className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-gray-900">CSV形式</span>
            </label>
          </div>
        </div>

        {/* オプション設定 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">オプション</h3>
          <div className="space-y-3">
            {/* メタデータ含める */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-gray-900">メタデータを含める</span>
              <span className="ml-2 text-sm text-gray-500">(作成日時、作成者など)</span>
            </label>

            {/* 日付範囲フィルター */}
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={exportOptions.dateRange.enabled}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, enabled: e.target.checked }
                  }))}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-gray-900">日付範囲で絞り込み</span>
              </label>
              
              {exportOptions.dateRange.enabled && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">開始日</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.from}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, from: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">終了日</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.to}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, to: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* エクスポート実行ボタン */}
        <div className="flex justify-end">
          <button
            onClick={executeExport}
            disabled={isExporting || exportOptions.collections.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                エクスポート中...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                エクスポート実行
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataExportPanel;
