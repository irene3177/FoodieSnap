import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';

// ---------- Mocks ----------

const { mockUseTheme } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

// ---------- Setup helper ----------

const mockToggleTheme = vi.fn();

const setupTheme = (isDark: boolean) => {
  mockUseTheme.mockReturnValue({
    toggleTheme: mockToggleTheme,
    isDark,
    theme: isDark ? 'dark' : 'light',
    setTheme: vi.fn(),
  });
};

// ---------- Render helper ----------

const renderToggle = (isDark: boolean) => {
  setupTheme(isDark);
  return render(<ThemeToggle />);
};

const getButton = () =>
  screen.getByRole('button', { name: /switch to/i });

// ---------- Tests ----------

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- aria-label / title ----

  describe('aria-label and title', () => {
    it('has aria-label "Switch to light mode" when dark', () => {
      renderToggle(true);

      expect(getButton()).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('has aria-label "Switch to dark mode" when light', () => {
      renderToggle(false);

      expect(getButton()).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );
    });

    it('has matching title attribute when dark', () => {
      renderToggle(true);

      expect(getButton()).toHaveAttribute(
        'title',
        'Switch to light mode'
      );
    });

    it('has matching title attribute when light', () => {
      renderToggle(false);

      expect(getButton()).toHaveAttribute(
        'title',
        'Switch to dark mode'
      );
    });
  });

  // ---- Click ----

  describe('click', () => {
    it('calls toggleTheme on click', async () => {
      renderToggle(false);

      await userEvent.click(getButton());

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('calls toggleTheme exactly once per click', async () => {
      renderToggle(false);

      await userEvent.click(getButton());
      await userEvent.click(getButton());

      expect(mockToggleTheme).toHaveBeenCalledTimes(2);
    });
  });

  // ---- Thumb position ----

  describe('thumb position', () => {
    it('thumb translated right when dark', () => {
      const { container } = renderToggle(true);

      // Thumb is the absolute-positioned element inside the pill
      const thumb = container.querySelector('.absolute.top-0\\.5') as HTMLElement;
      expect(thumb).not.toBeNull();
      expect(thumb.className).toContain('translate-x-[calc(100%+0.5rem)]');
      expect(thumb.className).not.toContain('-translate-x-0.5');
    });

    it('thumb translated left when light', () => {
      const { container } = renderToggle(false);

      const thumb = container.querySelector('.absolute.top-0\\.5') as HTMLElement;
      expect(thumb).not.toBeNull();
      expect(thumb.className).toContain('-translate-x-0.5');
      expect(thumb.className).not.toContain('translate-x-[calc(100%+0.5rem)]');
    });
  });

  // ---- Icon colors ----

  describe('icon colors', () => {
    it('sun icon uses "text-button" when light', () => {
      const { container } = renderToggle(false);

      // First svg is the sun
      const sunSvg = container.querySelectorAll('svg')[0] as SVGElement;
      expect(sunSvg.getAttribute('class')).toContain('text-button');
      expect(sunSvg.getAttribute('class')).not.toContain('text-muted');
    });

    it('sun icon uses "text-muted" when dark', () => {
      const { container } = renderToggle(true);

      const sunSvg = container.querySelectorAll('svg')[0] as SVGElement;
      expect(sunSvg.getAttribute('class')).toContain('text-muted');
      expect(sunSvg.getAttribute('class')).not.toContain('text-button');
    });

    it('moon icon uses "text-button" when dark', () => {
      const { container } = renderToggle(true);

      const moonSvg = container.querySelectorAll('svg')[1] as SVGElement;
      expect(moonSvg.getAttribute('class')).toContain('text-button');
      expect(moonSvg.getAttribute('class')).not.toContain('text-muted');
    });

    it('moon icon uses "text-muted" when light', () => {
      const { container } = renderToggle(false);

      const moonSvg = container.querySelectorAll('svg')[1] as SVGElement;
      expect(moonSvg.getAttribute('class')).toContain('text-muted');
      expect(moonSvg.getAttribute('class')).not.toContain('text-button');
    });
  });
});