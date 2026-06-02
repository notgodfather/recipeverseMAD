import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChefProfileScreen from '../screens/profile/ChefProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import CreateStoryScreen from '../screens/story/CreateStoryScreen';
import StoryViewerScreen from '../screens/story/StoryViewerScreen';
import { colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // While we wait for Firebase to resolve the auth session, show a
  // branded loading indicator instead of flashing the Login screen.
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainNavigator} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChefProfile" component={ChefProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="CreateStory" component={CreateStoryScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ presentation: 'transparentModal', animation: 'fade' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
