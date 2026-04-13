export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdRecipes?: string[];
  favorites?: string[];
  followers?: string[];
  following?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface updateAvatarData {
  avavatar: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  bio?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasCheckedSession: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (credentials: RegisterCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  error: string | null;
}