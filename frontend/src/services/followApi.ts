import { get, post, del } from '../utils/apiClient';
import { ApiResponse } from '../types';
import { UserListItem, FollowResponse, CheckFollowResponse } from '../types';

export const followApi = {
  // Follow a user
  follow: async (userId: string): Promise<ApiResponse<FollowResponse>> => {
    return post<FollowResponse>(`/follow/${userId}`);
  },

  // Unfollow a user
  unfollow: async (userId: string): Promise<ApiResponse<FollowResponse>> => {
    return del<FollowResponse>(`/follow/${userId}`);
  },

  // Check if current user follows another user
  checkFollowStatus: async (userId: string): Promise<ApiResponse<CheckFollowResponse>> => {
    return get<CheckFollowResponse>(`/follow/check/${userId}`);
  },

  // Get user's followers
  getFollowers: async (userId: string): Promise<ApiResponse<UserListItem[]>> => {
    return get<UserListItem[]>(`/follow/${userId}/followers`);
  },

  // Get users that a user follows
  getFollowing: async (userId: string): Promise<ApiResponse<UserListItem[]>> => {
    return get<UserListItem[]>(`/follow/${userId}/following`);
  }
};