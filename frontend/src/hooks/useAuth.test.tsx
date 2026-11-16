import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import * as authSlice from '@/store/authSlice';

// ---------- Mocks ----------

const mockDispatch = vi.fn();
const mockUseSelector = vi.fn();

vi.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

vi.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('@/store/authSlice', async () => {
  const actual = await vi.importActual<typeof import('@/store/authSlice')>(
    '@/store/authSlice'
  );

  const makeThunk = (type: string) => {
    const thunk = vi.fn(() => ({ type })) as any;
    thunk.fulfilled = { match: (action: any) => action?.type === type };
    thunk.rejected = { match: (action: any) => action?.type !== type };
    return thunk;
  };

  return {
    ...actual,
    login: makeThunk('auth/login/fulfilled'),
    register: makeThunk('auth/register/fulfilled'),
    updateProfile: makeThunk('auth/updateProfile/fulfilled'),
    logout: makeThunk('auth/logout'),
    refreshUser: makeThunk('auth/refreshUser'),
    clearError: vi.fn(() => ({ type: 'auth/clearError' })),

    // Selectors return whatever the test sets via mockUseSelector
    selectUser: vi.fn(),
    selectIsAuthenticated: vi.fn(),
    selectAuthLoading: vi.fn(),
    selectAuthError: vi.fn(),
    selectHasCheckedSession: vi.fn(),
  };
});

// ---------- Helpers ----------

const setupSelectors = (state: {
  user?: any;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  error?: string | null;
  hasCheckedSession?: boolean;
}) => {
  mockUseSelector.mockImplementation((selector: any) => {
    if (selector === authSlice.selectUser) return state.user ?? null;
    if (selector === authSlice.selectIsAuthenticated) return state.isAuthenticated ?? false;
    if (selector === authSlice.selectAuthLoading) return state.isLoading ?? false;
    if (selector === authSlice.selectAuthError) return state.error ?? null;
    if (selector === authSlice.selectHasCheckedSession) return state.hasCheckedSession ?? false;
    return undefined;
  });
};

// ---------- Tests ----------

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSelectors({});
  });

  // ---- Selectors ----

  describe('selectors', () => {
    it('returns user from store', () => {
      const user = { _id: 'u1', username: 'alice' };
      setupSelectors({ user });

      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toEqual(user);
    });

    it('returns isAuthenticated', () => {
      setupSelectors({ isAuthenticated: true });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns isLoading', () => {
      setupSelectors({ isLoading: true });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(true);
    });

    it('returns error', () => {
      setupSelectors({ error: 'Something failed' });

      const { result } = renderHook(() => useAuth());
      expect(result.current.error).toBe('Something failed');
    });

    it('returns hasCheckedSession', () => {
      setupSelectors({ hasCheckedSession: true });

      const { result } = renderHook(() => useAuth());
      expect(result.current.hasCheckedSession).toBe(true);
    });
  });

  // ---- login ----

  describe('login', () => {
    it('dispatches login and returns success=true on fulfilled', async () => {
      mockDispatch.mockResolvedValue({ type: 'auth/login/fulfilled' });

      const { result } = renderHook(() => useAuth());

      let authResult;
      await act(async () => {
        authResult = await result.current.login({
          email: 'a@b.com',
          password: 'pass',
        });
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(authResult).toEqual({ success: true });
    });

    it('returns success=false and error on rejected', async () => {
      mockDispatch.mockResolvedValue({
        type: 'auth/login/rejected',
        payload: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.login({
          email: 'a@b.com',
          password: 'wrong',
        });
      });

      expect(authResult).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
    });
  });

  // ---- register ----

  describe('register', () => {
    it('dispatches register and returns success=true on fulfilled', async () => {
      mockDispatch.mockResolvedValue({ type: 'auth/register/fulfilled' });

      const { result } = renderHook(() => useAuth());

      let authResult;
      await act(async () => {
        authResult = await result.current.register({
          username: 'alice',
          email: 'a@b.com',
          password: 'pass',
        });
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(authResult).toEqual({ success: true });
    });

    it('returns success=false and error on rejected', async () => {
      mockDispatch.mockResolvedValue({
        type: 'auth/register/rejected',
        payload: 'Email already taken',
      });

      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.register({
          username: 'alice',
          email: 'a@b.com',
          password: 'pass',
        });
      });

      expect(authResult).toEqual({
        success: false,
        error: 'Email already taken',
      });
    });
  });

  // ---- updateProfile ----

  describe('updateProfile', () => {
    it('dispatches updateProfile and returns success=true on fulfilled', async () => {
      mockDispatch.mockResolvedValue({ type: 'auth/updateProfile/fulfilled' });

      const { result } = renderHook(() => useAuth());

      let authResult;
      await act(async () => {
        authResult = await result.current.updateProfile({
          username: 'new-name',
        });
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(authResult).toEqual({ success: true });
    });

    it('returns success=false and error on rejected', async () => {
      mockDispatch.mockResolvedValue({
        type: 'auth/updateProfile/rejected',
        payload: 'Username taken',
      });

      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.updateProfile({
          username: 'taken',
        });
      });

      expect(authResult).toEqual({
        success: false,
        error: 'Username taken',
      });
    });
  });

  // ---- logout ----

  describe('logout', () => {
    it('dispatches logout', async () => {
      mockDispatch.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  // ---- refreshUser ----

  describe('refreshUser', () => {
    it('dispatches refreshUser', async () => {
      mockDispatch.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  // ---- clearError ----

  describe('clearError', () => {
    it('dispatches clearError', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});