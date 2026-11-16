import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  useFollow,
  useFollowersList,
  useFollowingList,
} from './useFollow';
import { followApi } from '@/services/followApi';
import toastReducer from '@/store/toastSlice';

// ---------- Mocks ----------

vi.mock('@/services/followApi');

// ---------- Helpers ----------

const makeUser = (id: string, username: string) => ({
  _id: id,
  username,
  avatar: '',
  bio: '',
  isFollowing: false,
});

const createTestStore = () =>
  configureStore({
    reducer: { toast: toastReducer },
  });

const renderWithStore = <T,>(callback: () => T) => {
  const store = createTestStore();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const result = renderHook(callback, { wrapper });
  return { ...result, store };
};

// ---------- Tests ----------

describe('useFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (followApi.follow as any).mockResolvedValue({
      success: true,
      data: { followersCount: 5 },
    });
    (followApi.unfollow as any).mockResolvedValue({
      success: true,
      data: { followersCount: 4 },
    });
  });

  // ---- Initial state ----

  describe('initial state', () => {
    it('uses initialIsFollowing', () => {
      const { result } = renderWithStore(() => useFollow('user-2', true));
      expect(result.current.isFollowing).toBe(true);
    });

    it('defaults to false', () => {
      const { result } = renderWithStore(() => useFollow('user-2'));
      expect(result.current.isFollowing).toBe(false);
    });

    it('syncs with initialIsFollowing when prop changes', () => {
      const { result, rerender } = renderHook(
        ({ initial }) => useFollow('user-2', initial),
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Provider store={createTestStore()}>{children}</Provider>
          ),
          initialProps: { initial: false },
        }
      );

      expect(result.current.isFollowing).toBe(false);

      rerender({ initial: true });

      expect(result.current.isFollowing).toBe(true);
    });
  });

  // ---- follow ----

  describe('follow', () => {
    it('sets isFollowing=true, calls API, shows toast, calls callback', async () => {
      const onFollowChange = vi.fn();

      const { result, store } = renderWithStore(() =>
        useFollow('user-2', false, { onFollowChange })
      );

      await act(async () => {
        await result.current.follow();
      });

      expect(followApi.follow).toHaveBeenCalledWith('user-2');
      expect(result.current.isFollowing).toBe(true);
      expect(onFollowChange).toHaveBeenCalledWith(true, 5);

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Successfully followed!');
      expect(state.toast.type).toBe('success');
    });

    it('handles "Already following" by setting isFollowing=true', async () => {
      (followApi.follow as any).mockResolvedValue({
        success: false,
        error: 'Already following this user',
      });

      const { result } = renderWithStore(() => useFollow('user-2', false));

      await act(async () => {
        await result.current.follow();
      });

      expect(result.current.isFollowing).toBe(true);
    });

    it('shows error toast when API throws', async () => {
      (followApi.follow as any).mockRejectedValue(new Error('Network error'));

      const { result, store } = renderWithStore(() =>
        useFollow('user-2', false)
      );

      await act(async () => {
        await result.current.follow();
      });

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Failed to follow user');
      expect(state.toast.type).toBe('error');
    });

    it('does not run when isLoading is true', async () => {
      // First call sets isLoading=true
      let resolveFollow: any;
      (followApi.follow as any).mockImplementation(
        () => new Promise((resolve) => { resolveFollow = resolve; })
      );

      const { result } = renderWithStore(() => useFollow('user-2', false));

      // Start first follow (does not await)
      act(() => {
        result.current.follow();
      });

      // Second call should be blocked by isLoading
      await act(async () => {
        await result.current.follow();
      });

      expect(followApi.follow).toHaveBeenCalledTimes(1);

      // Clean up
      await act(async () => {
        resolveFollow?.({ success: true, data: { followersCount: 1 } });
      });
    });
  });

  // ---- unfollow ----

  describe('unfollow', () => {
    it('sets isFollowing=false, calls API, shows toast, calls callback', async () => {
      const onFollowChange = vi.fn();

      const { result, store } = renderWithStore(() =>
        useFollow('user-2', true, { onFollowChange })
      );

      await act(async () => {
        await result.current.unfollow();
      });

      expect(followApi.unfollow).toHaveBeenCalledWith('user-2');
      expect(result.current.isFollowing).toBe(false);
      expect(onFollowChange).toHaveBeenCalledWith(false, 4);

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Unfollowed successfully');
    });

    it('shows error toast when API throws', async () => {
      (followApi.unfollow as any).mockRejectedValue(new Error('Network error'));

      const { result, store } = renderWithStore(() =>
        useFollow('user-2', true)
      );

      await act(async () => {
        await result.current.unfollow();
      });

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Failed to unfollow user');
    });

    it('does not run without targetUserId', async () => {
      const { result } = renderWithStore(() => useFollow('', true));

      await act(async () => {
        await result.current.unfollow();
      });

      expect(followApi.unfollow).not.toHaveBeenCalled();
    });
  });

  // ---- toggleFollow ----

  describe('toggleFollow', () => {
    it('calls follow when isFollowing=false', async () => {
      const { result } = renderWithStore(() => useFollow('user-2', false));

      await act(async () => {
        result.current.toggleFollow();
      });

      expect(followApi.follow).toHaveBeenCalledWith('user-2');
    });

    it('calls unfollow when isFollowing=true', async () => {
      const { result } = renderWithStore(() => useFollow('user-2', true));

      await act(async () => {
        result.current.toggleFollow();
      });

      expect(followApi.unfollow).toHaveBeenCalledWith('user-2');
    });
  });
});

// ---------- useFollowersList ----------

describe('useFollowersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (followApi.getFollowers as any).mockResolvedValue({
      success: true,
      data: [makeUser('u1', 'alice'), makeUser('u2', 'bob')],
    });
  });

  it('loads followers on mount', async () => {
    const { result } = renderWithStore(() => useFollowersList('user-2'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(followApi.getFollowers).toHaveBeenCalledWith('user-2');
    expect(result.current.followers).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  it('does not load when userId is empty', () => {
    const { result } = renderWithStore(() => useFollowersList(''));

    expect(followApi.getFollowers).not.toHaveBeenCalled();
    expect(result.current.followers).toEqual([]);
  });

  it('handles API error gracefully', async () => {
    (followApi.getFollowers as any).mockRejectedValue(new Error('Network'));

    const { result } = renderWithStore(() => useFollowersList('user-2'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.followers).toEqual([]);
  });

  it('refetch reloads followers', async () => {
    const { result } = renderWithStore(() => useFollowersList('user-2'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(followApi.getFollowers).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(followApi.getFollowers).toHaveBeenCalledTimes(2);
  });
});

// ---------- useFollowingList ----------

describe('useFollowingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (followApi.getFollowing as any).mockResolvedValue({
      success: true,
      data: [makeUser('u3', 'carol')],
    });
  });

  it('loads following list on mount', async () => {
    const { result } = renderWithStore(() => useFollowingList('user-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(followApi.getFollowing).toHaveBeenCalledWith('user-1');
    expect(result.current.following).toHaveLength(1);
    expect(result.current.total).toBe(1);
  });

  it('does not load when userId is empty', () => {

    expect(followApi.getFollowing).not.toHaveBeenCalled();
  });

  it('refetch reloads following list', async () => {
    const { result } = renderWithStore(() => useFollowingList('user-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(followApi.getFollowing).toHaveBeenCalledTimes(2);
  });
});