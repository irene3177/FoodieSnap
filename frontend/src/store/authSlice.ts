// store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../services/authApi';
import { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  UpdateProfileData 
} from '../types';
import { 
  connectSocket, 
  setAutoConnect, 
  forceDisconnect, 
  setLoggedOut 
} from '../services/socket';
import { RootState } from './store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasCheckedSession: boolean;
  isLoggingOut: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  hasCheckedSession: false,
  isLoggingOut: false
};

// Check session on app load
export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { getState }) => {
    const state = getState() as RootState;

    if (state.auth.isLoggingOut) {
      console.log('🔍 checkSession: skipping because logging out');
      return null;
    }

    if (!state.auth.isAuthenticated && state.auth.hasCheckedSession) {
      console.log('🔍 checkSession: user is not authenticated, skipping');
      return null;
    }
    
    console.log('🔍 checkSession started');
    if (state.auth.hasCheckedSession) {
      console.log('🔍 checkSession: already checked, skipping');
      return null;
    }

    const hasLogoutParam = window.location.search.includes('logout');
    if (hasLogoutParam) {
      console.log('🔍 checkSession: logout param detected');
      return null;
    }

    console.log('🔍 checkSession: calling authApi.getMe()');
    const response = await authApi.getMe();
    console.log('🔍 checkSession: response', response);
    
    if (response.success && response.data) {
      console.log('✅ checkSession: user authenticated', response.data.username);
      setAutoConnect(true);
      return response.data;
    }
    
    console.log('❌ checkSession: user not authenticated');
    return null;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    const response = await authApi.login(credentials);
    
    if (response.success && response.data) {
      setLoggedOut(false);
      setAutoConnect(true);
      connectSocket(response.data._id);
      return response.data;
    }
    
    return rejectWithValue(response.error || 'Login failed');
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    const response = await authApi.register(credentials);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return rejectWithValue(response.error || 'Registration failed');
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: UpdateProfileData, { rejectWithValue }) => {
    const response = await authApi.updateProfile(data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return rejectWithValue(response.error || 'Profile update failed');
  }
);

export const updateAvatar = createAsyncThunk(
  'auth/updateAvatar',
  async (file: File, { rejectWithValue }) => {
    const response = await authApi.updateAvatar(file);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return rejectWithValue(response.error || 'Avatar update failed');
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    dispatch(setLoggingOut(true));

    forceDisconnect();
    setLoggedOut(true);
    setAutoConnect(false);
    
    const response = await authApi.logout();
    
    if (!response.success) {
      console.error('Logout error:', response.error);
    }
    return null;
  }
);

export const refreshUser = createAsyncThunk(
  'auth/refreshUser',
  async (_, { rejectWithValue }) => {
    const response = await authApi.getMe();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return rejectWithValue(response.error || 'Failed to refresh user');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    resetSessionCheck: (state) => {
      state.hasCheckedSession = false;
    },
    setLoggingOut: (state, action: PayloadAction<boolean>) => {
      state.isLoggingOut = action.payload;
    },
    resetLoggingOut: (state) => {
      state.isLoggingOut = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check session
      .addCase(checkSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasCheckedSession = true;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          console.log('✅ checkSession.fulfilled: user set', action.payload.username);
        } else {
          state.user = null;
          state.isAuthenticated = false;
          console.log('❌ checkSession.fulfilled: user not set');
        }
      })
      .addCase(checkSession.rejected, (state) => {
        state.isLoading = false;
        state.hasCheckedSession = true;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Avatar
      .addCase(updateAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refresh User
      .addCase(refreshUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(refreshUser.rejected, (state) => {
        state.isLoading = false;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        // state.hasCheckedSession = false;
        state.isLoggingOut = false;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectHasCheckedSession = (state: RootState) => state.auth.hasCheckedSession;
export const selectIsLoggingOut = (state: RootState) => state.auth.isLoggingOut;

export const { clearError, setUser, resetSessionCheck, setLoggingOut } = authSlice.actions;
export default authSlice.reducer;