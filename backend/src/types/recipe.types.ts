import { Types, Document } from 'mongoose';

export interface IRecipe {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  youtubeUrl?: string;
  category?: string;
  area?: string;
  tags: string[];
  cookingTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  author: Types.ObjectId | string;
  rating: number;
  ratingCount: number;
  source: 'user' | 'theMealDB';
  sourceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookingTime?: number;
  minCookingTime?: number;
  search?: string;
  sort?: 'newest' | 'popular' | 'rating';
  minRating?: number;
  category?: string;
  area?: string;
  source?: 'user' | 'theMealDB';
  tags?: string[];
  ingredients?: string[];
  hasVideo?: boolean;
  hasImage?: boolean;
  minRatingCount?: number;
  exactMatch?: boolean;
  page?: number;
  limit?: number;
}

export interface IFavoriteResponse {
  recipeId: string;
  isFavorite: boolean;
  favoritesCount: number;
}

export interface IRecipeDocument extends Document, Omit<IRecipe, '_id'> {}