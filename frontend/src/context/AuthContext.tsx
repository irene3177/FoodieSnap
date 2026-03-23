import React, { createContext, useState, useEffect, useRef } from 'react';
import { 
  User,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileData,
  AuthContextType,
  AuthResult
} from '../types';
import { authApi } from '../services/authApi';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    if (hasCheckedSession.current) return;
    setIsLoading(true);
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      hasCheckedSession.current = true;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.login(credentials);

      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        const errorMsg = response.error || 'Login failed';
        setError(errorMsg);
        // throw new Error(response.error);
        return { success: false, error: errorMsg };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.register(credentials);

      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        const errorMsg = response.error || 'Registration failed';
        setError(errorMsg);
        // throw new Error(response.error);
        return { success: false, error: errorMsg };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.updateProfile(data);

      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        const errorMsg = response.error || 'Profile update failed';
        setError(errorMsg);
        // throw new Error(response.error);
        return { success: false, error: errorMsg };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      setUser(null);
      hasCheckedSession.current = false;
    } finally {
      setIsLoading(false);
      window.location.href = '/';
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      clearError,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};
