import React, { useState } from 'react';
import { 
  TrashIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import type { SelectionItem, BulkOperationResult } from '../../types/logs';

interface BulkOperationBarProps {
  selectedItems: SelectionItem[];
  onClearSelection: () => void;
  onBulkDelete: (items: SelectionItem[]) => Promise<BulkOperationResult>;
  onBulkEdit?: (items: SelectionItem[]) => void;
  className?: string;
}

const BulkOperationBar: React.FC<BulkOperationBarProps> = ({
  selectedItems,
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  className = ''
}) => {
  const { showToast } = useToast();
  const [isOperating, setIsOperating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedCount = selectedItems.filter(item => item.selected).length;

  // 選択がない場合は非表示
  if (selectedCount === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsOperating(true);
    setShowDeleteConfirm(false);

    try {
      const selectedForDelete = selectedItems.filter(item => item.selected);
      const result = await onBulkDelete(selectedForDelete);
      
      if (result.successful > 0) {
        showToast(`${result.successful}件のアイテムを削除しました`, 'success');
      }
      
      if (result.failed > 0) {
        showToast(`${result.failed}件の削除に失敗しました`, 'error');
      }
      
      onClearSelection();
      
    } catch (error) {
      showToast('一括削除でエラーが発生しました', 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleBulkEdit = () => {
    if (onBulkEdit) {
      const selectedForEdit = selectedItems.filter(item => item.selected);
      onBulkEdit(selectedForEdit);
    }
  };

  const getItemTypeText = () => {
    const types = [...new Set(selectedItems.filter(item => item.selected).map(item => item.type))];
    if (types.length === 1) {
      return types[0] === 'note' ? 'メモ' : 'スレッド';
    }
    return 'アイテム';
  };

  return (
    <div className={`bg-blue-600 text-white rounded-lg shadow-lg transition-all duration-300 ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 選択状態表示 */}
          <div className="flex items-center space-x-3">
            <Square3Stack3DIcon className="h-5 w-5" />
            <span className="font-medium">
              {selectedCount}件の{getItemTypeText()}を選択中
            </span>
          </div>

          {/* 操作ボタン */}
          <div className="flex items-center space-x-2">
            {showDeleteConfirm ? (
              <>
                <span className="text-sm mr-2">本当に削除しますか？</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isOperating}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  削除実行
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  キャンセル
                </button>
              </>
            ) : (
              <>
                {onBulkEdit && (
                  <button
                    onClick={handleBulkEdit}
                    disabled={isOperating}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    一括編集
                  </button>
                )}
                
                <button
                  onClick={handleBulkDelete}
                  disabled={isOperating}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm flex items-center"
                >
                  {isOperating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      削除中...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-1" />
                      一括削除
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClearSelection}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  選択解除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationBar;
