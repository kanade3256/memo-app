import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';

export const MembersPage = () => {
  const { userData } = useAuth();
  const { users, loading, error } = useUsers();

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  const getRoleBadgeStyle = (role: string): { bg: string; text: string } => {
    switch (role) {
      case 'professor':
        return { bg: 'bg-purple-100', text: 'text-purple-800' };
      case 'developer':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-800' };
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'professor':
        return '教授';
      case 'developer':
        return '開発者';
      default:
        return 'メンバー';
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">登録メンバー一覧</h1>
      
      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.uid}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {user.displayName || user.email}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div
                className={`${getRoleBadgeStyle(user.role).bg} ${
                  getRoleBadgeStyle(user.role).text
                } px-3 py-1 rounded-full text-sm font-medium`}
              >
                {getRoleLabel(user.role)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
