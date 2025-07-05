import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  HomeIcon,
  UserPlusIcon,
  UserCircleIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import type { UserRole } from '../../types/auth';
import { useTheme } from '../../contexts/ThemeContext';

interface HamburgerMenuProps {
  userRole: UserRole;
  onSignOut: () => Promise<void>;
}

export const HamburgerMenu = ({ userRole, onSignOut }: HamburgerMenuProps) => {
  const { currentTheme, setCurrentTheme } = useTheme();

  const handleRoleSwitch = (newRole: 'member' | 'professor' | 'developer') => {
    setCurrentTheme(newRole);
  };

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
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/members"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                >
                  <UsersIcon className="h-5 w-5" />
                  メンバー一覧
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
            
            {/* 開発者専用：ロール切り替え */}
            {userRole === 'developer' && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/developer-dashboard"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                    >
                      <CogIcon className="h-5 w-5" />
                      開発者ダッシュボード
                    </Link>
                  )}
                </Menu.Item>
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    表示モード切り替え
                  </p>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleRoleSwitch('member')}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } ${currentTheme === 'member' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                      flex items-center justify-between w-full text-left px-4 py-2 text-sm`}
                    >
                      <div className="flex items-center gap-3">
                        <EyeIcon className="h-5 w-5" />
                        メンバー画面
                      </div>
                      {currentTheme === 'member' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleRoleSwitch('professor')}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } ${currentTheme === 'professor' ? 'bg-green-50 text-green-700' : 'text-gray-700'}
                      flex items-center justify-between w-full text-left px-4 py-2 text-sm`}
                    >
                      <div className="flex items-center gap-3">
                        <EyeIcon className="h-5 w-5" />
                        教授画面
                      </div>
                      {currentTheme === 'professor' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleRoleSwitch('developer')}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } ${currentTheme === 'developer' ? 'bg-red-50 text-red-700' : 'text-gray-700'}
                      flex items-center justify-between w-full text-left px-4 py-2 text-sm`}
                    >
                      <div className="flex items-center gap-3">
                        <CogIcon className="h-5 w-5" />
                        開発者画面
                      </div>
                      {currentTheme === 'developer' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </button>
                  )}
                </Menu.Item>
              </>
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
