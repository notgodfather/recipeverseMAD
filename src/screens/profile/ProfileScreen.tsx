import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

export default function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('My Recipes');
  const columnWidth = (width - layout.spacing.m * 3) / 2;

  const [refreshing, setRefreshing] = useState(false);

  const { profile, firebaseUser, logout, refreshProfile } = useAuthStore();
  const { recipes, savedRecipes } = useRecipeStore();

  // Derived display values — fall back gracefully for guests
  const isGuest = firebaseUser?.isAnonymous ?? false;
  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? (isGuest ? 'Guest Chef' : 'Chef');
  const displayEmail = profile?.email ?? firebaseUser?.email ?? '';
  const avatarUri = profile?.photoURL
    ?? firebaseUser?.photoURL
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D04C2E&color=fff&size=200`;
  const bio = profile?.bio || (isGuest ? 'Browsing as a guest.' : 'No bio yet. Edit your profile to add one.');
  const specialty = profile?.specialty || '';
  const followers = profile?.followers ?? 0;
  const following = profile?.following ?? 0;
  const recipeCount = profile?.recipeCount ?? 0;

  // ── Real data: filter recipes by current user ─────────────
  const myRecipes = useMemo(
    () => recipes.filter((r) => r.chefId === firebaseUser?.uid),
    [recipes, firebaseUser?.uid]
  );

  const savedRecipesList = useMemo(
    () => recipes.filter((r) => savedRecipes.includes(r.id)),
    [recipes, savedRecipes]
  );

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setTimeout(() => setRefreshing(false), 500); // Small delay for UX
  }, [refreshProfile]);

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  // ── Render masonry grid of recipe images ──────────────────
  const renderRecipeGrid = (recipeList: Recipe[]) => {
    if (recipeList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name={activeTab === 'Saved' ? 'bookmark-outline' : 'restaurant-outline'}
            size={48}
            color="#E8CFC6"
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'Saved' ? 'No saved recipes yet' : 'No recipes yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'Saved'
              ? 'Save recipes you love and they\'ll appear here.'
              : 'Create your first recipe and share it with the community.'}
          </Text>
        </View>
      );
    }

    const leftColumn = recipeList.filter((_, i) => i % 2 === 0);
    const rightColumn = recipeList.filter((_, i) => i % 2 !== 0);

    return (
      <View style={styles.gridContainer}>
        <View style={styles.gridColumn}>
          {leftColumn.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigateToDetail(item.id)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={[styles.gridImage, { width: columnWidth, height: columnWidth * 1.2 }]}
              />
              <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.gridColumn}>
          {rightColumn.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigateToDetail(item.id)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={[styles.gridImage, { width: columnWidth, height: columnWidth * 1.2 }]}
              />
              <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ── About tab content ─────────────────────────────────────
  const renderAbout = () => (
    <View style={styles.aboutCard}>
      <View style={styles.aboutRow}>
        <Ionicons name="person-outline" size={18} color={colors.primary} />
        <View style={styles.aboutContent}>
          <Text style={styles.aboutLabel}>Bio</Text>
          <Text style={styles.aboutValue}>{bio}</Text>
        </View>
      </View>
      {specialty ? (
        <View style={styles.aboutRow}>
          <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
          <View style={styles.aboutContent}>
            <Text style={styles.aboutLabel}>Specialty</Text>
            <Text style={styles.aboutValue}>{specialty}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.aboutRow}>
        <Ionicons name="mail-outline" size={18} color={colors.primary} />
        <View style={styles.aboutContent}>
          <Text style={styles.aboutLabel}>Email</Text>
          <Text style={styles.aboutValue}>{displayEmail || 'Not provided'}</Text>
        </View>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={styles.aboutContent}>
          <Text style={styles.aboutLabel}>Joined</Text>
          <Text style={styles.aboutValue}>
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'Recently'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {/* Header & Avatar */}
        <View style={styles.header}>
          {/* Logout button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            {!isGuest && (
              <View style={styles.masterBadge}>
                <Ionicons name="star" size={10} color={colors.text} />
                <Text style={styles.masterBadgeText}>MASTER{'\n'}CHEF</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{displayName}</Text>
          {specialty ? <Text style={styles.specialty}>{specialty}</Text> : null}
          {displayEmail ? <Text style={styles.emailText}>{displayEmail}</Text> : null}

          {/* Edit Profile + Create Recipe buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Create')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color={colors.white} />
              <Text style={styles.createButtonText}>Create Recipe</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bio}>{bio}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{myRecipes.length}</Text>
            <Text style={styles.statLabel}>RECIPES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{following >= 1000 ? `${(following / 1000).toFixed(1)}k` : following}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {['My Recipes', 'Saved', 'About'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab ? styles.activeTab : null]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : null]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'My Recipes' && renderRecipeGrid(myRecipes)}
        {activeTab === 'Saved' && renderRecipeGrid(savedRecipesList)}
        {activeTab === 'About' && renderAbout()}

      </ScrollView>

      {/* Top right decorative circle */}
      <View style={styles.topRightCircle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F2',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  topRightCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F9DBD1',
    opacity: 0.5,
    zIndex: -1,
  },
  header: {
    paddingHorizontal: layout.spacing.l,
    marginBottom: layout.spacing.m,
  },
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 40,
    padding: 4,
  },
  avatarContainer: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b2f2f',
  },
  masterBadge: {
    position: 'absolute',
    bottom: -10,
    left: -20,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  masterBadgeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 10,
    color: colors.text,
    lineHeight: 12,
  },
  infoSection: {
    paddingHorizontal: layout.spacing.l,
    marginTop: layout.spacing.l,
  },
  name: {
    fontFamily: fonts.inter.bold,
    fontSize: 32,
    color: '#4A2A2A',
    marginBottom: 4,
  },
  specialty: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: '#B43015',
    marginBottom: 4,
  },
  emailText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: layout.spacing.m,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: layout.spacing.l,
  },
  editProfileButton: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: layout.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  editProfileText: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: colors.primary,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DE5A3D',
    paddingVertical: 12,
    borderRadius: layout.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: colors.white,
  },
  bio: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: '#6B4A4A',
    lineHeight: 22,
    marginBottom: layout.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.xl,
    marginBottom: layout.spacing.xl,
  },
  statBox: { alignItems: 'center' },
  statNumber: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: '#3A2A2A',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: fonts.inter.bold,
    fontSize: 10,
    color: '#8A5A4A',
    letterSpacing: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E8CFC6',
    marginBottom: layout.spacing.l,
    paddingHorizontal: layout.spacing.m,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: layout.spacing.m,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#DE5A3D',
  },
  tabText: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: '#A08080',
  },
  activeTabText: { color: '#B43015' },
  // ── Grid ─────────────────────────────────────────────────
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: layout.spacing.m,
    justifyContent: 'space-between',
  },
  gridColumn: {
    flexDirection: 'column',
    gap: layout.spacing.m,
  },
  gridImage: {
    borderRadius: layout.borderRadius.m,
    backgroundColor: '#E8CFC6',
  },
  gridTitle: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 12,
    color: '#4A2A2A',
    marginTop: 6,
    marginBottom: 4,
  },
  // ── Empty state ──────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xxl,
    paddingHorizontal: layout.spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: colors.text,
    marginTop: layout.spacing.m,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // ── About tab ────────────────────────────────────────────
  aboutCard: {
    marginHorizontal: layout.spacing.m,
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.l,
    padding: layout.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8E4',
  },
  aboutContent: {
    flex: 1,
  },
  aboutLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  aboutValue: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
});
