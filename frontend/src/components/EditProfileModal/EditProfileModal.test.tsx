import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProfileModal from './EditProfileModal';
import { useAuth } from '@/hooks';
import { authApi } from '@/services/authApi';

// ---------- Hoisted mocks ----------

const { mockDispatch, mockShowToast } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useScrollLock: vi.fn(),
}));

vi.mock('@/store/store', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('@/store/toastSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/toastSlice')>();
  return {
    ...actual,
    showToast: mockShowToast,
  };
});

vi.mock('@/services/authApi');

vi.mock('@/components/ui', () => ({
  Avatar: ({ username, src }: { username?: string; src?: string }) => (
    <div
      data-testid="avatar"
      data-username={username}
      data-src={src || ''}
    />
  ),
}));

vi.mock('react-textarea-autosize', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { ...rest } = props;
      return <textarea ref={ref} {...rest} />;
    }),
  };
});

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Test data ----------

const mockUser = {
  _id: 'u1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
  bio: 'Hello world',
};

const mockRefreshUser = vi.fn();

const setupAuth = (user: typeof mockUser | null = mockUser) => {
  (useAuth as any).mockReturnValue({
    user,
    refreshUser: mockRefreshUser,
  });
};

// ---------- Query helpers ----------

const getUsernameInput = () =>
  screen.getByLabelText(/^username/i) as HTMLInputElement;

const getBioInput = () =>
  screen.getByLabelText(/^bio$/i) as HTMLTextAreaElement;

// ---------- Render helper ----------

const renderModal = (
  props: Partial<React.ComponentProps<typeof EditProfileModal>> = {}
) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<EditProfileModal {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('EditProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    (authApi.updateProfile as any).mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(
        screen.queryByRole('heading', { name: /edit profile/i })
      ).not.toBeInTheDocument();
    });

    it('renders the form when isOpen=true', () => {
      renderModal();

      expect(
        screen.getByRole('heading', { name: /edit profile/i })
      ).toBeInTheDocument();
      expect(getUsernameInput()).toBeInTheDocument();
      expect(getBioInput()).toBeInTheDocument();
    });
  });

  // ---- Initialization ----

  describe('initialization', () => {
    it('initializes fields from user', () => {
      renderModal();

      expect(getUsernameInput().value).toBe('alice');
      expect(getBioInput().value).toBe('Hello world');
    });

    it('renders avatar with current avatar url', () => {
      renderModal();

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-src',
        'alice.jpg'
      );
    });

    it('initializes with empty fields when user has no bio', () => {
      setupAuth({ ...mockUser, bio: '' });
      renderModal();

      expect(getBioInput().value).toBe('');
    });

    it('updates avatar username prop as username changes', async () => {
      renderModal();

      await userEvent.clear(getUsernameInput());
      await userEvent.type(getUsernameInput(), 'new-alice');

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-username',
        'new-alice'
      );
    });
  });

  // ---- Bio counter ----

  describe('bio counter', () => {
    it('shows character count', () => {
      setupAuth({ ...mockUser, bio: '' });
      renderModal();

      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });

    it('updates as bio changes', async () => {
      setupAuth({ ...mockUser, bio: '' });
      renderModal();

      await userEvent.type(getBioInput(), 'Hello');

      expect(screen.getByText('5/200 characters')).toBeInTheDocument();
    });
  });

  // ---- Validation ----

  describe('validation', () => {
    it('submit is disabled when username is empty', async () => {
      renderModal();

      await userEvent.clear(getUsernameInput());

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows toast when submitting with only whitespace in username', async () => {
      renderModal();

      await userEvent.clear(getUsernameInput());
      await userEvent.type(getUsernameInput(), '   ');

      // Submit manually via form (button may be enabled due to trim check not being on whitespace)
      const form = getUsernameInput().closest('form') as HTMLFormElement;
      fireEvent.submit(form);

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Username is required',
        type: 'error',
      });
      expect(authApi.updateProfile).not.toHaveBeenCalled();
    });
  });

  // ---- Submit ----

  describe('submit', () => {
    it('calls authApi.updateProfile with trimmed values', async () => {
      renderModal();

      await userEvent.clear(getUsernameInput());
      await userEvent.type(getUsernameInput(), '  new-alice  ');

      await userEvent.clear(getBioInput());
      await userEvent.type(getBioInput(), '  New bio  ');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(authApi.updateProfile).toHaveBeenCalledWith({
          username: 'new-alice',
          bio: 'New bio',
        });
      });
    });

    it('passes bio as undefined when empty', async () => {
      renderModal();

      await userEvent.clear(getBioInput());

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(authApi.updateProfile).toHaveBeenCalledWith({
          username: 'alice',
          bio: undefined,
        });
      });
    });

    it('on success: shows toast, calls refreshUser, onSuccess, onClose', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      renderModal({ onClose, onSuccess });

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Profile updated successfully!',
        type: 'success',
      });
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('on success=false: shows error toast, does NOT close', async () => {
      (authApi.updateProfile as any).mockResolvedValue({
        success: false,
        error: 'Username already taken',
      });

      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Username already taken',
          type: 'error',
        });
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('on success=false without message: shows fallback error', async () => {
      (authApi.updateProfile as any).mockResolvedValue({
        success: false,
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Failed to update profile',
          type: 'error',
        });
      });
    });

    it('on API throw: shows fallback error toast', async () => {
      (authApi.updateProfile as any).mockRejectedValue(new Error('Network error'));

      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Failed to update profile',
          type: 'error',
        });
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- Loading ----

  describe('loading state', () => {
    it('shows spinner and disables buttons while loading', async () => {
      // Never resolves — keeps loading=true
      (authApi.updateProfile as any).mockImplementation(() => new Promise(() => {}));

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ---- Close interactions ----

  describe('close interactions', () => {
    it('calls onClose on Cancel click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      // X button has no accessible name — find it by its absolute class
      const allButtons = screen.getAllByRole('button');
      const xButton = allButtons.find((b) => b.className.includes('w-8 h-8'));
      expect(xButton).toBeDefined();

      await userEvent.click(xButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on overlay click', () => {
      const onClose = vi.fn();
      const { container } = renderModal({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside the modal', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(
        screen.getByRole('heading', { name: /edit profile/i })
      );

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});