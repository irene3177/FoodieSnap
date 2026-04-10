import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usersApi } from '../../../services/usersApi';
import * as apiClient from '../../../utils/apiClient';
import {
  UserProfile,
  UsersListResponse,
  GetUsersParams,
  FollowResponse,
  FollowersResponse,
  FollowingResponse,
  CreatedRecipesResponse,
  FavoritesListResponse,
  CheckFollowResponse,
} from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

describe('usersApi', () => {
  const mockUserId = 'user123';
  const mockFollowerId = 'follower456';
  const mockSearchQuery = 'testuser';

  const mockUserProfile: UserProfile = {
    _id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
    bio: 'Test bio',
    recipeCount: 5,
    followersCount: 10,
    followingCount: 5,
    isFollowing: false,
  };

  const mockUsersListResponse: UsersListResponse = {
    users: [
      {
        _id: mockUserId,
        username: 'testuser',
        avatar: 'avatar.jpg',
        bio: 'Test bio',
        recipeCount: 5,
        followersCount: 10,
        isFollowing: false,
      },
    ],
    total: 1,
    page: 1,
    pages: 1,
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

  const mockFollowersResponse: FollowersResponse = {
    users: [
      {
        _id: mockFollowerId,
        username: 'follower',
        avatar: 'avatar.jpg',
        bio: 'Follower bio',
        recipeCount: 3,
        followersCount: 5,
        isFollowing: false,
      },
    ],
    total: 1,
  };

  const mockFollowingResponse: FollowingResponse = {
    users: [
      {
        _id: mockUserId,
        username: 'following',
        avatar: 'avatar.jpg',
        bio: 'Following bio',
        recipeCount: 8,
        followersCount: 15,
        isFollowing: true,
      },
    ],
    total: 1,
  };

  const mockCreatedRecipesResponse: CreatedRecipesResponse = {
    createdRecipes: ['recipe1', 'recipe2', 'recipe3'],
  };

  const mockFavoritesListResponse: FavoritesListResponse = {
    userId: mockUserId,
    username: 'testuser',
    favorites: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      const mockResponse = { success: true, data: mockUserProfile };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getUserById(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUsers', () => {
    it('should get users list with default params', async () => {
      const mockResponse = { success: true, data: mockUsersListResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getUsers();

      expect(apiClient.get).toHaveBeenCalledWith('/users', undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should get users list with custom params', async () => {
      const params: GetUsersParams = {
        page: 2,
        limit: 10,
        search: 'test',
        sortBy: 'username',
        sortOrder: 'asc',
      };
      const mockResponse = { success: true, data: mockUsersListResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getUsers(params);

      expect(apiClient.get).toHaveBeenCalledWith('/users', params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCreatedRecipes', () => {
    it('should get user created recipes', async () => {
      const mockResponse = { success: true, data: mockCreatedRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getCreatedRecipes(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/recipes`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFavorites', () => {
    it('should get user favorites', async () => {
      const mockResponse = { success: true, data: mockFavoritesListResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getFavorites(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/favorites`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFollowers', () => {
    it('should get user followers', async () => {
      const mockResponse = { success: true, data: mockFollowersResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getFollowers(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/followers`, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should get user followers with pagination', async () => {
      const params = { page: 2, limit: 20 };
      const mockResponse = { success: true, data: mockFollowersResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getFollowers(mockUserId, params);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/followers`, params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFollowing', () => {
    it('should get users that user is following', async () => {
      const mockResponse = { success: true, data: mockFollowingResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getFollowing(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/following`, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should get following with pagination', async () => {
      const params = { page: 2, limit: 20 };
      const mockResponse = { success: true, data: mockFollowingResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.getFollowing(mockUserId, params);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/following`, params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('followUser', () => {
    it('should follow a user', async () => {
      const mockResponse = { success: true, data: mockFollowResponse };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await usersApi.followUser(mockUserId);

      expect(apiClient.post).toHaveBeenCalledWith(`/users/${mockUserId}/follow`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user', async () => {
      const mockResponse = { success: true, data: mockFollowResponse };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await usersApi.unfollowUser(mockUserId);

      expect(apiClient.del).toHaveBeenCalledWith(`/users/${mockUserId}/follow`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkFollow', () => {
    it('should check if user is following another user', async () => {
      const mockResponse = { success: true, data: mockCheckFollowResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.checkFollow(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/users/${mockUserId}/follow/check`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockResponse = { success: true, data: mockUsersListResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.searchUsers(mockSearchQuery);

      expect(apiClient.get).toHaveBeenCalledWith('/users/search', { q: mockSearchQuery });
      expect(result).toEqual(mockResponse);
    });

    it('should search users with pagination', async () => {
      const params = { page: 2, limit: 10 };
      const mockResponse = { success: true, data: mockUsersListResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await usersApi.searchUsers(mockSearchQuery, params);

      expect(apiClient.get).toHaveBeenCalledWith('/users/search', { q: mockSearchQuery, ...params });
      expect(result).toEqual(mockResponse);
    });
  });
});