import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '../../../pages/Profile/ProfilePage';
import { useAuth } from '../../../hooks/useAuth';
import { useFollow } from '../../../hooks/useFollow';
import { useProfileData } from '../../../hooks/useProfileData';
import { recipesApi } from '../../../services/recipesApi';
import toastReducer from '../../../store/toastSlice';
import authReducer from '../../../store/authSlice';
import { User, Recipe } from '../../../types';

// Mock hooks
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useFollow');
vi.mock('../../../hooks/useProfileData');
vi.mock('../../../services/recipesApi');
vi.mock('../../../services/authApi');

// Mock components
vi.mock('../../../components/RecipeCard/RecipeCard', () => ({
  default: ({ recipe }: { recipe: Recipe }) => (
    <div data-testid={`recipe-card-${recipe._id}`}>
      <h3>{recipe.title}</h3>
    </div>
  ),
}));

vi.mock('../../../components/Loader/Loader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="loader">{message}</div>,
}));

vi.mock('../../../components/EditProfileModal/EditProfileModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => (
    isOpen ? (
      <div data-testid="edit-profile-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../components/CreateRecipeModal/CreateRecipeModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => (
    isOpen ? (
      <div data-testid="create-recipe-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../components/FollowModal/FollowModal', () => ({
  default: ({ isOpen, onClose, type }: { isOpen: boolean; onClose: () => void; type: string }) => (
    isOpen ? (
      <div data-testid={`${type}-modal`}>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../components/MessageModal/MessageModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="message-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../components/ScrollToTop/ScrollToTop', () => ({
  ScrollToTop: () => null,
}));

interface RootState {
  toast: ReturnType<typeof toastReducer>;
  auth: ReturnType<typeof authReducer>;
}

describe('ProfilePage', () => {
  const mockUser: User = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@test.com',
    avatar: 'avatar.jpg',
  };

  const mockProfile = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@test.com',
    avatar: 'avatar.jpg',
    bio: 'Test bio',
    recipeCount: 5,
    followersCount: 10,
    followingCount: 5,
    isFollowing: false,
    createdRecipes: ['recipe1', 'recipe2'],
    favorites: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockFavorites: Recipe[] = [
    {
      _id: 'fav1',
      title: 'Favorite Recipe',
      description: 'Description',
      ingredients: ['ing1'],
      instructions: ['step1'],
      difficulty: 'medium',
      imageUrl: 'img.jpg',
      author: { _id: 'user123', username: 'testuser', avatar: 'avatar.jpg' },
      rating: 4.5,
      ratingCount: 10,
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockUserRecipes: Recipe[] = [
    {
      _id: 'recipe1',
      title: 'My Recipe',
      description: 'Description',
      ingredients: ['ing1'],
      instructions: ['step1'],
      difficulty: 'medium',
      imageUrl: 'img.jpg',
      author: { _id: 'user123', username: 'testuser', avatar: 'avatar.jpg' },
      rating: 4.5,
      ratingCount: 10,
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = configureStore({
      reducer: {
        toast: toastReducer,
        auth: authReducer,
      },
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasCheckedSession: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    const mockUseFollow = vi.mocked(useFollow);
    mockUseFollow.mockReturnValue({
      isFollowing: false,
      isLoading: false,
      follow: vi.fn().mockResolvedValue(undefined),
      unfollow: vi.fn().mockResolvedValue(undefined),
      toggleFollow: vi.fn(),
    });

    const mockUseProfileData = vi.mocked(useProfileData);
    mockUseProfileData.mockReturnValue({
      profile: mockProfile,
      favorites: mockFavorites,
      loading: false,
      loadingFavorites: false,
      error: null,
      refresh: vi.fn(),
      updateFollowStats: vi.fn(),
      updateCounters: vi.fn(),
    });

    const mockGetUserRecipes = vi.mocked(recipesApi.getUserRecipes);
    mockGetUserRecipes.mockResolvedValue({
      success: true,
      data: mockUserRecipes,
    });
  });

  const renderComponent = (userId?: string) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[userId ? `/profile/${userId}` : '/profile']}>
          <Routes>
            <Route path="/profile/:userId?" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  it('should show loader when loading', () => {
    const mockUseProfileData = vi.mocked(useProfileData);
    mockUseProfileData.mockReturnValue({
      profile: null,
      favorites: [],
      loading: true,
      loadingFavorites: false,
      error: null,
      refresh: vi.fn(),
      updateFollowStats: vi.fn(),
      updateCounters: vi.fn(),
    });

    renderComponent();
    
    expect(screen.getByTestId('loader')).toBeDefined();
    expect(screen.getByText('Loading profile...')).toBeDefined();
  });

  it('should show error when error occurs', () => {
    const mockUseProfileData = vi.mocked(useProfileData);
    mockUseProfileData.mockReturnValue({
      profile: null,
      favorites: [],
      loading: false,
      loadingFavorites: false,
      error: 'Failed to load profile',
      refresh: vi.fn(),
      updateFollowStats: vi.fn(),
      updateCounters: vi.fn(),
    });

    renderComponent();
    
    expect(screen.getByText('Failed to load profile')).toBeDefined();
  });

  it('should render profile header', () => {
    renderComponent();
    
    expect(screen.getByText('testuser')).toBeDefined();
    expect(screen.getByText('Test bio')).toBeDefined();
    expect(screen.getAllByText('5').length).toBe(2);
    expect(screen.getByText('10')).toBeDefined();
  });

  it('should show edit buttons for own profile', () => {
    renderComponent();
    
    expect(screen.getByText('Edit Profile')).toBeDefined();
    expect(screen.getByText('+ Add Recipe')).toBeDefined();
  });

  it('should show follow and message buttons for other profile', () => {
    const otherProfile = { ...mockProfile, _id: 'other123' };
    const mockUseProfileData = vi.mocked(useProfileData);
    mockUseProfileData.mockReturnValue({
      profile: otherProfile,
      favorites: [],
      loading: false,
      loadingFavorites: false,
      error: null,
      refresh: vi.fn(),
      updateFollowStats: vi.fn(),
      updateCounters: vi.fn(),
    });

    renderComponent('other123');
    
    expect(screen.getByText('Follow')).toBeDefined();
    expect(screen.getByText('💬 Message')).toBeDefined();
  });

  it('should open edit profile modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const editButton = screen.getByText('Edit Profile');
    await user.click(editButton);
    
    expect(screen.getByTestId('edit-profile-modal')).toBeDefined();
  });

  it('should open create recipe modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const createButton = screen.getByText('+ Add Recipe');
    await user.click(createButton);
    
    expect(screen.getByTestId('create-recipe-modal')).toBeDefined();
  });

  it('should open followers modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const followersStat = screen.getByText('10').closest('.profile-stat');
    if (followersStat) {
      await user.click(followersStat);
    }
    
    expect(screen.getByTestId('followers-modal')).toBeDefined();
  });

  it('should open following modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const followingValues = screen.getAllByText('5');
    const followingStat = followingValues[1].closest('.profile-stat');
    if (followingStat) {
      await user.click(followingStat);
    }
    
    expect(screen.getByTestId('following-modal')).toBeDefined();
  });

  it('should show favorites tab by default', () => {
    renderComponent();
    
    expect(screen.getByText('Favorite Recipes')).toBeDefined();
    expect(screen.getByText('Favorite Recipe')).toBeDefined();
  });

  it('should switch to about tab', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const aboutTab = screen.getAllByText('About')[0];
    await user.click(aboutTab);
    
    expect(screen.getAllByText('About').length).toBe(2);
    expect(screen.getByText('Member Since')).toBeDefined();
    expect(screen.getByText('Stats')).toBeDefined();
  });
});