import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileData } from './useProfileData';
import { usersApi } from '@/services/usersApi';
import { authApi } from '@/services/authApi';

// ---------- Mocks ----------

vi.mock('@/services/usersApi');
vi.mock('@/services/authApi');

// ---------- Helpers ----------

const makeProfile = (overrides: Partial<any> = {}) => ({
  _id: 'user-1',
  username: 'alice',
  avatar: '',
  bio: '',
  isFollowing: false,
  followersCount: 0,
  followingCount: 0,
  ...overrides,
});

const makeRecipe = (id: string, title: string) => ({
  _id: id,
  title,
  ingredients: [],
  instructions: [],
  imageUrl: '',
  difficulty: 'easy',
  rating: 0,
  ratingCount: 0,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

// ---------- Tests ----------

describe('useProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (authApi.getMe as any).mockResolvedValue({
      success: true,
      data: makeProfile({ _id: 'me-1', username: 'me' }),
    });

    (usersApi.getUserById as any).mockResolvedValue({
      success: true,
      data: makeProfile({ _id: 'user-2', username: 'bob' }),
    });

    (usersApi.getFavorites as any).mockResolvedValue({
      success: true,
      data: { favorites: [makeRecipe('r1', 'Recipe 1')] },
    });
  });

  // ---- isOwnProfile ----

  describe('isOwnProfile', () => {
    it('is true when userId is undefined', () => {
      const { result } = renderHook(() =>
        useProfileData(undefined, 'me-1')
      );
      expect(result.current.isOwnProfile).toBe(true);
    });

    it('is true when userId equals currentUserId', () => {
      const { result } = renderHook(() =>
        useProfileData('me-1', 'me-1')
      );
      expect(result.current.isOwnProfile).toBe(true);
    });

    it('is false when userId differs from currentUserId', () => {
      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );
      expect(result.current.isOwnProfile).toBe(false);
    });
  });

  // ---- Loading ----

  describe('loading profile', () => {
    it('loads own profile via authApi.getMe when userId is undefined', async () => {
      const { result } = renderHook(() =>
        useProfileData(undefined, 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(authApi.getMe).toHaveBeenCalledTimes(1);
      expect(usersApi.getUserById).not.toHaveBeenCalled();
      expect(result.current.profile?.username).toBe('me');
    });

    it('loads other profile via usersApi.getUserById when userId is provided', async () => {
      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(usersApi.getUserById).toHaveBeenCalledWith('user-2');
      expect(authApi.getMe).not.toHaveBeenCalled();
      expect(result.current.profile?.username).toBe('bob');
    });

    it('loads favorites for the loaded profile', async () => {
      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(usersApi.getFavorites).toHaveBeenCalledWith('user-2');
      await waitFor(() => expect(result.current.favorites).toHaveLength(1));
      expect(result.current.favorites[0].title).toBe('Recipe 1');
    });

    it('does nothing when both userId and currentUserId are missing', () => {
      const { result } = renderHook(() =>
        useProfileData(undefined, undefined)
      );

      expect(authApi.getMe).not.toHaveBeenCalled();
      expect(usersApi.getUserById).not.toHaveBeenCalled();
      expect(result.current.profile).toBeNull();
    });

    it('sets error when API returns success=false', async () => {
      (usersApi.getUserById as any).mockResolvedValue({
        success: false,
        error: 'User not found',
      });

      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('User not found');
      expect(result.current.profile).toBeNull();
    });

    it('sets error when API throws', async () => {
      (usersApi.getUserById as any).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Failed to load profile');
    });

    it('handles favorites API error without crashing', async () => {
      (usersApi.getFavorites as any).mockRejectedValue(new Error('Fail'));

      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Profile still loaded
      expect(result.current.profile).not.toBeNull();
      expect(result.current.favorites).toEqual([]);
    });
  });

  // ---- refresh ----

  describe('refresh', () => {
    it('reloads profile when refresh is called', async () => {
      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(usersApi.getUserById).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() =>
        expect(usersApi.getUserById).toHaveBeenCalledTimes(2)
      );
    });
  });

  // ---- updateFollowStats ----

  describe('updateFollowStats', () => {
    it('updates isFollowing and followersCount', async () => {
      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.profile).not.toBeNull());

      act(() => {
        result.current.updateFollowStats(true, 42);
      });

      expect(result.current.profile?.isFollowing).toBe(true);
      expect(result.current.profile?.followersCount).toBe(42);
    });

    it('keeps followersCount when new value is undefined', async () => {
      (usersApi.getUserById as any).mockResolvedValue({
        success: true,
        data: makeProfile({ _id: 'user-2', followersCount: 10 }),
      });

      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.profile).not.toBeNull());

      act(() => {
        result.current.updateFollowStats(true);
      });

      expect(result.current.profile?.isFollowing).toBe(true);
      expect(result.current.profile?.followersCount).toBe(10);
    });
  });

  // ---- updateCounters ----

  describe('updateCounters', () => {
    it('updates both counters', async () => {
      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.profile).not.toBeNull());

      act(() => {
        result.current.updateCounters(100, 50);
      });

      expect(result.current.profile?.followersCount).toBe(100);
      expect(result.current.profile?.followingCount).toBe(50);
    });

    it('keeps existing value when new value is undefined', async () => {
      (usersApi.getUserById as any).mockResolvedValue({
        success: true,
        data: makeProfile({
          _id: 'user-2',
          followersCount: 10,
          followingCount: 20,
        }),
      });

      const { result } = renderHook(() =>
        useProfileData('user-2', 'me-1')
      );

      await waitFor(() => expect(result.current.profile).not.toBeNull());

      act(() => {
        result.current.updateCounters(15); // only followers
      });

      expect(result.current.profile?.followersCount).toBe(15);
      expect(result.current.profile?.followingCount).toBe(20); // unchanged
    });
  });
});