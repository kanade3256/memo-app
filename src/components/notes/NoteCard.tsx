import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  EllipsisVerticalIcon, 
  PencilIcon, 
  TrashIcon,
  HandThumbUpIcon,
  HeartIcon,
  FaceSmileIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HeartIcon as HeartIconSolid,
  FaceSmileIcon as FaceSmileIconSolid
} from '@heroicons/react/24/solid';
import { Fragment } from 'react';
import { EditNoteModal } from './EditNoteModal';
import { DeleteNoteDialog } from './DeleteNoteDialog';
import { FullNoteModal } from './FullNoteModal';

interface NoteCardProps {
  note: {
    id: string;
    text: string;
    createdAt: Date;
    userId: string;
    userEmail: string;
    color: string;
    reactions?: { [emoji: string]: string[] };
  };
  userEmail: string;
  onEdit: (noteId: string, text: string, color: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onReaction?: (noteId: string, emoji: string) => Promise<void>;
  getDisplayName: (email: string) => string;
}

export const NoteCard = ({ note, userEmail, onEdit, onDelete, onReaction, getDisplayName }: NoteCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const isOwner = note.userEmail === userEmail;

  // リアクションボタンの設定
  const reactionButtons = [
    { emoji: '👍', icon: HandThumbUpIcon, solidIcon: HandThumbUpIconSolid },
    { emoji: '❤️', icon: HeartIcon, solidIcon: HeartIconSolid },
    { emoji: '😊', icon: FaceSmileIcon, solidIcon: FaceSmileIconSolid },
  ];

  const handleEdit = async (text: string, color: string) => {
    await onEdit(note.id, text, color);
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    await onDelete(note.id);
    setIsDeleteDialogOpen(false);
  };

  const handleReaction = async (emoji: string) => {
    if (onReaction) {
      await onReaction(note.id, emoji);
    }
  };

  // リアクション数を取得
  const getReactionCount = (emoji: string) => {
    return note.reactions?.[emoji]?.length || 0;
  };

  // ユーザーがリアクションしているかチェック
  const hasUserReacted = (emoji: string) => {
    return note.reactions?.[emoji]?.includes(userEmail) || false;
  };

  // リード文を表示する関数
  const getPreviewText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 全文表示が必要かどうか判定
  const needsFullView = note.text.length > 50;

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

        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {getPreviewText(note.text)}
          </p>
          {needsFullView && (
            <button
              onClick={() => setIsFullModalOpen(true)}
              className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <EyeIcon className="w-3 h-3 mr-1" />
              🔍 全文を表示
            </button>
          )}
        </div>

        {/* リアクション表示 */}
        {onReaction && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex space-x-2">
              {reactionButtons.map(({ emoji, icon: Icon, solidIcon: SolidIcon }) => {
                const count = getReactionCount(emoji);
                const hasReacted = hasUserReacted(emoji);
                const IconComponent = hasReacted ? SolidIcon : Icon;
                
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                      hasReacted 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    {count > 0 && <span className="font-medium">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span className="truncate max-w-[180px]">{getDisplayName(note.userEmail)}</span>
            <span className="text-xs">
              {note.createdAt instanceof Date 
                ? note.createdAt.toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : new Date(note.createdAt).toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
              }
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

      <FullNoteModal
        isOpen={isFullModalOpen}
        onClose={() => setIsFullModalOpen(false)}
        note={{
          id: note.id,
          title: '', // タイトルがない場合は空文字
          text: note.text,
          color: note.color,
          createdAt: note.createdAt,
          createdBy: note.userEmail,
          threadId: '', // threadIdは使用しないので空文字
          reactions: Object.entries(note.reactions || {}).flatMap(([emoji, users]) =>
            users.map(userId => ({
              id: `${note.id}-${emoji}-${userId}`,
              userId,
              emoji,
              createdAt: new Date()
            }))
          )
        }}
        getDisplayName={getDisplayName}
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
