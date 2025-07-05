import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoginHistory from '../admin/LoginHistory';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserIcon } from '@heroicons/react/24/outline';

export const ProfileSettingsPage = () => {
  const { userData, refreshUserData } = useAuth();
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  const handleDisplayNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName === userData.displayName) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, { displayName: displayName.trim() });
      await refreshUserData();
      setMessage({ type: 'success', text: '表示名を更新しました' });
    } catch (error) {
      console.error('Error updating display name:', error);
      setMessage({ type: 'error', text: '表示名の更新に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">プロフィール設定</h1>

      <div className="space-y-8">
        {/* デフォルトアイコン表示 */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">プロフィール</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 表示名設定 */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">表示名</h2>
          <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="表示名を入力"
            />
            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim() || displayName === userData.displayName}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600
                       transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              {isSubmitting ? '更新中...' : '表示名を更新'}
            </button>
          </form>
        </div>

        {/* メッセージ表示 */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700'
                : message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : ''
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ログイン履歴 */}
        <LoginHistory />
      </div>
    </div>
  );
};
