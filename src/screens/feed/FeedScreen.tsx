import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Text,
} from 'react-native';
import AppHeader from '../../components/common/AppHeader';
import ChefOfWeekBanner from '../../components/chef/ChefOfWeekBanner';
import RecipeCard from '../../components/recipe/RecipeCard';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

const SkeletonCard = () => {
  const theme = useTheme();
  return (
    <View style={skeleton.container}>
      <View style={[skeleton.headerRow]}>
        <View style={[skeleton.avatar, { backgroundColor: theme.borderLight }]} />
        <View style={[skeleton.titleLine, { backgroundColor: theme.borderLight }]} />
      </View>
      <View style={[skeleton.image, { backgroundColor: theme.borderLight }]} />
      <View style={[skeleton.actionsRow]}>
        <View style={[skeleton.icon, { backgroundColor: theme.borderLight }]} />
        <View style={[skeleton.icon, { backgroundColor: theme.borderLight }]} />
        <View style={[skeleton.icon, { backgroundColor: theme.borderLight }]} />
      </View>
      <View style={[skeleton.subtitleLine, { backgroundColor: theme.borderLight }]} />
      <View style={[skeleton.subtitleLineLong, { backgroundColor: theme.borderLight }]} />
    </View>
  );
};

const skeleton = StyleSheet.create({
  container: { marginBottom: 20, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  titleLine: { height: 12, borderRadius: 6, width: 120 },
  image: { width: '100%', aspectRatio: 4 / 5 },
  actionsRow: { flexDirection: 'row', padding: 12, gap: 16 },
  icon: { width: 24, height: 24, borderRadius: 12 },
  subtitleLine: { height: 10, borderRadius: 5, width: 100, marginLeft: 12, marginBottom: 8 },
  subtitleLineLong: { height: 10, borderRadius: 5, width: '80%', marginLeft: 12 },
});

export default function FeedScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {renderHeader()}
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (!isLoading && recipes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader />
        {renderHeader()}
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Welcome to RecipeVerse</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Follow chefs to see their recipes here, or run the seed script to populate the feed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
            tintColor={theme.text}
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
  },
  listContent: {
    paddingBottom: 110,
  },
  divider: {
    height: 0.5,
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
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
