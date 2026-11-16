import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '@/hooks';

// ---------- Mock dependencies ----------

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/Auth/LoginModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="login-modal">Login Modal</div> : null,
}));

vi.mock('@/components/Auth/RegisterModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="register-modal">Register Modal</div> : null,
}));

vi.mock('@/components/Menu/UserMenu', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="user-menu">User Menu</div> : null,
}));

vi.mock('@/components/Menu/AppMenu', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="app-menu">App Menu</div> : null,
}));

vi.mock('@/components/ui', () => ({
  Avatar: ({ src, username }: { src?: string; username?: string }) => (
    <div data-testid="avatar" data-username={username}>
      {src || 'no-avatar'}
    </div>
  ),
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/constants', () => ({
  NavLinks: [
    { path: '/recipes', label: 'Recipes', icon: () => <span>icon</span> },
    { path: '/search', label: 'Search', icon: () => <span>icon</span> },
  ],
}));

// ---------- Helpers ----------

const mockAuth = (opts: {
  isAuthenticated: boolean;
  user?: { _id: string; username: string; avatar?: string } | null;
}) => {
  (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    isAuthenticated: opts.isAuthenticated,
    user: opts.user ?? null,
    logout: vi.fn(),
    isLoading: false,
    refreshUser: vi.fn(),
  });
};

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

// ---------- Tests ----------

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication state', () => {
    it('shows Login and Sign Up buttons when not authenticated', () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
    });

    it('shows Avatar when authenticated', () => {
      mockAuth({
        isAuthenticated: true,
        user: { _id: '1', username: 'alice', avatar: 'avatar.jpg' },
      });
      renderHeader();

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument();
    });

    it('shows logo link to home page', () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      const logo = screen.getByRole('link', { name: /foodiesnap/i });
      expect(logo).toHaveAttribute('href', '/');
    });
  });

  describe('guest actions', () => {
    it('opens LoginModal when Login clicked', async () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Login' }));

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });

    it('opens RegisterModal when Sign Up clicked', async () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      expect(screen.queryByTestId('register-modal')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

      expect(screen.getByTestId('register-modal')).toBeInTheDocument();
    });
  });

  // ---- Authenticated Actions ----

  describe('authenticated actions', () => {
    it('opens UserMenu when Avatar clicked', async () => {
      mockAuth({
        isAuthenticated: true,
        user: { _id: '1', username: 'alice' },
      });
      renderHeader();

      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();

      const avatarButton = screen.getByRole('button', { name: /open user menu/i });
      await userEvent.click(avatarButton);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  // ---- Mobile Menu Button ----

  describe('mobile menu button', () => {
    it('opens AppMenu on mobile button click when guest', async () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      const menuButton = screen.getByTestId('mobile-menu-button');
      await userEvent.click(menuButton);

      expect(screen.getByTestId('app-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });

    it('opens UserMenu on mobile button click when authenticated', async () => {
      mockAuth({
        isAuthenticated: true,
        user: { _id: '1', username: 'alice' },
      });
      renderHeader();

      const menuButton = screen.getByTestId('mobile-menu-button');
      await userEvent.click(menuButton);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('app-menu')).not.toBeInTheDocument();
    });
  });

  // ---- Navigation ----

  describe('navigation', () => {
    it('renders navigation links from NavLinks', () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    });

    it('closes AppMenu when logo clicked', async () => {
      mockAuth({ isAuthenticated: false });
      renderHeader();

      await userEvent.click(screen.getByRole('button', { name: /menu/i }));
      expect(screen.getByTestId('app-menu')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('link', { name: /foodiesnap/i }));

      expect(screen.queryByTestId('app-menu')).not.toBeInTheDocument();
    });
  });
});