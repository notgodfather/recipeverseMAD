import React, { createContext, useContext } from 'react';
import { create } from 'zustand';
import { getTheme, ThemeColors } from '../constants/theme';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));

// React Context so any component can get the active theme colors
const ThemeContext = createContext<ThemeColors>(getTheme(false));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useThemeStore((s) => s.isDark);
  const theme = getTheme(isDark);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
