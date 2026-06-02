import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import RecipeCard from '../../components/recipe/RecipeCard';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

export default function TrendingScreen({ navigation }: any) {
  const { recipes, likedRecipes, savedRecipes, toggleLike, toggleSave } = useRecipeStore();
  const { firebaseUser } = useAuthStore();

  // Simple sort by most liked
  const trendingRecipes = [...recipes].sort((a, b) => b.likes - a.likes).slice(0, 10);
  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flame" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Trending Now</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {trendingRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recipes trending right now.</Text>
          </View>
        ) : (
          trendingRecipes.map((item, index) => {
            const isLiked = likedRecipes.includes(item.id);
            const isSaved = savedRecipes.includes(item.id);

            return (
              <View key={item.id}>
                {/* Ranking number */}
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>

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
              </View>
            );
          })
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: 8,
  },
  headerTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: colors.text,
  },
  scrollContent: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingTop: 16,
    paddingBottom: 100,
  },
  rankContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  rankText: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.inter.medium,
    color: colors.textSecondary,
  },
});
