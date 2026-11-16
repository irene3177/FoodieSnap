import { describe, it, expect } from 'vitest';
import authReducer, {
  clearError,
  setUser,
  resetAuthState,
  resetSessionCheck,
  setLoggingOut,
  checkSession,
  login,
  register,
  updateProfile,
  updateAvatar,
  changePassword,
  refreshUser,
  logout,
  deleteAccount,
} from './authSlice';
import type { User } from '@/types';

// ---------- Test data ----------

const mockUser: User = {
  _id: 'user-1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
  bio: 'Hello',
};

const makeState = (overrides: Partial<ReturnType<typeof authReducer>> = {}) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  hasCheckedSession: false,
  isLoggingOut: false,
  isLoggedOut: false,
  ...overrides,
});

// ---------- Tests ----------

describe('authSlice', () => {
  // ---- Reducers ----

  describe('sync reducers', () => {
    it('clearError resets error to null', () => {
      const state = makeState({ error: 'Some error' });
      const next = authReducer(state, clearError());

      expect(next.error).toBeNull();
    });

    it('setUser sets user and isAuthenticated=true', () => {
      const state = makeState();
      const next = authReducer(state, setUser(mockUser));

      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });

    it('resetAuthState resets all transient flags', () => {
      const state = makeState({
        isLoggingOut: true,
        isLoading: true,
        isLoggedOut: true,
        hasCheckedSession: true,
        user: mockUser,
        isAuthenticated: true,
      });

      const next = authReducer(state, resetAuthState());

      expect(next.isLoggingOut).toBe(false);
      expect(next.isLoading).toBe(false);
      expect(next.isLoggedOut).toBe(false);
      expect(next.hasCheckedSession).toBe(false);

      // Should NOT touch user / isAuthenticated
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });

    it('resetSessionCheck resets only hasCheckedSession', () => {
      const state = makeState({ hasCheckedSession: true, isLoading: true });
      const next = authReducer(state, resetSessionCheck());

      expect(next.hasCheckedSession).toBe(false);
      expect(next.isLoading).toBe(true); // untouched
    });

    it('setLoggingOut updates isLoggingOut', () => {
      const state = makeState();
      const next = authReducer(state, setLoggingOut(true));

      expect(next.isLoggingOut).toBe(true);
    });
  });

  // ---- checkSession ----

  describe('checkSession extra reducers', () => {
    it('pending sets isLoading=true', () => {
      const state = makeState({ isLoggedOut: false });
      const next = authReducer(state, checkSession.pending('req-id'));

      expect(next.isLoading).toBe(true);
    });

    it('pending does not set isLoading when isLoggedOut=true', () => {
      const state = makeState({ isLoggedOut: true });
      const next = authReducer(state, checkSession.pending('req-id'));

      expect(next.isLoading).toBe(false);
    });

    it('fulfilled with payload sets user and isAuthenticated', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(
        state,
        checkSession.fulfilled(mockUser, 'req-id')
      );

      expect(next.isLoading).toBe(false);
      expect(next.hasCheckedSession).toBe(true);
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });

    it('fulfilled with null clears user and isAuthenticated', () => {
      const state = makeState({
        isLoading: true,
        user: mockUser,
        isAuthenticated: true,
      });

      const next = authReducer(
        state,
        checkSession.fulfilled(null, 'req-id')
      );

      expect(next.isLoading).toBe(false);
      expect(next.hasCheckedSession).toBe(true);
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
    });

    it('rejected clears user and isAuthenticated', () => {
      const state = makeState({
        isLoading: true,
        user: mockUser,
        isAuthenticated: true,
      });

      const next = authReducer(
        state,
        checkSession.rejected(null, 'req-id')
      );

      expect(next.isLoading).toBe(false);
      expect(next.hasCheckedSession).toBe(true);
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
    });
  });

  // ---- login ----

  describe('login extra reducers', () => {
    it('pending sets isLoading=true and clears error', () => {
      const state = makeState({ error: 'previous' });
      const next = authReducer(state, login.pending('req-id', {
        email: 'a@b.com',
        password: 'x',
      }));

      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled sets user and clears error', () => {
      const state = makeState({ isLoading: true, error: 'old' });
      const next = authReducer(state, login.fulfilled(mockUser, 'req-id', {
        email: 'a@b.com',
        password: 'x',
      }));

      expect(next.isLoading).toBe(false);
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
      expect(next.error).toBeNull();
    });

    it('rejected clears user and sets error', () => {
      const state = makeState({ isLoading: true, user: mockUser, isAuthenticated: true });

      const next = authReducer(
        state,
        login.rejected(null, 'req-id', { email: '', password: '' }, 'Invalid credentials')
      );

      expect(next.isLoading).toBe(false);
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
      expect(next.error).toBe('Invalid credentials');
    });
  });

  // ---- register ----

  describe('register extra reducers', () => {
    it('fulfilled sets user and isAuthenticated', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(state, register.fulfilled(mockUser, 'req-id', {
        username: 'alice',
        email: 'a@b.com',
        password: 'x',
      }));

      expect(next.isLoading).toBe(false);
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });

    it('rejected sets error', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(
        state,
        register.rejected(null, 'req-id', { username: 'a', email: 'a@b.com', password: 'x' }, 'Email taken')
      );

      expect(next.isLoading).toBe(false);
      expect(next.error).toBe('Email taken');
    });
  });

  // ---- updateProfile / updateAvatar ----

  describe('updateProfile extra reducers', () => {
    it('fulfilled replaces user', () => {
      const updated = { ...mockUser, username: 'alice-new' };
      const state = makeState({ isLoading: true });
      const next = authReducer(state, updateProfile.fulfilled(updated, 'req-id', { username: 'alice-new' }));

      expect(next.isLoading).toBe(false);
      expect(next.user).toEqual(updated);
    });

    it('rejected sets error', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(
        state,
        updateProfile.rejected(null, 'req-id', { username: 'x' }, 'Update failed')
      );

      expect(next.isLoading).toBe(false);
      expect(next.error).toBe('Update failed');
    });
  });

  describe('updateAvatar extra reducers', () => {
    it('fulfilled replaces user', () => {
      const updated = { ...mockUser, avatar: 'new.jpg' };
      const state = makeState({ isLoading: true });
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      const next = authReducer(state, updateAvatar.fulfilled(updated, 'req-id', file));

      expect(next.user).toEqual(updated);
    });
  });

  // ---- refreshUser ----

  describe('refreshUser extra reducers', () => {
    it('fulfilled with payload sets user', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(state, refreshUser.fulfilled(mockUser, 'req-id'));

      expect(next.isLoading).toBe(false);
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });

    it('rejected sets isLoading=false without touching user', () => {
      const state = makeState({ isLoading: true, user: mockUser, isAuthenticated: true });
      const next = authReducer(state, refreshUser.rejected(null, 'req-id'));

      expect(next.isLoading).toBe(false);
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });
  });

  // ---- changePassword ----

  describe('changePassword extra reducers', () => {
    it('fulfilled clears error and isLoading', () => {
      const state = makeState({ isLoading: true, error: 'old' });
      const next = authReducer(
        state,
        changePassword.fulfilled({ success: true, data: undefined }, 'req-id', {
          currentPassword: 'old',
          newPassword: 'new',
        })
      );

      expect(next.isLoading).toBe(false);
      expect(next.error).toBeNull();
    });

    it('rejected sets error', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(
        state,
        changePassword.rejected(null, 'req-id', { currentPassword: 'x', newPassword: 'y' }, 'Wrong current password')
      );

      expect(next.isLoading).toBe(false);
      expect(next.error).toBe('Wrong current password');
    });
  });

  // ---- logout ----

  describe('logout extra reducers', () => {
    it('fulfilled resets everything', () => {
      const state = makeState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        hasCheckedSession: true,
        isLoggingOut: true,
      });

      const next = authReducer(state, logout.fulfilled(null, 'req-id'));

      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
      expect(next.isLoading).toBe(false);
      expect(next.hasCheckedSession).toBe(false);
      expect(next.isLoggingOut).toBe(false);
      expect(next.isLoggedOut).toBe(true);
    });

    it('rejected still resets state and sets isLoggedOut=true', () => {
      const state = makeState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        isLoggingOut: true,
      });

      const next = authReducer(state, logout.rejected(null, 'req-id'));

      expect(next.isLoading).toBe(false);
      expect(next.isLoggingOut).toBe(false);
      expect(next.isLoggedOut).toBe(true);
      // Note: user/isAuthenticated are NOT cleared on rejected
    });
  });

  // ---- deleteAccount ----

  describe('deleteAccount extra reducers', () => {
    it('fulfilled clears user, isAuthenticated, hasCheckedSession', () => {
      const state = makeState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        hasCheckedSession: true,
        isLoggingOut: true,
      });

      const next = authReducer(
        state,
        deleteAccount.fulfilled({ success: true, data: undefined }, 'req-id')
      );

      expect(next.isLoading).toBe(false);
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
      expect(next.hasCheckedSession).toBe(false);
      expect(next.isLoggingOut).toBe(false);
    });

    it('rejected sets error', () => {
      const state = makeState({ isLoading: true });
      const next = authReducer(
        state,
        deleteAccount.rejected(null, 'req-id', undefined, 'Cannot delete')
      );

      expect(next.isLoading).toBe(false);
      expect(next.error).toBe('Cannot delete');
    });
  });
});