import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButtons from './ShareButtons';

// ---------- Mocks ----------

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      button: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <button ref={ref} {...rest} />;
      }),
      div: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Test data ----------

const defaultProps = {
  title: 'Pasta Carbonara',
  url: '/recipe/r1',
  description: 'A classic Italian dish',
  image: 'https://example.com/pasta.jpg',
};

// ---------- Render helper ----------

const renderShare = (
  props: Partial<React.ComponentProps<typeof ShareButtons>> = {}
) => {
  const merged = { ...defaultProps, ...props };
  const utils = render(<ShareButtons {...merged} />);
  return { ...utils, ...merged };
};

const getButton = (name: 'Twitter' | 'Facebook' | 'Pinterest' | 'Copy') =>
  screen.getByRole('button', { name });

// ---------- Tests ----------

describe('ShareButtons', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders all 4 buttons', () => {
      renderShare();

      expect(getButton('Twitter')).toBeInTheDocument();
      expect(getButton('Facebook')).toBeInTheDocument();
      expect(getButton('Pinterest')).toBeInTheDocument();
      expect(getButton('Copy')).toBeInTheDocument();
    });

    it('renders "Share this recipe:" label', () => {
      renderShare();

      expect(screen.getByText(/share this recipe/i)).toBeInTheDocument();
    });

    it('uses origin + url for full URL', () => {
      renderShare();

      // We'll verify by clicking Twitter and inspecting the URL
      fireEvent.click(getButton('Twitter'));

      const calledUrl = openSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain(
        encodeURIComponent(`${window.location.origin}/recipe/r1`)
      );
    });
  });

  // ---- Twitter ----

  describe('twitter', () => {
    it('opens twitter share URL on click', () => {
      renderShare();

      fireEvent.click(getButton('Twitter'));

      expect(openSpy).toHaveBeenCalledTimes(1);
      const [url, target, features] = openSpy.mock.calls[0];
      expect(url).toContain('https://twitter.com/intent/tweet?');
      expect(url).toContain(`text=${encodeURIComponent('Pasta Carbonara')}`);
      expect(target).toBe('_blank');
      expect(features).toContain('width=600');
      expect(features).toContain('height=400');
    });
  });

  // ---- Facebook ----

  describe('facebook', () => {
    it('opens facebook share URL on click', () => {
      renderShare();

      fireEvent.click(getButton('Facebook'));

      const url = openSpy.mock.calls[0][0] as string;
      expect(url).toContain('https://www.facebook.com/sharer/sharer.php?');
      expect(url).toContain(
        `u=${encodeURIComponent(`${window.location.origin}/recipe/r1`)}`
      );
    });
  });

  // ---- Pinterest ----

  describe('pinterest', () => {
    it('opens pinterest with media when image is provided', () => {
      renderShare({ image: 'https://example.com/pasta.jpg' });

      fireEvent.click(getButton('Pinterest'));

      const url = openSpy.mock.calls[0][0] as string;
      expect(url).toContain('https://pinterest.com/pin/create/button/?');
      expect(url).toContain(`media=${encodeURIComponent('https://example.com/pasta.jpg')}`);
      expect(url).toContain(`description=${encodeURIComponent('A classic Italian dish')}`);
    });

    it('does not open when image is missing', () => {
      renderShare({ image: undefined });

      fireEvent.click(getButton('Pinterest'));

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('uses title as description fallback', () => {
      renderShare({ description: undefined, image: 'https://example.com/img.jpg' });

      fireEvent.click(getButton('Pinterest'));

      const url = openSpy.mock.calls[0][0] as string;
      expect(url).toContain(`description=${encodeURIComponent('Pasta Carbonara')}`);
    });
  });

  // ---- Copy ----

  describe('copy', () => {
    it('copies full URL to clipboard on click', async () => {
      renderShare();

      fireEvent.click(getButton('Copy'));

      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/recipe/r1`
      );
    });

    it('does not call window.open for copy', () => {
      renderShare();

      fireEvent.click(getButton('Copy'));

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('shows "Link copied!" tooltip after copy', async () => {
      renderShare();

      fireEvent.click(getButton('Copy'));

      await waitFor(() => {
        expect(screen.getByText(/link copied!/i)).toBeInTheDocument();
      });
    });
  });

  // ---- Tooltips ----

  describe('tooltips', () => {
    it('shows tooltip on hover with platform name', async () => {
      renderShare();

      fireEvent.mouseEnter(getButton('Twitter'));

      await waitFor(() => {
        expect(screen.getByText('Share on Twitter')).toBeInTheDocument();
      });
    });

    it('shows correct tooltip per platform', async () => {
      renderShare();

      fireEvent.mouseEnter(getButton('Facebook'));

      await waitFor(() => {
        expect(screen.getByText('Share on Facebook')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      renderShare();

      fireEvent.mouseEnter(getButton('Twitter'));

      await waitFor(() => {
        expect(screen.getByText('Share on Twitter')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(getButton('Twitter'));

      await waitFor(() => {
        expect(screen.queryByText('Share on Twitter')).not.toBeInTheDocument();
      });
    });

    it('shows "Copy link" tooltip for copy button before click', async () => {
      renderShare();

      fireEvent.mouseEnter(getButton('Copy'));

      await waitFor(() => {
        expect(screen.getByText('Copy link')).toBeInTheDocument();
      });
    });
  });
});