import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useFollow, useFollowersList, useFollowingList } from '../../../hooks/useFollow';
import { followApi } from '../../../services/followApi';
import toastReducer from '../../../store/toastSlice';

// Mock followApi
vi.mock('../../../services/followApi', () => ({
  followApi: {
    follow: vi.fn(),
    unfollow: vi.fn(),
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
  }
}));

describe('useFollow', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { toast: toastReducer }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  describe('useFollow', () => {
    it('should initialize with correct isFollowing state', () => {
      const { result } = renderHook(
        () => useFollow('user123', true),
        { wrapper }
      );
      
      expect(result.current.isFollowing).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should update isFollowing when initialIsFollowing changes', () => {
      const { result, rerender } = renderHook(
        ({ targetUserId, initialIsFollowing }) => useFollow(targetUserId, initialIsFollowing),
        { initialProps: { targetUserId: 'user123', initialIsFollowing: false }, wrapper }
      );
      
      expect(result.current.isFollowing).toBe(false);
      
      rerender({ targetUserId: 'user123', initialIsFollowing: true });
      
      expect(result.current.isFollowing).toBe(true);
    });

    it('should call follow API and update state on follow', async () => {
      const mockResponse = { 
        success: true, 
        data: { userId: 'user123', isFollowing: true, followersCount: 5 } 
      };
      vi.mocked(followApi.follow).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(
        () => useFollow('user123', false),
        { wrapper }
      );
      
      await act(async () => {
        await result.current.follow();
      });
      
      expect(followApi.follow).toHaveBeenCalledWith('user123');
      expect(result.current.isFollowing).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should call unfollow API and update state on unfollow', async () => {
      const mockResponse = { 
        success: true, 
        data: { userId: 'user123', isFollowing: false, followersCount: 4 } 
      };
      vi.mocked(followApi.unfollow).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(
        () => useFollow('user123', true),
        { wrapper }
      );
      
      await act(async () => {
        await result.current.unfollow();
      });
      
      expect(followApi.unfollow).toHaveBeenCalledWith('user123');
      expect(result.current.isFollowing).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should call onFollowChange callback when follow status changes', async () => {
      const onFollowChange = vi.fn();
      const mockResponse = { 
        success: true, 
        data: { userId: 'user123', isFollowing: true, followersCount: 5 } 
      };
      vi.mocked(followApi.follow).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(
        () => useFollow('user123', false, { onFollowChange }),
        { wrapper }
      );
      
      await act(async () => {
        await result.current.follow();
      });
      
      expect(onFollowChange).toHaveBeenCalledWith(true, 5);
    });

    it('should handle follow API error', async () => {
      vi.mocked(followApi.follow).mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(
        () => useFollow('user123', false),
        { wrapper }
      );
      
      await act(async () => {
        await result.current.follow();
      });
      
      expect(result.current.isFollowing).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle already following case', async () => {
      const mockResponse = { success: false, error: 'Already following this user' };
      vi.mocked(followApi.follow).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(
        () => useFollow('user123', false),
        { wrapper }
      );
      
      await act(async () => {
        await result.current.follow();
      });
      
      expect(result.current.isFollowing).toBe(true);
    });

    it('should toggle follow when toggleFollow is called', async () => {
      const mockFollowResponse = { 
        success: true, 
        data: { userId: 'user123', isFollowing: true, followersCount: 5 } 
      };
      const mockUnfollowResponse = { 
        success: true, 
        data: { userId: 'user123', isFollowing: false, followersCount: 4 } 
      };
      vi.mocked(followApi.follow).mockResolvedValue(mockFollowResponse);
      vi.mocked(followApi.unfollow).mockResolvedValue(mockUnfollowResponse);
      
      const { result } = renderHook(
        () => useFollow('user123', false),
        { wrapper }
      );
      
      // Follow
      await act(async () => {
        await result.current.toggleFollow();
      });
      expect(result.current.isFollowing).toBe(true);
      
      // Unfollow
      await act(async () => {
        await result.current.toggleFollow();
      });
      expect(result.current.isFollowing).toBe(false);
    });
  });

  describe('useFollowersList', () => {
    const mockFollowers = [
      { _id: '1', username: 'follower1', avatar: 'avatar1.jpg', bio: 'bio1', recipeCount: 5 },
      { _id: '2', username: 'follower2', avatar: 'avatar2.jpg', bio: 'bio2', recipeCount: 3 }
    ];

    it('should load followers on mount', async () => {
      vi.mocked(followApi.getFollowers).mockResolvedValue({
        success: true,
        data: mockFollowers
      });
      
      const { result } = renderHook(
        () => useFollowersList('user123'),
        { wrapper }
      );
      
      expect(result.current.isLoading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.followers).toEqual(mockFollowers);
        expect(result.current.total).toBe(2);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle empty followers list', async () => {
      vi.mocked(followApi.getFollowers).mockResolvedValue({
        success: true,
        data: []
      });
      
      const { result } = renderHook(
        () => useFollowersList('user123'),
        { wrapper }
      );
      
      await waitFor(() => {
        expect(result.current.followers).toEqual([]);
        expect(result.current.total).toBe(0);
      });
    });

    it('should handle API error', async () => {
      vi.mocked(followApi.getFollowers).mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(
        () => useFollowersList('user123'),
        { wrapper }
      );
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.followers).toEqual([]);
      });
    });

    it('should refetch when refetch is called', async () => {
      const firstResponse = { success: true, data: [] };
      const secondResponse = { success: true, data: mockFollowers };
      
      vi.mocked(followApi.getFollowers)
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);
      
      const { result } = renderHook(
        () => useFollowersList('user123'),
        { wrapper }
      );
      
      await waitFor(() => {
        expect(result.current.followers).toEqual([]);
      });
      
      await act(async () => {
        await result.current.refetch();
      });
      
      await waitFor(() => {
        expect(result.current.followers).toEqual(mockFollowers);
      });
    });
  });

  describe('useFollowingList', () => {
    const mockFollowing = [
      { _id: '1', username: 'following1', avatar: 'avatar1.jpg', bio: 'bio1', recipeCount: 2 },
      { _id: '2', username: 'following2', avatar: 'avatar2.jpg', bio: 'bio2', recipeCount: 7 }
    ];

    it('should load following on mount', async () => {
      vi.mocked(followApi.getFollowing).mockResolvedValue({
        success: true,
        data: mockFollowing
      });
      
      const { result } = renderHook(
        () => useFollowingList('user123'),
        { wrapper }
      );
      
      await waitFor(() => {
        expect(result.current.following).toEqual(mockFollowing);
        expect(result.current.total).toBe(2);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle empty following list', async () => {
      vi.mocked(followApi.getFollowing).mockResolvedValue({
        success: true,
        data: []
      });
      
      const { result } = renderHook(
        () => useFollowingList('user123'),
        { wrapper }
      );
      
      await waitFor(() => {
        expect(result.current.following).toEqual([]);
        expect(result.current.total).toBe(0);
      });
    });
  });
});