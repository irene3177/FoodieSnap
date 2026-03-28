import { get, post, del, put } from '../utils/apiClient';
import {
  FavoriteActionResponse,
  CheckFavoriteData,
  ReorderResponse,
  ClearAllResponse,
  ApiResponse,
  Recipe
} from '../types';

export const favoritesApi = {
  // Get all favorites
  getFavorites: async (): Promise<ApiResponse<Recipe[]>> => {
    return get<Recipe[]>('/favorites');
  },

  // Add to favorites
  addFavorite: async (recipeId: string): Promise<ApiResponse<FavoriteActionResponse>> => {
    return post<FavoriteActionResponse>(`/favorites/${recipeId}`);
  },

  // Remove from favorites
  removeFavorite: async (recipeId: string): Promise<ApiResponse<FavoriteActionResponse>> => {
    return del<FavoriteActionResponse>(`/favorites/${recipeId}`);
  },

  // Check if recipe is favorite
  checkFavorite: async (recipeId: string): Promise<ApiResponse<CheckFavoriteData>> => {
    return get<CheckFavoriteData>(`/favorites/${recipeId}/check`);
  },

  // Clear all favorites
  clearAllFavorites: async (): Promise<ApiResponse<ClearAllResponse>> => {
    return del<ClearAllResponse>('/favorites');
  },

  // Reorder favorites
  reorderFavorites: async (reorderedIds: (string | number) []): Promise<ApiResponse<ReorderResponse>> => {
    return put<ReorderResponse>('/favorites/reorder', { reorderedIds });
  }
};
