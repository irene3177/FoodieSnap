import axios, { isAxiosError } from 'axios';
import { config } from '../config';
import {
  FavoriteActionResponse,
  CheckFavoriteResponse,
  ReorderResponse,
  ClearAllResponse,
  ApiResponse,
  Recipe
} from '../types';

const apiClient = axios.create({
  baseURL: `${config.apiUrl}/favorites`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: config.timeout
});

const handleError = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'Request failed';
  }
  return 'An unexpected error occurred';
};

export const favoritesApi = {
  // Get all favorites
  getFavorites: async (): Promise<ApiResponse<Recipe[]>> => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Add to favorites
  addFavorite: async (recipeId: string): Promise<ApiResponse<FavoriteActionResponse>> => {
    try {
      const response = await apiClient.post(`/${recipeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Remove from favorites
  removeFavorite: async (recipeId: string): Promise<ApiResponse<FavoriteActionResponse>> => {
    try {
      const response = await apiClient.delete(`/${recipeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Check if recipe is favorite
  checkFavorite: async (recipeId: string): Promise<CheckFavoriteResponse> => {
    try {
      const response = await apiClient.get(`/${recipeId}/check`);
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Clear all favorites
  clearAllFavorites: async (): Promise<ApiResponse<ClearAllResponse>> => {
    try {
      const response = await apiClient.delete('/'); 
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Reorder favorites
  reorderFavorites: async (reorderedIds: (string | number) []): Promise<ApiResponse<ReorderResponse>> => {
    try {
      const response = await apiClient.put('/reorder', { reorderedIds });
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  }
};