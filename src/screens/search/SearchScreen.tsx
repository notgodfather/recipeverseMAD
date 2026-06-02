import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeStore } from '../../store/recipeStore';
import CategoryChip from '../../components/common/CategoryChip';
import { categories } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Recipes');
  const { recipes } = useRecipeStore();
  const { width } = useWindowDimensions();

  // 3-column square grid like Instagram Explore
  const maxW = Math.min(width, layout.maxContentWidth);
  const columnWidth = maxW / 3 - 2; 

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesQuery = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         recipe.chefName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All Recipes' || recipe.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const navigateToDetail = (id: string) => navigation.navigate('RecipeDetail', { id });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, chefs..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories row moved here from feed */}
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
      </View>

      {/* Explore Grid */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigateToDetail(item.id)} activeOpacity={0.9}>
            <Image
              source={{ uri: item.imageUri }}
              style={{ width: columnWidth, height: columnWidth, backgroundColor: colors.borderLight }}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
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
    paddingTop: 60,
    backgroundColor: colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    marginHorizontal: layout.spacing.m,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.inter.regular,
    fontSize: 15,
    color: colors.text,
    marginLeft: 8,
  },
  categoriesContainer: {
    paddingBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: layout.spacing.m,
  },
  gridContainer: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 3,
    marginBottom: 3,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.inter.medium,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
