import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions,
  RefreshControl, Platform, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRecipeStore, Recipe } from '../../store/recipeStore';
import { useTheme, useThemeStore } from '../../store/themeStore';
import { useCollectionStore } from '../../store/collectionStore';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

export default function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeStore();
  const maxW = Math.min(width, layout.maxContentWidth);
  const columnWidth = maxW / 3 - 2;

  const [activeTab, setActiveTab] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Collections
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const { profile, firebaseUser, logout, refreshProfile } = useAuthStore();
  const { recipes, savedRecipes } = useRecipeStore();
  const { collections, initCollections, createCollection } = useCollectionStore();

  const isGuest = firebaseUser?.isAnonymous ?? false;
  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? (isGuest ? 'Guest Chef' : 'Chef');
  const username = displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUri = profile?.photoURL
    ?? firebaseUser?.photoURL
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EFEFEF&color=262626&size=200`;
  const bio = profile?.bio || (isGuest ? 'Browsing as a guest.' : '');
  const followers = profile?.followers ?? 0;
  const following = profile?.following ?? 0;

  useEffect(() => {
    if (firebaseUser?.uid) {
      const unsub = initCollections(firebaseUser.uid);
      return unsub;
    }
  }, [firebaseUser?.uid]);

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
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      logout();
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !firebaseUser?.uid) return;
    await createCollection(firebaseUser.uid, newCollectionName.trim());
    setNewCollectionName('');
    setShowNewCollection(false);
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
          <View style={[styles.emptyIconCircle, { borderColor: theme.text }]}>
            <Ionicons name="camera-outline" size={32} color={theme.text} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Posts Yet</Text>
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
              style={{ width: '100%', height: '100%', backgroundColor: theme.borderLight }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCollections = () => {
    if (activeCollectionId) {
      const col = collections.find(c => c.id === activeCollectionId);
      const colRecipes = recipes.filter(r => col?.recipeIds.includes(r.id));
      return (
        <View>
          <TouchableOpacity 
            style={styles.backToCollections} 
            onPress={() => setActiveCollectionId(null)}
          >
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
            <Text style={[styles.backText, { color: theme.primary }]}>Collections</Text>
          </TouchableOpacity>
          <Text style={[styles.collectionDetailName, { color: theme.text }]}>{col?.name}</Text>
          {renderGrid(colRecipes)}
        </View>
      );
    }

    return (
      <View style={styles.collectionsGrid}>
        {/* Create new collection card */}
        <TouchableOpacity
          style={[styles.collectionCard, { borderColor: theme.border }]}
          onPress={() => setShowNewCollection(true)}
        >
          <View style={[styles.collectionCoverPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="add" size={36} color={theme.textSecondary} />
          </View>
          <Text style={[styles.collectionName, { color: theme.text }]}>New Collection</Text>
        </TouchableOpacity>

        {collections.map((col) => {
          const coverRecipe = recipes.find(r => col.recipeIds.includes(r.id));
          return (
            <TouchableOpacity
              key={col.id}
              style={[styles.collectionCard, { borderColor: theme.border }]}
              onPress={() => setActiveCollectionId(col.id)}
            >
              {coverRecipe ? (
                <Image source={{ uri: coverRecipe.imageUri }} style={styles.collectionCover} />
              ) : (
                <View style={[styles.collectionCoverPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="images-outline" size={28} color={theme.textSecondary} />
                </View>
              )}
              <Text style={[styles.collectionName, { color: theme.text }]}>{col.name}</Text>
              <Text style={[styles.collectionCount, { color: theme.textSecondary }]}>{col.recipeIds.length} recipes</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        {/* Dark mode toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.usernameHeader, { color: theme.text }]}>{username}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {/* Profile Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: theme.borderLight }]} />
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{myRecipes.length}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{following >= 1000 ? `${(following / 1000).toFixed(1)}k` : following}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>following</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={[styles.displayName, { color: theme.text }]}>{displayName}</Text>
          {!!bio && <Text style={[styles.bioText, { color: theme.text }]}>{bio}</Text>}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[styles.editButtonText, { color: theme.text }]}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderTopColor: theme.borderLight }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'grid' && styles.activeTab, activeTab === 'grid' && { borderBottomColor: theme.text }]} 
            onPress={() => { setActiveTab('grid'); setActiveCollectionId(null); }}
          >
            <Ionicons name="grid-outline" size={24} color={activeTab === 'grid' ? theme.text : theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.activeTab, activeTab === 'saved' && { borderBottomColor: theme.text }]} 
            onPress={() => { setActiveTab('saved'); setActiveCollectionId(null); }}
          >
            <Ionicons name="bookmark-outline" size={24} color={activeTab === 'saved' ? theme.text : theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'collections' && styles.activeTab, activeTab === 'collections' && { borderBottomColor: theme.text }]} 
            onPress={() => setActiveTab('collections')}
          >
            <Ionicons name="albums-outline" size={24} color={activeTab === 'collections' ? theme.text : theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {activeTab === 'grid' && renderGrid(myRecipes)}
        {activeTab === 'saved' && renderGrid(savedRecipesList)}
        {activeTab === 'collections' && renderCollections()}
      </ScrollView>

      {/* New Collection Modal */}
      <Modal visible={showNewCollection} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Collection</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="Collection name"
              placeholderTextColor={theme.textSecondary}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowNewCollection(false)} style={styles.modalCancel}>
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCreateCollection} 
                style={[styles.modalCreate, { opacity: newCollectionName.trim() ? 1 : 0.5 }]}
                disabled={!newCollectionName.trim()}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  header: {
    width: '100%', maxWidth: layout.maxContentWidth,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingBottom: 10, paddingHorizontal: 16,
  },
  usernameHeader: { fontFamily: fonts.inter.bold, fontSize: 16 },
  iconButton: { padding: 4 },
  scrollContent: { width: '100%', maxWidth: layout.maxContentWidth, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 10 },
  avatarContainer: { marginRight: 24 },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 1 },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10 },
  statBox: { alignItems: 'center' },
  statNumber: { fontFamily: fonts.inter.bold, fontSize: 16 },
  statLabel: { fontFamily: fonts.inter.regular, fontSize: 13 },
  bioSection: { paddingHorizontal: 16, marginTop: 12 },
  displayName: { fontFamily: fonts.inter.semiBold, fontSize: 14, marginBottom: 2 },
  bioText: { fontFamily: fonts.inter.regular, fontSize: 14, lineHeight: 18 },
  actionRow: { paddingHorizontal: 16, marginTop: 16, marginBottom: 10 },
  editButton: { borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  editButtonText: { fontFamily: fonts.inter.semiBold, fontSize: 14 },
  tabsContainer: { flexDirection: 'row', borderTopWidth: 0.5, marginTop: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  activeTab: {},
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: fonts.inter.bold, fontSize: 20 },
  // Collections
  collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  collectionCard: { width: '47%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, marginBottom: 8 },
  collectionCover: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  collectionCoverPlaceholder: { width: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  collectionName: { fontFamily: fonts.inter.semiBold, fontSize: 14, paddingHorizontal: 10, paddingTop: 8 },
  collectionCount: { fontFamily: fonts.inter.regular, fontSize: 12, paddingHorizontal: 10, paddingBottom: 10 },
  backToCollections: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
  backText: { fontFamily: fonts.inter.medium, fontSize: 14 },
  collectionDetailName: { fontFamily: fonts.inter.bold, fontSize: 20, paddingHorizontal: 16, marginBottom: 12 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxWidth: 400, borderRadius: 16, padding: 24 },
  modalTitle: { fontFamily: fonts.inter.bold, fontSize: 18, marginBottom: 16 },
  modalInput: { borderRadius: 8, padding: 14, fontFamily: fonts.inter.regular, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { fontFamily: fonts.inter.medium, fontSize: 14 },
  modalCreate: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#E84040', borderRadius: 8 },
  modalCreateText: { fontFamily: fonts.inter.bold, fontSize: 14, color: '#fff' },
});
