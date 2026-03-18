import axios, { isAxiosError } from 'axios';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  UpdateProfileData
} from '../types';

const handleApiError = (error: unknown): AuthResponse => {
  if (isAxiosError(error)) {
    // Server-side error
    return {
      success: false,
      error: error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Request failed'
    };
  }

  if (error instanceof Error) {
    // JS error
    return {
      success: false,
      error: error.message
    };
  }

  // Unexpected error
  return {
    success: false,
    error: 'An unexpected error occurred'
  };
};

// Create axios instance for auth
const authApiClient = axios.create({
  baseURL: 'http://localhost:5001/api/auth', // backend URL
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Include cookies for session management
  timeout: 10000
});

export const authApi = {
  // Register a new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await authApiClient.post('/register', credentials);

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authApiClient.post('/login', credentials);

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get current user profile
  getMe: async(): Promise<AuthResponse> => {
    try {
      const response = await authApiClient.get('/me');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<AuthResponse> => {
    try {
      const response = await authApiClient.put('/profile', data);

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await authApiClient.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

