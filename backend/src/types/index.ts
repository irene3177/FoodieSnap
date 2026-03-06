import { Types, Document } from 'mongoose';

export interface IUser {
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  savedRecipes?: Types.ObjectId[];
  favorites?: string[];
}

export interface IUserDocument extends Document, Omit<IUser, '_id'> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IRecipe {
  _id?: Types.ObjectId;
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
}

export interface IComment {
  _id?: Types.ObjectId;
  text: string;
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating?: number;
  likes: number;
  likedBy: Types.ObjectId[];
  isEdited: boolean;
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