import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppMenu from '@/components/Menu/AppMenu';
import { useScrollLock } from '@/hooks';

// ---------- Mocks ----------

vi.mock('@/hooks', () => ({
  useScrollLock: vi.fn(),
}));

vi.mock('@/components/ui', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/components/Auth/LoginModal', () => ({
  default: ({ isOpen, onClose, onSwitchToRegister }: any) =>
    isOpen ? (
      <div data-testid="login-modal">
        <button onClick={onClose}>Close Login</button>
        <button onClick={onSwitchToRegister}>Switch to Register</button>
      </div>
    ) : null,
}));

vi.mock('@/components/Auth/RegisterModal', () => ({
  default: ({ isOpen, onClose, onSwitchToLogin }: any) =>
    isOpen ? (
      <div data-testid="register-modal">
        <button onClick={onClose}>Close Register</button>
        <button onClick={onSwitchToLogin}>Switch to Login</button>
      </div>
    ) : null,
}));

vi.mock('@/constants', () => ({
  NavLinks: [
    { path: '/recipes', label: 'Recipes', icon: () => <span>🍳</span> },
    { path: '/search', label: 'Search', icon: () => <span>🔍</span> },
  ],
}));

// ---------- Render helper ----------

const renderMenu = (
  props: Partial<React.ComponentProps<typeof AppMenu>> = {}
) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(
    <MemoryRouter>
      <AppMenu {...merged} />
    </MemoryRouter>
  );

  return { ...utils, ...merged };
};

const getLoginButton = () =>
  screen.getByRole('button', { name: /login/i });

const getSignUpButton = () =>
  screen.getByRole('button', { name: /sign up/i });

// ---------- Tests ----------

describe('AppMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders menu content when isOpen=true', () => {
      renderMenu();

      expect(screen.getByRole('heading', { name: /foodiesnap/i })).toBeInTheDocument();
    });

    it('renders NavLinks', () => {
      renderMenu();

      expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    });

    it('renders ThemeToggle', () => {
      renderMenu();

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('renders Login and Sign Up buttons', () => {
      renderMenu();

      expect(getLoginButton()).toBeInTheDocument();
      expect(getSignUpButton()).toBeInTheDocument();
    });
  });

  // ---- Close interactions ----

  describe('close interactions', () => {
    it('calls onClose on overlay click', () => {
      const onClose = vi.fn();
      const { container } = renderMenu({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /close menu/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on NavLink click', async () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      await userEvent.click(screen.getByRole('link', { name: /recipes/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Login flow ----

  describe('login flow', () => {
    it('calls onClose and opens LoginModal after timeout', async () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();

      await userEvent.click(getLoginButton());

      expect(onClose).toHaveBeenCalledTimes(1);

      // Modal opens after 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });

    it('LoginModal onClose closes it', async () => {
      renderMenu();

      await userEvent.click(getLoginButton());
      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /close login/i }));

      expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
    });

    it('switch from Login to Register', async () => {
      renderMenu();

      await userEvent.click(getLoginButton());
      act(() => vi.advanceTimersByTime(300));

      await userEvent.click(screen.getByRole('button', { name: /switch to register/i }));

      expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('register-modal')).toBeInTheDocument();
    });
  });

  // ---- Sign Up flow ----

  describe('sign up flow', () => {
    it('calls onClose and opens RegisterModal after timeout', async () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      await userEvent.click(getSignUpButton());

      expect(onClose).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('register-modal')).toBeInTheDocument();
    });

    it('RegisterModal onClose closes it', async () => {
      renderMenu();

      await userEvent.click(getSignUpButton());
      act(() => vi.advanceTimersByTime(300));

      await userEvent.click(screen.getByRole('button', { name: /close register/i }));

      expect(screen.queryByTestId('register-modal')).not.toBeInTheDocument();
    });

    it('switch from Register to Login', async () => {
      renderMenu();

      await userEvent.click(getSignUpButton());
      act(() => vi.advanceTimersByTime(300));

      await userEvent.click(screen.getByRole('button', { name: /switch to login/i }));

      expect(screen.queryByTestId('register-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });
  });

  // ---- isOpen=false reset ----

  describe('reset on close', () => {
    it('resets modal state when isOpen changes to false', async () => {
      const { rerender } = render(
        <MemoryRouter>
          <AppMenu isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Open Login
      await userEvent.click(getLoginButton());
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByTestId('login-modal')).toBeInTheDocument();

      // Close menu
      rerender(
        <MemoryRouter>
          <AppMenu isOpen={false} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Reopen menu
      rerender(
        <MemoryRouter>
          <AppMenu isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Login modal should be closed
      expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
    });
  });

  // ---- Scroll lock ----

  describe('scroll lock', () => {
    it('calls useScrollLock(isOpen)', () => {
      renderMenu({ isOpen: true });

      expect(useScrollLock).toHaveBeenCalledWith(true);
    });
  });
});