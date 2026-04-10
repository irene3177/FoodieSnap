import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import Users from '../../../pages/Users/Users';
import usersReducer from '../../../store/usersSlice';
import { UserListItem } from '../../../types';

// Mock useDebounce
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock components
vi.mock('../../../components/Loader/Loader', () => ({
  default: () => <div data-testid="loader">Loading...</div>,
}));

vi.mock('../../../components/UserCard/UserCard', () => ({
  default: ({ user, onClick }: { user: UserListItem; onClick: () => void }) => (
    <div data-testid={`user-card-${user._id}`} onClick={onClick}>
      <h3>{user.username}</h3>
    </div>
  ),
}));

vi.mock('../../../components/ScrollToTop/ScrollToTop', () => ({
  ScrollToTop: () => null,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

interface RootState {
  users: ReturnType<typeof usersReducer>;
}

describe('Users', () => {
  const mockUsers: UserListItem[] = [
    {
      _id: '1',
      username: 'user1',
      avatar: 'avatar1.jpg',
      bio: 'Bio 1',
      recipeCount: 5,
      followersCount: 10,
      isFollowing: false,
    },
    {
      _id: '2',
      username: 'user2',
      avatar: 'avatar2.jpg',
      bio: 'Bio 2',
      recipeCount: 3,
      followersCount: 5,
      isFollowing: true,
    },
  ];

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = configureStore({
      reducer: {
        users: usersReducer,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should show loader while loading', () => {
    // Set loading state
    store = configureStore({
      reducer: {
        users: () => ({ users: [], total: 0, page: 1, pages: 1, loading: true, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    expect(screen.getByTestId('loader')).toBeDefined();
  });

  it('should show error message on error', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: [], total: 0, page: 1, pages: 1, loading: false, error: 'Failed to load users', searchQuery: '' }),
      },
    });

    renderComponent();
    
    expect(screen.getByText('Failed to load users')).toBeDefined();
    expect(screen.getByText('Try Again')).toBeDefined();
  });

  it('should show empty state when no users', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: [], total: 0, page: 1, pages: 1, loading: false, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    expect(screen.getByText('No users found')).toBeDefined();
    expect(screen.getByText('Be the first to join our community!')).toBeDefined();
  });

  it('should show users list when loaded', async () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: mockUsers, total: 2, page: 1, pages: 1, loading: false, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    expect(screen.getByText('user1')).toBeDefined();
    expect(screen.getByText('user2')).toBeDefined();
    expect(screen.getByText('Total 2 members')).toBeDefined();
  });

  it('should handle search input', async () => {
    const user = userEvent.setup();
    
    store = configureStore({
      reducer: {
        users: usersReducer,
      },
    });

    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Search by username...');
    await user.type(searchInput, 'test');
    
    expect(searchInput).toHaveValue('test');
  });

  it('should clear search', async () => {
    const user = userEvent.setup();
    
    store = configureStore({
      reducer: {
        users: usersReducer,
      },
    });

    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Search by username...');
    await user.type(searchInput, 'test');
    
    expect(searchInput).toHaveValue('test');
    
    const clearButton = screen.getByText('✕');
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('should navigate to user profile on card click', async () => {
    const user = userEvent.setup();
    
    store = configureStore({
      reducer: {
        users: () => ({ users: mockUsers, total: 2, page: 1, pages: 1, loading: false, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    const userCard = screen.getByTestId('user-card-1');
    await user.click(userCard);
    
    expect(mockNavigate).toHaveBeenCalledWith('/user/1');
  });

  it('should show pagination when multiple pages', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: mockUsers, total: 50, page: 2, pages: 5, loading: false, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    expect(screen.getByText('← Previous')).toBeDefined();
    expect(screen.getByText('Next →')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('should disable previous button on first page', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: mockUsers, total: 50, page: 1, pages: 5, loading: false, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    const prevButton = screen.getByText('← Previous');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: mockUsers, total: 50, page: 5, pages: 5, loading: false, error: null, searchQuery: '' }),
      },
    });

    renderComponent();
    
    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
  });

  it('should show search results count when searching', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: mockUsers, total: 2, page: 1, pages: 1, loading: false, error: null, searchQuery: 'test' }),
      },
    });

    renderComponent();
    
    expect(screen.getByText('Found 2 users matching "test"')).toBeDefined();
  });

  it('should show empty state with search term when no results', () => {
    store = configureStore({
      reducer: {
        users: () => ({ users: [], total: 0, page: 1, pages: 1, loading: false, error: null, searchQuery: 'nonexistent' }),
      },
    });

    renderComponent();
    
    expect(screen.getByText('No users found')).toBeDefined();
    expect(screen.getByText('No users matching "nonexistent". Try a different search term.')).toBeDefined();
  });
});