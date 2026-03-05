export interface Comment {
  id: string;
  recipeId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  rating?: number;  // Optional rating with comment
  createdAt: number;
  updatedAt?: number;
  likes: number;
  isEdited: boolean;
  replies?: Comment[]; // For nested comments
  parentId?: string; // For replies
}

export interface CommentState {
  comments: Record<number, Comment[]>;  // key: recipeId
  loading: boolean;
  error: string | null;
}

export type CommentAction = 
  | { type: 'ADD_COMMENT'; payload: { recipeId: number; comment: Comment } }
  | { type: 'EDIT_COMMENT'; payload: { recipeId: number; commentId: string; text: string } }
  | { type: 'DELETE_COMMENT'; payload: { recipeId: number; commentId: string } }
  | { type: 'LIKE_COMMENT'; payload: { recipeId: number; commentId: string } }
  | { type: 'SET_COMMENTS'; payload: { recipeId: number; comments: Comment[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export interface CommentContextType {
  comments: Record<number, Comment[]>;
  loading: boolean;
  error: string | null;
  addComment: (recipeId: number, text: string, rating?: number) => void;
  editComment: (recipeId: number, commentId: string, text: string) => void;
  deleteComment: (recipeId: number, commentId: string) => void;
  likeComment: (recipeId: number, commentId: string) => void; 
  getCommentsForRecipe: (recipeId: number) => Comment[];
}

// Share types
export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export type SharePlatform = 'twitter' | 'facebook' | 'pinterest' | 'copy'; 