import { get, post, put, postWithFormData } from '../utils/apiClient';
import {
  User,
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileData
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
  getMe: async(): Promise<ApiResponse<User>> => {
    return get<User>('/auth/me');
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

  // Logout user
  logout: async (): Promise<ApiResponse<{ success: boolean }>> => {
    return post<{ success: boolean }>('/auth/logout');
  }
};
