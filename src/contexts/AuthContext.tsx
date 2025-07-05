import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
import { auth, db } from '../config/firebase';
import type { UserRole, UserData } from '../types/auth';

// ブロックされたユーザーかチェック
const checkIfBlocked = async (email: string): Promise<boolean> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Checking if user is blocked:', normalizedEmail);
    
    const blockedRef = collection(db, 'blockedUsers');
    const blockedQuery = query(
      blockedRef, 
      where('email', '==', normalizedEmail),
      where('isActive', '==', true)
    );
    const blockedDocs = await getDocs(blockedQuery);

    const isBlocked = !blockedDocs.empty;
    console.log('Block check result:', { normalizedEmail, isBlocked });
    
    return isBlocked;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    // エラーの場合はブロックされていないとみなす（フェイルオープン）
    return false;
  }
};

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

      const normalizedEmail = email.toLowerCase().trim();
      console.log('Checking whitelist for email:', normalizedEmail);
      
      // メールアドレスでホワイトリストを検索
      const whitelistRef = collection(db, 'Whitelist');
      const whitelistQuery = query(whitelistRef, where('email', '==', normalizedEmail));
      const whitelistDocs = await getDocs(whitelistQuery);

      const exists = !whitelistDocs.empty;
      console.log('Whitelist check result:', { normalizedEmail, exists });
      
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

    // ホワイトリストからユーザー情報を取得
    const whitelistQuery = query(collection(db, 'Whitelist'), where('email', '==', user.email?.toLowerCase().trim()));
    const whitelistDocs = await getDocs(whitelistQuery);
    
    const whitelistData = whitelistDocs.docs[0]?.data();
    if (!whitelistData) {
      throw new Error('ホワイトリストエントリーが見つかりません');
    }

    const newUserData = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: 'member',  // デフォルトロールは'member'
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
          // ホワイトリストチェック（優先）
          const isWhitelisted = await checkWhitelist(currentUser.email!);
          
          if (!isWhitelisted) {
            await logAccessAttempt(currentUser.email!, 'denied');
            await firebaseSignOut(auth);
            setError('このメールアドレスではアクセスできません');
            setIsAuthorized(false);
            setUser(null);
            setUserData(null);
            setLoading(false);
            return;
          }

          // ブロックチェック（セカンダリ）
          try {
            const isBlocked = await checkIfBlocked(currentUser.email!);
            
            if (isBlocked) {
              await logAccessAttempt(currentUser.email!, 'denied');
              await firebaseSignOut(auth);
              setError('このアカウントはブロックされています');
              setIsAuthorized(false);
              setUser(null);
              setUserData(null);
              setLoading(false);
              return;
            }
          } catch (blockCheckError) {
            console.warn('Block check failed, proceeding with login:', blockCheckError);
            // ブロックチェックに失敗してもログインを継続
          }

          // ユーザーデータの取得
          await logAccessAttempt(currentUser.email!, 'approved');
          const userData = await getOrCreateUserData(currentUser);
          setUser(currentUser);
          setUserData(userData);
          setIsAuthorized(true);
          setError(null);
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

// ユーザーをブロックする関数
export const blockUser = async (email: string, reason: string, blockedByEmail: string) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Blocking user:', normalizedEmail);
    
    // 既存のブロックエントリーをチェック
    const blockedRef = collection(db, 'blockedUsers');
    const existingQuery = query(blockedRef, where('email', '==', normalizedEmail));
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      // 既存のエントリーを更新
      const docRef = doc(db, 'blockedUsers', existingDocs.docs[0].id);
      await updateDoc(docRef, {
        isActive: true,
        blockedAt: serverTimestamp(),
        blockedBy: blockedByEmail,
        reason: reason
      });
    } else {
      // 新しいエントリーを作成
      await addDoc(blockedRef, {
        email: normalizedEmail,
        blockedAt: serverTimestamp(),
        blockedBy: blockedByEmail,
        reason: reason,
        isActive: true
      });
    }
    
    console.log('Successfully blocked user:', normalizedEmail);
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

// ユーザーのブロックを解除する関数
export const unblockUser = async (email: string) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Unblocking user:', normalizedEmail);
    
    const blockedRef = collection(db, 'blockedUsers');
    const blockedQuery = query(blockedRef, where('email', '==', normalizedEmail));
    const blockedDocs = await getDocs(blockedQuery);
    
    if (!blockedDocs.empty) {
      const docRef = doc(db, 'blockedUsers', blockedDocs.docs[0].id);
      await updateDoc(docRef, {
        isActive: false
      });
      console.log('Successfully unblocked user:', normalizedEmail);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unblocking user:', error);
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
