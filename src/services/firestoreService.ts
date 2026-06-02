import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  increment,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types/user';

/**
 * Creates or merges a user profile document in /users/{uid}.
 * Safe to call on every login — uses setDoc with merge so existing
 * data (bio, specialty, etc.) is never overwritten.
 */
export async function createUserProfile(
  uid: string,
  data: { email: string; displayName: string; photoURL: string | null }
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First-time user — write a full default profile
    await setDoc(ref, {
      uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL ?? null,
      bio: '',
      specialty: '',
      followers: 0,
      following: 0,
      recipeCount: 0,
      createdAt: serverTimestamp(),
    });
  } else {
    // Returning user — only update mutable auth fields (email / display name / photo)
    await updateDoc(ref, {
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL ?? null,
    });
  }
}

/**
 * Fetches a user's profile from Firestore.
 * Returns null if the document does not exist yet.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    uid: d.uid,
    email: d.email,
    displayName: d.displayName,
    photoURL: d.photoURL ?? null,
    bio: d.bio ?? '',
    specialty: d.specialty ?? '',
    followers: d.followers ?? 0,
    following: d.following ?? 0,
    recipeCount: d.recipeCount ?? 0,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

/**
 * Partially updates a user's profile (e.g. bio, specialty).
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'bio' | 'specialty' | 'displayName' | 'photoURL'>>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, data as Record<string, unknown>);
}

// ─── Saved Recipes ──────────────────────────────────────────────

/**
 * Saves a recipe for the user. Stores the recipe ID in a subcollection
 * so saved recipes persist across sessions.
 */
export async function saveRecipe(uid: string, recipeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'savedRecipes', recipeId);
  await setDoc(ref, { savedAt: serverTimestamp() });
}

/**
 * Removes a saved recipe for the user.
 */
export async function unsaveRecipe(uid: string, recipeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'savedRecipes', recipeId);
  await deleteDoc(ref);
}

/**
 * Returns all saved recipe IDs for a user.
 */
export async function getSavedRecipeIds(uid: string): Promise<string[]> {
  const colRef = collection(db, 'users', uid, 'savedRecipes');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.id);
}

// ─── Comments ───────────────────────────────────────────────────

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: Date;
}

/**
 * Adds a comment to a recipe. Also increments the recipe's comment count.
 */
export async function addComment(
  recipeId: string,
  data: { userId: string; userName: string; userAvatar: string | null; text: string }
): Promise<void> {
  const colRef = collection(db, 'recipes', recipeId, 'comments');
  await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
  });

  // Increment the comment count on the recipe doc
  const recipeRef = doc(db, 'recipes', recipeId);
  await updateDoc(recipeRef, { comments: increment(1) });

  const recipeSnap = await getDoc(recipeRef);
  if (recipeSnap.exists()) {
    const rd = recipeSnap.data();
    if (rd.chefId && rd.chefId !== data.userId) {
      await addNotification(rd.chefId, {
        type: 'comment',
        sourceUserId: data.userId,
        sourceUserName: data.userName,
        sourceUserAvatar: data.userAvatar,
        recipeId: recipeId,
        recipeTitle: rd.title,
        text: data.text,
      });
    }
  }
}

/**
 * Returns a real-time listener for comments on a recipe, newest-first.
 * Returns the unsubscribe function.
 */
export function onCommentsSnapshot(
  recipeId: string,
  callback: (comments: Comment[]) => void
): () => void {
  const colRef = collection(db, 'recipes', recipeId, 'comments');
  // No orderBy to avoid index requirement — sort client-side
  const q = query(colRef);

  return onSnapshot(q, (snap) => {
    const comments: Comment[] = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId ?? '',
          userName: data.userName ?? 'Anonymous',
          userAvatar: data.userAvatar ?? null,
          text: data.text ?? '',
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(comments);
  });
}

/**
 * Deletes a comment. Also decrements the recipe's comment count.
 */
export async function deleteComment(recipeId: string, commentId: string): Promise<void> {
  const ref = doc(db, 'recipes', recipeId, 'comments', commentId);
  await deleteDoc(ref);

  const recipeRef = doc(db, 'recipes', recipeId);
  await updateDoc(recipeRef, { comments: increment(-1) });
}

