export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  specialty: string;
  followers: number;
  following: number;
  recipeCount: number;
  createdAt: Date;
}
