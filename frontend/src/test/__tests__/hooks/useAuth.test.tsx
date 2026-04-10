import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../../../hooks/useAuth';
import authReducer from '../../../store/authSlice';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: { auth: authReducer }
  });
};

describe('useAuth', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasCheckedSession).toBe(false);
  });

  it('should have all required functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.refreshUser).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // First, set an error in the store
    store.dispatch({ type: 'auth/login/rejected', payload: 'Test error' });
    
    expect(store.getState().auth.error).toBe('Test error');
    
    // Call clearError
    act(() => {
      result.current.clearError();
    });
    
    expect(store.getState().auth.error).toBeNull();
  });

  it('should update user after successful login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = {
      _id: '123',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'avatar.jpg',
      bio: 'Test bio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simulate successful login
    act(() => {
      store.dispatch({ type: 'auth/login/fulfilled', payload: mockUser });
    });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should update user after successful registration', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = {
      _id: '123',
      username: 'newuser',
      email: 'new@test.com',
      avatar: 'avatar.jpg',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    act(() => {
      store.dispatch({ type: 'auth/register/fulfilled', payload: mockUser });
    });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should update user after profile update', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const initialUser = {
      _id: '123',
      username: 'oldname',
      email: 'test@test.com',
      avatar: 'old.jpg',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedUser = {
      ...initialUser,
      username: 'newname',
      bio: 'New bio'
    };
    
    act(() => {
      store.dispatch({ type: 'auth/login/fulfilled', payload: initialUser });
    });
    
    act(() => {
      store.dispatch({ type: 'auth/updateProfile/fulfilled', payload: updatedUser });
    });
    
    await waitFor(() => {
      expect(result.current.user?.username).toBe('newname');
      expect(result.current.user?.bio).toBe('New bio');
    });
  });

  it('should clear user after logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = {
      _id: '123',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'avatar.jpg',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    act(() => {
      store.dispatch({ type: 'auth/login/fulfilled', payload: mockUser });
    });
    
    expect(result.current.user).toEqual(mockUser);
    
    act(() => {
      store.dispatch({ type: 'auth/logout/fulfilled' });
    });
    
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});