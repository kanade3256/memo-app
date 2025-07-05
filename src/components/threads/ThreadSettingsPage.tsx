import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeftIcon,
  UserGroupIcon,
  PencilIcon,
  SwatchIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import type { UserRole } from '../../types/auth';

type ThreadColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

interface ThreadSettings {
  title: string;
  visibleTo: string[] | "all";
  editableBy: string[] | "all";
  color: ThreadColor;
  description: string;
  pinned: boolean;
}

const THREAD_COLORS: { value: ThreadColor; label: string; bgClass: string }[] = [
  { value: 'yellow', label: 'イエロー', bgClass: 'bg-yellow-100' },
  { value: 'blue', label: 'ブルー', bgClass: 'bg-blue-100' },
  { value: 'green', label: 'グリーン', bgClass: 'bg-green-100' },
  { value: 'pink', label: 'ピンク', bgClass: 'bg-pink-100' },
  { value: 'purple', label: 'パープル', bgClass: 'bg-purple-100' }
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'member', label: 'メンバー' },
  { value: 'professor', label: '教授' },
  { value: 'developer', label: '開発者' }
];

export const ThreadSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { users } = useUsers();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ThreadSettings>({
    title: '',
    visibleTo: 'all',
    editableBy: 'all',
    color: 'blue',
    description: '',
    pinned: false
  });
  const [visibilityMode, setVisibilityMode] = useState<'all' | 'role' | 'user'>('all');
  const [editMode, setEditMode] = useState<'all' | 'creator' | 'role' | 'user'>('all');
  const [selectedVisibleRoles, setSelectedVisibleRoles] = useState<UserRole[]>([]);
  const [selectedEditRoles, setSelectedEditRoles] = useState<UserRole[]>([]);
  const [selectedVisibleUsers, setSelectedVisibleUsers] = useState<string[]>([]);
  const [selectedEditUsers, setSelectedEditUsers] = useState<string[]>([]);

  if (!userData) {
    navigate('/');
    return null;
  }

  const handleVisibilityChange = (mode: 'all' | 'role' | 'user') => {
    setVisibilityMode(mode);
    if (mode === 'all') {
      setSettings({ ...settings, visibleTo: 'all' });
    } else {
      setSettings({ ...settings, visibleTo: [] });
    }
  };

  const handleEditModeChange = (mode: 'all' | 'creator' | 'role' | 'user') => {
    setEditMode(mode);
    if (mode === 'all') {
      setSettings({ ...settings, editableBy: 'all' });
    } else if (mode === 'creator') {
      setSettings({ ...settings, editableBy: [userData.uid] });
    } else {
      setSettings({ ...settings, editableBy: [] });
    }
  };

  const handleRoleSelection = (role: UserRole, type: 'visible' | 'edit') => {
    if (type === 'visible') {
      const newRoles = selectedVisibleRoles.includes(role)
        ? selectedVisibleRoles.filter(r => r !== role)
        : [...selectedVisibleRoles, role];
      setSelectedVisibleRoles(newRoles);
      setSettings({ ...settings, visibleTo: newRoles });
    } else {
      const newRoles = selectedEditRoles.includes(role)
        ? selectedEditRoles.filter(r => r !== role)
        : [...selectedEditRoles, role];
      setSelectedEditRoles(newRoles);
      setSettings({ ...settings, editableBy: newRoles });
    }
  };

  const handleUserSelection = (userUid: string, type: 'visible' | 'edit') => {
    if (type === 'visible') {
      const newUsers = selectedVisibleUsers.includes(userUid)
        ? selectedVisibleUsers.filter(u => u !== userUid)
        : [...selectedVisibleUsers, userUid];
      setSelectedVisibleUsers(newUsers);
      setSettings({ ...settings, visibleTo: newUsers });
    } else {
      const newUsers = selectedEditUsers.includes(userUid)
        ? selectedEditUsers.filter(u => u !== userUid)
        : [...selectedEditUsers, userUid];
      setSelectedEditUsers(newUsers);
      setSettings({ ...settings, editableBy: newUsers });
    }
  };

  const validateForm = (): boolean => {
    if (!settings.title.trim()) {
      showWarning('スレチE��名を入力してください');
      return false;
    }
    if (visibilityMode !== 'all' && Array.isArray(settings.visibleTo) && settings.visibleTo.length === 0) {
      showWarning('表示対象を選択してください');
      return false;
    }
    if (editMode !== 'all' && editMode !== 'creator' && Array.isArray(settings.editableBy) && settings.editableBy.length === 0) {
      showWarning('編雁E��能老E��選択してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'threads'), {
        title: settings.title.trim(),
        createdAt: serverTimestamp(),
        createdBy: userData.email,
        visibleTo: settings.visibleTo,
        editableBy: settings.editableBy,
        color: settings.color,
        description: settings.description.trim(),
        pinned: settings.pinned
      });

      showSuccess('スレッドを作成しました！');
      navigate('/');
    } catch (error) {
      console.error('Error creating thread:', error);
      showError('スレッドの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getColorStyle = (color: ThreadColor): string => {
    const colorMap: Record<ThreadColor, string> = {
      yellow: 'bg-yellow-100 border-yellow-300',
      blue: 'bg-blue-100 border-blue-300',
      green: 'bg-green-100 border-green-300',
      pink: 'bg-pink-100 border-pink-300',
      purple: 'bg-purple-100 border-purple-300'
    };
    return colorMap[color];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">新規スレッド作成</h1>
          <p className="mt-2 text-gray-600">スレッドの詳細設定を行ってください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* スレチE��吁E*/}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スレッド名<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="スレッド名を入力"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スレッド説明
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  placeholder="スレッドの説明を入力（任意）"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 表示設宁E*/}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">表示対象</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibilityMode === 'all'}
                    onChange={() => handleVisibilityChange('all')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">全員</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibilityMode === 'role'}
                    onChange={() => handleVisibilityChange('role')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">特定ロール</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibilityMode === 'user'}
                    onChange={() => handleVisibilityChange('user')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">特定ユーザー</span>
                </label>
              </div>

              {visibilityMode === 'role' && (
                <div className="pl-6 space-y-2">
                  <p className="text-sm text-gray-600">表示するロールを選択</p>
                  {ROLE_OPTIONS.map((role) => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedVisibleRoles.includes(role.value)}
                        onChange={() => handleRoleSelection(role.value, 'visible')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2">{role.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {visibilityMode === 'user' && (
                <div className="pl-6 space-y-2">
                  <p className="text-sm text-gray-600">表示するユーザーを選択</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.uid} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedVisibleUsers.includes(user.uid)}
                          onChange={() => handleUserSelection(user.uid, 'visible')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">{user.displayName || user.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 編雁E��限設宁E*/}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <PencilIcon className="h-6 w-6 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">編集権限設定</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    checked={editMode === 'all'}
                    onChange={() => handleEditModeChange('all')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">全員</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    checked={editMode === 'creator'}
                    onChange={() => handleEditModeChange('creator')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">作�E老E�Eみ</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    checked={editMode === 'role'}
                    onChange={() => handleEditModeChange('role')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">特定ロール</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    checked={editMode === 'user'}
                    onChange={() => handleEditModeChange('user')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">持E��ユーザー</span>
                </label>
              </div>

              {editMode === 'role' && (
                <div className="pl-6 space-y-2">
                  <p className="text-sm text-gray-600">編雁E��能なロールを選抁E</p>
                  {ROLE_OPTIONS.map((role) => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedEditRoles.includes(role.value)}
                        onChange={() => handleRoleSelection(role.value, 'edit')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2">{role.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {editMode === 'user' && (
                <div className="pl-6 space-y-2">
                  <p className="text-sm text-gray-600">編雁E��能なユーザーを選抁E</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.uid} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEditUsers.includes(user.uid)}
                          onChange={() => handleUserSelection(user.uid, 'edit')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">{user.displayName || user.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* カラー・その他設定 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <SwatchIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">外観・その他</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  スレッドカラー
                </label>
                <div className="flex flex-wrap gap-3">
                  {THREAD_COLORS.map((color) => (
                    <label key={color.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color.value}
                        checked={settings.color === color.value}
                        onChange={(e) => setSettings({ ...settings, color: e.target.value as ThreadColor })}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-lg border-2 ${color.bgClass} ${
                        settings.color === color.value ? 'border-blue-500 shadow-lg' : 'border-gray-300'
                      } transition-all`} />
                      <span className="ml-2 text-sm">{color.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pinned}
                    onChange={(e) => setSettings({ ...settings, pinned: e.target.checked })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <StarIcon className={`h-5 w-5 ml-2 mr-1 ${settings.pinned ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700">ピン留め（スレッド一覧の上部に固定表示）</span>
                </label>
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">プレビュー</h2>
            <div className={`p-4 rounded-lg border-2 ${getColorStyle(settings.color)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {settings.title || 'スレッド名'}
                    {settings.pinned && <StarIcon className="h-4 w-4 text-yellow-500 inline ml-1" />}
                  </h3>
                  {settings.description && (
                    <p className="text-sm text-gray-600 mt-1">{settings.description}</p>
                  )}
                </div>
                <div className={`w-4 h-4 rounded ${settings.color === 'yellow' ? 'bg-yellow-400' : 
                  settings.color === 'blue' ? 'bg-blue-400' :
                  settings.color === 'green' ? 'bg-green-400' :
                  settings.color === 'pink' ? 'bg-pink-400' : 'bg-purple-400'}`} />
              </div>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  作�E中...
                </div>
              ) : (
                'スレチE��を作�E'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

