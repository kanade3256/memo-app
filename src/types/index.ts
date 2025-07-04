import { Timestamp } from 'firebase/firestore';

export interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: Timestamp;
  createdBy: string;
  threadId: string;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: Timestamp;
  createdBy: string;
}
