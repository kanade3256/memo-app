import { useState } from 'react';
import { useErrorLog } from '../../hooks/useErrorLog';

export const ErrorBadge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { errors, unreadCount, markAsRead, markAllAsRead } = useErrorLog();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <>
      {/* エラーバッジ */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white rounded-full p-3 shadow-lg hover:bg-red-600 transition-colors"
      >
        <span className="text-xl">⚠️</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* エラーモーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">エラーログ</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {errors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">エラーはありません</p>
              ) : (
                <ul className="space-y-4">
                  {errors.map((error) => (
                    <li
                      key={error.id}
                      className={`p-4 rounded-lg border ${
                        error.isRead ? 'bg-gray-50' : 'bg-red-50'
                      }`}
                      onClick={() => !error.isRead && markAsRead(error.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium text-red-600">{error.message}</p>
                          {error.location && (
                            <p className="text-sm text-gray-600">場所: {error.location}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {formatDate(error.timestamp)}
                          </p>
                        </div>
                        {!error.isRead && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            未読
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                すべて既読にする
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
