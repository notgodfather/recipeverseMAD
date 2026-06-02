import { create } from 'zustand';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

export interface RecipeCollection {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt?: any;
}

interface CollectionState {
  collections: RecipeCollection[];
  isLoading: boolean;
  initCollections: (userId: string) => () => void;
  createCollection: (userId: string, name: string) => Promise<string>;
  addToCollection: (userId: string, collectionId: string, recipeId: string) => Promise<void>;
  removeFromCollection: (userId: string, collectionId: string, recipeId: string) => Promise<void>;
  deleteCollection: (userId: string, collectionId: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  isLoading: true,

  initCollections: (userId: string) => {
    const colRef = collection(db, 'users', userId, 'collections');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const collections: RecipeCollection[] = [];
      snapshot.forEach((doc) => {
        collections.push({ id: doc.id, ...doc.data() } as RecipeCollection);
      });
      set({ collections, isLoading: false });
    }, (error) => {
      console.error('Error fetching collections:', error);
      set({ isLoading: false });
    });
    return unsubscribe;
  },

  createCollection: async (userId, name) => {
    const colRef = collection(db, 'users', userId, 'collections');
    const docRef = await addDoc(colRef, {
      name,
      recipeIds: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  addToCollection: async (userId, collectionId, recipeId) => {
    const docRef = doc(db, 'users', userId, 'collections', collectionId);
    await updateDoc(docRef, {
      recipeIds: arrayUnion(recipeId),
    });
  },

  removeFromCollection: async (userId, collectionId, recipeId) => {
    const docRef = doc(db, 'users', userId, 'collections', collectionId);
    await updateDoc(docRef, {
      recipeIds: arrayRemove(recipeId),
    });
  },

  deleteCollection: async (userId, collectionId) => {
    const docRef = doc(db, 'users', userId, 'collections', collectionId);
    await deleteDoc(docRef);
  },
}));
