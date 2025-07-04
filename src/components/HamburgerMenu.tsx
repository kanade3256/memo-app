import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  HomeIcon,
  UserPlusIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import type { UserRole } from '../types/auth';

interface HamburgerMenuProps {
  userRole: UserRole;
  onSignOut: () => Promise<void>;
}

export const HamburgerMenu = ({ userRole, onSignOut }: HamburgerMenuProps) => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bars3Icon className="h-6 w-6 text-gray-600" />
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
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                >
                  <HomeIcon className="h-5 w-5" />
                  ホーム
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile-settings"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                >
                  <UserCircleIcon className="h-5 w-5" />
                  プロフィール設定
                </Link>
              )}
            </Menu.Item>
            {(userRole === 'professor' || userRole === 'developer') && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/register-user"
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                  >
                    <UserPlusIcon className="h-5 w-5" />
                    ユーザー登録
                  </Link>
                )}
              </Menu.Item>
            )}
            <div className="border-t border-gray-100 my-1"></div>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onSignOut}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600`}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  ログアウト
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
