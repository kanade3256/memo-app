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

  // professor縺ｾ縺溘・developer縺ｮ縺ｿ繧｢繧ｯ繧ｻ繧ｹ蜿ｯ閭ｽ
  if (!userData || !['professor', 'developer'].includes(userData.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <ShieldExclamationIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">繧｢繧ｯ繧ｻ繧ｹ讓ｩ髯舌′縺ゅｊ縺ｾ縺帙ｓ</h1>
          <p className="text-gray-600">縺薙・讖溯・縺ｯ謨呎肢縺ｾ縺溘・髢狗匱閠・・縺ｿ蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・/p>
        </div>
      </div>
    );
  }

  // 繝悶Ο繝・け縺輔ｌ縺溘Θ繝ｼ繧ｶ繝ｼ繝ｪ繧ｹ繝医・蜿門ｾ・
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

  // 繝ｦ繝ｼ繧ｶ繝ｼ繧偵ヶ繝ｭ繝・け
  const handleBlockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockEmail.trim() || !userData) return;

    setIsBlocking(true);
    try {
      await blockUser(blockEmail.trim(), blockReason.trim(), userData.email);
      setBlockEmail('');
      setBlockReason('');
      showToast('繝ｦ繝ｼ繧ｶ繝ｼ繧偵ヶ繝ｭ繝・け縺励∪縺励◆', 'success');
    } catch (error) {
      console.error('Error blocking user:', error);
      showToast('繝悶Ο繝・け蜃ｦ逅・〒繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆', 'error');
    } finally {
      setIsBlocking(false);
    }
  };

  // 繝悶Ο繝・け隗｣髯､
  const handleUnblockUser = async (email: string) => {
    const confirmed = window.confirm(`${email} 縺ｮ繝悶Ο繝・け繧定ｧ｣髯､縺励∪縺吶°・歔);
    if (!confirmed) return;

    try {
      await unblockUser(email);
      showToast('繝悶Ο繝・け繧定ｧ｣髯､縺励∪縺励◆', 'success');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showToast('繝悶Ο繝・け隗｣髯､縺ｧ繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆', 'error');
    }
  };

  // 逋ｻ骭ｲ繝ｦ繝ｼ繧ｶ繝ｼ縺九ｉ驕ｸ謚槫庄閭ｽ縺ｪ繝ｦ繝ｼ繧ｶ繝ｼ繝ｪ繧ｹ繝医ｒ蜿門ｾ・
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
        {/* 繝倥ャ繝繝ｼ */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500 mr-3" />
            繝ｦ繝ｼ繧ｶ繝ｼ繝悶Ο繝・け邂｡逅・
          </h1>
          <p className="mt-2 text-gray-600">
            荳埼←蛻・↑陦檎ぜ繧定｡後▲縺溘Θ繝ｼ繧ｶ繝ｼ縺ｮ繧｢繧ｯ繧ｻ繧ｹ繧偵ヶ繝ｭ繝・け縺ｧ縺阪∪縺・
          </p>
        </div>

        {/* 繝悶Ο繝・け霑ｽ蜉繝輔か繝ｼ繝 */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">繝ｦ繝ｼ繧ｶ繝ｼ繧偵ヶ繝ｭ繝・け</h2>
          <form onSubmit={handleBlockUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺ｾ縺溘・驕ｸ謚・
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
                    <option value="">逋ｻ骭ｲ繝ｦ繝ｼ繧ｶ繝ｼ縺九ｉ驕ｸ謚・..</option>
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
                  繝悶Ο繝・け逅・罰
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="荳埼←蛻・↑謚慕ｨｿ縲∬ｦ冗ｴ・＆蜿阪↑縺ｩ"
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
                  繝悶Ο繝・け荳ｭ...
                </div>
              ) : (
                '繝ｦ繝ｼ繧ｶ繝ｼ繧偵ヶ繝ｭ繝・け'
              )}
            </button>
          </form>
        </div>

        {/* 繝悶Ο繝・け縺輔ｌ縺溘Θ繝ｼ繧ｶ繝ｼ繝ｪ繧ｹ繝・*/}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">繝悶Ο繝・け貂医∩繝ｦ繝ｼ繧ｶ繝ｼ</h2>
            <p className="text-gray-600">迴ｾ蝨ｨ繝悶Ο繝・け縺輔ｌ縺ｦ縺・ｋ繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ荳隕ｧ</p>
          </div>
          
          {blockedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">繝悶Ο繝・け縺輔ｌ縺溘Θ繝ｼ繧ｶ繝ｼ縺ｯ縺・∪縺帙ｓ</p>
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
                            繝悶Ο繝・け閠・ {blockedUser.blockedBy}
                          </p>
                          {blockedUser.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              逅・罰: {blockedUser.reason}
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
                        {blockedUser.isActive ? '繝悶Ο繝・け荳ｭ' : '繝悶Ο繝・け隗｣髯､貂医∩'}
                      </span>
                      {blockedUser.isActive && (
                        <button
                          onClick={() => handleUnblockUser(blockedUser.email)}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          繝悶Ο繝・け隗｣髯､
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

