import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useProfileData } from '../../../hooks/useProfileData';
import { usersApi } from '../../../services/usersApi';
import { authApi } from '../../../services/authApi';
import authReducer from '../../../store/authSlice';
import { Recipe } from '../../../types';

// Mock APIs
vi.mock('../../../services/usersApi', () => ({
  usersApi: {
    getUserById: vi.fn(),
    getFavorites: vi.fn(),
  }
}));

vi.mock('../../../services/authApi', () => ({
  authApi: {
    getMe: vi.fn(),
  }
}));

describe('useProfileData', () => {
  let store: ReturnType<typeof configureStore>;
  const mockUserId = 'user123';
  const mockCurrentUserId = 'currentUser456';

  // Create a complete Recipe object that matches the Recipe type
  const createMockRecipe = (id: string, title: string): Recipe => ({
    _id: id,
    title: title,
    description: 'Test description',
    ingredients: ['ingredient 1', 'ingredient 2'],
    instructions: ['step 1', 'step 2'],
    difficulty: 'medium',
    imageUrl: 'img.jpg',
    author: {
      _id: mockUserId,
      username: 'testuser',
      avatar: 'avatar.jpg'
    },
    rating: 4.5,
    ratingCount: 10,
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const mockUserProfile = {
    _id: mockUserId,
    username: 'testuser',
    email: 'test@test.com',
    avatar: 'avatar.jpg',
    bio: 'Test bio',
    recipeCount: 5,
    followersCount: 10,
    followingCount: 5,
    isFollowing: false,
    createdRecipes: [],
    favorites: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockFavorites: Recipe[] = [
    createMockRecipe('recipe1', 'Recipe 1'),
    createMockRecipe('recipe2', 'Recipe 2')
  ];

  // Mock FavoritesListResponse
  const mockFavoritesResponse = {
    userId: mockUserId,
    username: 'testuser',
    favorites: mockFavorites
  };

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  describe('Initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      expect(result.current.profile).toBeNull();
      expect(result.current.favorites).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.loadingFavorites).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadProfile - own profile', () => {
    it('should load own profile when no userId provided', async () => {
      vi.mocked(authApi.getMe).mockResolvedValue({
        success: true,
        data: { ...mockUserProfile, _id: mockCurrentUserId }
      });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: { ...mockFavoritesResponse, userId: mockCurrentUserId, username: 'currentuser' }
      });

      const { result } = renderHook(
        () => useProfileData(undefined, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authApi.getMe).toHaveBeenCalled();
      expect(usersApi.getFavorites).toHaveBeenCalledWith(mockCurrentUserId);
      expect(result.current.profile).toEqual({ ...mockUserProfile, _id: mockCurrentUserId });
      expect(result.current.favorites).toEqual(mockFavorites);
      expect(result.current.error).toBeNull();
    });

    it('should load another user profile when userId provided', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: true,
        data: mockUserProfile
      });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: mockFavoritesResponse
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(usersApi.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(usersApi.getFavorites).toHaveBeenCalledWith(mockUserId);
      expect(result.current.profile).toEqual(mockUserProfile);
      expect(result.current.favorites).toEqual(mockFavorites);
    });
  });

  describe('Error handling', () => {
    it('should handle API error when loading profile', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: false,
        error: 'User not found'
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('User not found');
      expect(result.current.profile).toBeNull();
    });

    it('should handle exception when loading profile', async () => {
      vi.mocked(usersApi.getUserById).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load profile');
    });

    it('should handle favorites loading error gracefully', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: true,
        data: mockUserProfile
      });
      vi.mocked(usersApi.getFavorites).mockRejectedValue(new Error('Favorites error'));

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockUserProfile);
      expect(result.current.favorites).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('updateFollowStats', () => {
    it('should update isFollowing and followersCount', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: true,
        data: mockUserProfile
      });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: mockFavoritesResponse
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.profile).toBeTruthy();
      });

      act(() => {
        result.current.updateFollowStats(true, 11);
      });

      expect(result.current.profile?.isFollowing).toBe(true);
      expect(result.current.profile?.followersCount).toBe(11);
    });

    it('should keep existing followersCount if not provided', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: true,
        data: mockUserProfile
      });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: mockFavoritesResponse
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.profile).toBeTruthy();
      });

      const originalCount = result.current.profile?.followersCount;

      act(() => {
        result.current.updateFollowStats(true);
      });

      expect(result.current.profile?.followersCount).toBe(originalCount);
    });
  });

  describe('updateCounters', () => {
    it('should update followersCount and followingCount', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: true,
        data: mockUserProfile
      });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: mockFavoritesResponse
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.profile).toBeTruthy();
      });

      act(() => {
        result.current.updateCounters(15, 8);
      });

      expect(result.current.profile?.followersCount).toBe(15);
      expect(result.current.profile?.followingCount).toBe(8);
    });

    it('should update only provided counters', async () => {
      vi.mocked(usersApi.getUserById).mockResolvedValue({
        success: true,
        data: mockUserProfile
      });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: mockFavoritesResponse
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.profile).toBeTruthy();
      });

      const originalFollowingCount = result.current.profile?.followingCount;

      act(() => {
        result.current.updateCounters(20);
      });

      expect(result.current.profile?.followersCount).toBe(20);
      expect(result.current.profile?.followingCount).toBe(originalFollowingCount);
    });
  });

  describe('refresh', () => {
    it('should reload profile when refresh is called', async () => {
      const firstProfile = { ...mockUserProfile, username: 'first' };
      const secondProfile = { ...mockUserProfile, username: 'second' };

      vi.mocked(usersApi.getUserById)
        .mockResolvedValueOnce({ success: true, data: firstProfile })
        .mockResolvedValueOnce({ success: true, data: secondProfile });
      vi.mocked(usersApi.getFavorites).mockResolvedValue({
        success: true,
        data: mockFavoritesResponse
      });

      const { result } = renderHook(
        () => useProfileData(mockUserId, mockCurrentUserId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.profile?.username).toBe('first');
      });

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.profile?.username).toBe('second');
      });
    });
  });

  describe('No userId', () => {
    it('should not load profile if no userId and no currentUserId', async () => {
      const { result } = renderHook(
        () => useProfileData(undefined, undefined),
        { wrapper }
      );

      expect(result.current.loading).toBe(true);
      
      // Wait a bit to ensure no API calls are made
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(usersApi.getUserById).not.toHaveBeenCalled();
      expect(authApi.getMe).not.toHaveBeenCalled();
    });
  });
});