import { User, Recipe } from './index';

export interface UserProfile extends User {
  recipeCount?: number;  // (from createdRecipes.length)
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
  users: UserListItem[];
  total: number;
  page: number;
  pages: number;
}

export interface UserResponse {
  user: UserProfile;
}

export interface CreatedRecipesResponse {
  createdRecipes: string[];
}

export interface FavoritesListResponse {
  userId: string;
  username: string;
  favorites: Recipe[];
}

export interface FollowersResponse {
  users: UserListItem[];
  total: number;
}

export interface FollowingResponse {
  users: UserListItem[];
  total: number;
}

export interface FollowResponse {
  following: boolean;
  followersCount?: number;
  followingCount?: number;
}

export interface CheckFollowResponse {
  isFollowing: boolean;
}