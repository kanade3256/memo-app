import { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Thread } from '../types';

import type { UserRole } from '../types/auth';

interface ThreadCardProps {
  thread: Thread;
  userEmail: string;
  userRole: UserRole;
  onSelect: () => void;
  onEdit: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const ThreadCard = ({
  thread,
  userEmail,
  userRole,
  onSelect,
  onEdit,
  onDelete,
}: ThreadCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(thread.title);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isOwner = thread.createdBy === userEmail;
  const canEdit = userRole === 'professor' || userRole === 'developer' || isOwner;

  const handleEdit = async () => {
    if (newTitle.trim() && newTitle !== thread.title) {
      await onEdit(newTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <>
      <div className="group relative bg-white/60 backdrop-blur-sm rounded-lg p-6 shadow-sm 
                    hover:shadow-md transition-all duration-200 cursor-pointer"
           onClick={() => !isEditing && onSelect()}>
        {isEditing ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleEdit}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
            <button
              onClick={() => {
                setNewTitle(thread.title);
                setIsEditing(false);
              }}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-medium text-gray-900">{thread.title}</h3>
            {canEdit && (
              <Menu as="div" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Menu.Button className="p-1 rounded-full hover:bg-black/5 transition-colors" onClick={(e) => e.stopPropagation()}>
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
                  <Menu.Items className="absolute right-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50" onClick={(e) => e.stopPropagation()}>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteDialogOpen(true);
                          }}
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
          </>
        )}
        <div className="mt-2 text-sm text-gray-500">
          作成者: {thread.createdBy}
        </div>
        <div className="text-xs text-gray-400">
          {thread.createdAt.toDate().toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      スレッドを削除
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        このスレッドを削除してもよろしいですか？この操作は取り消せません。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setIsDeleteDialogOpen(false);
                  }}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm 
                           font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  削除
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(false);
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm 
                           font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
                           hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
