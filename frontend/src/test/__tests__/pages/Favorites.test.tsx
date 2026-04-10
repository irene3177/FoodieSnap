import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Favorites from '../../../pages/Favorites/Favorites';
import { useAuth } from '../../../hooks/useAuth';
import favoritesReducer from '../../../store/favoritesSlice';
import toastReducer from '../../../store/toastSlice';
import authReducer from '../../../store/authSlice';
import { Recipe } from '../../../types';
import { ReactNode } from 'react';

// Mock hooks
vi.mock('../../../hooks/useAuth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock components
vi.mock('../../../components/SortableRecipeCard/SortableRecipeCard', () => ({
  default: ({ recipe }: { recipe: Recipe }) => (
    <div data-testid={`recipe-card-${recipe._id}`}>
      <h3>{recipe.title}</h3>
    </div>
  ),
}));

vi.mock('../../../components/Skeleton/Skeleton', () => ({
  FavoritesSkeleton: () => <div data-testid="favorites-skeleton">Loading favorites...</div>,
}));

// Mock dnd-kit with proper types
interface DndContextProps {
  children: ReactNode;
  onDragEnd?: (event: { active: { id: string }; over: { id: string } }) => void;
}

interface SortableContextProps {
  children: ReactNode;
}

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: DndContextProps) => (
    <div data-testid="dnd-context" onClick={() => onDragEnd && onDragEnd({ active: { id: '1' }, over: { id: '2' } })}>
      {children}
    </div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((sensors) => sensors),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((array, from, to) => {
    const result = [...array];
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
    return result;
  }),
  rectSortingStrategy: vi.fn(),
  SortableContext: ({ children }: SortableContextProps) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
}));

interface RootState {
  favorites: ReturnType<typeof favoritesReducer>;
  toast: ReturnType<typeof toastReducer>;
  auth: ReturnType<typeof authReducer>;
}

describe('Favorites', () => {
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@test.com',
    avatar: 'avatar.jpg',
  };

  const mockRecipes: Recipe[] = [
    {
      _id: '1',
      title: 'Recipe 1',
      description: 'Description 1',
      ingredients: ['ing1'],
      instructions: ['step1'],
      difficulty: 'medium',
      imageUrl: 'img1.jpg',
      author: { _id: 'user123', username: 'testuser', avatar: 'avatar.jpg' },
      rating: 4.5,
      ratingCount: 10,
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      title: 'Recipe 2',
      description: 'Description 2',
      ingredients: ['ing2'],
      instructions: ['step2'],
      difficulty: 'easy',
      imageUrl: 'img2.jpg',
      author: { _id: 'user123', username: 'testuser', avatar: 'avatar.jpg' },
      rating: 4.0,
      ratingCount: 5,
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
        favorites: favoritesReducer,
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
      refreshUser: vi.fn(),
    });

    window.confirm = vi.fn(() => true);
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Favorites />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should show unauthorized message when no user', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasCheckedSession: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderComponent();
    
    expect(screen.getByText('Please log in')).toBeDefined();
    expect(screen.getByText('Go to Login')).toBeDefined();
  });

  it('should show skeleton when loading and no favorites', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: [], loading: true, error: null, initialized: false }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    expect(screen.getByTestId('favorites-skeleton')).toBeDefined();
  });

  it('should show error message when error occurs', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: [], loading: false, error: 'Failed to load favorites', initialized: false }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    expect(screen.getByText('Oops! Something went wrong')).toBeDefined();
    expect(screen.getByText('Failed to load favorites')).toBeDefined();
    expect(screen.getByText('Try Again')).toBeDefined();
  });

  it('should show empty state when no favorites', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: [], loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    expect(screen.getByText('No favorites yet')).toBeDefined();
    expect(screen.getByText('Explore Recipes')).toBeDefined();
  });

  it('should show favorites list when loaded', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: mockRecipes, loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    expect(screen.getByText('My Favorite Recipes')).toBeDefined();
    expect(screen.getByText('2 saved recipes')).toBeDefined();
    expect(screen.getByText('Recipe 1')).toBeDefined();
    expect(screen.getByText('Recipe 2')).toBeDefined();
    expect(screen.getByText('Clear All')).toBeDefined();
  });

  it('should show clear all button when favorites exist', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: mockRecipes, loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    expect(screen.getByText('Clear All')).toBeDefined();
  });

  it('should handle clear all favorites', async () => {
    const user = userEvent.setup();
    
    store = configureStore({
      reducer: {
        favorites: () => ({ items: mockRecipes, loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear all favorites?');
  });

  it('should not clear favorites if user cancels', async () => {
    window.confirm = vi.fn(() => false);
    const user = userEvent.setup();
    
    store = configureStore({
      reducer: {
        favorites: () => ({ items: mockRecipes, loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    expect(window.confirm).toHaveBeenCalled();
  });

  it('should show drag instruction when favorites exist', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: mockRecipes, loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    const dragInstructions = screen.getAllByText('Drag the card to reorder your favorites');
    expect(dragInstructions.length).toBeGreaterThan(0);
  });

  it('should show pro tips section', () => {
    store = configureStore({
      reducer: {
        favorites: () => ({ items: mockRecipes, loading: false, error: null, initialized: true }),
        toast: toastReducer,
        auth: authReducer,
      },
    });

    renderComponent();
    
    expect(screen.getByText('💡 Pro Tips')).toBeDefined();
    const dragInstructions = screen.getAllByText('Drag the card to reorder your favorites');
    expect(dragInstructions.length).toBeGreaterThan(0);
  });
});