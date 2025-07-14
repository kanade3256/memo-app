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
        className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 bg-red-500 text-white rounded-full p-2 sm:p-3 shadow-lg hover:bg-red-600 transition-colors z-50"
      >
        <span className="text-base sm:text-xl">⚠️</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* エラーモーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-0">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-0 sm:mx-4 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">エラーログ</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
              {errors.length === 0 ? (
                <p className="text-gray-500 text-center py-3 sm:py-4 text-sm sm:text-base">エラーはありません</p>
              ) : (
                <ul className="space-y-2 sm:space-y-4">
                  {errors.map((error) => (
                    <li
                      key={error.id}
                      className={`p-3 sm:p-4 rounded-lg border ${
                        error.isRead ? 'bg-gray-50' : 'bg-red-50'
                      }`}
                      onClick={() => !error.isRead && markAsRead(error.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 pr-2">
                          <p className="font-medium text-red-600 text-xs sm:text-sm">{error.message}</p>
                          {error.location && (
                            <p className="text-xs sm:text-sm text-gray-600">場所: {error.location}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(error.timestamp)}
                          </p>
                        </div>
                        {!error.isRead && (
                          <span className="text-[10px] sm:text-xs flex-shrink-0 bg-red-100 text-red-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                            未読
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 sm:mt-4 flex justify-end space-x-2">
              <button
                onClick={markAllAsRead}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
              >
                すべて既読
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
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
