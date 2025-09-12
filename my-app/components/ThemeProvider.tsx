import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  theme: typeof DefaultTheme;
  statusBarStyle: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  theme: DefaultTheme,
  statusBarStyle: 'dark',
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const nativeColorScheme = useNativeColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(nativeColorScheme ?? 'light');

  useEffect(() => {
    if (nativeColorScheme) {
      setColorScheme(nativeColorScheme);
    }
  }, [nativeColorScheme]);

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';

  const value = {
    colorScheme,
    theme,
    statusBarStyle,
  };

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={theme}>
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}
