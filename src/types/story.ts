export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUri: string;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
}

export interface UserStoryGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: Story[];
}
