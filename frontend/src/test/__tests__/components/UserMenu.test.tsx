import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from '../../../components/Auth/UserMenu';
import { useAuth } from '../../../hooks/useAuth';
import unreadReducer from '../../../store/unreadSlice';
import toastReducer from '../../../store/toastSlice';
import authReducer from '../../../store/authSlice';
import { ReactNode } from 'react';

// Mock hooks
vi.mock('../../../hooks/useAuth');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) => (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock ChangePasswordModal
vi.mock('../../../components/ChangePasswordModal/ChangePasswordModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="change-password-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

interface RootState {
  unread: ReturnType<typeof unreadReducer>;
  toast: ReturnType<typeof toastReducer>;
  auth: ReturnType<typeof authReducer>;
}

describe('UserMenu', () => {
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
    bio: 'This is a test bio',
    favorites: [],
  };

  const mockLogout = vi.fn();

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = configureStore({
      reducer: {
        unread: unreadReducer,
        toast: toastReducer,
        auth: authReducer,
      },
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
      error: null,
      hasCheckedSession: true,
    });

    mockLogout.mockResolvedValue({ success: true });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <UserMenu />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should return null when no user', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
      error: null,
      hasCheckedSession: true,
    });

    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('should render user avatar and name', () => {
    renderComponent();
    
    const avatarImg = screen.getByAltText('testuser');
    expect(avatarImg).toBeDefined();
    expect(avatarImg).toHaveAttribute('src', 'avatar.jpg');
    expect(screen.getByText('testuser')).toBeDefined();
  });

  it('should render user initial when avatar does not exist', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, avatar: undefined },
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
      error: null,
      hasCheckedSession: true,
    });

    renderComponent();
    
    expect(screen.getByText('T')).toBeDefined();
  });

  it('should open dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    expect(screen.getByText('My Profile')).toBeDefined();
    expect(screen.getByText('Messages')).toBeDefined();
    expect(screen.getByText('Favorites')).toBeDefined();
    expect(screen.getByText('Change Password')).toBeDefined();
    expect(screen.getByText('Delete Account')).toBeDefined();
    expect(screen.getByText('Logout')).toBeDefined();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    expect(screen.getByText('My Profile')).toBeDefined();
    
    await user.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('My Profile')).toBeNull();
    });
  });

  it('should call logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should open change password modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const changePasswordButton = screen.getByText('Change Password');
    await user.click(changePasswordButton);
    
    expect(screen.getByTestId('change-password-modal')).toBeDefined();
  });

  it('should open delete confirmation modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const deleteButton = screen.getByText('Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    expect(screen.getByText(/Are you sure you want to delete your account/)).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Yes, Delete My Account')).toBeDefined();
  });

  it('should close delete modal on cancel', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const deleteButton = screen.getByText('Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Account')).toBeNull();
    });
  });

  it('should close delete modal on overlay click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const deleteButton = screen.getByText('Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    
    const overlay = document.querySelector('.user-menu__delete-modal-overlay');
    if (overlay) {
      await user.click(overlay);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Account')).toBeNull();
    });
  });

  it('should navigate to profile on My Profile click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const profileLink = screen.getByText('My Profile');
    expect(profileLink.closest('a')).toHaveAttribute('href', '/me');
  });

  it('should navigate to chats on Messages click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const chatsLink = screen.getByText('Messages');
    expect(chatsLink.closest('a')).toHaveAttribute('href', '/chats');
  });

  it('should navigate to favorites on Favorites click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    await user.click(menuButton);
    
    const favoritesLink = screen.getByText('Favorites');
    expect(favoritesLink.closest('a')).toHaveAttribute('href', '/favorites');
  });

  it('should show loading state on logout button', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: true,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
      error: null,
      hasCheckedSession: true,
    });

    renderComponent();
    
    const menuButton = screen.getByLabelText('User Menu');
    expect(menuButton).toBeDisabled();
  });
});