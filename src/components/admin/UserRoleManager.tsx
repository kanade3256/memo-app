import { useState } from 'react';
import type { UserRole } from '../../types/auth';
import { updateUserRole } from '../../contexts/AuthContext';

interface UserRoleManagerProps {
  userId: string;
  currentRole: UserRole;
  onRoleUpdate: () => void;
}

export const UserRoleManager = ({ userId, currentRole, onRoleUpdate }: UserRoleManagerProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const roles: UserRole[] = ['member', 'professor', 'developer'];

  const handleRoleUpdate = async () => {
    try {
      setIsUpdating(true);
      await updateUserRole(userId, selectedRole);
      onRoleUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('ロールの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
        className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isUpdating}
      >
        {roles.map(role => (
          <option key={role} value={role}>
            {role === 'member' ? 'メンバー' :
             role === 'professor' ? '教授' :
             role === 'developer' ? '開発者' : role}
          </option>
        ))}
      </select>
      {selectedRole !== currentRole && (
        <button
          onClick={handleRoleUpdate}
          disabled={isUpdating}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdating ? '更新中...' : 'ロールを更新'}
        </button>
      )}
    </div>
  );
};
