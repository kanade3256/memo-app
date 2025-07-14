import type { UserRole } from '../../types/auth';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleColors: Record<UserRole, { bg: string; text: string }> = {
  member: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  professor: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
  },
  developer: {
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
};

const roleLabels: Record<UserRole, string> = {
  member: 'メンバー',
  professor: '教授',
  developer: '開発者',
};

export const RoleBadge = ({ role, className = '' }: RoleBadgeProps) => {
  const { bg, text } = roleColors[role];
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}
    >
      {roleLabels[role]}
    </span>
  );
};
