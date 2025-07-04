import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBadge } from './components/ErrorBadge';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UsersProvider, useUsers } from './contexts/UsersContext';
import { MembersPage } from './components/MembersPage';
import { Login } from './components/Login';
import { ThreadsList } from './components/ThreadsList';
import { NotesList } from './components/NotesList';
import { RoleBadge } from './components/RoleBadge';
import { RegisterUserPage } from './components/RegisterUserPage';
import { ProfileSettingsPage } from './components/ProfileSettingsPage';
import { HamburgerMenu } from './components/HamburgerMenu';

const AppContent = () => {
  const { userData, loading, error, signOut, isAuthorized } = useAuth();
  const { getDisplayName } = useUsers();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              研究室メモアプリ
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-600 font-medium">
                  {getDisplayName(userData.email)}
                </span>
                <RoleBadge role={userData.role} />
              </div>
              <HamburgerMenu
                userRole={userData.role}
                onSignOut={signOut}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6">
        <Routes>
          <Route
            path="/"
            element={
              !selectedThreadId ? (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                  <ThreadsList
                    userEmail={userData.email}
                    userRole={userData.role}
                    onSelectThread={setSelectedThreadId}
                    getDisplayName={getDisplayName}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <button
                    onClick={() => setSelectedThreadId(null)}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700
                      font-medium transition-colors px-4 py-2 rounded-lg hover:bg-blue-50/50"
                  >
                    <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    スレッド一覧に戻る
                  </button>
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8">
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
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <UsersProvider>
        <Router>
          <AppContent />
          <ErrorBadge />
        </Router>
      </UsersProvider>
    </AuthProvider>
  );
}

export default App;
