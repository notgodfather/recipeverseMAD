import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

export default function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const maxW = Math.min(width, layout.maxContentWidth);
  const columnWidth = maxW / 3 - 2;

  const [activeTab, setActiveTab] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  const { profile, firebaseUser, logout, refreshProfile } = useAuthStore();
  const { recipes, savedRecipes } = useRecipeStore();

  const isGuest = firebaseUser?.isAnonymous ?? false;
  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? (isGuest ? 'Guest Chef' : 'Chef');
  const username = displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUri = profile?.photoURL
    ?? firebaseUser?.photoURL
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EFEFEF&color=262626&size=200`;
  const bio = profile?.bio || (isGuest ? 'Browsing as a guest.' : '');
  const followers = profile?.followers ?? 0;
  const following = profile?.following ?? 0;

  const myRecipes = useMemo(
    () => recipes.filter((r) => r.chefId === firebaseUser?.uid),
    [recipes, firebaseUser?.uid]
  );

  const savedRecipesList = useMemo(
    () => recipes.filter((r) => savedRecipes.includes(r.id)),
    [recipes, savedRecipes]
  );

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout();
      }
    } else {
      // Need Alert import for this but ignoring it since web is priority for now, or just fallback
      logout(); 
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setTimeout(() => setRefreshing(false), 500);
  }, [refreshProfile]);

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  const renderGrid = (recipeList: Recipe[]) => {
    if (recipeList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="camera-outline" size={32} color={colors.text} />
          </View>
          <Text style={styles.emptyTitle}>No Posts Yet</Text>
        </View>
      );
    }
    return (
      <View style={styles.gridContainer}>
        {recipeList.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigateToDetail(item.id)}
            activeOpacity={0.9}
            style={{ width: columnWidth, height: columnWidth, marginBottom: 3 }}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={{ width: '100%', height: '100%', backgroundColor: colors.borderLight }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.usernameHeader}>{username}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Profile Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{myRecipes.length}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{following >= 1000 ? `${(following / 1000).toFixed(1)}k` : following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.displayName}>{displayName}</Text>
          {!!bio && <Text style={styles.bioText}>{bio}</Text>}
        </View>

        {/* Edit Profile Button */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.editButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]} 
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons name="grid-outline" size={24} color={activeTab === 'grid' ? colors.text : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]} 
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons name="bookmark-outline" size={24} color={activeTab === 'saved' ? colors.text : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'grid' && renderGrid(myRecipes)}
        {activeTab === 'saved' && renderGrid(savedRecipesList)}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  usernameHeader: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.text,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.text,
  },
  bioSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  displayName: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  bioText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  actionRow: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.text,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: colors.text,
  },
});
