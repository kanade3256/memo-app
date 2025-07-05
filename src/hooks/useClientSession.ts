import { useEffect, useState } from 'react';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useErrorLog } from './useErrorLog';

export const useClientSession = () => {
  const { user, signOut } = useAuth();
  const { logError } = useErrorLog();
  const [clientId] = useState(() => crypto.randomUUID());
  const [isValidSession, setIsValidSession] = useState(true);

  useEffect(() => {
    if (!user) return;

    const registerSession = async () => {
      try {
        // 現在のセッションを登録
        const sessionRef = doc(db, 'sessions', clientId);
        await setDoc(sessionRef, {
          uid: user.uid,
          clientId,
          loginAt: serverTimestamp(),
          userAgent: navigator.userAgent,
        });

        // 同一ユーザーの古いセッションを無効化
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs
          .filter(doc => doc.id !== clientId)
          .map(doc => deleteDoc(doc.ref));
        
        await Promise.all(deletePromises);

        // ログイン履歴を記録
        const historyRef = doc(collection(db, `users/${user.uid}/loginHistory`));
        await setDoc(historyRef, {
          loginAt: serverTimestamp(),
          userAgent: navigator.userAgent,
          clientId,
        });

      } catch (error) {
        logError(error as Error, 'ClientSession.registerSession');
      }
    };

    registerSession();

    // セッションの監視
    const unsubscribe = onSnapshot(
      doc(db, 'sessions', clientId),
      (doc) => {
        if (!doc.exists()) {
          setIsValidSession(false);
          signOut();
        }
      },
      (error) => {
        logError(error, 'ClientSession.sessionListener');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, clientId, logError, signOut]);

  return { isValidSession };
};
