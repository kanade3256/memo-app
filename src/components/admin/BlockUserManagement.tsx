import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { 
  ShieldExclamationIcon, 
  UserIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import { useAuth, blockUser, unblockUser } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import { useToast } from '../../contexts/ToastContext';
import type { BlockedUser } from '../../types/auth';
import type { Timestamp } from 'firebase/firestore';

const BlockUserManagement: React.FC = () => {
  const { userData } = useAuth();
  const { users } = useUsers();
  const { showToast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockEmail, setBlockEmail] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // professorまたはdeveloperのみアクセス可能
  if (!userData || !['professor', 'developer'].includes(userData.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <ShieldExclamationIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h1>
          <p className="text-gray-600">この機能は教授または開発者のみ利用できます。</p>
        </div>
      </div>
    );
  }

  // ブロックされたユーザーリストの取得
  useEffect(() => {
    const q = query(
      collection(db, 'blockedUsers'),
      orderBy('blockedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blockedList: BlockedUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        blockedList.push({
          id: doc.id,
          email: data.email,
          blockedAt: data.blockedAt as Timestamp,
          blockedBy: data.blockedBy,
          reason: data.reason,
          isActive: data.isActive
        });
      });
      setBlockedUsers(blockedList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ユーザーをブロック
  const handleBlockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockEmail.trim() || !userData) return;

    setIsBlocking(true);
    try {
      await blockUser(blockEmail.trim(), blockReason.trim(), userData.email);
      setBlockEmail('');
      setBlockReason('');
      showToast('ユーザーをブロックしました', 'success');
    } catch (error) {
      console.error('Error blocking user:', error);
      showToast('ブロック処理でエラーが発生しました', 'error');
    } finally {
      setIsBlocking(false);
    }
  };

  // ブロック解除
  const handleUnblockUser = async (email: string) => {
    const confirmed = window.confirm(`${email} のブロックを解除しますか？`);
    if (!confirmed) return;

    try {
      await unblockUser(email);
      showToast('ブロックを解除しました', 'success');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showToast('ブロック解除でエラーが発生しました', 'error');
    }
  };

  // 登録ユーザーから選択可能なユーザーリストを取得
  const getSelectableUsers = () => {
    const blockedEmails = new Set(blockedUsers.filter(b => b.isActive).map(b => b.email));
    return users.filter(user => !blockedEmails.has(user.email));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500 mr-3" />
            ユーザーブロック管理
          </h1>
          <p className="mt-2 text-gray-600">
            不適切な行為を行ったユーザーのアクセスをブロックできます。
          </p>
        </div>

        {/* ブロック追加フォーム */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ユーザーをブロック</h2>
          <form onSubmit={handleBlockUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレスまたは選択
                </label>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={blockEmail}
                    onChange={(e) => setBlockEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                  <select
                    value={blockEmail}
                    onChange={(e) => setBlockEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">登録ユーザーから選択...</option>
                    {getSelectableUsers().map((user) => (
                      <option key={user.uid} value={user.email}>
                        {user.displayName || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ブロック理由
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="不適切な投稿、規約違反など"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isBlocking || !blockEmail.trim()}
              className="w-full md:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isBlocking ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ブロック中...
                </div>
              ) : (
                'ユーザーをブロック'
              )}
            </button>
          </form>
        </div>

        {/* ブロック済みユーザーリスト */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ブロック済みユーザー</h2>
            <p className="text-gray-600">現在ブロックされているユーザーの一覧</p>
          </div>
          
          {blockedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ブロックされたユーザーはいません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          blockedUser.isActive ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {blockedUser.isActive ? (
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{blockedUser.email}</p>
                          <p className="text-sm text-gray-500">
                            ブロック者: {blockedUser.blockedBy}
                          </p>
                          {blockedUser.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              理由: {blockedUser.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {blockedUser.blockedAt?.toDate().toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        blockedUser.isActive 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {blockedUser.isActive ? 'ブロック中' : 'ブロック解除済み'}
                      </span>
                      {blockedUser.isActive && (
                        <button
                          onClick={() => handleUnblockUser(blockedUser.email)}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          ブロック解除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockUserManagement;

