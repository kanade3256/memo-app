import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: any;
}

interface NoteWithReactions {
  id: string;
  title?: string; // オプショナルに変更
  text: string;
  color: string;
  createdAt: Date | any; // Dateまたはany型に対応
  createdBy: string;
  threadId?: string; // オプショナルに変更
  reactions?: Reaction[];
}

interface FullNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteWithReactions;
  getDisplayName: (email: string) => string;
}

export const FullNoteModal = ({
  isOpen,
  onClose,
  note,
  getDisplayName,
}: FullNoteModalProps) => {
  const getBackgroundColor = (color: string) => {
    const colors: { [key: string]: string } = {
      yellow: 'bg-yellow-100 border-yellow-300',
      green: 'bg-green-100 border-green-300',
      blue: 'bg-blue-100 border-blue-300',
      pink: 'bg-pink-100 border-pink-300',
      purple: 'bg-purple-100 border-purple-300',
    };
    return colors[color] || 'bg-yellow-100 border-yellow-300';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
        onKeyDown={handleKeyDown}
      >
        {/* 背景オーバーレイ */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`w-full max-w-sm sm:max-w-lg lg:max-w-3xl xl:max-w-4xl transform overflow-hidden 
                          rounded-xl sm:rounded-2xl shadow-2xl transition-all
                          ${getBackgroundColor(note.color)} border-2 p-4 sm:p-6 lg:p-8`}
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                    <Dialog.Title className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {note.title || 'メモ詳細'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 sm:p-2 hover:bg-black/10 transition-colors flex-shrink-0"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                  </button>
                </div>

                {/* 作成者・日時情報 */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/70 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">作成者</span>
                      <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">
                        {getDisplayName(note.createdBy)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">作成日時</span>
                      <span className="text-xs sm:text-sm text-gray-600">
                        {note.createdAt instanceof Date 
                          ? note.createdAt.toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : note.createdAt?.toDate?.()?.toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) || '不明'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 本文内容 */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">内容</h3>
                  <div className="bg-white/80 rounded-lg p-4 sm:p-6 border border-gray-200 min-h-[150px] sm:min-h-[200px] lg:min-h-[250px]">
                    <p className="text-sm sm:text-base lg:text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                </div>

                {/* リアクション表示（もしあれば） */}
                {note.reactions && note.reactions.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">リアクション</h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const reactionCounts = note.reactions!.reduce((acc: Record<string, number>, reaction) => {
                          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                          return acc;
                        }, {});
                        
                        return Object.entries(reactionCounts).map(([emoji, count]) => (
                          <div
                            key={emoji}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/80 rounded-full border border-gray-200"
                          >
                            <span className="text-base sm:text-lg">{emoji}</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-700">{count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* 閉じるボタン */}
                <div className="flex justify-center pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
                             transition-colors font-medium text-sm sm:text-base"
                  >
                    閉じる
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

