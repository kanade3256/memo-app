import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ErrorLog {
  id: string;
  message: string;
  timestamp: Date;
  location?: string;
  isRead: boolean;
}

interface ErrorStore {
  errors: ErrorLog[];
  unreadCount: number;
  logError: (error: Error, location?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearErrors: () => void;
}

export const useErrorLog = create<ErrorStore>()(
  devtools(
    (set, get) => ({
      errors: [],
      unreadCount: 0,
      logError: (error: Error, location?: string) => {
        const newError: ErrorLog = {
          id: Date.now().toString(),
          message: error.message,
          timestamp: new Date(),
          location,
          isRead: false,
        };
        set(state => ({
          errors: [newError, ...state.errors],
          unreadCount: state.unreadCount + 1,
        }));
      },
      markAsRead: (id: string) => {
        set(state => {
          const updatedErrors = state.errors.map(error => 
            error.id === id ? { ...error, isRead: true } : error
          );
          return {
            errors: updatedErrors,
            unreadCount: state.unreadCount - 1,
          };
        });
      },
      markAllAsRead: () => {
        set(state => ({
          errors: state.errors.map(error => ({ ...error, isRead: true })),
          unreadCount: 0,
        }));
      },
      clearErrors: () => {
        set({ errors: [], unreadCount: 0 });
      },
    })
  )
);
