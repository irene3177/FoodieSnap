import axios, { isAxiosError } from 'axios';
import { config } from '../config';
import { RatingStats } from '../store/ratingSlice';
import { ApiResponse } from '../types';

const apiClient = axios.create({
  baseURL: `${config.apiUrl}/ratings`,
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

export const ratingApi = {
  // Get rating stats for a recipe
  getRecipeRating: async (recipeId: string): Promise<ApiResponse<RatingStats>> => {
    try {
      const response = await apiClient.get(`/recipe/${recipeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Get all ratings by current user
  getUserRatings: async (): Promise<ApiResponse<Record<string, number>>> => {
    try {
      const response = await apiClient.get('/user');
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Rate a recipe
  rateRecipe: async (recipeId: string, value: number): Promise<ApiResponse<{
    recipeId: string;
    value: number;
    stats: RatingStats;
  }>> => {
    try {
      const response = await apiClient.post(`/recipe/${recipeId}`, { value });
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Update a rating
  updateRating: async (recipeId: string, value: number): Promise<ApiResponse<{
    recipeId: string;
    value: number;
    stats: RatingStats;
  }>> => {
    try {
      const response = await apiClient.put(`/recipe/${recipeId}`, { value });
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Delete a rating
  deleteRating: async (recipeId: string): Promise<ApiResponse<{
    recipeId: string;
    stats: RatingStats;
  }>> => {
    try {
      const response = await apiClient.delete(`/recipe/${recipeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  }
};