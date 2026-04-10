import { describe, it, expect, beforeEach, vi } from 'vitest';
import { followApi } from '../../../services/followApi';
import * as apiClient from '../../../utils/apiClient';
import { UserListItem, FollowResponse, CheckFollowResponse } from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

describe('followApi', () => {
  const mockUserId = 'user123';
  const mockFollowerId = 'follower456';

  const mockUserListItem: UserListItem = {
    _id: mockFollowerId,
    username: 'followeruser',
    avatar: 'avatar.jpg',
    bio: 'Test bio',
    recipeCount: 5,
    followersCount: 10,
    isFollowing: false,
  };

  const mockFollowResponse: FollowResponse = {
    userId: mockUserId,
    isFollowing: true,
    followersCount: 11,
    followingCount: 6,
  };

  const mockCheckFollowResponse: CheckFollowResponse = {
    isFollowing: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('follow', () => {
    it('should follow a user', async () => {
      const mockResponse = { success: true, data: mockFollowResponse };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await followApi.follow(mockUserId);

      expect(apiClient.post).toHaveBeenCalledWith(`/follow/${mockUserId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when following a user', async () => {
      const mockError = { success: false, error: 'Cannot follow yourself' };
      vi.mocked(apiClient.post).mockResolvedValue(mockError);

      const result = await followApi.follow(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot follow yourself');
    });
  });

  describe('unfollow', () => {
    it('should unfollow a user', async () => {
      const unfollowResponse = {
        ...mockFollowResponse,
        isFollowing: false,
        followersCount: 10,
      };
      const mockResponse = { success: true, data: unfollowResponse };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await followApi.unfollow(mockUserId);

      expect(apiClient.del).toHaveBeenCalledWith(`/follow/${mockUserId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when unfollowing a user', async () => {
      const mockError = { success: false, error: 'Not following this user' };
      vi.mocked(apiClient.del).mockResolvedValue(mockError);

      const result = await followApi.unfollow(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not following this user');
    });
  });

  describe('checkFollowStatus', () => {
    it('should check if current user follows another user', async () => {
      const mockResponse = { success: true, data: mockCheckFollowResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await followApi.checkFollowStatus(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/follow/check/${mockUserId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should return false when not following', async () => {
      const mockResponse = { success: true, data: { isFollowing: false } };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await followApi.checkFollowStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.isFollowing).toBe(false);
    });
  });

  describe('getFollowers', () => {
    it('should get user followers', async () => {
      const mockFollowers = [mockUserListItem];
      const mockResponse = { success: true, data: mockFollowers };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await followApi.getFollowers(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/follow/${mockUserId}/followers`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty followers list', async () => {
      const mockResponse = { success: true, data: [] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await followApi.getFollowers(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle error when getting followers', async () => {
      const mockError = { success: false, error: 'User not found' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await followApi.getFollowers(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getFollowing', () => {
    it('should get users that a user follows', async () => {
      const mockFollowing = [mockUserListItem];
      const mockResponse = { success: true, data: mockFollowing };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await followApi.getFollowing(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/follow/${mockUserId}/following`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty following list', async () => {
      const mockResponse = { success: true, data: [] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await followApi.getFollowing(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle error when getting following users', async () => {
      const mockError = { success: false, error: 'User not found' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await followApi.getFollowing(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });
});