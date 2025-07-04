import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useErrorLog } from './useErrorLog';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15分

export const useSessionManager = () => {
  const { signOut } = useAuth();
  const { logError } = useErrorLog();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        await signOut();
        logError(new Error('セッションがタイムアウトしました'), 'SessionManager');
      } catch (error) {
        logError(error as Error, 'SessionManager.resetTimer');
      }
    }, IDLE_TIMEOUT);
  }, [signOut, logError]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // アクティビティ監視の開始
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // 初期タイマーのセット
    resetTimer();

    // クリーンアップ
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
};
