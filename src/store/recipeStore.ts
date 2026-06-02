import { create } from 'zustand';
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipeIds,
  addNotification,
} from '../services/firestoreService';
import { useAuthStore } from './authStore';

export interface Recipe {
  id: string;
  type: 'standard' | 'wide';
  chefId: string;
  chefName: string;
  chefAvatar: string;
  title: string;
  description?: string;
  imageUri: string;
  category: string;
  tags?: string[];
  rating: number;
  likes: number;
  comments: number;
  macros?: { carbs: number; protein: number; fat: number };
  prepTime?: string;
  difficulty?: string;
  calories?: string;
  steps?: string[];
  ingredients?: string[];
  tip?: string;
  createdAt?: Date;
}

interface RecipeState {
  recipes: Recipe[];
  likedRecipes: string[];
  savedRecipes: string[];
  isLoading: boolean;
  error: string | null;

  /** Start real-time Firestore listener. Returns unsubscribe function. */
  initRecipeFeed: () => () => void;
  toggleLike: (id: string, userId?: string) => void;
  toggleSave: (id: string, userId?: string) => void;
  /** Load saved recipe IDs from Firestore for a specific user */
  loadSavedRecipes: (uid: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  likedRecipes: [],
  savedRecipes: [],
  isLoading: true,
  error: null,

  initRecipeFeed: () => {
    // Reset loading each time so remounts show skeletons cleanly
    set({ isLoading: true, error: null });

    // Simple collection query — no orderBy so no Firestore index required.
    // We sort by createdAt on the client side instead.
    const q = query(collection(db, 'recipes'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recipes: Recipe[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type ?? 'standard',
              chefId: data.chefId ?? '',
              chefName: data.chefName ?? 'Unknown Chef',
              chefAvatar: data.chefAvatar ?? '',
              title: data.title ?? '',
              description: data.description,
              imageUri: data.imageUri ?? '',
              category: data.category ?? 'Other',
              tags: data.tags ?? [],
              rating: data.rating ?? 0,
              likes: data.likes ?? 0,
              comments: data.comments ?? 0,
              macros: data.macros,
              prepTime: data.prepTime,
              difficulty: data.difficulty,
              calories: data.calories,
              steps: data.steps ?? [],
              ingredients: data.ingredients ?? [],
              tip: data.tip ?? null,
              createdAt: data.createdAt?.toDate?.() ?? new Date(0),
            } as Recipe;
          })
          // Sort newest-first on the client
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

        set({ recipes, isLoading: false, error: null });
      },
      (error) => {
        console.error('Recipe feed error:', error);
        set({ isLoading: false, error: error.message });
      }
    );

    return unsubscribe;
  },

  toggleLike: (id, userId) => {
    const { likedRecipes } = get();
    const isLiked = likedRecipes.includes(id);

    // Optimistic local update
    set((state) => ({
      likedRecipes: isLiked
        ? state.likedRecipes.filter((rId) => rId !== id)
        : [...state.likedRecipes, id],
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, likes: isLiked ? r.likes - 1 : r.likes + 1 } : r
      ),
    }));

    // Persist like count to Firestore
    const ref = doc(db, 'recipes', id);
    updateDoc(ref, { likes: increment(isLiked ? -1 : 1) }).catch(console.error);

    // Send notification if newly liked
    if (!isLiked && userId) {
      const recipe = get().recipes.find((r) => r.id === id);
      const currentUser = useAuthStore.getState().profile;
      if (recipe && recipe.chefId && recipe.chefId !== userId && currentUser) {
        addNotification(recipe.chefId, {
          type: 'like',
          sourceUserId: userId,
          sourceUserName: currentUser.displayName,
          sourceUserAvatar: currentUser.photoURL,
          recipeId: id,
          recipeTitle: recipe.title,
        }).catch(console.error);
      }
    }
  },

  toggleSave: (id, userId) => {
    const { savedRecipes } = get();
    const isSaved = savedRecipes.includes(id);

    // Optimistic local update
    set((state) => ({
      savedRecipes: isSaved
        ? state.savedRecipes.filter((rId) => rId !== id)
        : [...state.savedRecipes, id],
    }));

    // Persist to Firestore
    if (userId) {
      if (isSaved) {
        unsaveRecipe(userId, id).catch(console.error);
      } else {
        saveRecipe(userId, id).catch(console.error);
      }
    }
  },

  loadSavedRecipes: async (uid: string) => {
    try {
      const ids = await getSavedRecipeIds(uid);
      set({ savedRecipes: ids });
    } catch (e) {
      console.error('Failed to load saved recipes:', e);
    }
  },
}));

