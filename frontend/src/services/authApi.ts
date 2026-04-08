import { get, post, put, postWithFormData, del } from '../utils/apiClient';
import {
  User,
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileData,
  ChangePasswordData,
  UserProfile
} from '../types';


export const authApi = {
  // Register a new user
  register: async (credentials: RegisterCredentials): Promise<ApiResponse<User>> => {
    return post<User>('/auth/register', credentials);
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    return post<User>('/auth/login', credentials);
  },

  // Get current user profile
  getMe: async(): Promise<ApiResponse<UserProfile>> => {
    return get<UserProfile>('/auth/me');
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<User>> => {
    return put<User>('/auth/profile', data);
  },

  // Update avatar
  updateAvatar: async (file: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return postWithFormData<User>('/auth/avatar', formData);
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return put<{ success: boolean; message: string }>('/auth/password', data);
  },

  // Delete user account
  deleteAccount: async (): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return del<{ success: boolean; message: string }>('/auth/user');
  },

  // Logout user
  logout: async (): Promise<ApiResponse<{ success: boolean }>> => {
    return post<{ success: boolean }>('/auth/logout');
  }
};
