import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useErrorHandler } from '../../utils/errorHandler';

interface DashboardStats {
  totalUsers: number;
  totalThreads: number;
  totalNotes: number;
  recentErrors: number;
}

export const DeveloperDashboard = () => {
  const { userData } = useAuth();
  const { getThemeColors } = useTheme();
  const { handleError } = useErrorHandler();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalThreads: 0,
    totalNotes: 0,
    recentErrors: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // 初回フェッチ完了フラグ

  // themeColorsをメモ化して再レンダリングを防ぐ
  const themeColors = useMemo(() => getThemeColors(), [getThemeColors]);

  // fetchStats関数をuseCallbackでメモ化
  const fetchStats = useCallback(async () => {
    if (hasFetched) return; // 既にフェッチ済みの場合は実行しない
    
    try {
      setLoading(true);

      // ユーザー数を取得
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // スレッド数を取得
      const threadsSnapshot = await getDocs(collection(db, 'threads'));
      
      // 全スレッドのノート数を計算
      let totalNotes = 0;
      for (const threadDoc of threadsSnapshot.docs) {
        const notesSnapshot = await getDocs(collection(db, `threads/${threadDoc.id}/notes`));
        totalNotes += notesSnapshot.size;
      }

      // 最近のアクセス試行エラーを取得
      const accessAttemptsQuery = query(
        collection(db, 'accessAttempts'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const accessAttemptsSnapshot = await getDocs(accessAttemptsQuery);
      const recentErrors = accessAttemptsSnapshot.docs.filter(
        doc => doc.data().status === 'denied'
      ).length;

      setStats({
        totalUsers: usersSnapshot.size,
        totalThreads: threadsSnapshot.size,
        totalNotes,
        recentErrors
      });

      setHasFetched(true); // フェッチ完了をマーク

    } catch (error) {
      handleError(error as Error, 'DeveloperDashboard.fetchStats');
    } finally {
      setLoading(false);
    }
  }, [hasFetched, handleError, setHasFetched]);

  useEffect(() => {
    // 開発者ロールの場合のみ実行し、依存関係を最小限に
    if (userData?.role === 'developer') {
      fetchStats();
    }    }, [userData?.role, fetchStats]);

  const refreshStats = useCallback(() => {
    setHasFetched(false);
    fetchStats();
  }, [fetchStats]);

  if (userData?.role !== 'developer') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">このページは開発者のみアクセス可能です</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold bg-gradient-to-r ${themeColors.text} bg-clip-text text-transparent`}>
          開発者ダッシュボード
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshStats}
            className={`px-3 py-1 rounded-lg text-sm font-medium bg-${themeColors.primary} text-white hover:opacity-90 transition-opacity`}
          >
            統計更新
          </button>
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${themeColors.primary} text-white`}>
            Developer Mode
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-${themeColors.primary}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">総ユーザー数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className={`p-3 rounded-full bg-${themeColors.accent}`}>
              <svg className={`w-6 h-6 text-${themeColors.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-${themeColors.primary}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">総スレッド数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalThreads}</p>
            </div>
            <div className={`p-3 rounded-full bg-${themeColors.accent}`}>
              <svg className={`w-6 h-6 text-${themeColors.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-${themeColors.primary}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">総ノート数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
            </div>
            <div className={`p-3 rounded-full bg-${themeColors.accent}`}>
              <svg className={`w-6 h-6 text-${themeColors.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-${themeColors.primary}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">最近のエラー</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentErrors}</p>
            </div>
            <div className={`p-3 rounded-full bg-${themeColors.accent}`}>
              <svg className={`w-6 h-6 text-${themeColors.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">システム情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">現在のユーザー</p>
            <p className="font-medium">{userData.displayName || userData.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">ロール</p>
            <p className="font-medium">Developer</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">最終更新</p>
            <p className="font-medium">{new Date().toLocaleString('ja-JP')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// React.memoでコンポーネントをメモ化して不要な再レンダリングを防ぐ
export default memo(DeveloperDashboard);
