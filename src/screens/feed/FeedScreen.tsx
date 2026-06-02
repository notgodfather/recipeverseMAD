import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Text,
} from 'react-native';
import AppHeader from '../../components/common/AppHeader';
import ChefOfWeekBanner from '../../components/chef/ChefOfWeekBanner';
import RecipeCard from '../../components/recipe/RecipeCard';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

// ── Skeleton loader card ────────────────────────────────────
const SkeletonCard = () => (
  <View style={skeleton.container}>
    <View style={skeleton.headerRow}>
      <View style={skeleton.avatar} />
      <View style={skeleton.titleLine} />
    </View>
    <View style={skeleton.image} />
    <View style={skeleton.actionsRow}>
      <View style={skeleton.icon} />
      <View style={skeleton.icon} />
      <View style={skeleton.icon} />
    </View>
    <View style={skeleton.subtitleLine} />
    <View style={skeleton.subtitleLineLong} />
  </View>
);

const skeleton = StyleSheet.create({
  container: { marginBottom: 20, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.borderLight },
  titleLine: { height: 12, borderRadius: 6, backgroundColor: colors.borderLight, width: 120 },
  image: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.borderLight },
  actionsRow: { flexDirection: 'row', padding: 12, gap: 16 },
  icon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.borderLight },
  subtitleLine: { height: 10, borderRadius: 5, backgroundColor: colors.borderLight, width: 100, marginLeft: 12, marginBottom: 8 },
  subtitleLineLong: { height: 10, borderRadius: 5, backgroundColor: colors.borderLight, width: '80%', marginLeft: 12 },
});
// ────────────────────────────────────────────────────────────

export default function FeedScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);

  const { recipes, likedRecipes, savedRecipes, toggleLike, toggleSave, isLoading, initRecipeFeed } =
    useRecipeStore();
  const { firebaseUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initRecipeFeed();
    return unsubscribe;
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  const renderHeader = () => (
    <>
      <ChefOfWeekBanner />
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {renderHeader()}
          <View style={styles.divider} />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (!isLoading && recipes.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader />
        {renderHeader()}
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Welcome to RecipeVerse</Text>
          <Text style={styles.emptySubtitle}>
            Follow chefs to see their recipes here, or run the seed script to populate the feed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <FlatList
        data={recipes}
        keyExtractor={(item: Recipe) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
        renderItem={({ item }: { item: Recipe }) => {
          const isLiked = likedRecipes.includes(item.id);
          const isSaved = savedRecipes.includes(item.id);

          return (
            <RecipeCard
              imageUri={item.imageUri}
              chefAvatar={item.chefAvatar}
              title={item.title}
              chefName={item.chefName}
              rating={item.rating}
              likes={item.likes}
              comments={item.comments}
              description={item.description}
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
    backgroundColor: colors.background,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.borderLight,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
