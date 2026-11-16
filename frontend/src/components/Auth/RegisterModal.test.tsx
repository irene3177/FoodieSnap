import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterModal from './RegisterModal';
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

// react-textarea-autosize: plain textarea for tests
vi.mock('react-textarea-autosize', () => {
  const React = require('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      return <textarea ref={ref} {...props} />;
    }),
  };
});

// ---------- Query helpers ----------

const getUsernameInput = () =>
  screen.getByLabelText(/^username$/i) as HTMLInputElement;

const getEmailInput = () =>
  screen.getByLabelText(/^email$/i) as HTMLInputElement;

const getPasswordInput = () =>
  screen.getByLabelText(/^password$/i) as HTMLInputElement;

const getBioInput = () =>
  screen.getByLabelText(/^bio \(optional\)$/i) as HTMLTextAreaElement;

// ---------- Auth setup ----------

const mockRegister = vi.fn();
const mockRefreshUser = vi.fn();

const setupAuth = (overrides: Partial<{
  register: any;
  isLoading: boolean;
  error: string | null;
  refreshUser: any;
}> = {}) => {
  (useAuth as any).mockReturnValue({
    register: overrides.register ?? mockRegister,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    refreshUser: overrides.refreshUser ?? mockRefreshUser,
  });
};

const renderRegisterModal = (
  props: Partial<React.ComponentProps<typeof RegisterModal>> = {}
) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSwitchToLogin: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<RegisterModal {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('RegisterModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    mockRegister.mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
    (useScrollLock as any).mockReturnValue(undefined);
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderRegisterModal({ isOpen: false });

      expect(screen.queryByText(/join our community/i)).not.toBeInTheDocument();
    });

    it('renders the form when isOpen=true', () => {
      renderRegisterModal();

      expect(screen.getByText(/join our community/i)).toBeInTheDocument();
      expect(getUsernameInput()).toBeInTheDocument();
      expect(getEmailInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(getBioInput()).toBeInTheDocument();
    });
  });

  // ---- Input ----

  describe('input handling', () => {
    it('updates all fields', async () => {
      renderRegisterModal();

      await userEvent.type(getUsernameInput(), 'johndoe');
      await userEvent.type(getEmailInput(), 'john@test.com');
      await userEvent.type(getPasswordInput(), 'secret123');
      await userEvent.type(getBioInput(), 'Hello!');

      expect(getUsernameInput().value).toBe('johndoe');
      expect(getEmailInput().value).toBe('john@test.com');
      expect(getPasswordInput().value).toBe('secret123');
      expect(getBioInput().value).toBe('Hello!');
    });

    it('toggles password visibility', async () => {
      renderRegisterModal();

      expect(getPasswordInput().type).toBe('password');

      await userEvent.click(screen.getByRole('button', { name: /show password/i }));
      expect(getPasswordInput().type).toBe('text');

      await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
      expect(getPasswordInput().type).toBe('password');
    });

    it('shows bio character counter', async () => {
      renderRegisterModal();

      expect(screen.getByText('0/200 characters')).toBeInTheDocument();

      await userEvent.type(getBioInput(), 'Hello');

      expect(screen.getByText('5/200 characters')).toBeInTheDocument();
    });
  });

  // ---- Validation ----

  describe('validation', () => {
    it('shows error when password is too short', async () => {
      renderRegisterModal();

      await userEvent.type(getUsernameInput(), 'johndoe');
      await userEvent.type(getEmailInput(), 'john@test.com');
      await userEvent.type(getPasswordInput(), '12345'); // 5 chars

      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(
        screen.getByText(/password must be at least 6 characters long/i)
      ).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when username is too short', async () => {
      renderRegisterModal();

      await userEvent.type(getUsernameInput(), 'jo'); // 2 chars
      await userEvent.type(getEmailInput(), 'john@test.com');
      await userEvent.type(getPasswordInput(), 'secret123');

      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(
        screen.getByText(/username must be at least 3 characters long/i)
      ).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('does not call register when form is invalid', async () => {
      renderRegisterModal();

      // Only fill in email — leave username and password empty
      await userEvent.type(getEmailInput(), 'john@test.com');
      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  // ---- Submit ----

  describe('submit', () => {
    const fillValidForm = async () => {
      await userEvent.type(getUsernameInput(), 'johndoe');
      await userEvent.type(getEmailInput(), 'john@test.com');
      await userEvent.type(getPasswordInput(), 'secret123');
    };

    it('calls register with correct data', async () => {
      renderRegisterModal();
      await fillValidForm();
      await userEvent.type(getBioInput(), 'Hello!');

      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(mockRegister).toHaveBeenCalledWith({
        username: 'johndoe',
        email: 'john@test.com',
        password: 'secret123',
        bio: 'Hello!',
      });
    });

    it('sends bio as undefined when empty', async () => {
      renderRegisterModal();
      await fillValidForm();

      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(mockRegister).toHaveBeenCalledWith({
        username: 'johndoe',
        email: 'john@test.com',
        password: 'secret123',
        bio: undefined,
      });
    });

    it('calls refreshUser and onClose on success', async () => {
      const onClose = vi.fn();
      renderRegisterModal({ onClose });
      await fillValidForm();

      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await vi.waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalledTimes(1);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears fields after successful submit', async () => {
      renderRegisterModal();
      await fillValidForm();

      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await vi.waitFor(() => {
        expect(getUsernameInput().value).toBe('');
      });
      expect(getEmailInput().value).toBe('');
      expect(getPasswordInput().value).toBe('');
      expect(getBioInput().value).toBe('');
    });
  });

  // ---- Server error ----

  describe('server error', () => {
    it('shows error message from useAuth', () => {
      setupAuth({ error: 'Email already exists' });
      renderRegisterModal();

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  // ---- Loading ----

  describe('loading state', () => {
    it('disables all fields while loading', () => {
      setupAuth({ isLoading: true });
      renderRegisterModal();

      expect(getUsernameInput()).toBeDisabled();
      expect(getEmailInput()).toBeDisabled();
      expect(getPasswordInput()).toBeDisabled();
      expect(getBioInput()).toBeDisabled();
    });

    it('shows "Creating account..." text while loading', () => {
      setupAuth({ isLoading: true });
      renderRegisterModal();

      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });

    it('disables submit button while loading', () => {
      setupAuth({ isLoading: true });
      renderRegisterModal();

      expect(
        screen.getByRole('button', { name: /creating account/i })
      ).toBeDisabled();
    });
  });

  // ---- Close interactions ----

  describe('close interactions', () => {
    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderRegisterModal({ onClose });

      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find((b) => b.className.includes('absolute'));
      await userEvent.click(xButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears fields on close', async () => {
      renderRegisterModal();

      await userEvent.type(getUsernameInput(), 'johndoe');
      await userEvent.type(getEmailInput(), 'john@test.com');

      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find((b) => b.className.includes('absolute'));
      await userEvent.click(xButton!);

      expect(getUsernameInput().value).toBe('');
      expect(getEmailInput().value).toBe('');
    });

    it('calls onSwitchToLogin on "Login here" click', async () => {
      const onSwitchToLogin = vi.fn();
      renderRegisterModal({ onSwitchToLogin });

      await userEvent.click(screen.getByRole('button', { name: /login here/i }));

      expect(onSwitchToLogin).toHaveBeenCalledTimes(1);
    });

    it('closes on overlay click', async () => {
      const onClose = vi.fn();
      const { container } = renderRegisterModal({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the modal', async () => {
      const onClose = vi.fn();
      renderRegisterModal({ onClose });

      await userEvent.click(screen.getByText(/join our community/i));

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});