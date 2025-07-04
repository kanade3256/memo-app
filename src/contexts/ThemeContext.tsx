import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

type RoleTheme = 'member' | 'professor' | 'developer';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
}

interface ThemeContextType {
  currentTheme: RoleTheme;
  setCurrentTheme: (theme: RoleTheme) => void;
  themeColors: ThemeColors;
  getThemeColors: () => {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
    hover: string;
    text: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors = {
  member: {
    primary: 'blue-500',
    secondary: 'blue-600', 
    accent: 'blue-50',
    gradient: 'from-blue-50 to-indigo-50',
    hover: 'hover:bg-blue-600',
    text: 'from-blue-600 to-indigo-600'
  },
  professor: {
    primary: 'green-500',
    secondary: 'green-600',
    accent: 'green-50', 
    gradient: 'from-green-50 to-emerald-50',
    hover: 'hover:bg-green-600',
    text: 'from-green-600 to-emerald-600'
  },
  developer: {
    primary: 'red-500',
    secondary: 'red-600',
    accent: 'red-50',
    gradient: 'from-red-50 to-rose-50', 
    hover: 'hover:bg-red-600',
    text: 'from-red-600 to-rose-600'
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { userData } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<RoleTheme>('member');

  useEffect(() => {
    if (userData?.role) {
      setCurrentTheme(userData.role as RoleTheme);
    }
  }, [userData?.role]);

  const getThemeColors = useCallback(() => themeColors[currentTheme], [currentTheme]);

  const currentThemeColors: ThemeColors = useMemo(() => ({
    primary: currentTheme === 'member' ? '#3B82F6' : currentTheme === 'professor' ? '#10B981' : '#EF4444',
    secondary: currentTheme === 'member' ? '#2563EB' : currentTheme === 'professor' ? '#059669' : '#DC2626',
    accent: currentTheme === 'member' ? '#10B981' : currentTheme === 'professor' ? '#3B82F6' : '#F59E0B',
    gradientFrom: currentTheme === 'member' ? '#EBF8FF' : currentTheme === 'professor' ? '#ECFDF5' : '#FEF2F2',
    gradientTo: currentTheme === 'member' ? '#E0E7FF' : currentTheme === 'professor' ? '#D1FAE5' : '#FEE2E2'
  }), [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, getThemeColors, themeColors: currentThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
