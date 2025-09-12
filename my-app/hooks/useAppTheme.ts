import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return useMemo(() => ({
    theme: colorScheme === 'dark' ? DarkTheme : DefaultTheme,
    colorScheme,
    isDark: colorScheme === 'dark',
    statusBarStyle: colorScheme === 'dark' ? 'light' : 'dark'
  }), [colorScheme]);
}
