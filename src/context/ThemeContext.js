import React, { createContext, useContext, useMemo } from 'react';

const LIGHT = {
  isDark: false,
  bg: '#F8F5FF',
  bgDark: '#EDE8FF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F0EAFF',
  primary: '#7C3AED',
  primaryLight: '#9D5BFF',
  primaryDark: '#5B21B6',
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E8DEFF',
  borderLight: '#F0EAFF',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  pending: '#6366F1',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.45)',
  divider: '#E8DEFF',
  inputBg: '#FFFFFF',
  switchTrackOn: '#7C3AED',
  switchTrackOff: '#CBD5E1',
  keyBg: '#EEF0FF',
  keyBackspaceBg: '#F0E8FF',
};

const ThemeContext = createContext({ colors: LIGHT, isDark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const value = useMemo(() => ({
    colors: LIGHT,
    isDark: false,
    toggleTheme: () => {},
  }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
