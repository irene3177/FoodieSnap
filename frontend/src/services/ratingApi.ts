import  { get, post, put, del } from '../utils/apiClient';
import { RatingStats } from '../store/ratingSlice';
import { ApiResponse, RatingResponse, DeleteRatingResponse } from '../types';

export const ratingApi = {
  // Get rating stats for a recipe
  getRecipeRating: async (recipeId: string): Promise<ApiResponse<RatingStats>> => {
    return get<RatingStats>(`/ratings/recipe/${recipeId}`);
  },

  // Get all ratings by current user
  getUserRatings: async (): Promise<ApiResponse<Record<string, number>>> => {
    return get<Record<string, number>>('/ratings/user');
  },

  // Rate a recipe
  rateRecipe: async (recipeId: string, value: number): Promise<ApiResponse<RatingResponse>> => {
    return post<RatingResponse>(`/ratings/recipe/${recipeId}`, { value });
  },

  // Update a rating
  updateRating: async (recipeId: string, value: number): Promise<ApiResponse<RatingResponse>> => {
    return put<RatingResponse>(`/ratings/recipe/${recipeId}`, { value });
  },

  // Delete a rating
  deleteRating: async (recipeId: string): Promise<ApiResponse<DeleteRatingResponse>> => {
    return del<DeleteRatingResponse>(`/ratings/recipe/${recipeId}`);
  }
};