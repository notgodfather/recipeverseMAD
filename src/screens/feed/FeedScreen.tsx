import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import AppHeader from '../../components/common/AppHeader';
import ChefOfWeekBanner from '../../components/chef/ChefOfWeekBanner';
import CategoryChip from '../../components/common/CategoryChip';
import RecipeCard from '../../components/recipe/RecipeCard';
import RecipeCardWide from '../../components/recipe/RecipeCardWide';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { categories } from '../../constants/categories';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

// ── Skeleton loader card ────────────────────────────────────
const SkeletonCard = () => (
  <View style={skeleton.container}>
    <View style={skeleton.image} />
    <View style={skeleton.row}>
      <View style={skeleton.avatar} />
      <View style={skeleton.textBlock}>
        <View style={skeleton.titleLine} />
        <View style={skeleton.subtitleLine} />
      </View>
    </View>
    <View style={skeleton.tagsRow}>
      <View style={skeleton.tag} />
      <View style={skeleton.tag} />
    </View>
  </View>
);

const skeleton = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 28 },
  image: { height: 220, borderRadius: 20, backgroundColor: '#EDE0DB' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EDE0DB' },
  textBlock: { flex: 1, gap: 8 },
  titleLine: { height: 16, borderRadius: 8, backgroundColor: '#EDE0DB', width: '75%' },
  subtitleLine: { height: 11, borderRadius: 6, backgroundColor: '#F2E8E4', width: '45%' },
  tagsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tag: { height: 24, width: 60, borderRadius: 12, backgroundColor: '#F2E8E4' },
});
// ────────────────────────────────────────────────────────────

export default function FeedScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('All Recipes');
  const [refreshing, setRefreshing] = useState(false);

  const { recipes, likedRecipes, savedRecipes, toggleLike, toggleSave, isLoading, initRecipeFeed } =
    useRecipeStore();
  const { firebaseUser } = useAuthStore();

  // Start the live Firestore listener when the screen mounts
  useEffect(() => {
    const unsubscribe = initRecipeFeed();
    return unsubscribe; // cleans up on unmount
  }, []);

  const filteredRecipes =
    activeCategory === 'All Recipes'
      ? recipes
      : recipes.filter((r) => r.category === activeCategory);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The onSnapshot listener auto-updates — just give a brief visual delay
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  const renderHeader = () => (
    <>
      <ChefOfWeekBanner />
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              isActive={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          <ChefOfWeekBanner />
          <View style={{ height: 16 }} />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────
  if (!isLoading && filteredRecipes.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader />
        {renderHeader()}
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtitle}>
            {activeCategory === 'All Recipes'
              ? 'Run the seed script to populate the feed with real recipes.'
              : `No ${activeCategory} recipes found. Try a different category.`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item: Recipe) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }: { item: Recipe }) => {
          const isLiked = likedRecipes.includes(item.id);
          const isSaved = savedRecipes.includes(item.id);

          if (item.type === 'standard') {
            return (
              <TouchableOpacity activeOpacity={0.95} onPress={() => navigateToDetail(item.id)}>
                <RecipeCard
                  imageUri={item.imageUri}
                  chefAvatar={item.chefAvatar}
                  title={item.title}
                  chefName={item.chefName}
                  rating={item.rating}
                  likes={item.likes}
                  comments={item.comments}
                  macros={item.macros!}
                  tags={item.tags}
                  isLiked={isLiked}
                  isSaved={isSaved}
                  onLikePress={() => toggleLike(item.id, firebaseUser?.uid)}
                  onSavePress={() => toggleSave(item.id, firebaseUser?.uid)}
                />
              </TouchableOpacity>
            );
          }

          return (
            <RecipeCardWide
              imageUri={item.imageUri}
              chefAvatar={item.chefAvatar}
              title={item.title}
              chefName={item.chefName}
              rating={item.rating}
              description={item.description!}
              prepTime={item.prepTime!}
              difficulty={item.difficulty!}
              calories={item.calories!}
              tags={item.tags}
              likes={item.likes}
              isLiked={isLiked}
              isSaved={isSaved}
              onLikePress={() => toggleLike(item.id, firebaseUser?.uid)}
              onSavePress={() => toggleSave(item.id, firebaseUser?.uid)}
              onViewPress={() => navigateToDetail(item.id)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 110,
  },
  categoriesContainer: {
    marginBottom: layout.spacing.l,
  },
  categoriesScroll: {
    paddingHorizontal: layout.spacing.m,
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
