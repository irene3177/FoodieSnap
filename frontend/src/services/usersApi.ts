import axios, { isAxiosError } from 'axios';
import {
  UserResponse,
  UsersListResponse,
  GetUsersParams,
  FollowResponse,
  FollowersResponse,
  FollowingResponse,
  SavedRecipesResponse,
  FavoritesListResponse
} from '../types';

const handleApiError = (error: unknown): { success: false; error: string } => {
  if (isAxiosError(error)) {
    // Server-side error
    return {
      success: false,
      error: error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Request failed'
    };
  }

  if (error instanceof Error) {
    // JS error
    return {
      success: false,
      error: error.message
    };
  }

  // Unexpected error
  return {
    success: false,
    error: 'An unexpected error occurred'
  };
};

// Create axios instance for user
const usersApiClient = axios.create({
  baseURL: 'http://localhost:5001/api/users', // backend URL
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Include cookies for session management
  timeout: 10000
});


export const usersApi = {
  // Get user by ID (public)
  getUserById: async (userId: string): Promise<UserResponse> => {
    try {
      const response = await usersApiClient.get(`/${userId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get users list with pagination (public)
  getUsers: async (params?: GetUsersParams): Promise<UsersListResponse> => {
    try {
      const response = await usersApiClient.get('/', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get user's saved recipes
  getSavedRecipes: async (userId: string): Promise<SavedRecipesResponse> => {
    try {
      const response = await usersApiClient.get(`/${userId}/saved`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get favourite recipes
  getFavorites: async (userId: string): Promise<FavoritesListResponse> => {
    try {
      const response = await usersApiClient.get(`/${userId}/favorites`);
      if (response.data.success && response.data.data?.favorites) {
        return {
          ...response.data,
          data: {
            ...response.data.data,
            favorites: response.data.data.favorites
          }
        };
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get user's followers 
  getFollowers: async (userId: string, params?: { page?: number; limit?: number}): Promise<FollowersResponse> => {
    try {
      const response = await usersApiClient.get(`/${userId}/followers`, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get users that user is following
  getFollowing: async (userId: string, params?: {page?: number; limit?: number }): Promise<FollowingResponse> => {
    try {
      const response = await usersApiClient.get(`/${userId}/following`, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Follow a user
  followUser: async (userId: string): Promise<FollowResponse> => {
    try {
      const response = await usersApiClient.post(`/${userId}/follow`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Unfollow a user
  unfollowUser: async (userId: string): Promise<FollowResponse> => {
    try {
      const response = await usersApiClient.delete(`/${userId}/follow`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Check if user is following another user
  checkFollow: async (userId: string): Promise<{ success: boolean; data?: { isFollowing: boolean }; error?: string }> => {
    try {
      const response = await usersApiClient.get(`/${userId}/follow/check`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Search users by username
  searchUsers: async (query: string, params?: { page?: number; limit?: number }): Promise<UsersListResponse> => {
    try {
      const response = await usersApiClient.get(`/search`, {
        params: { q: query, ...params }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
