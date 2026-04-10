import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import usersReducer, {
  fetchUsers,
  searchUsers,
  clearUsers,
  clearError,
  setPage,
} from '../../../store/usersSlice';
import { usersApi } from '../../../services/usersApi';
import { UserListItem, GetUsersParams } from '../../../types';

// Mock usersApi
vi.mock('../../../services/usersApi', () => ({
  usersApi: {
    getUsers: vi.fn(),
    searchUsers: vi.fn(),
  },
}));

interface RootState {
  users: ReturnType<typeof usersReducer>;
}

describe('usersSlice', () => {
  const mockUser: UserListItem = {
    _id: 'user123',
    username: 'testuser',
    avatar: 'avatar.jpg',
    bio: 'Test bio',
    recipeCount: 5,
    followersCount: 10,
    isFollowing: false,
  };

  const mockUsersResponse = {
    users: [mockUser],
    total: 1,
    page: 1,
    pages: 1,
  };

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { users: usersReducer },
    });
  });

  it('should return initial state', () => {
    const state = store.getState().users;
    expect(state.users).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.page).toBe(1);
    expect(state.pages).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.searchQuery).toBe('');
  });

  it('should clear users', () => {
    // First add some data
    store.dispatch({ type: fetchUsers.fulfilled.type, payload: mockUsersResponse });
    expect(store.getState().users.users).not.toEqual([]);
    
    // Then clear
    store.dispatch(clearUsers());
    const state = store.getState().users;
    expect(state.users).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.page).toBe(1);
    expect(state.pages).toBe(1);
    expect(state.searchQuery).toBe('');
  });

  it('should clear error', () => {
    // First set an error
    store.dispatch({ type: fetchUsers.rejected.type, payload: 'Some error' });
    expect(store.getState().users.error).toBe('Some error');
    
    // Then clear
    store.dispatch(clearError());
    expect(store.getState().users.error).toBeNull();
  });

  it('should set page', () => {
    store.dispatch(setPage(2));
    expect(store.getState().users.page).toBe(2);
  });

  describe('fetchUsers', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      search: 'test',
    };

    it('should handle fetch users fulfilled', async () => {
      const mockResponse = { success: true, data: mockUsersResponse };
      vi.mocked(usersApi.getUsers).mockResolvedValue(mockResponse);

      await store.dispatch(fetchUsers(params));
      
      const state = store.getState().users;
      expect(state.loading).toBe(false);
      expect(state.users).toEqual([mockUser]);
      expect(state.total).toBe(1);
      expect(state.page).toBe(1);
      expect(state.pages).toBe(1);
      expect(state.searchQuery).toBe('');
    });

    it('should handle fetch users rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to fetch' };
      vi.mocked(usersApi.getUsers).mockResolvedValue(mockResponse);

      await store.dispatch(fetchUsers(params));
      
      const state = store.getState().users;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
    });
  });

  describe('searchUsers', () => {
    const searchQuery = 'testuser';

    it('should handle search users fulfilled', async () => {
      const mockResponse = { success: true, data: mockUsersResponse };
      vi.mocked(usersApi.searchUsers).mockResolvedValue(mockResponse);

      await store.dispatch(searchUsers(searchQuery));
      
      const state = store.getState().users;
      expect(state.loading).toBe(false);
      expect(state.users).toEqual([mockUser]);
      expect(state.total).toBe(1);
      expect(state.page).toBe(1);
      expect(state.pages).toBe(1);
      expect(state.searchQuery).toBe(searchQuery);
    });

    it('should handle search users rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to search' };
      vi.mocked(usersApi.searchUsers).mockResolvedValue(mockResponse);

      await store.dispatch(searchUsers(searchQuery));
      
      const state = store.getState().users;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to search');
    });
  });
});