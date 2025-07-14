import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  SwatchIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const THREAD_COLORS = [
  { value: 'yellow', label: 'イエロー', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { value: 'blue', label: 'ブルー', bg: 'bg-blue-100', border: 'border-blue-300' },
  { value: 'green', label: 'グリーン', bg: 'bg-green-100', border: 'border-green-300' },
  { value: 'pink', label: 'ピンク', bg: 'bg-pink-100', border: 'border-pink-300' },
  { value: 'purple', label: 'パープル', bg: 'bg-purple-100', border: 'border-purple-300' },
];

const VISIBILITY_OPTIONS = [
  { value: 'all', label: '全員に表示' },
  { value: 'professor', label: '教授のみ' },
  { value: 'developer', label: '開発者のみ' },
  { value: 'member', label: '一般メンバーのみ' },
  { value: 'custom', label: '指定ユーザー' },
];

const EDIT_OPTIONS = [
  { value: 'all', label: '全員が編集可能' },
  { value: 'creator', label: '作成者のみ' },
  { value: 'professor', label: '教授のみ' },
  { value: 'developer', label: '開発者のみ' },
  { value: 'custom', label: '指定ユーザー' },
];

export const CreateThreadPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { users } = useUsers();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: 'yellow',
    visibleTo: 'all',
    editableBy: 'all',
    pinned: false,
    customVisibleUsers: [] as string[],
    customEditableUsers: [] as string[],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserSelection = (field: 'customVisibleUsers' | 'customEditableUsers', userId: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(userId)
        ? prev[field].filter(id => id !== userId)
        : [...prev[field], userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast('スレッド名を入力してください', 'error');
      return;
    }

    if (!userData) {
      showToast('ユーザー情報が取得できません', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // visibleToとeditableByの値を決定
      let visibleTo: string[] | string = formData.visibleTo;
      let editableBy: string[] | string = formData.editableBy;

      if (formData.visibleTo === 'custom') {
        visibleTo = formData.customVisibleUsers;
      }

      if (formData.editableBy === 'custom') {
        editableBy = formData.customEditableUsers;
      }

      const threadData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        color: formData.color,
        visibleTo,
        editableBy,
        pinned: formData.pinned,
        createdAt: serverTimestamp(),
        createdBy: userData.email,
      };

      await addDoc(collection(db, 'threads'), threadData);
      showToast('スレッドを作成しました', 'success');
      navigate('/');
    } catch (error) {
      console.error('Error creating thread:', error);
      showToast('スレッドの作成に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            スレッド一覧に戻る
          </button>
          
          <div className="flex items-center">
            <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">新規スレッド作成</h1>
          </div>
          <p className="mt-2 text-gray-600">
            新しいディスカッションスレッドを作成します
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              基本情報
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スレッド名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="例：プロジェクト進捗報告"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スレッド説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="このスレッドの目的や内容について説明してください"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 表示設定 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <EyeIcon className="h-6 w-6 mr-2" />
              表示設定
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                表示対象
              </label>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="visibleTo"
                      value={option.value}
                      checked={formData.visibleTo === option.value}
                      onChange={(e) => handleInputChange('visibleTo', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>

              {formData.visibleTo === 'custom' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示するユーザーを選択
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.uid} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.customVisibleUsers.includes(user.uid)}
                          onChange={() => handleUserSelection('customVisibleUsers', user.uid)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {user.displayName || user.email}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 編集設定 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <PencilIcon className="h-6 w-6 mr-2" />
              編集設定
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                編集可能者
              </label>
              <div className="space-y-2">
                {EDIT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="editableBy"
                      value={option.value}
                      checked={formData.editableBy === option.value}
                      onChange={(e) => handleInputChange('editableBy', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>

              {formData.editableBy === 'custom' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    編集可能なユーザーを選択
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.uid} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.customEditableUsers.includes(user.uid)}
                          onChange={() => handleUserSelection('customEditableUsers', user.uid)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {user.displayName || user.email}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 外観設定 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <SwatchIcon className="h-6 w-6 mr-2" />
              外観設定
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  スレッドカラー
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {THREAD_COLORS.map((color) => (
                    <label
                      key={color.value}
                      className={`relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.color === color.value
                          ? `${color.border} ring-2 ring-blue-500`
                          : 'border-gray-200 hover:border-gray-300'
                      } ${color.bg}`}
                    >
                      <input
                        type="radio"
                        name="color"
                        value={color.value}
                        checked={formData.color === color.value}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {color.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => handleInputChange('pinned', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <StarIcon className="h-5 w-5 ml-2 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    スレッド一覧の上部にピン留めする
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* フォームアクション */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  作成中...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  スレッドを作成
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
