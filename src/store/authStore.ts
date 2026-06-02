import { create } from 'zustand';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { createUserProfile, getUserProfile } from '../services/firestoreService';
import type { UserProfile } from '../types/user';

interface AuthState {
  /** True while we're waiting for the initial onAuthStateChanged callback */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Full Firestore profile (null for guests or before profile loads) */
  profile: UserProfile | null;
  /** Raw Firebase Auth user object */
  firebaseUser: User | null;

  setProfile: (profile: UserProfile | null) => void;
  /** Reload profile from Firestore (e.g. after editing) */
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  /** Call once on app mount to wire up the Firebase Auth listener */
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  profile: null,
  firebaseUser: null,

  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    set({ profile });
  },

  logout: async () => {
    await signOut(auth);
    // onAuthStateChanged will fire with null and reset the rest of the state
  },

  initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — make sure their Firestore doc exists, then load it
        try {
          await createUserProfile(firebaseUser.uid, {
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Chef',
            photoURL: firebaseUser.photoURL,
          });

          const profile = await getUserProfile(firebaseUser.uid);

          set({
            isLoading: false,
            isAuthenticated: true,
            firebaseUser,
            profile,
          });

          // Hydrate saved recipes from Firestore so they persist across sessions
          const { useRecipeStore } = require('./recipeStore');
          useRecipeStore.getState().loadSavedRecipes(firebaseUser.uid);
        } catch (error) {
          console.error("Error during post-login Firestore fetch:", error);
          // Still set authenticated so user isn't stuck on loading/login if Firestore fails
          set({
            isLoading: false,
            isAuthenticated: true,
            firebaseUser,
            profile: null,
          });
        }
      } else {
        // Signed out or no session
        set({
          isLoading: false,
          isAuthenticated: false,
          firebaseUser: null,
          profile: null,
        });
      }
    });

    // Return the unsubscribe so the caller can clean up
    return unsubscribe;
  },
}));

