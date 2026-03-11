import axios, { isAxiosError } from 'axios';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  UpdateProfileData
} from '../types/auth.types';

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

      if (response.data.success && response.data.data?.user) {
        // Store user data in localStorage for session persistence
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authApiClient.post('/login', credentials);

      if (response.data.success && response.data.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get current user profile
  getProfile: async(): Promise<AuthResponse> => {
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

      if (response.data.success && response.data.data?.user) {
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await authApiClient.post('/logout');
    } finally {
      localStorage.removeItem('user');
    }
  },

  // Get user by ID (for profile viewing)
  getUserById: async (userId: string): Promise<{ success: boolean; data?: User; error?: string }> => {
    try {
      const response = await authApiClient.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      return {
        success: false,
        error: 'Failed to fetch user'
      };
    }
  },

  // Get current user data from localStorage (for session persistence)
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        
        // Convert _id to string if it's an object (for compatibility with backend)
        return {
          ...user,
          _id: user._id?.toString() || user._id
        };
      } catch {
        return null;
      }
    }
    return null;
  }
};

