import { useAuth } from '../../contexts/AuthContext';

export const Login = () => {
  const { loading, error, signIn } = useAuth();

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          研究室メモアプリ
        </h1>
        <div className="text-center text-gray-600">
          <p>研究室メンバー専用のメモ共有アプリです。</p>
          <p>ログインには研究室のメールアドレスが必要です。</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        )}
        <button
          onClick={signIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white px-6 py-3 rounded-lg
                   border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? 'ログイン中...' : 'Googleでログイン'}
        </button>
      </div>
    </div>
  );
};
