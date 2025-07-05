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
        {/* 背景オーバ�Eレイ */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
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
                className={`w-full max-w-2xl transform overflow-hidden rounded-2xl shadow-2xl transition-all
                          ${getBackgroundColor(note.color)} border-2 p-8`}
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <EyeIcon className="h-6 w-6 text-gray-600" />
                    <Dialog.Title className="text-2xl font-bold text-gray-900">
                      {note.title || 'メモ詳細'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-black/10 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* 作�E老E�E日時情報 */}
                <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">作�E老E</span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {getDisplayName(note.createdBy)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">作�E日晁E</span>
                      <span className="text-sm text-gray-600">
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

                {/* 本斁E�E斁E*/}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">冁E��</h3>
                  <div className="bg-white/80 rounded-lg p-6 border border-gray-200 min-h-[200px]">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                </div>

                {/* リアクション表示�E�もしあれ�E�E�E*/}
                {note.reactions && note.reactions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">リアクション</h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const reactionCounts = note.reactions!.reduce((acc: Record<string, number>, reaction) => {
                          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                          return acc;
                        }, {});
                        
                        return Object.entries(reactionCounts).map(([emoji, count]) => (
                          <div
                            key={emoji}
                            className="flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full border border-gray-200"
                          >
                            <span className="text-lg">{emoji}</span>
                            <span className="text-sm font-medium text-gray-700">{count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* 閉じる�Eタン */}
                <div className="flex justify-center">
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
                             transition-colors font-medium"
                  >
                    閉じめE
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

