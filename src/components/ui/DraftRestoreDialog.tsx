import React from 'react';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { DraftManager } from '../../utils/draftManager';
import type { Draft } from '../../types/logs';

interface DraftRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (draft: Draft) => void;
  draftType: 'note' | 'thread';
  draftId: string;
}

const DraftRestoreDialog: React.FC<DraftRestoreDialogProps> = ({
  isOpen,
  onClose,
  onRestore,
  draftType,
  draftId
}) => {
  if (!isOpen) return null;

  const draft = DraftManager.getDraft(draftType, draftId);

  if (!draft) {
    return null;
  }

  const handleRestore = () => {
    onRestore(draft);
    onClose();
  };

  const handleDiscard = () => {
    DraftManager.deleteDraft(draftType, draftId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">下書きが見つかりました</h3>
              <p className="text-sm text-gray-500">
                保存された下書きを復元しますか？
              </p>
            </div>
          </div>
        </div>

        {/* 下書き内容プレビュー */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {DraftManager.getLastSavedText(draft)}に保存
                {draft.autoSaved && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                    自動保存
                  </span>
                )}
              </span>
            </div>
            
            <div className="space-y-2">
              {draft.title && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">タイトル:</div>
                  <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                    {draft.title}
                  </div>
                </div>
              )}
              
              {draft.content && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">内容:</div>
                  <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border max-h-24 overflow-y-auto">
                    {draft.content}
                  </div>
                </div>
              )}
              
              {draft.color && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">色:</div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-4 h-4 rounded border-2 ${getColorClass(draft.color)}`}
                    ></div>
                    <span className="text-sm text-gray-600">{getColorName(draft.color)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            下書きは{Math.floor((7 * 24 * 60 * 60 * 1000 - (Date.now() - draft.lastSaved)) / (24 * 60 * 60 * 1000))}日後に自動削除されます
          </div>
        </div>

        {/* アクションボタン */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleDiscard}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            下書きを削除
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            キャンセル
          </button>
          
          <button
            onClick={handleRestore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            下書きを復元
          </button>
        </div>
      </div>
    </div>
  );
};

// 色のクラス名を取得
const getColorClass = (color: string): string => {
  switch (color) {
    case 'yellow': return 'bg-yellow-200 border-yellow-300';
    case 'green': return 'bg-green-200 border-green-300';
    case 'blue': return 'bg-blue-200 border-blue-300';
    case 'pink': return 'bg-pink-200 border-pink-300';
    case 'purple': return 'bg-purple-200 border-purple-300';
    default: return 'bg-gray-200 border-gray-300';
  }
};

// 色の名前を取得
const getColorName = (color: string): string => {
  switch (color) {
    case 'yellow': return '黄色';
    case 'green': return '緑色';
    case 'blue': return '青色';
    case 'pink': return 'ピンク';
    case 'purple': return '紫色';
    default: return 'グレー';
  }
};

export default DraftRestoreDialog;
