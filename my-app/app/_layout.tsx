import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';

import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationRef = useNavigationContainerRef();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      // Hide the splash screen after the fonts have loaded and the UI is ready.
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const unsubscribe = navigationRef?.addListener('transitionStart', () => {
      setIsRouteLoading(true);
    });

    const unsubscribeEnd = navigationRef?.addListener('transitionEnd', () => {
      // Add a small delay to ensure content is ready
      setTimeout(() => setIsRouteLoading(false), 150);
    });

    return () => {
      unsubscribe?.();
      unsubscribeEnd?.();
    };
  }, [navigationRef]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
        }}
        navigationKey={colorScheme}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      {isRouteLoading && <LoadingOverlay />}
    </ThemeProvider>
  );
}
