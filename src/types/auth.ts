export type UserRole = 'member' | 'professor' | 'developer';

export interface WhitelistEntry {
  email: string;
  addedAt: Date;
  addedBy: string;
}

import type { Timestamp } from 'firebase/firestore';

export interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Timestamp;
}

export interface AccessAttempt {
  email: string;
  timestamp: Date;
  status: 'denied' | 'approved';
  message?: string;
}
