import { Recipe } from './index';
export interface FavoriteActionResponse {
  recipeId: string;
  isFavorite: boolean;
  favoritesCount: number;
}

export interface CheckFavoriteResponse {
  success: boolean;
  data?: {
    isFavorite: boolean;
  };
  error?: string;
}

export interface ReorderResponse {
  message: string;
  favorites: Recipe[];
}

export interface ClearAllResponse {
  message: string;
  favoritesCount: number;
}