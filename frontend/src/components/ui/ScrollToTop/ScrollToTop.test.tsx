import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrollToTop } from './ScrollToTop';

// ---------- Helpers ----------

const setScrollY = (value: number) => {
  Object.defineProperty(window, 'scrollY', {
    value,
    writable: true,
    configurable: true,
  });
};

const fireScroll = () => {
  fireEvent.scroll(window);
};

// ---------- Tests ----------

describe('ScrollToTop', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setScrollY(0);
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('does not render when scrollY=0', () => {
      setScrollY(0);
      render(<ScrollToTop />);

      expect(
        screen.queryByRole('button', { name: /scroll to top/i })
      ).not.toBeInTheDocument();
    });

    it('does not render when scrollY < threshold', () => {
      setScrollY(100);
      render(<ScrollToTop threshold={300} />);

      expect(
        screen.queryByRole('button', { name: /scroll to top/i })
      ).not.toBeInTheDocument();
    });

    it('renders when scrollY > threshold', () => {
      setScrollY(500);
      render(<ScrollToTop threshold={300} />);

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toBeInTheDocument();
    });

    it('renders when scrollY === threshold + 1', () => {
      setScrollY(301);
      render(<ScrollToTop threshold={300} />);

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toBeInTheDocument();
    });

    it('does not render when scrollY === threshold', () => {
      setScrollY(300);
      render(<ScrollToTop threshold={300} />);

      expect(
        screen.queryByRole('button', { name: /scroll to top/i })
      ).not.toBeInTheDocument();
    });
  });

  // ---- showAfter ----

  describe('showAfter', () => {
    it('showAfter overrides threshold', () => {
      setScrollY(250);
      render(<ScrollToTop threshold={100} showAfter={300} />);

      // scrollY=250 < showAfter=300 → hidden, even though threshold=100
      expect(
        screen.queryByRole('button', { name: /scroll to top/i })
      ).not.toBeInTheDocument();
    });

    it('uses threshold when showAfter is undefined', () => {
      setScrollY(150);
      render(<ScrollToTop threshold={100} />);

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toBeInTheDocument();
    });
  });

  // ---- Scroll events ----

  describe('scroll events', () => {
    it('shows button when scrolling past threshold', () => {
      setScrollY(0);
      render(<ScrollToTop threshold={300} />);

      expect(
        screen.queryByRole('button', { name: /scroll to top/i })
      ).not.toBeInTheDocument();

      act(() => {
        setScrollY(500);
        fireScroll();
      });

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toBeInTheDocument();
    });

    it('hides button when scrolling back up', () => {
      setScrollY(500);
      render(<ScrollToTop threshold={300} />);

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toBeInTheDocument();

      act(() => {
        setScrollY(100);
        fireScroll();
      });

      expect(
        screen.queryByRole('button', { name: /scroll to top/i })
      ).not.toBeInTheDocument();
    });
  });

  // ---- ScrollTo behavior ----

  describe('scrollTo', () => {
    it('calls window.scrollTo with top:0 on click', async () => {
      setScrollY(500);
      render(<ScrollToTop />);

      await userEvent.click(
        screen.getByRole('button', { name: /scroll to top/i })
      );

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('uses custom behavior', async () => {
      setScrollY(500);
      render(<ScrollToTop behavior="auto" />);

      await userEvent.click(
        screen.getByRole('button', { name: /scroll to top/i })
      );

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto',
      });
    });
  });

  // ---- Cleanup ----

  describe('cleanup', () => {
    it('adds scroll listener on mount', () => {
      render(<ScrollToTop />);

      const scrollCalls = addSpy.mock.calls.filter(
        ([event]: string) => event === 'scroll'
      );
      expect(scrollCalls.length).toBeGreaterThan(0);
    });

    it('removes scroll listener on unmount', () => {
      const { unmount } = render(<ScrollToTop />);

      unmount();

      const scrollCalls = removeSpy.mock.calls.filter(
        ([event]: string) => event === 'scroll'
      );
      expect(scrollCalls.length).toBeGreaterThan(0);
    });
  });

  // ---- A11y ----

  describe('accessibility', () => {
    it('has aria-label', () => {
      setScrollY(500);
      render(<ScrollToTop />);

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toBeInTheDocument();
    });

    it('has title attribute', () => {
      setScrollY(500);
      render(<ScrollToTop />);

      expect(
        screen.getByRole('button', { name: /scroll to top/i })
      ).toHaveAttribute('title', 'Scroll to top');
    });
  });
});