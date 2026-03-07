import { Types, Document } from 'mongoose';

export interface IRecipe {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  cookingTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  author: Types.ObjectId | string;
  rating: number;
  ratingCount: number;
}

export interface IRecipeInput {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  cookingTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IRecipeFilters {
  difficulty?: string;
  maxCookingTime?: number;
  search?: string;
  sort?: 'newest' | 'popular' | 'rating';
}

export interface IFavoriteResponse {
  recipeId: string;
  isFavorite: boolean;
  favoritesCount: number;
}

export interface IRecipeDocument extends Document, Omit<IRecipe, '_id'> {}