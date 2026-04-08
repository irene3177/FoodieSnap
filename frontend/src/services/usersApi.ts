import { get, post, del } from '../utils/apiClient';
import {
  ApiResponse,
  UserProfile,
  UsersListResponse,
  GetUsersParams,
  FollowResponse,
  FollowersResponse,
  FollowingResponse,
  CreatedRecipesResponse,
  FavoritesListResponse,
  CheckFollowResponse,
  ApiParams
} from '../types';

export const usersApi = {
  // Get user by ID (public)
  getUserById: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    return get<UserProfile>(`/users/${userId}`);
  },

  // Get users list with pagination (public)
  getUsers: async (params?: GetUsersParams): Promise<ApiResponse<UsersListResponse>> => {
    return get<UsersListResponse>('/users', params as ApiParams);
  },

  // Get user's created recipes
  getCreatedRecipes: async (userId: string): Promise<ApiResponse<CreatedRecipesResponse>> => {
    return get<CreatedRecipesResponse>(`/users/${userId}/recipes`);
  },

  // Get favourite recipes
  getFavorites: async (userId: string): Promise<ApiResponse<FavoritesListResponse>> => {
    return get<FavoritesListResponse>(`/users/${userId}/favorites`);
  },

  // Get user's followers 
  getFollowers: async (
    userId: string,
    params?: { page?: number; limit?: number}
  ): Promise<ApiResponse<FollowersResponse>> => {
    return get<FollowersResponse>(`/users/${userId}/followers`, params);
  },

  // Get users that user is following
  getFollowing: async (
    userId: string,
    params?: {page?: number; limit?: number }
  ): Promise<ApiResponse<FollowingResponse>> => {
    return get<FollowingResponse>(`/users/${userId}/following`, params);
  },

  // Follow a user
  followUser: async (userId: string): Promise<ApiResponse<FollowResponse>> => {
    return post<FollowResponse>(`/users/${userId}/follow`);
  },

  // Unfollow a user
  unfollowUser: async (userId: string): Promise<ApiResponse<FollowResponse>> => {
    return del<FollowResponse>(`/users/${userId}/follow`);
  },

  // Check if user is following another user
  checkFollow: async (userId: string): Promise<ApiResponse<CheckFollowResponse>> => {
    return get<CheckFollowResponse>(`/users/${userId}/follow/check`);
  },

  // Search users by username
  searchUsers: async (
    query: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<UsersListResponse>> => {
    return get<UsersListResponse>('/users/search', {q: query, ...params});
  }
};
