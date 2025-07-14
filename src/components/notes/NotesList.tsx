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
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Note } from '../../types';
import { NoteCard } from './NoteCard';
import { SearchBar } from '../ui/SearchBar';
import { LoadingOverlay, BulkOperationBar } from '../ui';
import type { SelectionItem, BulkOperationResult } from '../../types/logs';

import type { UserRole } from '../../types/auth';

interface NotesListProps {
  threadId: string;
  userEmail: string;
  userRole?: UserRole;
  getDisplayName: (email: string) => string;
}

const COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'];

export const NotesList = ({ threadId, userEmail, getDisplayName }: NotesListProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', text: '', color: 'yellow' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (threadId) {
      fetchNotes();
    }
  }, [threadId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.text.trim()) return;

    setIsCreating(true);
    try {
      console.log('Creating note with data:', {
        title: newNote.title.trim(),
        text: newNote.text,
        color: newNote.color,
        createdAt: Timestamp.now(),
        createdBy: userEmail,
        threadId
      });

      await addDoc(collection(db, `threads/${threadId}/notes`), {
        title: newNote.title.trim(),
        text: newNote.text,
        color: newNote.color,
        createdAt: Timestamp.now(),
        createdBy: userEmail
      });

      console.log('Note created successfully');
      setNewNote({ title: '', text: '', color: 'yellow' });
      setIsFormVisible(false);
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      alert('メモの作成でエラーが発生しました: ' + errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // チェックボックス選択関数
  const handleSelectionChange = (noteId: string, selected: boolean) => {
    setSelectedItems(prev => {
      if (selected) {
        // 新しい選択を追加
        const newSelection: SelectionItem = {
          id: noteId,
          type: 'note',
          selected: true,
          data: notes.find(n => n.id === noteId) || {}
        };
        return [...prev.filter(item => item.id !== noteId), newSelection];
      } else {
        // 選択を解除
        return prev.filter(item => item.id !== noteId);
      }
    });
  };

  // 全選択/全解除
  const handleSelectAll = () => {
    const filteredNotes = notes.filter((note) =>
      note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const allSelected = filteredNotes.every(note => 
      selectedItems.some(item => item.id === note.id && item.selected)
    );

    if (allSelected) {
      // 全解除
      setSelectedItems([]);
    } else {
      // 全選択
      const newSelections: SelectionItem[] = filteredNotes.map(note => ({
        id: note.id,
        type: 'note',
        selected: true,
        data: note
      }));
      setSelectedItems(newSelections);
    }
  };

  // 一括削除関数
  const handleBulkDelete = async (items: SelectionItem[]): Promise<BulkOperationResult> => {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const noteRef = doc(db, `threads/${threadId}/notes`, item.id);
        await deleteDoc(noteRef);
        successful++;
      } catch (error) {
        console.error('Error deleting note:', item.id, error);
        failed++;
        errors.push(`${item.id}: ${error instanceof Error ? error.message : '不明なエラー'}`);
      }
    }

    await fetchNotes();
    return { 
      operation: 'delete',
      total: items.length,
      successful, 
      failed,
      errors
    };
  };

  // 選択モード切り替え
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]); // 選択をクリア
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

  const filteredNotes = notes.filter((note) =>
    note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = selectedItems.filter(item => item.selected).length;

  return (
    <LoadingOverlay isLoading={isLoading} text="メモを読み込み中...">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">メモ一覧</h2>
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              <PlusIcon className="h-5 w-5" />
              <span>新規メモ</span>
            </button>
          </div>
          
          {/* 選択モード切り替えボタン */}
          <div className="flex items-center gap-2">
            {isSelectionMode && selectedCount > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedCount === filteredNotes.length ? (
                  <>
                    <XMarkIcon className="h-4 w-4 inline mr-1" />
                    全解除
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 inline mr-1" />
                    全選択
                  </>
                )}
              </button>
            )}
            <button
              onClick={toggleSelectionMode}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelectionMode 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelectionMode ? '選択終了' : '一括選択'}
            </button>
          </div>
        </div>

        {/* 一括操作バー */}
        {isSelectionMode && selectedCount > 0 && (
          <div className="mb-6">
            <BulkOperationBar
              selectedItems={selectedItems}
              onClearSelection={() => setSelectedItems([])}
              onBulkDelete={handleBulkDelete}
            />
          </div>
        )}

        {isFormVisible && (
          <LoadingOverlay isLoading={isCreating} text="メモを作成中...">
            <form onSubmit={handleCreateNote} className="mb-6 bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="メモのタイトル（任意）"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <textarea
                    value={newNote.text}
                    onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                    placeholder="メモの内容を入力"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    disabled={isCreating}
                  />
                </div>
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
                        disabled={isCreating}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating || !newNote.text.trim()}
                  >
                    {isCreating ? 'メモを作成中...' : 'メモを作成'}
                  </button>
                </div>
              </div>
            </form>
          </LoadingOverlay>
        )}

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="メモを検索..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={{
                id: note.id,
                title: (note as any).title || '', // titleフィールドを追加
                text: note.text,
                createdAt: note.createdAt.toDate(),
                userId: note.createdBy,
                userEmail: note.createdBy,
                color: note.color,
                reactions: (note as any).reactions || {}
              }}
              userEmail={userEmail}
              getDisplayName={getDisplayName}
              isSelectionMode={isSelectionMode}
              isSelected={selectedItems.some(item => item.id === note.id && item.selected)}
              onSelectionChange={handleSelectionChange}
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
    </LoadingOverlay>
  );
};
