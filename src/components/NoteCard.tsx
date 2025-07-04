import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import type { Note } from '../types';
import { EditNoteModal } from './EditNoteModal';
import { DeleteNoteDialog } from './DeleteNoteDialog';

interface NoteCardProps {
  note: Note;
  userEmail: string;
  onEdit: (noteId: string, text: string, color: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  getDisplayName: (email: string) => string;
}

export const NoteCard = ({ note, userEmail, onEdit, onDelete, getDisplayName }: NoteCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isOwner = note.createdBy === userEmail;

  const handleEdit = async (text: string, color: string) => {
    await onEdit(note.id, text, color);
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    await onDelete(note.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className={`relative p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow ${
        getBackgroundColor(note.color)
      }`}>
        {isOwner && (
          <Menu as="div" className="absolute top-2 right-2">
            <Menu.Button className="p-1 rounded-full hover:bg-black/5 transition-colors">
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      編集
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      削除
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        )}

        <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed mb-4">
          {note.text}
        </p>
        <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span className="truncate max-w-[180px]">{getDisplayName(note.createdBy)}</span>
            <span className="text-xs">
              {note.createdAt.toDate().toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      <EditNoteModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        initialText={note.text}
        initialColor={note.color}
      />

      <DeleteNoteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};

const getBackgroundColor = (color: string) => {
  const colors: { [key: string]: string } = {
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    pink: 'bg-pink-100',
    purple: 'bg-purple-100',
  };
  return colors[color] || 'bg-yellow-100';
};
