import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './tokens';
import { useAppState } from '../lib/state';

const ThemeContext = createContext({ colors: darkColors, isDark: true });

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const { state } = useAppState();
  const pref = state?.settings?.themePreference ?? 'system';

  const isDark = pref === 'system'
    ? (systemScheme !== 'light')
    : pref === 'dark';

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(() => ({ colors, isDark, scheme: isDark ? 'dark' : 'light' }), [colors, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
