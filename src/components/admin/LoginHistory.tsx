import { useEffect, useState, useCallback, memo } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../utils/errorHandler';

interface LoginHistoryItem {
  id: string;
  loginAt: Date;
  userAgent: string;
  clientId: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function formatUserAgent(userAgent: string): string {
  // シンプルなユーザーエージェント解析
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // ブラウザの検出
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  }

  // OSの検出
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return `${browser} on ${os}`;
}

export const LoginHistory = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);

  // テスト用のログイン履歴を作成する関数
  const createTestHistory = async () => {
    if (!user) return;
    
    try {
      const historyRef = doc(collection(db, `users/${user.uid}/loginHistory`));
      await setDoc(historyRef, {
        loginAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        clientId: crypto.randomUUID(),
      });
      console.log('Test login history created');
      
      // データを再取得
      await fetchHistory();
    } catch (error) {
      handleError(error as Error, 'LoginHistory.createTestHistory');
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching login history for user:', user.uid);
      const historyRef = collection(db, `users/${user.uid}/loginHistory`);
      console.log('History ref path:', historyRef.path);
      const q = query(historyRef, orderBy('loginAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      console.log('Query snapshot size:', snapshot.size);

      const historyItems = snapshot.docs.map(doc => ({
        id: doc.id,
        loginAt: doc.data().loginAt.toDate(),
        userAgent: doc.data().userAgent,
        clientId: doc.data().clientId,
      }));

      setHistory(historyItems);
    } catch (error) {
      handleError(error, 'LoginHistory.fetchHistory');
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">ログイン履歴</h3>
      <div className="overflow-x-auto">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">ログイン履歴がありません</p>
            <button
              onClick={createTestHistory}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              テスト履歴を作成
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ログイン日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                使用端末
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(item.loginAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatUserAgent(item.userAgent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

// React.memoでコンポーネントをメモ化して不要な再レンダリングを防ぐ
export default memo(LoginHistory);
