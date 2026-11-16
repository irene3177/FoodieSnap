import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeCard from './RecipeCard';
import type { Recipe } from '@/types';

// ---------- Mocks ----------

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/FavoriteButton/BookmarkButton', () => ({
  default: ({ recipe }: { recipe: Recipe }) => (
    <button data-testid="bookmark-button" data-id={recipe._id} />
  ),
}));

vi.mock('@/components/RatingStars/RatingStars', () => ({
  default: ({ interactive }: { interactive?: boolean }) => (
    <div data-testid="rating-stars" data-interactive={String(!!interactive)} />
  ),
}));

vi.mock('@/components/RecipeActions/RecipeActions', () => ({
  default: ({ recipe, isOwner, onEdit, onDelete }: any) => (
    <div
      data-testid="recipe-actions"
      data-id={recipe._id}
      data-owner={String(!!isOwner)}
      data-has-edit={String(!!onEdit)}
      data-has-delete={String(!!onDelete)}
    />
  ),
}));

// ---------- Test data ----------

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  _id: 'r1',
  title: 'Pasta Carbonara',
  description: '',
  ingredients: ['pasta', 'eggs', 'bacon'],
  instructions: [],
  imageUrl: 'https://example.com/pasta.jpg',
  category: 'Italian',
  cookingTime: 30,
  difficulty: 'easy',
  rating: 4.5,
  ratingCount: 10,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

// ---------- Render helper ----------

const renderCard = (
  props: Partial<React.ComponentProps<typeof RecipeCard>> = {}
) => {
  const defaults = {
    recipe: makeRecipe(),
    onEdit: undefined,
    onDelete: undefined,
    isOwner: false,
    aspectRatio: 'square' as const,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<RecipeCard {...merged} />);
  return { ...utils, ...merged };
};

const getCard = () =>
  screen.getByRole('button', { name: /view details for/i });

// ---------- Tests ----------

describe('RecipeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders title', () => {
      renderCard();

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    it('renders image with alt text', () => {
      renderCard();

      const img = screen.getByAltText('Pasta Carbonara') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('pasta.jpg');
    });

    it('renders category badge when category is present', () => {
      renderCard();

      expect(screen.getByText('Italian')).toBeInTheDocument();
    });

    it('does not render badge when category is missing', () => {
      renderCard({ recipe: makeRecipe({ category: undefined }) });

      expect(screen.queryByText('Italian')).not.toBeInTheDocument();
    });

    it('renders cooking time when present', () => {
      renderCard();

      expect(screen.getByText(/30m/)).toBeInTheDocument();
    });

    it('does not render cooking time when missing', () => {
      renderCard({ recipe: makeRecipe({ cookingTime: undefined }) });

      expect(screen.queryByText(/\d+m$/)).not.toBeInTheDocument();
    });

    it('renders difficulty', () => {
      renderCard();

      expect(screen.getByText('easy')).toBeInTheDocument();
    });

    it('renders ingredients count', () => {
      renderCard();

      expect(screen.getByText('3 ingredients')).toBeInTheDocument();
    });
  });

  // ---- Composition ----

  describe('composition', () => {
    it('renders BookmarkButton with recipe id', () => {
      renderCard();

      expect(screen.getByTestId('bookmark-button')).toHaveAttribute('data-id', 'r1');
    });

    it('renders RatingStars with interactive=false', () => {
      renderCard();

      expect(screen.getByTestId('rating-stars')).toHaveAttribute(
        'data-interactive',
        'false'
      );
    });

    it('passes isOwner and callbacks to RecipeActions', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderCard({ isOwner: true, onEdit, onDelete });

      const actions = screen.getByTestId('recipe-actions');
      expect(actions).toHaveAttribute('data-owner', 'true');
      expect(actions).toHaveAttribute('data-has-edit', 'true');
      expect(actions).toHaveAttribute('data-has-delete', 'true');
    });

    it('passes isOwner=false to RecipeActions by default', () => {
      renderCard();

      expect(screen.getByTestId('recipe-actions')).toHaveAttribute(
        'data-owner',
        'false'
      );
    });
  });

  // ---- Click navigation ----

  describe('click navigation', () => {
    it('navigates to recipe detail on click', async () => {
      renderCard();

      await userEvent.click(getCard());

      expect(mockNavigate).toHaveBeenCalledWith('/recipe/r1');
    });
  });

  // ---- Keyboard navigation ----

  describe('keyboard navigation', () => {
    it('navigates on Enter', () => {
      renderCard();

      fireEvent.keyDown(getCard(), { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith('/recipe/r1');
    });

    it('navigates on Space', () => {
      renderCard();

      fireEvent.keyDown(getCard(), { key: ' ' });

      expect(mockNavigate).toHaveBeenCalledWith('/recipe/r1');
    });

    it('does not navigate on other keys', () => {
      renderCard();

      fireEvent.keyDown(getCard(), { key: 'a' });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ---- A11y ----

  describe('accessibility', () => {
    it('has role=button', () => {
      renderCard();

      expect(getCard()).toBeInTheDocument();
    });

    it('has tabIndex=0', () => {
      renderCard();

      expect(getCard()).toHaveAttribute('tabindex', '0');
    });

    it('has aria-label with title', () => {
      renderCard();

      expect(getCard()).toHaveAttribute(
        'aria-label',
        'View details for Pasta Carbonara'
      );
    });
  });

  // ---- Aspect ratio ----

  describe('aspect ratio', () => {
    it('uses portrait height when aspectRatio=portrait', () => {
      const { container } = renderCard({ aspectRatio: 'portrait' });

      const imageWrapper = container.querySelector('.h-64');
      expect(imageWrapper).not.toBeNull();
    });

    it('uses square height when aspectRatio=square', () => {
      const { container } = renderCard({ aspectRatio: 'square' });

      const imageWrapper = container.querySelector('.h-48');
      expect(imageWrapper).not.toBeNull();
    });

    it('uses landscape height when aspectRatio=landscape', () => {
      const { container } = renderCard({ aspectRatio: 'landscape' });

      const imageWrapper = container.querySelector('.h-40');
      expect(imageWrapper).not.toBeNull();
    });
  });
});