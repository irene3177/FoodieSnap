import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from './LoginModal';
import { useAuth, useScrollLock } from '@/hooks';

// ---------- Mocks ----------

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useScrollLock: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { initial, animate, exit, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Query helpers ----------

const getEmailInput = () =>
  screen.getByLabelText(/^email$/i) as HTMLInputElement;

const getPasswordInput = () =>
  screen.getByLabelText(/^password$/i) as HTMLInputElement;

// ---------- Auth setup ----------

const mockLogin = vi.fn();
const mockRefreshUser = vi.fn();
const mockClearError = vi.fn();

const setupAuth = (overrides: Partial<{
  login: any;
  isLoading: boolean;
  error: string | null;
  refreshUser: any;
  clearError: any;
}> = {}) => {
  (useAuth as any).mockReturnValue({
    login: overrides.login ?? mockLogin,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    refreshUser: overrides.refreshUser ?? mockRefreshUser,
    clearError: overrides.clearError ?? mockClearError,
  });
};

const renderLoginModal = (props: Partial<React.ComponentProps<typeof LoginModal>> = {}) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSwitchToRegister: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<LoginModal {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    mockLogin.mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
    (useScrollLock as any).mockReturnValue(undefined);
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderLoginModal({ isOpen: false });

      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    });

    it('renders the form when isOpen=true', () => {
      renderLoginModal();

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(getEmailInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
    });
  });

  // ---- Input ----

  describe('input handling', () => {
    it('updates email field', async () => {
      renderLoginModal();

      await userEvent.type(getEmailInput(), 'test@example.com');

      expect(getEmailInput().value).toBe('test@example.com');
    });

    it('updates password field', async () => {
      renderLoginModal();

      await userEvent.type(getPasswordInput(), 'secret');

      expect(getPasswordInput().value).toBe('secret');
    });

    it('toggles password visibility', async () => {
      renderLoginModal();

      expect(getPasswordInput().type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await userEvent.click(toggleButton);

      expect(getPasswordInput().type).toBe('text');

      const hideButton = screen.getByRole('button', { name: /hide password/i });
      await userEvent.click(hideButton);

      expect(getPasswordInput().type).toBe('password');
    });
  });

  // ---- Submit ----

  describe('submit', () => {
    it('calls login with email and password', async () => {
      renderLoginModal();

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'secret');
      await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret',
      });
    });

    it('calls refreshUser and onClose on success', async () => {
      const onClose = vi.fn();
      renderLoginModal({ onClose });

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'secret');
      await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await vi.waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalledTimes(1);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose on failure', async () => {
      mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });
      const onClose = vi.fn();
      renderLoginModal({ onClose });

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'wrong');
      await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await vi.waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      expect(mockRefreshUser).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- Error display ----

  describe('error display', () => {
    it('does not show error before submit', () => {
      setupAuth({ error: 'Some error' });
      renderLoginModal();

      // Error is in auth state, but hasAttemptedSubmit is false
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });

    it('shows error after failed submit', async () => {
      mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });
      setupAuth({ error: 'Invalid credentials' });

      renderLoginModal();

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'wrong');
      await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await vi.waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('hides error on re-open', async () => {
      setupAuth({ error: 'Old error' });
      const { rerender } = render(
        <LoginModal isOpen={true} onClose={vi.fn()} onSwitchToRegister={vi.fn()} />
      );

      rerender(
        <LoginModal isOpen={false} onClose={vi.fn()} onSwitchToRegister={vi.fn()} />
      );
      rerender(
        <LoginModal isOpen={true} onClose={vi.fn()} onSwitchToRegister={vi.fn()} />
      );

      expect(screen.queryByText('Old error')).not.toBeInTheDocument();
    });
  });

  // ---- Loading ----

  describe('loading state', () => {
    it('disables fields and button while loading', () => {
      setupAuth({ isLoading: true });
      renderLoginModal();

      expect(getEmailInput()).toBeDisabled();
      expect(getPasswordInput()).toBeDisabled();
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });

    it('shows "Logging in..." text while loading', () => {
      setupAuth({ isLoading: true });
      renderLoginModal();

      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    });

    it('shows "Login" text when not loading', () => {
      setupAuth({ isLoading: false });
      renderLoginModal();

      expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    });
  });

  // ---- Close interactions ----

  describe('close interactions', () => {
    it('calls onClose and clearError on X click', async () => {
      const onClose = vi.fn();
      renderLoginModal({ onClose });

      // X button has no accessible name — find it by its absolute-position class
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find((b) => b.className.includes('absolute'));
      expect(xButton).toBeDefined();

      await userEvent.click(xButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalled();
    });

    it('clears fields on close', async () => {
      renderLoginModal();

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'secret');

      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find((b) => b.className.includes('absolute'));
      await userEvent.click(xButton!);

      expect(getEmailInput().value).toBe('');
      expect(getPasswordInput().value).toBe('');
    });

    it('calls onSwitchToRegister and clearError on switch click', async () => {
      const onSwitchToRegister = vi.fn();
      renderLoginModal({ onSwitchToRegister });

      await userEvent.click(screen.getByRole('button', { name: /sign up here/i }));

      expect(onSwitchToRegister).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalled();
    });

    it('clears fields on switch', async () => {
      renderLoginModal();

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'secret');

      await userEvent.click(screen.getByRole('button', { name: /sign up here/i }));

      expect(getEmailInput().value).toBe('');
      expect(getPasswordInput().value).toBe('');
    });
  });

  // ---- Overlay ----

  describe('overlay click', () => {
    it('closes when clicking the overlay', async () => {
      const onClose = vi.fn();
      const { container } = renderLoginModal({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();

      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the modal', async () => {
      const onClose = vi.fn();
      renderLoginModal({ onClose });

      await userEvent.click(screen.getByText(/welcome back/i));

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});