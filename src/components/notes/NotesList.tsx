import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  Timestamp,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { Note } from '../../types';
import { NoteCard } from './NoteCard';
import { SearchBar } from '../ui/SearchBar';

import type { UserRole } from '../../types/auth';

interface NotesListProps {
  threadId: string;
  userEmail: string;
  userRole: UserRole;
  getDisplayName: (email: string) => string;
}

const COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'];

export const NotesList = ({ threadId, userEmail, userRole, getDisplayName }: NotesListProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ text: '', color: 'yellow' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotes = async () => {
    const notesQuery = query(
      collection(db, `threads/${threadId}/notes`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(notesQuery);
    const notesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
    setNotes(notesData);
  };

  useEffect(() => {
    if (threadId) {
      fetchNotes();
    }
  }, [threadId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.text.trim()) return;

    await addDoc(collection(db, `threads/${threadId}/notes`), {
      text: newNote.text,
      color: newNote.color,
      createdAt: Timestamp.now(),
      createdBy: userEmail
    });

    setNewNote({ text: '', color: 'yellow' });
    setIsFormVisible(false);
    fetchNotes();
  };

  const getBackgroundColor = (color: string) => {
    const colors: { [key: string]: string } = {
      yellow: 'bg-yellow-100',
      green: 'bg-green-100',
      blue: 'bg-blue-100',
      pink: 'bg-pink-100',
      purple: 'bg-purple-100'
    };
    return colors[color] || 'bg-yellow-100';
  };

  const handleReaction = async (noteId: string, emoji: string) => {
    try {
      const noteRef = doc(db, `threads/${threadId}/notes`, noteId);
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const currentReactions = (note as any).reactions || {};
      const userReactions = currentReactions[emoji] || [];
      
      let updatedReactions;
      if (userReactions.includes(userEmail)) {
        // リアクションを削除
        updatedReactions = {
          ...currentReactions,
          [emoji]: userReactions.filter((email: string) => email !== userEmail)
        };
        // 空の配列の場合は削除
        if (updatedReactions[emoji].length === 0) {
          delete updatedReactions[emoji];
        }
      } else {
        // リアクションを追加
        updatedReactions = {
          ...currentReactions,
          [emoji]: [...userReactions, userEmail]
        };
      }

      await updateDoc(noteRef, { reactions: updatedReactions });
      await fetchNotes(); // リストを更新
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">メモ一覧</h2>
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>新規メモ</span>
          </button>
        </div>
      </div>

      {isFormVisible && (
        <form onSubmit={handleCreateNote} className="mb-6 bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-4">
            <textarea
              value={newNote.text}
              onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
              placeholder="新しいメモを入力"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex items-center gap-4">
              <span className="text-gray-700">色を選択：</span>
              <div className="flex gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewNote({ ...newNote, color })}
                    className={`w-8 h-8 rounded-lg ${getBackgroundColor(color)} ${
                      newNote.color === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } transition-all`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                メモを作成
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="メモを検索..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes
          .filter((note) =>
            note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((note) => (
          <NoteCard
            key={note.id}
            note={{
              id: note.id,
              text: note.text,
              createdAt: note.createdAt.toDate(),
              userId: note.createdBy,
              userEmail: note.createdBy,
              color: note.color,
              reactions: (note as any).reactions || {}
            }}
            userEmail={userEmail}
            getDisplayName={getDisplayName}
            onEdit={async (noteId, text, color) => {
              const noteRef = doc(db, `threads/${threadId}/notes`, noteId);
              await updateDoc(noteRef, {
                text,
                color,
              });
              await fetchNotes();
            }}
            onDelete={async (noteId) => {
              const noteRef = doc(db, `threads/${threadId}/notes`, noteId);
              await deleteDoc(noteRef);
              await fetchNotes();
            }}
            onReaction={handleReaction}
          />
        ))}
      </div>
    </div>
  );
};
