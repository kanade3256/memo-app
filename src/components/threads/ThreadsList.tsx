import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { SearchBar } from '../ui/SearchBar';
import { ThreadCard } from './ThreadCard';
import type { Thread } from '../../types';
import type { UserRole } from '../../types/auth';

interface ThreadsListProps {
  userEmail: string;
  userRole: UserRole;
  onSelectThread: (threadId: string) => void;
  getDisplayName: (email: string) => string;
}

export const ThreadsList = ({ userEmail, userRole, onSelectThread, getDisplayName }: ThreadsListProps) => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchThreads = async () => {
    const threadsQuery = query(
      collection(db, 'threads'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(threadsQuery);
    const threadsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Thread));
    setThreads(threadsData);
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;

    await addDoc(collection(db, 'threads'), {
      title: newThreadTitle,
      createdAt: Timestamp.now(),
      createdBy: userEmail
    });

    setNewThreadTitle('');
    setIsFormVisible(false);
    fetchThreads();
  };

  const handleEditThread = async (threadId: string, newTitle: string) => {
    const threadRef = doc(db, 'threads', threadId);
    await updateDoc(threadRef, { title: newTitle });
    fetchThreads();
  };

  const handleDeleteThread = async (threadId: string) => {
    const threadRef = doc(db, 'threads', threadId);
    await deleteDoc(threadRef);
    fetchThreads();
  };

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">スレッド一覧</h2>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* 新規スレッド作成ボタン（全ユーザー対象） */}
          <button
            onClick={() => navigate('/create-thread')}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg 
                     hover:bg-blue-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>スレッド作成</span>
          </button>
          
          {/* 簡易作成（教授・開発者のみ） */}
          {(userRole === 'professor' || userRole === 'developer') && (
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg 
                       hover:bg-gray-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>簡易作成</span>
            </button>
          )}
        </div>
      </div>

      {isFormVisible && (
        <form onSubmit={handleCreateThread} className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="新しいスレッドのタイトル"
              className="flex-1 p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              作成
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 sm:mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="スレッドを検索..."
        />
      </div>

      <div className="grid gap-3 sm:gap-4">
        {filteredThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            userEmail={userEmail}
            userRole={userRole}
            onSelect={() => onSelectThread(thread.id)}
            onEdit={(title) => handleEditThread(thread.id, title)}
            onDelete={() => handleDeleteThread(thread.id)}
            getDisplayName={getDisplayName}
          />
        ))}
      </div>
    </div>
  );
};
