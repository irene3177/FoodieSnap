import { User, Recipe } from './index';

export interface UserProfile extends User {
  recipeCount?: number;  // (from savedRecipes.length)
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface UserListItem {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  recipeCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'username' | 'recipeCount' | 'followersCount';
  sortOrder?: 'asc' | 'desc';
}

export interface UsersListResponse {
  success: boolean;
  data?: {
    users: UserListItem[];
    total: number;
    page: number;
    pages: number;
  };
  error?: string;
}

export interface UserResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export interface SavedRecipesResponse {
  success: boolean;
  data?: {
    savedRecipes: string[];
  };
  error?: string;
}

export interface FavoritesListResponse {
  success: boolean;
  data?: {
    userId: string;
    username: string;
    favorites: Recipe[];
  };
  error?: string;
}

export interface FollowersResponse {
  success: boolean;
  data?: {
    users: UserListItem[];
    total: number;
  };
  error?: string;
}

export interface FollowingResponse {
  success: boolean;
  data?: {
    users: UserListItem[];
    total: number;
  };
  error?: string;
}

export interface FollowResponse {
  success: boolean;
  data?: {
    following: boolean;
    followersCount?: number;
    followingCount?: number;
  };
  error?: string;
}