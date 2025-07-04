import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserRole, UserData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthorized: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ホワイトリストチェック
  const checkWhitelist = async (email: string): Promise<boolean> => {
    try {
      if (!email) {
        console.error('Email is required for whitelist check');
        return false;
      }

      console.log('Checking whitelist for email:', email);
      const normalizedEmail = email.toLowerCase().trim();
      
      // まず全てのホワイトリストエントリーを取得して確認
      const whitelistRef = collection(db, 'Whitelist');
      const allEntriesQuery = query(whitelistRef);
      const allEntries = await getDocs(allEntriesQuery);
      
      console.log('Total whitelist entries:', allEntries.size);
      
      // すべてのエントリーをログに出力（詳細な比較情報を含む）
      allEntries.forEach(doc => {
        const data = doc.data();
        const entryEmail = data.email?.toLowerCase?.()?.trim?.();
        console.log('Comparing whitelist entry:', {
          id: doc.id,
          rawEmail: data.email,
          normalizedEmail: entryEmail,
          matches: entryEmail === normalizedEmail,
          addedAt: data.addedAt?.toDate?.() || data.addedAt,
          addedBy: data.addedBy,
          comparison: {
            entryLength: entryEmail?.length,
            searchLength: normalizedEmail.length,
            exact: entryEmail === normalizedEmail,
            includesSearch: entryEmail?.includes(normalizedEmail),
            searchIncludes: normalizedEmail.includes(entryEmail || ''),
            charactersMatch: Array.from(entryEmail || '').map((char, i) => ({
              position: i,
              entryChar: char,
              searchChar: normalizedEmail[i],
              matches: char === normalizedEmail[i]
            }))
          }
        });
      });

      // 直接クエリでも試してみる
      const directQuery = query(whitelistRef, where('email', '==', normalizedEmail));
      const directQueryResult = await getDocs(directQuery);
      console.log('Direct query result:', {
        found: !directQueryResult.empty,
        count: directQueryResult.size
      });

      // メールアドレスが一致するものを探す
      const exists = allEntries.docs.some(doc => {
        const entryEmail = doc.data().email?.toLowerCase?.()?.trim?.();
        const matches = entryEmail === normalizedEmail;
        if (matches) {
          console.log('Found matching whitelist entry:', doc.data());
        }
        return matches;
      });

      console.log('Final whitelist check result:', {
        normalizedEmail,
        exists,
        allEntriesCount: allEntries.size,
        directQueryFound: !directQueryResult.empty
      });
      return exists;
    } catch (error) {
      console.error('Error checking whitelist:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      // エラーの場合はfalseを返す（エラーをスローするのではなく）
      return false;
    }
  };

  // アクセス試行ログの記録
  const logAccessAttempt = async (email: string, status: 'denied' | 'approved') => {
    const logData: {
      email: string;
      timestamp: any;  // serverTimestampの型のため
      status: 'denied' | 'approved';
      message?: string;
    } = {
      email,
      timestamp: serverTimestamp(),
      status,
    };

    // deniedの場合のみmessageフィールドを追加
    if (status === 'denied') {
      logData.message = 'メールアドレスがホワイトリストに登録されていません';
    }

    await addDoc(collection(db, 'accessAttempts'), logData);
  };

  // ユーザーデータの取得または作成
  const getOrCreateUserData = async (user: User): Promise<UserData> => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt as Timestamp
      } as UserData;
    }

    const newUserData = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'member',
      createdAt: Timestamp.now(),
    } as UserData;

    await setDoc(userRef, newUserData);
    return newUserData;
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // ホワイトリストチェック
          const isWhitelisted = await checkWhitelist(currentUser.email!);
          
          if (!isWhitelisted) {
            await logAccessAttempt(currentUser.email!, 'denied');
            await firebaseSignOut(auth);
            setError('このメールアドレスではアクセスできません');
            setIsAuthorized(false);
            setUser(null);
            setUserData(null);
          } else {
            await logAccessAttempt(currentUser.email!, 'approved');
            const userData = await getOrCreateUserData(currentUser);
            setUser(currentUser);
            setUserData(userData);
            setIsAuthorized(true);
            setError(null);
          }
        } else {
          setUser(null);
          setUserData(null);
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Auth error:', err);
        const errorMessage = err instanceof Error ? err.message : '認証エラーが発生しました';
        setError(`認証エラー: ${errorMessage}`);
        setUser(null);
        setUserData(null);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Sign in error:', err);
      setError('ログインに失敗しました');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('ログアウトに失敗しました');
    }
  };

  const refreshUserData = async () => {
    if (user) {
      const newUserData = await getOrCreateUserData(user);
      setUserData(newUserData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        signIn,
        signOut,
        isAuthorized,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};  // ホワイトリストにユーザーを追加するヘルパー関数
export const addToWhitelist = async (emailToAdd: string, addedByEmail: string) => {
  const whitelistRef = collection(db, 'Whitelist');
  
  // 既存のエントリーをチェック
  const q = query(whitelistRef, where('email', '==', emailToAdd.toLowerCase().trim()));
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    console.log('Email already in whitelist');
    return;
  }

  // 新しいエントリーを追加
  await addDoc(whitelistRef, {
    email: emailToAdd.toLowerCase().trim(),
    addedAt: serverTimestamp(),
    addedBy: addedByEmail
  });

  console.log('Successfully added to whitelist:', emailToAdd);
};

// ユーザーロールを更新する関数
export const updateUserRole = async (userId: string, newRole: UserRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole
    });
    console.log(`Updated user ${userId} role to ${newRole}`);
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
