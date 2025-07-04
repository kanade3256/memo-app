import { FirebaseError } from 'firebase/app';
import { useErrorLog } from '../hooks/useErrorLog';

// Firebase エラーメッセージの日本語化
const firebaseErrorMessages: Record<string, string> = {
  'auth/user-not-found': 'ユーザーが見つかりません',
  'auth/wrong-password': 'パスワードが間違っています',
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
  'auth/invalid-email': '無効なメールアドレスです',
  'auth/operation-not-allowed': 'この操作は許可されていません',
  'auth/weak-password': 'パスワードが弱すぎます',
  'permission-denied': '権限がありません',
  'not-found': 'データが見つかりません',
  'already-exists': 'データが既に存在します',
};

export const useErrorHandler = () => {
  const { logError } = useErrorLog();

  const handleError = (error: unknown, location?: string) => {
    console.error('Error occurred:', error);

    if (error instanceof FirebaseError) {
      const message = firebaseErrorMessages[error.code] || error.message;
      logError(new Error(message), location);
      return;
    }

    if (error instanceof Error) {
      logError(error, location);
      return;
    }

    logError(new Error('予期せぬエラーが発生しました'), location);
  };

  return { handleError };
};
