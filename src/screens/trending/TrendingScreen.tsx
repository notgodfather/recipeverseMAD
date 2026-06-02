import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import { categories } from '../../constants/categories';

// ── Skeleton loader ──────────────────────────────────────────
const SkeletonHero = () => (
  <View style={skeleton.hero}>
    <View style={skeleton.heroOverlay}>
      <View style={skeleton.heroBadge} />
      <View style={skeleton.heroTitle} />
      <View style={skeleton.heroSubtitle} />
    </View>
  </View>
);

const SkeletonItem = () => (
  <View style={skeleton.item}>
    <View style={skeleton.rank} />
    <View style={skeleton.image} />
    <View style={skeleton.info}>
      <View style={skeleton.titleLine} />
      <View style={skeleton.subtitleLine} />
    </View>
  </View>
);

const skeleton = StyleSheet.create({
  hero: {
    height: 220,
    borderRadius: 20,
    backgroundColor: '#EDE0DB',
    marginHorizontal: layout.spacing.m,
    marginBottom: layout.spacing.l,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: layout.spacing.l,
    gap: 8,
  },
  heroBadge: {
    width: 80,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0D0CB',
  },
  heroTitle: {
    width: '70%',
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0D0CB',
  },
  heroSubtitle: {
    width: '45%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0D0CB',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.m,
    paddingVertical: 12,
    gap: 12,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE0DB',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#EDE0DB',
  },
  info: {
    flex: 1,
    gap: 8,
  },
  titleLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EDE0DB',
    width: '75%',
  },
  subtitleLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F2E8E4',
    width: '50%',
  },
});

// ── Time-weighted trending score ─────────────────────────────
function getTrendingScore(recipe: Recipe): number {
  const likes = recipe.likes || 0;
  const comments = recipe.comments || 0;
  const createdAt = recipe.createdAt?.getTime?.() ?? Date.now();
  const ageHours = Math.max(1, (Date.now() - createdAt) / (1000 * 60 * 60));
  // Gravity-based ranking: newer recipes with engagement score higher
  return (likes * 2 + comments * 3) / Math.pow(ageHours / 24, 0.8);
}

// ── Rank badge component ─────────────────────────────────────
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <View style={[rankStyles.badge, { backgroundColor: '#FFD700' }]}>
        <Ionicons name="trophy" size={14} color="#8B6508" />
      </View>
    );
  }
  if (rank === 2) {
    return (
      <View style={[rankStyles.badge, { backgroundColor: '#E8E8E8' }]}>
        <Text style={[rankStyles.text, { color: '#6B6B6B' }]}>{rank}</Text>
      </View>
    );
  }
  if (rank === 3) {
    return (
      <View style={[rankStyles.badge, { backgroundColor: '#F0C8A0' }]}>
        <Text style={[rankStyles.text, { color: '#8B5E3C' }]}>{rank}</Text>
      </View>
    );
  }
  return (
    <View style={[rankStyles.badge, { backgroundColor: '#F2E8E4' }]}>
      <Text style={[rankStyles.text, { color: '#8A5A4A' }]}>{rank}</Text>
    </View>
  );
};

const rankStyles = StyleSheet.create({
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
  },
});

