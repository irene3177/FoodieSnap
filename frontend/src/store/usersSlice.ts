import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../services/usersApi';
import { UserListItem, GetUsersParams } from '../types';
import { RootState } from './store';

export interface UsersState {
  users: UserListItem[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: UsersState = {
  users: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  searchQuery: ''
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params: GetUsersParams, { rejectWithValue }) => {
    const response = await usersApi.getUsers(params);
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to fetch users');
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query: string, { rejectWithValue }) => {
    const response = await usersApi.getUsers({ search: query, page: 1, limit: 20 });
    if (response.success && response.data) {
      return { ...response.data, searchQuery: query };
    }
    return rejectWithValue(response.error || 'Failed to search users');
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.users = [];
      state.total = 0;
      state.page = 1;
      state.pages = 1;
      state.searchQuery = '';
    },
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // searchUsers
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.searchQuery = action.payload.searchQuery;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Selectors
export const selectUsers = (state: RootState) => state.users.users;
export const selectUsersLoading = (state: RootState) => state.users.loading;
export const selectUsersError = (state: RootState) => state.users.error;
export const selectUsersTotal = (state: RootState) => state.users.total;
export const selectUsersPage = (state: RootState) => state.users.page;
export const selectUsersPages = (state: RootState) => state.users.pages;
export const selectSearchQuery = (state: RootState) => state.users.searchQuery;

export const { clearUsers, clearError, setPage } = usersSlice.actions;
export default usersSlice.reducer;