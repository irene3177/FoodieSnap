import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChangePasswordModal from './ChangePasswordModal';
import toastReducer from '@/store/toastSlice';

// ---------- Hoisted mocks ----------

const { mockDispatch, mockChangePasswordThunk, mockShowToast } = vi.hoisted(() => {
  const mockChangePasswordThunk = vi.fn((data: any) => ({
    type: 'auth/changePassword',
    payload: data,
  }));

  return {
    mockDispatch: vi.fn(),
    mockChangePasswordThunk,
    mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
  };
});

vi.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  showToast: mockShowToast,
  changePassword: mockChangePasswordThunk,
}));

vi.mock('@/hooks/useScrollLock', () => ({
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

const getCurrentPasswordInput = () =>
  screen.getByLabelText(/^current password$/i) as HTMLInputElement;

const getNewPasswordInput = () =>
  screen.getByLabelText(/^new password$/i) as HTMLInputElement;

const getConfirmPasswordInput = () =>
  screen.getByLabelText(/^confirm new password$/i) as HTMLInputElement;

const getForm = () =>
  getCurrentPasswordInput().closest('form') as HTMLFormElement;

// Submit programmatically to bypass HTML5 required validation
const submitForm = () => fireEvent.submit(getForm());

// ---------- Test store / render ----------

const createTestStore = () =>
  configureStore({ reducer: { toast: toastReducer } });

const renderModal = (
  props: Partial<React.ComponentProps<typeof ChangePasswordModal>> = {}
) => {
  const store = createTestStore();
  const defaults = { isOpen: true, onClose: vi.fn() };
  const merged = { ...defaults, ...props };

  const utils = render(
    <Provider store={store}>
      <ChangePasswordModal {...merged} />
    </Provider>
  );

  return { ...utils, ...merged, store };
};

// Helper to build a dispatch return with `.unwrap()`
const makeDispatchReturn = (result: any, shouldReject = false) => ({
  unwrap: shouldReject
    ? vi.fn().mockRejectedValue(result)
    : vi.fn().mockResolvedValue(result),
  type: 'auth/changePassword',
});

// ---------- Tests ----------

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(
        screen.queryByRole('heading', { name: /change password/i })
      ).not.toBeInTheDocument();
    });

    it('renders the form when isOpen=true', () => {
      renderModal();

      expect(
        screen.getByRole('heading', { name: /change password/i })
      ).toBeInTheDocument();
      expect(getCurrentPasswordInput()).toBeInTheDocument();
      expect(getNewPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
    });
  });

  // ---- Input ----

  describe('input handling', () => {
    it('updates all three password fields', async () => {
      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'newpass123');

      expect(getCurrentPasswordInput().value).toBe('oldpass');
      expect(getNewPasswordInput().value).toBe('newpass123');
      expect(getConfirmPasswordInput().value).toBe('newpass123');
    });

    it('toggles visibility for current password independently', async () => {
      renderModal();

      expect(getCurrentPasswordInput().type).toBe('password');

      const toggles = screen.getAllByRole('button', { name: /show password/i });
      await userEvent.click(toggles[0]);

      expect(getCurrentPasswordInput().type).toBe('text');
      expect(getNewPasswordInput().type).toBe('password');
      expect(getConfirmPasswordInput().type).toBe('password');
    });
  });

  // ---- Validation ----

  describe('validation', () => {
    it('shows toast when current password is empty', async () => {
      renderModal();

      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'newpass123');

      submitForm();

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Current password is required',
        type: 'error',
      });
      expect(mockChangePasswordThunk).not.toHaveBeenCalled();
    });

    it('shows toast when new password is empty', async () => {
      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');

      submitForm();

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'New password is required',
        type: 'error',
      });
    });

    it('shows toast when new password is too short', async () => {
      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), '12345');
      await userEvent.type(getConfirmPasswordInput(), '12345');

      submitForm();

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Password must be at least 6 characters',
        type: 'error',
      });
    });

    it('shows toast when passwords do not match', async () => {
      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'different');

      submitForm();

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Passwords do not match',
        type: 'error',
      });
    });

    it('shows toast when new password equals current password', async () => {
      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'samepass');
      await userEvent.type(getNewPasswordInput(), 'samepass');
      await userEvent.type(getConfirmPasswordInput(), 'samepass');

      submitForm();

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'New password must be different from current password',
        type: 'error',
      });
    });

    it('does not dispatch changePassword when validation fails', async () => {
      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), '123');
      await userEvent.type(getConfirmPasswordInput(), '123');

      submitForm();

      expect(mockChangePasswordThunk).not.toHaveBeenCalled();
    });
  });

  // ---- Mismatch indicator ----

  describe('mismatch indicator', () => {
    it('shows "Passwords do not match" when confirm differs', async () => {
      renderModal();

      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'different');

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('does not show indicator when confirm is empty', async () => {
      renderModal();

      await userEvent.type(getNewPasswordInput(), 'newpass123');

      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });

    it('hides indicator when passwords match', async () => {
      renderModal();

      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'different');
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

      await userEvent.clear(getConfirmPasswordInput());
      await userEvent.type(getConfirmPasswordInput(), 'newpass123');
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });
  });

  // ---- Submit ----

  describe('submit', () => {
    const fillValidForm = async () => {
      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'newpass123');
    };

    it('dispatches changePassword with correct data', async () => {
      mockDispatch.mockReturnValueOnce(
        makeDispatchReturn({ success: true, message: 'ok' })
      );

      renderModal();
      await fillValidForm();

      submitForm();

      await vi.waitFor(() => {
        expect(mockChangePasswordThunk).toHaveBeenCalledWith({
          currentPassword: 'oldpass',
          newPassword: 'newpass123',
        });
      });
    });

    it('shows success toast and closes on success', async () => {
      mockDispatch.mockReturnValueOnce(
        makeDispatchReturn({ success: true, message: 'ok' })
      );

      const onClose = vi.fn();
      renderModal({ onClose });
      await fillValidForm();

      submitForm();

      await vi.waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Password changed successfully!',
        type: 'success',
      });
    });

    it('does not close on rejected dispatch', async () => {
      mockDispatch.mockReturnValueOnce(
        makeDispatchReturn(new Error('Wrong current password'), true)
      );

      const onClose = vi.fn();
      renderModal({ onClose });
      await fillValidForm();

      submitForm();

      await vi.waitFor(() => {
        expect(mockChangePasswordThunk).toHaveBeenCalled();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- Loading ----

  describe('loading state', () => {
    it('disables buttons while submitting', async () => {
      // Never resolves — keeps loading=true
      mockDispatch.mockReturnValueOnce({
        unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
        type: 'auth/changePassword',
      });

      renderModal();

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'newpass123');

      submitForm();

      await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      const submitButton = screen.getByRole('button', { name: /changing/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ---- Close interactions ----

  describe('close interactions', () => {
    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const allButtons = screen.getAllByRole('button');
      const xButton = allButtons.find((b) => b.className.includes('w-8 h-8'));
      expect(xButton).toBeDefined();

      await userEvent.click(xButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on Cancel click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears fields after close', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');
      await userEvent.type(getNewPasswordInput(), 'newpass123');
      await userEvent.type(getConfirmPasswordInput(), 'newpass123');

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(getCurrentPasswordInput().value).toBe('');
      expect(getNewPasswordInput().value).toBe('');
      expect(getConfirmPasswordInput().value).toBe('');
    });

    it('closes on overlay click', () => {
      const onClose = vi.fn();
      const { container } = renderModal({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears fields when isOpen changes to false', async () => {
      const { rerender } = render(
        <Provider store={createTestStore()}>
          <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      await userEvent.type(getCurrentPasswordInput(), 'oldpass');

      rerender(
        <Provider store={createTestStore()}>
          <ChangePasswordModal isOpen={false} onClose={vi.fn()} />
        </Provider>
      );

      rerender(
        <Provider store={createTestStore()}>
          <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      expect(getCurrentPasswordInput().value).toBe('');
    });
  });
});