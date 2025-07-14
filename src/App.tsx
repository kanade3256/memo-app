import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBadge } from './components/ui/ErrorBadge';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UsersProvider, useUsers } from './contexts/UsersContext';
import { ToastProvider } from './contexts/ToastContext';
import { MembersPage } from './components/admin/MembersPage';
import { Login } from './components/auth/Login';
import { ThreadsList } from './components/threads/ThreadsList';
import { CreateThreadPage } from './components/threads/CreateThreadPage';
import { NotesList } from './components/notes/NotesList';
import { RoleBadge } from './components/ui/RoleBadge';
import { RegisterUserPage } from './components/auth/RegisterUserPage';
import { ProfileSettingsPage } from './components/auth/ProfileSettingsPage';
import { HamburgerMenu } from './components/ui/HamburgerMenu';
import { DeveloperDashboard } from './components/admin/DeveloperDashboard';

const AppContent = () => {
  const { userData, loading, error, signOut, isAuthorized } = useAuth();
  const { getDisplayName } = useUsers();
  const { themeColors } = useTheme();
  
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderTopColor: themeColors.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg shadow-sm">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !userData) {
    return <Login />;
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br"
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`
      }}
    >
      <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-3 sm:px-6">
          <div className="flex justify-between items-center">
            <h1 
              className="text-sm sm:text-xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent truncate whitespace-nowrap overflow-hidden max-w-[40%] sm:max-w-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`
              }}
            >
              研究室メモアプリ
            </h1>
            <div className="flex items-center gap-2 sm:gap-6">
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: themeColors.accent }}
                />
                <span className="text-gray-600 font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                  {getDisplayName(userData.email)}
                </span>
                <RoleBadge role={userData.role} className="scale-75 sm:scale-100" />
              </div>
              <HamburgerMenu
                userRole={userData.role}
                onSignOut={signOut}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-6">
        <Routes>
          <Route
            path="/"
            element={
              !selectedThreadId ? (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-6 md:p-8">
                  <ThreadsList
                    userEmail={userData.email}
                    userRole={userData.role}
                    onSelectThread={setSelectedThreadId}
                    getDisplayName={getDisplayName}
                  />
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <button
                    onClick={() => setSelectedThreadId(null)}
                    className="inline-flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-medium transition-colors px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg"
                    style={{ 
                      color: themeColors.primary,
                      backgroundColor: `${themeColors.primary}10`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${themeColors.primary}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                    }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    スレッド一覧に戻る
                  </button>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-6 md:p-8">
                    <NotesList
                      threadId={selectedThreadId}
                      userEmail={userData.email}
                      userRole={userData.role}
                      getDisplayName={getDisplayName}
                    />
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/register-user"
            element={
              userData.role === 'professor' || userData.role === 'developer' ? (
                <RegisterUserPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/profile-settings"
            element={<ProfileSettingsPage />}
          />
          <Route
            path="/members"
            element={<MembersPage />}
          />
          <Route
            path="/developer-dashboard"
            element={
              userData.role === 'developer' ? (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-6 md:p-8">
                  <DeveloperDashboard />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/create-thread"
            element={<CreateThreadPage />}
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <UsersProvider>
        <ThemeProvider>
          <ToastProvider>
            <Router>
              <AppContent />
              <AdminErrorBadge />
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </UsersProvider>
    </AuthProvider>
  );
}

// 管理者のみにエラーバッジを表示するためのラッパーコンポーネント
const AdminErrorBadge = () => {
  const { userData } = useAuth();
  
  // 管理者（developer または professor）の場合のみ ErrorBadge を表示
  if (userData && (userData.role === 'developer' || userData.role === 'professor')) {
    return <ErrorBadge />;
  }
  
  // それ以外のユーザーには表示しない
  return null;
};

export default App;
