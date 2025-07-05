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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    メモを編集
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="メモを入力..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">色:</span>
                    <div className="flex gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-6 h-6 rounded-full ${
                            getBackgroundColor(c)
                          } ${
                            color === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !text.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 
                        disabled:hover:bg-blue-600 transition-colors"
                    >
                      {isSubmitting ? '保存中...' : '保存'}
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
