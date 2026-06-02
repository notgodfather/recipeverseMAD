import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold_Italic,
} from '@expo-google-fonts/playfair-display';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider, useTheme } from './src/store/themeStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const initAuthListener = useAuthStore((s) => s.initAuthListener);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold_Italic,
  });

  // Start the Firebase auth listener once on app mount.
  // Returns the unsubscribe function so it cleans up if the component ever unmounts.
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContent fontsLoaded={fontsLoaded} fontError={fontError} />
    </ThemeProvider>
  );
}

function AppContent({ fontsLoaded, fontError }: { fontsLoaded: boolean; fontError: any }) {
  const theme = useTheme();
  const initAuthListener = useAuthStore((s) => s.initAuthListener);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayoutRootView}>
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
