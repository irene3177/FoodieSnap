import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import MobileUserMenu from '../../../components/Auth/MobileUserMenu';
import { useAuth } from '../../../hooks/useAuth';
import * as authSlice from '../../../store/authSlice';
import toastReducer from '../../../store/toastSlice';
import authReducer from '../../../store/authSlice';

// Mock hooks
vi.mock('../../../hooks/useAuth');

// Mock deleteAccount thunk
vi.mock('../../../store/authSlice', async () => {
  const actual = await vi.importActual('../../../store/authSlice');
  return {
    ...actual,
    deleteAccount: vi.fn(),
  };
});

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
  toast: ReturnType<typeof toastReducer>;
  auth: ReturnType<typeof authReducer>;
}

describe('MobileUserMenu', () => {
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
    bio: 'This is a test bio that is longer than fifty characters to test truncation',
  };

  const mockOnClose = vi.fn();
  const mockLogout = vi.fn();

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
          <MobileUserMenu onClose={mockOnClose} />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should render user avatar with image when avatar exists', () => {
    renderComponent();
    
    const avatarImg = screen.getByAltText('testuser');
    expect(avatarImg).toBeDefined();
    expect(avatarImg).toHaveAttribute('src', 'avatar.jpg');
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

  it('should render user info', () => {
    renderComponent();
    
    expect(screen.getByText('testuser')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('should render navigation links', () => {
    renderComponent();
    
    expect(screen.getByText('👤 My Profile')).toBeDefined();
    expect(screen.getByText('💬 Chats')).toBeDefined();
    expect(screen.getByText('❤️ Favorites')).toBeDefined();
  });

  it('should render action buttons', () => {
    renderComponent();
    
    expect(screen.getByText('🔒 Change Password')).toBeDefined();
    expect(screen.getByText('🗑️ Delete Account')).toBeDefined();
    expect(screen.getByText('🚪 Logout')).toBeDefined();
  });

  it('should call onClose when link is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const profileLink = screen.getByText('👤 My Profile');
    await user.click(profileLink);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const logoutButton = screen.getByText('🚪 Logout');
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
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
    
    const logoutButton = screen.getByRole('button', { name: /Logging out/ });
    expect(logoutButton).toBeDefined();
    expect(logoutButton).toBeDisabled();
  });

  it('should open change password modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const changePasswordButton = screen.getByText('🔒 Change Password');
    await user.click(changePasswordButton);
    
    expect(screen.getByTestId('change-password-modal')).toBeDefined();
  });

  it('should open delete confirmation modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const deleteButton = screen.getByText('🗑️ Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    expect(screen.getByText(/Are you sure you want to delete your account/)).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Yes, Delete My Account')).toBeDefined();
  });

  it('should close delete confirmation modal on cancel', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const deleteButton = screen.getByText('🗑️ Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Account')).toBeNull();
    });
  });

  it('should close delete confirmation modal on overlay click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const deleteButton = screen.getByText('🗑️ Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    
    const overlay = document.querySelector('.mobile-user-menu__delete-modal-overlay');
    if (overlay) {
      await user.click(overlay);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Account')).toBeNull();
    });
  });

  it('should close delete modal on close button click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const deleteButton = screen.getByText('🗑️ Delete Account');
    await user.click(deleteButton);
    
    expect(screen.getByText('Delete Account')).toBeDefined();
    
    const closeButton = screen.getByText('✕');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Account')).toBeNull();
    });
  });

  it('should handle account deletion', async () => {
    const user = userEvent.setup();
    
    // Mock the deleteAccount function
    const mockDeleteAccount = authSlice.deleteAccount as unknown as ReturnType<typeof vi.fn>;
    const mockUnwrap = vi.fn().mockResolvedValue(undefined);
    const mockThunkResult = {
      unwrap: mockUnwrap,
    };
    mockDeleteAccount.mockReturnValue(mockThunkResult);
    
    // Mock window.location.href
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    
    renderComponent();
    
    const deleteButton = screen.getByText('🗑️ Delete Account');
    await user.click(deleteButton);
    
    const confirmButton = screen.getByText('Yes, Delete My Account');
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
    
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});