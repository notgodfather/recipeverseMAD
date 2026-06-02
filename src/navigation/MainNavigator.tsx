import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import FeedScreen from '../screens/feed/FeedScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CreateRecipeScreen from '../screens/create/CreateRecipeScreen';
import TrendingScreen from '../screens/trending/TrendingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useTheme } from '../store/themeStore';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0.5,
          borderTopColor: theme.border,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Feed':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Trending':
              iconName = focused ? 'flame' : 'flame-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'home';
          }
          return <Ionicons name={iconName} size={route.name === 'Create' ? 32 : 26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Create"
        component={CreateRecipeScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
