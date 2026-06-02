import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import FeedScreen from '../screens/feed/FeedScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CreateRecipeScreen from '../screens/create/CreateRecipeScreen';
import TrendingScreen from '../screens/trending/TrendingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.primaryLight,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Feed':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Create':
              return (
                <View style={styles.createButtonContainer}>
                  <View style={styles.createButton}>
                    <Ionicons name="add" size={24} color={colors.white} />
                  </View>
                </View>
              );
            case 'Trending':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home';
          }
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen 
        name="Create" 
        component={CreateRecipeScreen} 
        options={{ 
          tabBarStyle: { display: 'none' }, // Hide tab bar when creating
        }}
      />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    top: -15, // Lift the button up
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
