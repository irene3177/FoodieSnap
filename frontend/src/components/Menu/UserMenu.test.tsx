import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import UserMenu from '@/components/Menu/UserMenu';
import { useAuth, useScrollLock } from '@/hooks';
import toastReducer from '@/store/toastSlice';
import unreadReducer from '@/store/unreadSlice';

// ---------- Mocks ----------

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useScrollLock: vi.fn(),
}));

// Avatar mock: empty div with data-username so it doesn't collide with getByText('alice')
vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));


vi.mock('@/components/Auth/DeleteAccountModal', () => ({
  default: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) =>
    isOpen ? (
      <div data-testid="delete-account-modal">
        <button onClick={onConfirm}>Confirm Delete</button>
      </div>
    ) : null,
}));

vi.mock('@/components/ChangePasswordModal/ChangePasswordModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="change-password-modal" /> : null,
}));

vi.mock('@/constants', () => ({
  NavLinks: [
    { path: '/recipes', label: 'Recipes', icon: () => <span>icon</span> },
    { path: '/search', label: 'Search', icon: () => <span>icon</span> },
  ],
  PersonalLinks: [
    { path: '/me', label: 'Profile', icon: () => <span>icon</span> },
    { path: '/chats', label: 'Chats', icon: () => <span>icon</span> },
  ],
}));

// ---------- Helpers ----------

const mockLogout = vi.fn();

const setupAuth = (overrides: Partial<{
  user: any;
  logout: any;
  isLoading: boolean;
}> = {}) => {
  (useAuth as any).mockReturnValue({
    user: overrides.user ?? {
      _id: 'u1',
      username: 'alice',
      email: 'alice@test.com',
      avatar: 'avatar.jpg',
    },
    logout: overrides.logout ?? mockLogout,
    isLoading: overrides.isLoading ?? false,
  });
};

const renderUserMenu = (
  props: Partial<React.ComponentProps<typeof UserMenu>> = {},
  unreadTotal = 0
) => {
  const store = configureStore({
    reducer: {
      auth: (state = {}) => state,
      unread: unreadReducer,
      toast: toastReducer,
    } as any,
    preloadedState: {
      unread: {
        counts: unreadTotal > 0 ? { 'conv-1': unreadTotal } : {},
        lastMessages: {},
        total: unreadTotal,
        loading: false,
      },
    } as any,
  });

  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <UserMenu {...merged} />
      </MemoryRouter>
    </Provider>
  );

  return { ...utils, ...merged, store };
};

// ---------- Tests ----------

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    mockLogout.mockResolvedValue(undefined);
  });

  // ---- User info ----

  describe('user info', () => {
    it('displays username and email', () => {
      renderUserMenu();

      // The username can appear in multiple places (avatar, heading), so use getAllByText
      expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });

    it('renders avatar with username prop', () => {
      renderUserMenu();

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-username',
        'alice'
      );
    });
  });

  // ---- Navigation links ----

  describe('navigation links', () => {
    it('renders NavLinks', () => {
      renderUserMenu();

      expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    });

    it('renders PersonalLinks', () => {
      renderUserMenu();

      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /chats/i })).toBeInTheDocument();
    });

    it('calls onClose when a NavLink is clicked', async () => {
      const onClose = vi.fn();
      renderUserMenu({ onClose });

      await userEvent.click(screen.getByRole('link', { name: /recipes/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking the profile link in header', async () => {
      const onClose = vi.fn();
      renderUserMenu({ onClose });

      await userEvent.click(screen.getByRole('link', { name: 'alice' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Unread badge ----

  describe('unread badge', () => {
    it('does not show badge when totalUnread is 0', () => {
      renderUserMenu({}, 0);

      const chatsLink = screen.getByRole('link', { name: /chats/i });
      expect(chatsLink).not.toHaveTextContent(/^\d+$/);
    });

    it('shows badge when totalUnread > 0', () => {
      renderUserMenu({}, 5);

      const chatsLink = screen.getByRole('link', { name: /chats/i });
      expect(chatsLink).toHaveTextContent('5');
    });

    it('shows "99+" when totalUnread > 99', () => {
      renderUserMenu({}, 150);

      const chatsLink = screen.getByRole('link', { name: /chats/i });
      expect(chatsLink).toHaveTextContent('99+');
    });
  });

  // ---- Logout ----

  describe('logout', () => {
    it('calls logout and onClose', async () => {
      const onClose = vi.fn();
      renderUserMenu({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /logout/i }));

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows "Logging out..." while loading', () => {
      setupAuth({ isLoading: true });
      renderUserMenu();

      expect(screen.getByText(/logging out/i)).toBeInTheDocument();
    });

    it('disables logout button while loading', () => {
      setupAuth({ isLoading: true });
      renderUserMenu();

      expect(screen.getByRole('button', { name: /logging out/i })).toBeDisabled();
    });
  });

  // ---- Change Password ----

  describe('change password', () => {
    it('opens ChangePasswordModal and closes menu', async () => {
      const onClose = vi.fn();
      renderUserMenu({ onClose });

      expect(screen.queryByTestId('change-password-modal')).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /change password/i })
      );

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });
  });

  // ---- Delete Account ----

  describe('delete account', () => {
    it('opens DeleteAccountModal and closes menu', async () => {
      const onClose = vi.fn();
      renderUserMenu({ onClose });

      expect(screen.queryByTestId('delete-account-modal')).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /delete account/i })
      );

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument();
    });
  });

  // ---- Overlay and close ----

  describe('overlay and close button', () => {
    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      const { container } = renderUserMenu({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const onClose = vi.fn();
      renderUserMenu({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /close menu/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Scroll lock ----

  describe('scroll lock', () => {
    it('calls useScrollLock', () => {
      renderUserMenu();

      expect(useScrollLock).toHaveBeenCalled();
    });
  });
});