// ─── Delete Recipe ──────────────────────────────────────────────

/**
 * Deletes a recipe document from Firestore.
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  const ref = doc(db, 'recipes', recipeId);
  await deleteDoc(ref);
}

// ─── Follow / Unfollow ──────────────────────────────────────────

/**
 * Follows a target user. Creates docs in both users' subcollections
 * and atomically increments their follower/following counts.
 */
export async function followUser(uid: string, targetUid: string): Promise<void> {
  // Add to current user's "following" subcollection
  await setDoc(doc(db, 'users', uid, 'following', targetUid), {
    followedAt: serverTimestamp(),
  });
  // Add to target user's "followers" subcollection
  await setDoc(doc(db, 'users', targetUid, 'followers', uid), {
    followedAt: serverTimestamp(),
  });

  // Update counts
  await updateDoc(doc(db, 'users', uid), { following: increment(1) });
  await updateDoc(doc(db, 'users', targetUid), { followers: increment(1) });

  const currentUserSnap = await getDoc(doc(db, 'users', uid));
  if (currentUserSnap.exists()) {
    const cd = currentUserSnap.data();
    await addNotification(targetUid, {
      type: 'follow',
      sourceUserId: uid,
      sourceUserName: cd.displayName || 'Someone',
      sourceUserAvatar: cd.photoURL || null,
    });
  }
}

/**
 * Unfollows a target user. Reverses the follow operation.
 */
export async function unfollowUser(uid: string, targetUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'following', targetUid));
  await deleteDoc(doc(db, 'users', targetUid, 'followers', uid));

  await updateDoc(doc(db, 'users', uid), { following: increment(-1) });
  await updateDoc(doc(db, 'users', targetUid), { followers: increment(-1) });
}

/**
 * Checks whether the current user is following the target user.
 */
export async function isFollowing(uid: string, targetUid: string): Promise<boolean> {
  const ref = doc(db, 'users', uid, 'following', targetUid);
  const snap = await getDoc(ref);
  return snap.exists();
}

/**
 * Fetches recipes created by a specific user.
 */
export async function getUserRecipes(uid: string): Promise<string[]> {
  const q = query(collection(db, 'recipes'), where('chefId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

/**
 * Gets the Chef of the Week (user with the most followers).
 */
export async function getChefOfTheWeek(): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), orderBy('followers', 'desc'), limit(1));
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  
  const d = snap.docs[0].data();
  return {
    uid: d.uid,
    email: d.email,
    displayName: d.displayName,
    photoURL: d.photoURL ?? null,
    bio: d.bio ?? '',
    specialty: d.specialty ?? '',
    followers: d.followers ?? 0,
    following: d.following ?? 0,
    recipeCount: d.recipeCount ?? 0,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

// ─── Notifications ──────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  sourceUserId: string;
  sourceUserName: string;
  sourceUserAvatar: string | null;
  recipeId?: string;
  recipeTitle?: string;
  text?: string;
  read: boolean;
  createdAt: Date;
}

export async function addNotification(
  targetUid: string,
  data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
): Promise<void> {
  const colRef = collection(db, 'users', targetUid, 'notifications');
  await addDoc(colRef, {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function onNotificationsSnapshot(
  uid: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  const colRef = collection(db, 'users', uid, 'notifications');
  const q = query(colRef);

  return onSnapshot(q, (snap) => {
    const notifs: AppNotification[] = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type,
          sourceUserId: data.sourceUserId,
          sourceUserName: data.sourceUserName,
          sourceUserAvatar: data.sourceUserAvatar ?? null,
          recipeId: data.recipeId,
          recipeTitle: data.recipeTitle,
          text: data.text,
          read: data.read ?? false,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(notifs);
  });
}

export async function markNotificationAsRead(uid: string, notificationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
}

export async function markAllNotificationsAsRead(uid: string, notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter(n => !n.read);
  for (const n of unread) {
    markNotificationAsRead(uid, n.id).catch(console.error);
  }
}
