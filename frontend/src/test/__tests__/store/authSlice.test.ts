import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  register,
  logout,
  checkSession,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
  refreshUser,
  clearError,
  setUser,
  resetSessionCheck,
  setLoggingOut,
  resetAuthState
} from '../../../store/authSlice';
import { authApi } from '../../../services/authApi';
import * as socket from '../../../services/socket';
import { User, LoginCredentials, RegisterCredentials, UpdateProfileData } from '../../../types';

// Mock services
vi.mock('../../../services/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    updateAvatar: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock('../../../services/socket', () => ({
  connectSocket: vi.fn(),
  setAutoConnect: vi.fn(),
  forceDisconnect: vi.fn(),
  setLoggedOut: vi.fn(),
}));

interface RootState {
  auth: ReturnType<typeof authReducer>;
}

describe('authSlice', () => {
  const mockUser: User = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
  };

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.hasCheckedSession).toBe(false);
      expect(state.isLoggingOut).toBe(false);
      expect(state.isLoggedOut).toBe(false);
    });
  });

  describe('sync actions', () => {
    it('should clear error', () => {
      store.dispatch({ type: 'auth/login/rejected', payload: 'Error message' });
      expect(store.getState().auth.error).toBe('Error message');
      
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it('should set user', () => {
      store.dispatch(setUser(mockUser));
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should reset session check', () => {
      store.dispatch(resetSessionCheck());
      expect(store.getState().auth.hasCheckedSession).toBe(false);
    });

    it('should set logging out', () => {
      store.dispatch(setLoggingOut(true));
      expect(store.getState().auth.isLoggingOut).toBe(true);
      
      store.dispatch(setLoggingOut(false));
      expect(store.getState().auth.isLoggingOut).toBe(false);
    });

    it('should reset auth state', () => {
      store.dispatch(setUser(mockUser));
      store.dispatch(setLoggingOut(true));
      store.dispatch(resetAuthState());
      
      const state = store.getState().auth;
      expect(state.isLoggingOut).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isLoggedOut).toBe(false);
      expect(state.hasCheckedSession).toBe(false);
    });
  });

  describe('login', () => {
    const loginCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should handle successful login', async () => {
      const mockResponse = { success: true, data: mockUser };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse);

      const result = await store.dispatch(login(loginCredentials));
      
      const state = store.getState().auth;
      expect(result.payload).toEqual(mockUser);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(socket.setLoggedOut).toHaveBeenCalledWith(false);
      expect(socket.setAutoConnect).toHaveBeenCalledWith(true);
      expect(socket.connectSocket).toHaveBeenCalledWith(mockUser._id);
    });

    it('should handle failed login', async () => {
      const mockResponse = { success: false, error: 'Invalid credentials' };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse);

      const result = await store.dispatch(login(loginCredentials));
      
      const state = store.getState().auth;
      expect(result.payload).toBe('Invalid credentials');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    const registerCredentials: RegisterCredentials = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    };

    it('should handle successful registration', async () => {
      const mockResponse = { success: true, data: mockUser };
      vi.mocked(authApi.register).mockResolvedValue(mockResponse);

      const result = await store.dispatch(register(registerCredentials));
      
      const state = store.getState().auth;
      expect(result.payload).toEqual(mockUser);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle failed registration', async () => {
      const mockResponse = { success: false, error: 'Email already exists' };
      vi.mocked(authApi.register).mockResolvedValue(mockResponse);

      const result = await store.dispatch(register(registerCredentials));
      
      const state = store.getState().auth;
      expect(result.payload).toBe('Email already exists');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should handle successful logout', async () => {
      const mockResponse = { success: true, data: { success: true } };
      vi.mocked(authApi.logout).mockResolvedValue(mockResponse);

      await store.dispatch(logout());
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.hasCheckedSession).toBe(false);
      expect(state.isLoggingOut).toBe(false);
      expect(state.isLoggedOut).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(socket.forceDisconnect).toHaveBeenCalled();
      expect(socket.setLoggedOut).toHaveBeenCalledWith(true);
      expect(socket.setAutoConnect).toHaveBeenCalledWith(false);
    });
  });

  describe('checkSession', () => {
    it('should handle successful session check', async () => {
      const mockResponse = { success: true, data: mockUser };
      vi.mocked(authApi.getMe).mockResolvedValue(mockResponse);

      await store.dispatch(checkSession());
      
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.hasCheckedSession).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle failed session check', async () => {
      const mockResponse = { success: false, error: 'Not authenticated' };
      vi.mocked(authApi.getMe).mockResolvedValue(mockResponse);

      await store.dispatch(checkSession());
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.hasCheckedSession).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateProfile', () => {
    const updateData: UpdateProfileData = {
      username: 'updateduser',
      bio: 'New bio',
    };

    it('should handle successful profile update', async () => {
      const updatedUser = { ...mockUser, username: 'updateduser' };
      const mockResponse = { success: true, data: updatedUser };
      vi.mocked(authApi.updateProfile).mockResolvedValue(mockResponse);

      const result = await store.dispatch(updateProfile(updateData));
      
      const state = store.getState().auth;
      expect(result.payload).toEqual(updatedUser);
      expect(state.user).toEqual(updatedUser);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateAvatar', () => {
    it('should handle successful avatar update', async () => {
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const updatedUser = { ...mockUser, avatar: 'new-avatar.jpg' };
      const mockResponse = { success: true, data: updatedUser };
      vi.mocked(authApi.updateAvatar).mockResolvedValue(mockResponse);

      const result = await store.dispatch(updateAvatar(file));
      
      const state = store.getState().auth;
      expect(result.payload).toEqual(updatedUser);
      expect(state.user).toEqual(updatedUser);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'old123',
      newPassword: 'new123',
    };

    it('should handle successful password change', async () => {
      const mockResponse = { success: true, data: { success: true, message: 'Password updated' } };
      vi.mocked(authApi.changePassword).mockResolvedValue(mockResponse);

      const result = await store.dispatch(changePassword(passwordData));
      
      const state = store.getState().auth;
      expect(result.payload).toEqual(mockResponse);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    it('should handle successful account deletion', async () => {
      const mockResponse = { success: true, data: { success: true, message: 'Account deleted' } };
      vi.mocked(authApi.deleteAccount).mockResolvedValue(mockResponse);
      vi.mocked(authApi.logout).mockResolvedValue({ success: true, data: { success: true } });

      await store.dispatch(deleteAccount());
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.hasCheckedSession).toBe(false);
      expect(state.isLoggingOut).toBe(false);
    });
  });

  describe('refreshUser', () => {
    it('should handle successful user refresh', async () => {
      const mockResponse = { success: true, data: mockUser };
      vi.mocked(authApi.getMe).mockResolvedValue(mockResponse);

      const result = await store.dispatch(refreshUser());
      
      const state = store.getState().auth;
      expect(result.payload).toEqual(mockUser);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });
});