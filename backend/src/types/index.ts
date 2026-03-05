export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  favorites?: string[];
  createdAt?: Date;
}

export interface IRecipe {
  _id?: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  cookingTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  author: string | IUser;
  rating: number;
  ratingCount: number;
  createdAt?: Date;
}

export interface IComment {
  _id?: string;
  text: string;
  recipeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating?: number;
  likes: number;
  likedBy: string[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ICommentInput {
  text: string;
  recipeId: string;
  rating?: number;
}

export interface ICommentUpdateInput {
  text?: string;
  rating?: number;
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}