import { useState } from 'react';
import { doc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const RegisterUserPage = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'developer' | 'professor'>('member');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData } = useAuth();

  if (!userData || (userData.role !== 'professor' && userData.role !== 'developer')) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });

      const normalizedEmail = email.toLowerCase();
      
      // メールアドレスの重複チェック
      const whitelistQuery = query(collection(db, 'Whitelist'), where('email', '==', normalizedEmail));
      const whitelistDocs = await getDocs(whitelistQuery);

      if (!whitelistDocs.empty) {
        setMessage({ type: 'error', text: 'このメールアドレスは既に登録されています' });
        return;
      }

      // ランダムなIDを生成
      const whitelistId = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      
      // Whitelistに追加
      await setDoc(doc(db, 'Whitelist', whitelistId), {
        email: normalizedEmail,
        role: role,
        addedAt: serverTimestamp(),
        addedBy: userData.email || 'admin'
      });

      setMessage({ type: 'success', text: 'ユーザーを登録しました' });
      setEmail('');
    } catch (error) {
      console.error('Error adding user to whitelist:', error);
      setMessage({ type: 'error', text: 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">新規ユーザー登録</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@example.com"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            ロール
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'developer' | 'professor')}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="member">メンバー</option>
            <option value="developer">開発者</option>
            <option value="professor">教授</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-500 text-white px-6 py-3 rounded-lg
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
            transition-colors`}
        >
          {isSubmitting ? '登録中...' : '登録する'}
        </button>

        {message.text && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
};
