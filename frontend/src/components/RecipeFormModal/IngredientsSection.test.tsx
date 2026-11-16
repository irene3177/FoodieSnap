import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { IngredientsSection } from './IngredientsSection';

// ---------- Mocks ----------

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      span: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <span ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Render helper ----------

const renderSection = (
  props: Partial<React.ComponentProps<typeof IngredientsSection>> = {}
) => {
  const defaults = {
    ingredients: [] as string[],
    ingredientInput: '',
    onIngredientInputChange: vi.fn(),
    onAddIngredient: vi.fn(),
    onRemoveIngredient: vi.fn(),
    onIngredientKeyDown: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<IngredientsSection {...merged} />);
  return { ...utils, ...merged };
};

const getInput = () =>
  screen.getByPlaceholderText(/e\.g\., 3 medium/i) as HTMLInputElement;

// ---------- Tests ----------

describe('IngredientsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders section heading', () => {
      renderSection();

      expect(
        screen.getByRole('heading', { name: /ingredients/i })
      ).toBeInTheDocument();
    });

    it('renders hint text with examples', () => {
      renderSection();

      expect(screen.getByText(/type an ingredient/i)).toBeInTheDocument();
      expect(screen.getByText(/3 Medium Potatoes/i)).toBeInTheDocument();
      expect(screen.getByText(/1 tbsp Olive Oil/i)).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
      renderSection();

      expect(getInput()).toBeInTheDocument();
      expect(getInput()).toHaveAttribute(
        'placeholder',
        'e.g., 3 Medium Potatoes, 1 tbsp Olive Oil...'
      );
    });

    it('renders input with current value', () => {
      renderSection({ ingredientInput: '3 Potatoes' });

      expect(getInput().value).toBe('3 Potatoes');
    });
  });

  // ---- Input callbacks ----

  describe('input callbacks', () => {
    it('calls onIngredientInputChange on typing', async () => {
      const onIngredientInputChange = vi.fn();
      renderSection({ onIngredientInputChange });

      await userEvent.type(getInput(), 'P');

      expect(onIngredientInputChange).toHaveBeenCalledWith('P');
    });

    it('calls onIngredientKeyDown on Enter', async () => {
      const onIngredientKeyDown = vi.fn();
      renderSection({ onIngredientKeyDown });

      await userEvent.type(getInput(), '{Enter}');

      expect(onIngredientKeyDown).toHaveBeenCalled();
      const call = onIngredientKeyDown.mock.calls[0][0];
      expect(call.key).toBe('Enter');
    });

    it('calls onIngredientKeyDown on comma', async () => {
      const onIngredientKeyDown = vi.fn();
      renderSection({ onIngredientKeyDown });

      await userEvent.type(getInput(), ',');

      expect(onIngredientKeyDown).toHaveBeenCalled();
    });
  });

  // ---- forwardRef ----

  describe('forwardRef', () => {
    it('forwards ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      renderSection({ ref });

      expect(ref.current).toBe(getInput());
    });
  });

  // ---- Chips ----

  describe('chips', () => {
    it('does not render chips when ingredients is empty', () => {
      renderSection({ ingredients: [] });

      expect(
        screen.queryByRole('button', { name: /^remove/i })
      ).not.toBeInTheDocument();
    });

    it('renders all ingredients as chips', () => {
      renderSection({
        ingredients: ['Flour', 'Eggs', 'Sugar'],
      });

      expect(screen.getByText('Flour')).toBeInTheDocument();
      expect(screen.getByText('Eggs')).toBeInTheDocument();
      expect(screen.getByText('Sugar')).toBeInTheDocument();
    });

    it('renders remove button for each chip', () => {
      renderSection({ ingredients: ['3 Potatoes', '1 tbsp Olive Oil'] });

      expect(
        screen.getByRole('button', { name: /remove 3 potatoes/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /remove 1 tbsp olive oil/i })
      ).toBeInTheDocument();
    });

    it('calls onRemoveIngredient with correct index', async () => {
      const onRemoveIngredient = vi.fn();
      renderSection({
        ingredients: ['First', 'Second', 'Third'],
        onRemoveIngredient,
      });

      await userEvent.click(
        screen.getByRole('button', { name: /remove second/i })
      );

      expect(onRemoveIngredient).toHaveBeenCalledWith(1);
    });

    it('calls onRemoveIngredient with index 0 for first chip', async () => {
      const onRemoveIngredient = vi.fn();
      renderSection({
        ingredients: ['First', 'Second'],
        onRemoveIngredient,
      });

      await userEvent.click(
        screen.getByRole('button', { name: /remove first/i })
      );

      expect(onRemoveIngredient).toHaveBeenCalledWith(0);
    });
  });
});