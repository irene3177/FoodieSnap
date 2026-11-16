import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreparationSection } from './PreparationSection';

// ---------- Mocks ----------

vi.mock('@/constants', () => ({
  DIFFICULTY_OPTIONS: [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ],
}));

// ---------- Render helper ----------

const renderSection = (
  props: Partial<React.ComponentProps<typeof PreparationSection>> = {}
) => {
  const defaults = {
    cookingTime: 30,
    difficulty: 'easy' as const,
    onCookingTimeChange: vi.fn(),
    onDifficultyChange: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<PreparationSection {...merged} />);
  return { ...utils, ...merged };
};

const getTimeInput = () =>
  screen.getByRole('spinbutton') as HTMLInputElement;

// ---------- Tests ----------

describe('PreparationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders section heading', () => {
      renderSection();

      expect(
        screen.getByRole('heading', { name: /preparation/i })
      ).toBeInTheDocument();
    });

    it('renders time input with current value', () => {
      renderSection({ cookingTime: 45 });

      expect(getTimeInput().value).toBe('45');
    });

    it('time input has min=1', () => {
      renderSection();

      expect(getTimeInput()).toHaveAttribute('min', '1');
    });

    it('renders all difficulty buttons', () => {
      renderSection();

      expect(screen.getByRole('button', { name: /easy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hard/i })).toBeInTheDocument();
    });
  });

  // ---- Cooking time ----

  describe('cooking time', () => {
    it('calls onCookingTimeChange with parsed number', () => {
      const onCookingTimeChange = vi.fn();
      renderSection({ onCookingTimeChange });

      fireEvent.change(getTimeInput(), { target: { value: '60' } });

      expect(onCookingTimeChange).toHaveBeenCalledWith(60);
    });

    it('calls with 0 when input is empty', () => {
      const onCookingTimeChange = vi.fn();
      renderSection({ onCookingTimeChange });

      fireEvent.change(getTimeInput(), { target: { value: '' } });

      expect(onCookingTimeChange).toHaveBeenCalledWith(0);
    });

    it('calls with 0 when input is invalid', () => {
      const onCookingTimeChange = vi.fn();
      renderSection({ onCookingTimeChange });

      fireEvent.change(getTimeInput(), { target: { value: 'abc' } });

      expect(onCookingTimeChange).toHaveBeenCalledWith(0);
    });
  });

  // ---- Difficulty ----

  describe('difficulty', () => {
    it('applies active class to selected difficulty', () => {
      renderSection({ difficulty: 'medium' });

      const mediumButton = screen.getByRole('button', { name: /medium/i });
      expect(mediumButton.className).toContain('bg-accent-secondary-bg');
    });

    it('does not apply active class to non-selected difficulties', () => {
      renderSection({ difficulty: 'medium' });

      const easyButton = screen.getByRole('button', { name: /easy/i });
      expect(easyButton.className).not.toContain('bg-accent-secondary-bg');
    });

    it('calls onDifficultyChange with value on click', async () => {
      const onDifficultyChange = vi.fn();
      renderSection({ onDifficultyChange });

      await userEvent.click(screen.getByRole('button', { name: /hard/i }));

      expect(onDifficultyChange).toHaveBeenCalledWith('hard');
    });
  });
});