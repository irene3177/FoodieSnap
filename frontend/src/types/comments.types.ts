export interface Comment {
  _id: string;
  recipeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  rating?: number;  // Optional rating with comment
  createdAt: string;
  updatedAt?: string;
  likes: number;
  likedBy?: string[];
  isEdited: boolean;

  // Nested comments
  replies?: Comment[]; // For nested comments
  parentId?: string; // For replies
}

// Share types
export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface CreateCommentData {
  text: string;
  recipeId: string;
  rating?: number;
}

export interface LikeResponse {
  likes: number;
  hasLiked: boolean;
}

export type SharePlatform = 'twitter' | 'facebook' | 'pinterest' | 'copy'; 