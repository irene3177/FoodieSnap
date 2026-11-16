import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EmptyState from './EmptyState';

// ---------- Render helper ----------

const renderEmpty = (
  props: Partial<React.ComponentProps<typeof EmptyState>> = {}
) => {
  const defaults = {
    icon: <span data-testid="icon">🍳</span>,
  };
  const merged = { ...defaults, ...props };

  const utils = render(
    <MemoryRouter>
      <EmptyState {...merged} />
    </MemoryRouter>
  );
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Content ----

  describe('content', () => {
    it('renders title', () => {
      renderEmpty({ title: 'Nothing here' });

      expect(
        screen.getByRole('heading', { name: 'Nothing here' })
      ).toBeInTheDocument();
    });

    it('renders description', () => {
      renderEmpty({ description: 'Try again later' });

      expect(screen.getByText('Try again later')).toBeInTheDocument();
    });

    it('does not render title when undefined', () => {
      renderEmpty();

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('does not render description when undefined', () => {
      const { container } = renderEmpty({ title: 'X' });

      // The <p> for description should not be rendered
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('renders the icon', () => {
      renderEmpty();

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  // ---- Actions ----

  describe('primary action', () => {
    it('renders Link with label and href', () => {
      renderEmpty({
        action: {
          label: 'Explore',
          to: '/recipes',
        },
      });

      const link = screen.getByRole('link', { name: /explore/i });
      expect(link).toHaveAttribute('href', '/recipes');
    });

    it('renders action icon', () => {
      renderEmpty({
        action: {
          label: 'Explore',
          to: '/recipes',
          icon: <span data-testid="action-icon">→</span>,
        },
      });

      expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });

    it('passes state to Link', () => {
      renderEmpty({
        action: {
          label: 'Explore',
          to: '/recipes',
          state: { openSignUp: true },
        },
      });

      // state is not reflected in DOM, but at least render should not throw
      const link = screen.getByRole('link', { name: /explore/i });
      expect(link).toBeInTheDocument();
    });

    it('does not render Link when action is undefined', () => {
      renderEmpty();

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('secondary action', () => {
    it('renders button with label', () => {
      renderEmpty({
        secondaryAction: { label: 'Create Recipe', onClick: vi.fn() },
      });

      expect(
        screen.getByRole('button', { name: 'Create Recipe' })
      ).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const onClick = vi.fn();
      renderEmpty({ secondaryAction: { label: 'Go', onClick } });

      await userEvent.click(screen.getByRole('button', { name: 'Go' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not render button when secondaryAction is undefined', () => {
      renderEmpty();

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // ---- Icon sizes ----

  describe('iconSize', () => {
    it('uses lg by default', () => {
      const { container } = renderEmpty();

      // lg → w-48 h-48
      const iconCircle = container.querySelector('.glass-card');
      expect(iconCircle?.className).toContain('w-48');
    });

    it('applies sm size', () => {
      const { container } = renderEmpty({ iconSize: 'sm' });

      const iconCircle = container.querySelector('.glass-card');
      expect(iconCircle?.className).toContain('w-24');
    });

    it('applies md size', () => {
      const { container } = renderEmpty({ iconSize: 'md' });

      const iconCircle = container.querySelector('.glass-card');
      expect(iconCircle?.className).toContain('w-32');
    });
  });

  // ---- Mouse events (3D tilt) ----

  describe('3D tilt behavior', () => {
    let rafSpy: ReturnType<typeof vi.spyOn>;
    let cancelSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
        () => {
          return 1;
        }
      );
      cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    afterEach(() => {
      rafSpy.mockRestore();
      cancelSpy.mockRestore();
    });

    it('calls requestAnimationFrame on mount', () => {
      renderEmpty();

      expect(rafSpy).toHaveBeenCalled();
    });

    it('cancels animation on unmount', () => {
      const { unmount } = renderEmpty();

      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('does not throw on mouse move', () => {
      const { container } = renderEmpty();

      // Trigger mouse move on the icon container
      const iconWrapper = container.querySelector('.perspective-\\[1000px\\]') as HTMLElement;
      expect(iconWrapper).not.toBeNull();

      fireEvent.mouseMove(iconWrapper, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(iconWrapper);
    });
  });

  // ---- className ----

  describe('className', () => {
    it('applies custom className to root', () => {
      const { container } = renderEmpty({ className: 'my-custom' });

      const root = container.querySelector('.my-custom');
      expect(root).not.toBeNull();
    });
  });
});