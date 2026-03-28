import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/store';
import { 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectAuthError,
  selectHasCheckedSession,
  login,
  register,
  logout,
  updateProfile,
  refreshUser,
  clearError
} from '../store/authSlice';
import { LoginCredentials, RegisterCredentials, UpdateProfileData, AuthResult } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const hasCheckedSession = useSelector(selectHasCheckedSession);

  const handleLogin = async (credentials: LoginCredentials): Promise<AuthResult> => {
    const result = await dispatch(login(credentials));
    if (login.fulfilled.match(result)) {
      return { success: true };
    }
    return { success: false, error: result.payload as string };
  };

  const handleRegister = async (credentials: RegisterCredentials): Promise<AuthResult> => {
    const result = await dispatch(register(credentials));
    if (register.fulfilled.match(result)) {
      return { success: true };
    }
    return { success: false, error: result.payload as string };
  };

  const handleUpdateProfile = async (data: UpdateProfileData): Promise<AuthResult> => {
    const result = await dispatch(updateProfile(data));
    if (updateProfile.fulfilled.match(result)) {
      return { success: true };
    }
    return { success: false, error: result.payload as string };
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const handleRefreshUser = async () => {
    await dispatch(refreshUser());
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    hasCheckedSession,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshUser: handleRefreshUser,
    clearError: handleClearError,
  };
};