import { Timestamp } from 'firebase/firestore';

export interface Note {
  id: string;
  title: string;
  text: string;
  color: string;
  createdAt: Timestamp;
  createdBy: string;
  threadId: string;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: Timestamp;
}

export type ThreadColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface ThreadSettings {
  title: string;
  visibleTo: string[] | "all";
  editableBy: string[] | "all";
  color: ThreadColor;
  description: string;
  pinned: boolean;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: Timestamp;
  createdBy: string;
  visibleTo: string[] | "all";
  editableBy: string[] | "all";
  color: string;
  description: string;
  pinned: boolean;
}