// ── Trending Item ────────────────────────────────────────────
const TrendingItem = ({
  rank,
  recipe,
  onPress,
  onChefPress,
}: {
  rank: number;
  recipe: Recipe;
  onPress: () => void;
  onChefPress: () => void;
}) => {
  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

  return (
    <TouchableOpacity style={styles.trendingItem} onPress={onPress} activeOpacity={0.8}>
      <RankBadge rank={rank} />
      <Image source={{ uri: recipe.imageUri }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <TouchableOpacity onPress={onChefPress} activeOpacity={0.7}>
          <Text style={styles.itemChef}>by {recipe.chefName}</Text>
        </TouchableOpacity>
        <View style={styles.itemStats}>
          <View style={styles.itemStat}>
            <Ionicons name="heart" size={12} color={colors.primary} />
            <Text style={styles.itemStatText}>{formatCount(recipe.likes || 0)}</Text>
          </View>
          <View style={styles.itemStat}>
            <Ionicons name="chatbubble-outline" size={11} color="#8A5A4A" />
            <Text style={[styles.itemStatText, { color: '#8A5A4A' }]}>
              {formatCount(recipe.comments || 0)}
            </Text>
          </View>
          {recipe.prepTime && (
            <View style={styles.itemStat}>
              <Ionicons name="time-outline" size={11} color="#8A5A4A" />
              <Text style={[styles.itemStatText, { color: '#8A5A4A' }]}>
                {recipe.prepTime}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.trendIcon}>
        <Ionicons
          name={rank <= 3 ? 'trending-up' : 'arrow-up'}
          size={18}
          color={rank <= 3 ? '#2E7D32' : '#8A5A4A'}
        />
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ──────────────────────────────────────────────
export default function TrendingScreen({ navigation }: any) {
  const { recipes, isLoading, initRecipeFeed } = useRecipeStore();
  const { firebaseUser } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = initRecipeFeed();
    return unsubscribe;
  }, []);

  const filterOptions = ['All', ...categories.filter((c) => c !== 'All Recipes')];

  const trendingRecipes = useMemo(() => {
    let filtered = [...recipes];
    if (activeFilter !== 'All') {
      filtered = filtered.filter((r) => r.category === activeFilter);
    }
    return filtered
      .map((r) => ({ recipe: r, score: getTrendingScore(r) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((item) => item.recipe);
  }, [recipes, activeFilter]);

  const featuredRecipe = trendingRecipes[0] ?? null;
  const restRecipes = trendingRecipes.slice(1);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });
  const navigateToChef = (chefId: string) => {
    if (chefId && chefId !== firebaseUser?.uid) {
      navigation.navigate('ChefProfile', { chefId });
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Trending Now</Text>
            <Text style={styles.headerSubtitle}>What the community is loving</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="flame" size={22} color={colors.primary} />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonHero />
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trending Now</Text>
          <Text style={styles.headerSubtitle}>What the community is loving</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="flame" size={22} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {trendingRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flame-outline" size={48} color="#E8CFC6" />
            <Text style={styles.emptyTitle}>No trending recipes</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter !== 'All'
                ? `No trending ${activeFilter} recipes right now. Try another category.`
                : 'Start liking and commenting on recipes to see trends!'}
            </Text>
          </View>
        ) : (
          <>
            {/* Featured #1 Hero Card */}
            {featuredRecipe && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigateToDetail(featuredRecipe.id)}
              >
                <ImageBackground
                  source={{ uri: featuredRecipe.imageUri }}
                  style={styles.heroCard}
                  imageStyle={styles.heroImage}
                >
                  <View style={styles.heroOverlay}>
                    <View style={styles.heroBadge}>
                      <Ionicons name="trophy" size={12} color="#8B6508" />
                      <Text style={styles.heroBadgeText}>#1 TRENDING</Text>
                    </View>
                    <Text style={styles.heroTitle}>{featuredRecipe.title}</Text>
                    <View style={styles.heroBottom}>
                      <TouchableOpacity
                        style={styles.heroChef}
                        onPress={() => navigateToChef(featuredRecipe.chefId)}
                        activeOpacity={0.7}
                      >
                        {featuredRecipe.chefAvatar ? (
                          <Image
                            source={{ uri: featuredRecipe.chefAvatar }}
                            style={styles.heroChefAvatar}
                          />
                        ) : (
                          <View style={[styles.heroChefAvatar, { backgroundColor: '#DE5A3D' }]} />
                        )}
                        <Text style={styles.heroChefName}>{featuredRecipe.chefName}</Text>
                      </TouchableOpacity>
                      <View style={styles.heroStats}>
                        <Ionicons name="heart" size={14} color="#FF6B6B" />
                        <Text style={styles.heroStatsText}>{featuredRecipe.likes}</Text>
                        <Ionicons
                          name="chatbubble"
                          size={12}
                          color="rgba(255,255,255,0.8)"
                          style={{ marginLeft: 8 }}
                        />
                        <Text style={styles.heroStatsText}>{featuredRecipe.comments}</Text>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}

            {/* Section label */}
            {restRecipes.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Rising Stars</Text>
                <Text style={styles.sectionCount}>{restRecipes.length} recipes</Text>
              </View>
            )}

            {/* List of remaining */}
            {restRecipes.map((recipe, index) => (
              <TrendingItem
                key={recipe.id}
                rank={index + 2}
                recipe={recipe}
                onPress={() => navigateToDetail(recipe.id)}
                onChefPress={() => navigateToChef(recipe.chefId)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.l,
    paddingTop: 60,
    paddingBottom: layout.spacing.m,
  },
  headerTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 28,
    color: '#3A2A2A',
  },
  headerSubtitle: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDE8E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  // ── Filters ──────────────────────────────────────────
  filterScroll: {
    paddingHorizontal: layout.spacing.m,
    gap: 8,
    marginBottom: layout.spacing.l,
  },
  filterChip: {
    backgroundColor: '#F2E8E4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: '#8A5A4A',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  // ── Hero card ────────────────────────────────────────
  heroCard: {
    height: 220,
    marginHorizontal: layout.spacing.m,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: layout.spacing.l,
    shadowColor: '#3D2020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  heroImage: {
    borderRadius: 20,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: layout.spacing.l,
    backgroundColor: 'rgba(15, 5, 0, 0.45)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFD700',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 10,
    color: '#8B6508',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 24,
    color: colors.white,
    lineHeight: 30,
    marginBottom: 10,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroChef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroChefAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8CFC6',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroChefName: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatsText: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  // ── Section header ───────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.l,
    marginBottom: layout.spacing.m,
  },
  sectionTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: '#3A2A2A',
  },
  sectionCount: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  // ── Trending item ────────────────────────────────────
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: layout.spacing.m,
    padding: layout.spacing.m,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E8CFC6',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 15,
    color: '#3A2A2A',
    marginBottom: 3,
  },
  itemChef: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.primary,
    marginBottom: 5,
  },
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemStatText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary,
  },
  trendIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Empty state ──────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xxl,
    paddingHorizontal: 40,
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
});
