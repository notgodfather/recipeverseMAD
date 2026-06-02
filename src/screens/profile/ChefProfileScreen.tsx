import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import {
  getUserProfile,
  followUser,
  unfollowUser,
  isFollowing as isFollowingCheck,
} from '../../services/firestoreService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import type { UserProfile } from '../../types/user';

export default function ChefProfileScreen({ route, navigation }: any) {
  const { chefId } = route.params ?? {};
  const { width } = useWindowDimensions();
  const columnWidth = (width - layout.spacing.m * 3) / 2;

  const { firebaseUser } = useAuthStore();
  const { recipes, savedRecipes, likedRecipes, toggleLike, toggleSave } = useRecipeStore();

  const [chef, setChef] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Recipes');
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = firebaseUser?.uid === chefId;

  // Load chef profile
  const loadProfile = useCallback(async () => {
    if (!chefId) return;
    try {
      const profile = await getUserProfile(chefId);
      setChef(profile);
    } catch (e) {
      console.error('Failed to load chef profile:', e);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Check follow status
  useEffect(() => {
    if (!firebaseUser?.uid || !chefId || isOwnProfile) return;
    isFollowingCheck(firebaseUser.uid, chefId).then(setFollowing);
  }, [firebaseUser?.uid, chefId, isOwnProfile]);

  const handleFollow = async () => {
    if (!firebaseUser?.uid || !chefId) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(firebaseUser.uid, chefId);
        setFollowing(false);
        if (chef) setChef({ ...chef, followers: Math.max(0, chef.followers - 1) });
      } else {
        await followUser(firebaseUser.uid, chefId);
        setFollowing(true);
        if (chef) setChef({ ...chef, followers: chef.followers + 1 });
      }
    } catch (e) {
      console.error('Follow error:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  // Chef's recipes
  const chefRecipes = useMemo(
    () => recipes.filter((r) => r.chefId === chefId),
    [recipes, chefId]
  );

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  // Formatted display values
  const displayName = chef?.displayName ?? 'Chef';
  const avatarUri =
    chef?.photoURL ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D04C2E&color=fff&size=200`;
  const bio = chef?.bio || 'A passionate chef sharing recipes with the world.';
  const specialty = chef?.specialty || '';
  const followers = chef?.followers ?? 0;
  const followingCount = chef?.following ?? 0;
  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;

  // ── Render recipe grid ────────────────────────────────
  const renderRecipeGrid = (recipeList: Recipe[]) => {
    if (recipeList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color="#E8CFC6" />
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtitle}>
            This chef hasn't shared any recipes yet.
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
              <View style={styles.gridStats}>
                <Ionicons name="heart" size={11} color={colors.primary} />
                <Text style={styles.gridStatText}>{item.likes}</Text>
              </View>
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
              <View style={styles.gridStats}>
                <Ionicons name="heart" size={11} color={colors.primary} />
                <Text style={styles.gridStatText}>{item.likes}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ── About tab ─────────────────────────────────────────
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
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={styles.aboutContent}>
          <Text style={styles.aboutLabel}>Joined</Text>
          <Text style={styles.aboutValue}>
            {chef?.createdAt
              ? new Date(chef.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'Recently'}
          </Text>
        </View>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name="book-outline" size={18} color={colors.primary} />
        <View style={styles.aboutContent}>
          <Text style={styles.aboutLabel}>Total Recipes</Text>
          <Text style={styles.aboutValue}>{chefRecipes.length}</Text>
        </View>
      </View>
    </View>
  );

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            {chefRecipes.length >= 5 && (
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

          {/* Follow button (only if not own profile) */}
          {!isOwnProfile && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  following && styles.followingBtn,
                ]}
                onPress={handleFollow}
                disabled={followLoading}
                activeOpacity={0.85}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={following ? '#6B4A4A' : colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name={following ? 'checkmark' : 'person-add-outline'}
                      size={18}
                      color={following ? '#6B4A4A' : colors.white}
                    />
                    <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                      {following ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.bio}>{bio}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{formatCount(followers)}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{chefRecipes.length}</Text>
            <Text style={styles.statLabel}>RECIPES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{formatCount(followingCount)}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {['Recipes', 'About'].map((tab) => (
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
        {activeTab === 'Recipes' && renderRecipeGrid(chefRecipes)}
        {activeTab === 'About' && renderAbout()}
      </ScrollView>

      {/* Decorative circle */}
      <View style={styles.topRightCircle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F2',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    marginBottom: layout.spacing.m,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: layout.spacing.l,
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DE5A3D',
    paddingVertical: 14,
    borderRadius: layout.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#DE5A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  followBtnText: {
    fontFamily: fonts.inter.bold,
    fontSize: 15,
    color: colors.white,
  },
  followingBtn: {
    backgroundColor: '#F2E8E4',
    shadowOpacity: 0,
    elevation: 0,
  },
  followingBtnText: {
    color: '#6B4A4A',
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
  // ── Grid ─────────────────────────────────────────────
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
    marginBottom: 2,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  gridStatText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.primary,
  },
  // ── Empty state ──────────────────────────────────────
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
  // ── About tab ────────────────────────────────────────
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
