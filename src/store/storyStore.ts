import { create } from 'zustand';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Story, UserStoryGroup } from '../types/story';

interface StoryState {
  groupedStories: UserStoryGroup[];
  isLoading: boolean;
  initStoriesFeed: () => () => void;
  addStory: (userId: string, userName: string, userAvatar: string, imageUri: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set) => ({
  groupedStories: [],
  isLoading: true,

  initStoriesFeed: () => {
    const now = Date.now();
    // Query stories that expire in the future
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawStories: Story[] = [];
      snapshot.forEach((doc) => {
        rawStories.push({ id: doc.id, ...doc.data() } as Story);
      });

      // Group stories by user
      const groupMap = new Map<string, UserStoryGroup>();
      
      rawStories.forEach((story) => {
        if (!groupMap.has(story.userId)) {
          groupMap.set(story.userId, {
            userId: story.userId,
            userName: story.userName,
            userAvatar: story.userAvatar,
            stories: [],
          });
        }
        groupMap.get(story.userId)!.stories.push(story);
      });

      // Convert map to array and sort groups (e.g. prioritize active users)
      const groupedStories = Array.from(groupMap.values());
      
      set({ groupedStories, isLoading: false });
    }, (error) => {
      console.error("Error fetching stories:", error);
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  addStory: async (userId, userName, userAvatar, imageUri) => {
    try {
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now
      
      await addDoc(collection(db, 'stories'), {
        userId,
        userName,
        userAvatar,
        imageUri,
        createdAt: now,
        expiresAt,
      });
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  },
}));
