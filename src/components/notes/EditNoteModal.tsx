import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, color: string) => Promise<void>;
  initialText: string;
  initialColor: string;
}

const COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'] as const;

export const EditNoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialText,
  initialColor,
}: EditNoteModalProps) => {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState(initialColor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text, color);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-xs sm:max-w-md lg:max-w-lg transform overflow-hidden rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Dialog.Title className="text-base sm:text-lg font-medium text-gray-900">
                    メモを編集
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メモ内容
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none"
                      placeholder="メモの内容を入力してください..."
                    />
                    <div className="mt-2 text-xs sm:text-sm text-gray-500">
                      {text.length}/1000文字
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      カラーテーマ
                    </label>
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`aspect-square rounded-lg border-2 transition-all duration-200 ${
                            getBackgroundColor(c)
                          } ${
                            color === c 
                              ? 'border-blue-500 ring-2 ring-blue-200 scale-105' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          title={getColorName(c)}
                        >
                          <div className={`w-full h-full rounded-md ${getBackgroundColor(c)}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="order-2 sm:order-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !text.trim()}
                      className="order-1 sm:order-2 flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 
                        disabled:hover:bg-blue-600 transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          保存中...
                        </div>
                      ) : (
                        '保存する'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const getBackgroundColor = (color: string) => {
  const colors: { [key: string]: string } = {
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    pink: 'bg-pink-100',
    purple: 'bg-purple-100',
  };
  return colors[color] || 'bg-yellow-100';
};

const getColorName = (color: string) => {
  const names: { [key: string]: string } = {
    yellow: 'イエロー',
    green: 'グリーン',
    blue: 'ブルー',
    pink: 'ピンク',
    purple: 'パープル',
  };
  return names[color] || 'イエロー';
};
