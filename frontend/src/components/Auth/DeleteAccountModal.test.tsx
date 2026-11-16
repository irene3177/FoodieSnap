import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteAccountModal from './DeleteAccountModal';
import { useScrollLock } from '@/hooks';

// ---------- Mocks ----------

vi.mock('@/hooks', () => ({
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

// ---------- Helpers ----------

const renderModal = (props: Partial<React.ComponentProps<typeof DeleteAccountModal>> = {}) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isDeleting: false,
  };

  const mergedProps = { ...defaults, ...props };
  const utils = render(<DeleteAccountModal {...mergedProps} />);

  return { ...utils, ...mergedProps };
};

// ---------- Tests ----------

describe('DeleteAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useScrollLock as any).mockReturnValue(undefined);
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument();
    });

    it('renders content when isOpen=true', () => {
      renderModal({ isOpen: true });

      expect(
        screen.getByRole('heading', { name: /delete account/i })
      ).toBeInTheDocument();
    });

    it('renders the warning text with consequences', () => {
      renderModal();

      expect(
        screen.getByText(/are you sure you want to delete your account/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/delete all your recipes/i)).toBeInTheDocument();
      expect(screen.getByText(/delete all your comments/i)).toBeInTheDocument();
      expect(screen.getByText(/remove you from favorites lists/i)).toBeInTheDocument();
      expect(screen.getByText(/permanently delete your profile/i)).toBeInTheDocument();
    });

    it('renders in a portal attached to document.body', () => {
      const { baseElement } = renderModal();

      const heading = screen.getByRole('heading', { name: /delete account/i });
      expect(baseElement.contains(heading)).toBe(true);
    });
  });

  // ---- Overlay click ----

  describe('overlay click', () => {
    it('calls onClose when clicking the overlay', () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose when clicking inside the modal content', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const heading = screen.getByRole('heading', { name: /delete account/i });
      await userEvent.click(heading);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- Buttons ----

  describe('buttons', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Confirm is clicked', async () => {
      const onConfirm = vi.fn();
      renderModal({ onConfirm });

      await userEvent.click(
        screen.getByRole('button', { name: /yes, delete my account/i })
      );

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close (X) button is clicked', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /close modal/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- isDeleting ----

  describe('isDeleting', () => {
    it('enables the confirm button by default', () => {
      renderModal({ isDeleting: false });

      const confirmButton = screen.getByRole('button', {
        name: /yes, delete my account/i,
      });
      expect(confirmButton).not.toBeDisabled();
    });

    it('disables the confirm button when isDeleting=true', () => {
      renderModal({ isDeleting: true });

      const confirmButton = screen.getByRole('button', {
        name: /yes, delete my account/i,
      });
      expect(confirmButton).toBeDisabled();
    });

    it('does not fire onConfirm when clicking disabled confirm', async () => {
      const onConfirm = vi.fn();
      renderModal({ isDeleting: true, onConfirm });

      const confirmButton = screen.getByRole('button', {
        name: /yes, delete my account/i,
      });

      await userEvent.click(confirmButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('does not disable the cancel button while deleting', () => {
      renderModal({ isDeleting: true });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).not.toBeDisabled();
    });
  });

  // ---- useScrollLock ----

  describe('useScrollLock', () => {
    it('is called with isOpen=true', () => {
      renderModal({ isOpen: true });

      expect(useScrollLock).toHaveBeenCalledWith(true);
    });

    it('is called with isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(useScrollLock).toHaveBeenCalledWith(false);
    });
  });
});