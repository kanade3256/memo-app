import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserData } from '../types/auth';

interface UsersContextType {
  users: UserData[];
  loading: boolean;
  error: string | null;
  getDisplayName: (email: string) => string;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

// ロール順を定義
const roleOrder = {
  'professor': 0,
  'developer': 1,
  'member': 2,
};

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersRef = collection(db, 'users');
      const q = query(usersRef);  // シンプルなクエリに変更
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id  // documentIDを明示的に含める
      } as UserData));

      // ロール順 → 表示名順でソート
      usersData.sort((a, b) => {
        const roleComparison = (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
        if (roleComparison !== 0) return roleComparison;
        return (a.displayName || a.email).localeCompare(b.displayName || b.email);
      });

      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getDisplayName = (email: string): string => {
    const user = users.find(u => u.email === email);
    return user?.displayName || email;
  };

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        getDisplayName,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
