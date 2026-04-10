import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi } from '../../../services/authApi';
import * as apiClient from '../../../utils/apiClient';
import { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  UpdateProfileData, 
  ChangePasswordData,
  UserProfile 
} from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  postWithFormData: vi.fn(),
}));

describe('authApi', () => {
  const mockUser: User = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
  };

  const mockUserProfile: UserProfile = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
    recipeCount: 5,
    followersCount: 10,
    followingCount: 5,
    isFollowing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerData: RegisterCredentials = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      const mockResponse = { success: true, data: mockUser };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration error', async () => {
      const registerData: RegisterCredentials = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      const mockError = { success: false, error: 'Email already exists' };
      vi.mocked(apiClient.post).mockResolvedValue(mockError);

      const result = await authApi.register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginData: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = { success: true, data: mockUser };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.login(loginData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login error', async () => {
      const loginData: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const mockError = { success: false, error: 'Invalid credentials' };
      vi.mocked(apiClient.post).mockResolvedValue(mockError);

      const result = await authApi.login(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('getMe', () => {
    it('should get current user profile', async () => {
      const mockResponse = { success: true, data: mockUserProfile };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authApi.getMe();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });

    it('should handle getMe error', async () => {
      const mockError = { success: false, error: 'Not authenticated' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await authApi.getMe();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData: UpdateProfileData = {
        username: 'updateduser',
        bio: 'New bio',
      };
      const updatedUser = { ...mockUser, username: 'updateduser', bio: 'New bio' };
      const mockResponse = { success: true, data: updatedUser };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await authApi.updateProfile(updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar', async () => {
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const updatedUser = { ...mockUser, avatar: 'new-avatar.jpg' };
      const mockResponse = { success: true, data: updatedUser };
      vi.mocked(apiClient.postWithFormData).mockResolvedValue(mockResponse);

      const result = await authApi.updateAvatar(file);

      expect(apiClient.postWithFormData).toHaveBeenCalledWith('/auth/avatar', expect.any(FormData));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const passwordData: ChangePasswordData = {
        currentPassword: 'old123',
        newPassword: 'new123',
      };
      const mockResponse = { success: true, data: { success: true, message: 'Password updated' } };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await authApi.changePassword(passwordData);

      expect(apiClient.put).toHaveBeenCalledWith('/auth/password', passwordData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle wrong current password', async () => {
      const passwordData: ChangePasswordData = {
        currentPassword: 'wrong',
        newPassword: 'new123',
      };
      const mockError = { success: false, error: 'Current password is incorrect' };
      vi.mocked(apiClient.put).mockResolvedValue(mockError);

      const result = await authApi.changePassword(passwordData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      const mockResponse = { success: true, data: { success: true, message: 'Account deleted' } };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await authApi.deleteAccount();

      expect(apiClient.del).toHaveBeenCalledWith('/auth/user');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const mockResponse = { success: true, data: { success: true } };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual(mockResponse);
    });
  });
});