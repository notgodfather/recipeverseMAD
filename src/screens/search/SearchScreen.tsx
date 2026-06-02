import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Keyboard, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import RecipeCard from '../../components/recipe/RecipeCard';
import RecipeCardWide from '../../components/recipe/RecipeCardWide';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { recipes, likedRecipes, savedRecipes, toggleLike, toggleSave, initRecipeFeed } = useRecipeStore();
  const { firebaseUser } = useAuthStore();

  useEffect(() => {
    // Ensure we have recipes loaded
    const unsubscribe = initRecipeFeed();
    
    // Load recent searches
    AsyncStorage.getItem('recentSearches').then(data => {
      if (data) setRecentSearches(JSON.parse(data));
    });

    return unsubscribe;
  }, []);

  const saveRecentSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    initRecipeFeed();
    setTimeout(() => setRefreshing(false), 500);
  }, [initRecipeFeed]);

  const filteredRecipes = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return recipes.filter(r => 
      r.title.toLowerCase().includes(lowerQuery) ||
      r.chefName.toLowerCase().includes(lowerQuery) ||
      r.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
      r.ingredients?.some(i => i.toLowerCase().includes(lowerQuery)) ||
      r.category.toLowerCase().includes(lowerQuery)
    );
  }, [query, recipes]);

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  const renderItem = ({ item }: { item: Recipe }) => {
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
        onSavePress={() => toggleSave(item.id)}
        onViewPress={() => navigateToDetail(item.id)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search recipes, chefs, or ingredients..."
            placeholderTextColor="#A08080"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => saveRecentSearch(query)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          <Text style={styles.sectionTitle}>Discover</Text>
          
          <View style={styles.tagsContainer}>
            {['Healthy Breakfast', 'Quick Dinners', 'Vegan Options', 'High Protein', 'Gluten-Free', 'Desserts'].map((tag) => (
              <TouchableOpacity key={tag} style={styles.tag} onPress={() => setQuery(tag)}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {recentSearches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: layout.spacing.xl }]}>Recent Searches</Text>
              <View style={styles.recentList}>
                {recentSearches.map((item) => (
                  <TouchableOpacity key={item} style={styles.recentItem} onPress={() => { setQuery(item); saveRecentSearch(item); }}>
                    <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.recentText}>{item}</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
          {filteredRecipes.length > 0 ? (
            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#E8CFC6" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>We couldn't find anything matching "{query}". Try different keywords or check for typos.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: layout.spacing.l,
    paddingTop: 60,
    backgroundColor: colors.primaryLight,
    paddingBottom: layout.spacing.l,
    borderBottomLeftRadius: layout.borderRadius.xl,
    borderBottomRightRadius: layout.borderRadius.xl,
    zIndex: 10,
  },
  title: {
    fontFamily: fonts.inter.bold,
    fontSize: 28,
    color: '#3A2A2A',
    marginBottom: layout.spacing.m,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    height: 50,
    borderRadius: layout.borderRadius.m,
    paddingHorizontal: layout.spacing.m,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.inter.medium,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    padding: layout.spacing.l,
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: layout.spacing.l,
    paddingBottom: 100, // accommodate bottom nav
  },
  sectionTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: '#3A2A2A',
    marginBottom: layout.spacing.m,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F9DBD1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tagText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: '#8A5A4A',
  },
  recentList: {
    gap: layout.spacing.m,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8CFC6',
    paddingBottom: layout.spacing.m,
  },
  recentText: {
    fontFamily: fonts.inter.medium,
    fontSize: 16,
    color: '#4A2A2A',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
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
