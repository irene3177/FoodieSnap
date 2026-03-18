import axios, { isAxiosError } from 'axios';
import { config } from '../config';
import { ApiResponse, Comment } from '../types';

const handleError = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'Request failed';
  }
  return 'An unexpected error occurred';
};

const apiClient = axios.create({
  baseURL: `${config.apiUrl}/comments`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: config.timeout
});

export const commentsApi = {
  // Get comments for a recipe
  getRecipeComments: async (recipeId: string): Promise<ApiResponse<Comment[]>> => {
    try {
      const response = await apiClient.get(`/recipe/${recipeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  // Create a new comment
  createComment: async (
    data: { 
      text: string;
      recipeId: string;
      rating?: number;
    }): Promise<ApiResponse<Comment>> => {
      try {
        const response = await apiClient.post('/', data);
        return response.data;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },

    // Update a comment
    updateComment: async (commentId: string, text: string): Promise<ApiResponse<Comment>> => {
      try {
        const response = await apiClient.put(`/${commentId}`, { text });
        return response.data;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },

    // Delete a comment
    deleteComment: async (commentId: string): Promise<ApiResponse<null>> => {
      try {
        const response = await apiClient.delete(`/${commentId}`);
        return response.data;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },

    // Toggle like on a comment
    toggleLike: async (commentId: string): Promise<ApiResponse<{
      likes: number;
      hasLiked: boolean
    }>> => {
      try {
        const response = await apiClient.post(`/${commentId}/like`);
        return response.data;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    }
};

