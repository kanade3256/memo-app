import type { Timestamp } from 'firebase/firestore';

export interface Thread {
  id: string;
  title: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: Timestamp;
  createdBy: string;
}
