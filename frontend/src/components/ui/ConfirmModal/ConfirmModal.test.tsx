import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';
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
        const { ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Render helper ----------

const renderModal = (
  props: Partial<React.ComponentProps<typeof ConfirmModal>> = {}
) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Recipe?',
    body: 'Are you sure you want to delete this recipe?',
    label: 'Yes, Delete',
    isDeleting: false,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<ConfirmModal {...merged} />);
  return { ...utils, ...merged };
};

const getCancelButton = () =>
  screen.getByRole('button', { name: /cancel/i });

const getConfirmButton = (label = /yes, delete/i) =>
  screen.getByRole('button', { name: label });

// ---------- Tests ----------

describe('ConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(
        screen.queryByRole('heading', { name: /delete recipe\?/i })
      ).not.toBeInTheDocument();
    });

    it('renders content when isOpen=true', () => {
      renderModal({ isOpen: true });

      expect(
        screen.getByRole('heading', { name: /delete recipe\?/i })
      ).toBeInTheDocument();
    });
  });

  // ---- Content ----

  describe('content', () => {
    it('renders the title', () => {
      renderModal({ title: 'Confirm Action' });

      expect(
        screen.getByRole('heading', { name: 'Confirm Action' })
      ).toBeInTheDocument();
    });

    it('renders body as string', () => {
      renderModal({ body: 'Plain string body' });

      expect(screen.getByText('Plain string body')).toBeInTheDocument();
    });

    it('renders body as ReactNode', () => {
      renderModal({
        body: (
          <div>
            <p>Custom node 1</p>
            <p>Custom node 2</p>
          </div>
        ),
      });

      expect(screen.getByText('Custom node 1')).toBeInTheDocument();
      expect(screen.getByText('Custom node 2')).toBeInTheDocument();
    });

    it('uses custom label for confirm button', () => {
      renderModal({ label: 'Delete Forever' });

      expect(
        screen.getByRole('button', { name: 'Delete Forever' })
      ).toBeInTheDocument();
    });
  });

  // ---- Portal ----

  describe('portal', () => {
    it('renders into document.body', () => {
      const { baseElement } = renderModal();

      const modal = screen.getByRole('heading', { name: /delete recipe\?/i });
      expect(baseElement.contains(modal)).toBe(true);
    });

    it('does not render into the React container', () => {
      const { container } = renderModal();

      // The React container (from render) should be empty — content is in portal
      expect(container.firstChild).toBeNull();
    });
  });

  // ---- Close interactions ----

  describe('close interactions', () => {
    it('calls onClose on Cancel click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(getCancelButton());

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on overlay click', () => {
      const onClose = vi.fn();
      const { baseElement } = renderModal({ onClose });

      const overlay = baseElement.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside modal', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      // Click on heading (inside modal content)
      await userEvent.click(
        screen.getByRole('heading', { name: /delete recipe\?/i })
      );

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      // X button has no aria-label — find by class
      const allButtons = screen.getAllByRole('button');
      const xButton = allButtons.find((b) => b.className.includes('w-8 h-8'));
      expect(xButton).toBeDefined();

      await userEvent.click(xButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Confirm ----

  describe('confirm', () => {
    it('calls onConfirm on Confirm click', async () => {
      const onConfirm = vi.fn();
      renderModal({ onConfirm });

      await userEvent.click(getConfirmButton());

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Confirm click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(getConfirmButton());

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- isDeleting ----

  describe('isDeleting', () => {
    it('Confirm is enabled by default', () => {
      renderModal({ isDeleting: false });

      expect(getConfirmButton()).not.toBeDisabled();
    });

    it('Confirm is disabled when isDeleting=true', () => {
      renderModal({ isDeleting: true });

      expect(getConfirmButton()).toBeDisabled();
    });

    it('Cancel is not disabled when isDeleting=true', () => {
      renderModal({ isDeleting: true });

      expect(getCancelButton()).not.toBeDisabled();
    });

    it('does not fire onConfirm when Confirm is disabled', async () => {
      const onConfirm = vi.fn();
      renderModal({ isDeleting: true, onConfirm });

      await userEvent.click(getConfirmButton());

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  // ---- useScrollLock ----

  describe('scroll lock', () => {
    it('calls useScrollLock(isOpen)', () => {
      renderModal({ isOpen: true });

      expect(useScrollLock).toHaveBeenCalledWith(true);
    });

    it('calls useScrollLock(false) when closed', () => {
      renderModal({ isOpen: false });

      expect(useScrollLock).toHaveBeenCalledWith(false);
    });
  });
});