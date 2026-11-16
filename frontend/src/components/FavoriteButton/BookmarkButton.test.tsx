import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkButton from './BookmarkButton';
import { useAuth } from '@/hooks';
import type { Recipe } from '@/types';

// ---------- Hoisted mocks ----------

const {
  mockDispatch,
  mockAddToFavorites,
  mockRemoveFromFavorites,
  mockFetchFavorites,
  mockShowToast,
  mockStateHolder,
} = vi.hoisted(() => {
  const makeThunk = (type: string) =>
    vi.fn((payload: any) => ({ type, payload }));

  return {
    mockDispatch: vi.fn(),
    mockAddToFavorites: makeThunk('favorites/addToFavorites'),
    mockRemoveFromFavorites: makeThunk('favorites/removeFromFavorites'),
    mockFetchFavorites: makeThunk('favorites/fetchFavorites'),
    mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
    mockStateHolder: { state: {} as any },
  };
});

vi.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(mockStateHolder.state),
  showToast: mockShowToast,
}));

vi.mock('@/store/favoritesSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/favoritesSlice')>();
  return {
    ...actual,
    addToFavorites: mockAddToFavorites,
    removeFromFavorites: mockRemoveFromFavorites,
    fetchFavorites: mockFetchFavorites,
  };
});

vi.mock('@/store/toastSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/toastSlice')>();
  return {
    ...actual,
    showToast: mockShowToast,
  };
});

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: {
      button: React.forwardRef((props: any, ref: any) => {
        const { whileHover, whileTap, initial, animate, ...rest } = props;
        return <button ref={ref} {...rest} />;
      }),
      div: React.forwardRef((props: any, ref: any) => {
        const { variants, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
      span: React.forwardRef((props: any, ref: any) => {
        const { initial, animate, transition, ...rest } = props;
        return <span ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Test data ----------

const mockUser = {
  _id: 'u1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: '',
};

const makeRecipe = (id: string, title: string): Recipe => ({
  _id: id,
  title,
  description: '',
  ingredients: [],
  instructions: [],
  imageUrl: '',
  difficulty: 'easy',
  rating: 0,
  ratingCount: 0,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

// ---------- Render helper ----------

const renderButton = (
  props: Partial<React.ComponentProps<typeof BookmarkButton>> = {},
  options: {
    favorites?: Recipe[];
    loading?: boolean;
    user?: typeof mockUser | null;
  } = {}
) => {
  (useAuth as any).mockReturnValue({
    user: options.user === undefined ? mockUser : options.user,
  });

  mockStateHolder.state = {
    favorites: {
      items: options.favorites ?? [],
      loading: options.loading ?? false,
      error: null,
      initialized: true,
    },
  };

  const defaults = {
    recipe: makeRecipe('r1', 'Pasta'),
    size: 'medium' as const,
    showText: false,
    className: '',
  };
  const merged = { ...defaults, ...props };

  const utils = render(<BookmarkButton {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('shows "Add to favorites" aria-label when not in favorites', () => {
      renderButton();

      expect(
        screen.getByRole('button', { name: /add to favorites/i })
      ).toBeInTheDocument();
    });

    it('shows "Remove from favorites" aria-label when already in favorites', () => {
      const recipe = makeRecipe('r1', 'Pasta');
      renderButton({ recipe }, { favorites: [recipe] });

      expect(
        screen.getByRole('button', { name: /remove from favorites/i })
      ).toBeInTheDocument();
    });

    it('renders empty bookmark icon when not favorited', () => {
      const { container } = renderButton();

      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add to favorites/i })
      ).toBeInTheDocument();
    });

    it('renders filled bookmark icon when favorited', () => {
      const recipe = makeRecipe('r1', 'Pasta');
      renderButton({ recipe }, { favorites: [recipe] });

      expect(
        screen.getByRole('button', { name: /remove from favorites/i })
      ).toBeInTheDocument();
    });
  });

  // ---- showText ----

  describe('showText', () => {
    it('shows "Add to Favorites" text when showText=true and not fav', () => {
      renderButton({ showText: true });

      expect(screen.getByText(/add to favorites/i)).toBeInTheDocument();
    });

    it('shows "Added to Favorites" text when showText=true and fav', () => {
      const recipe = makeRecipe('r1', 'Pasta');
      renderButton({ recipe, showText: true }, { favorites: [recipe] });

      expect(screen.getByText(/added to favorites/i)).toBeInTheDocument();
    });

    it('does not show text when showText=false', () => {
      renderButton({ showText: false });

      expect(screen.queryByText(/add to favorites/i)).not.toBeInTheDocument();
    });
  });

  // ---- Guest ----

  describe('guest', () => {
    it('shows toast when guest clicks', async () => {
      renderButton({}, { user: null });

      await userEvent.click(
        screen.getByRole('button', { name: /add to favorites/i })
      );

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Please log in to add favorites',
        type: 'info',
      });
      expect(mockAddToFavorites).not.toHaveBeenCalled();
      expect(mockRemoveFromFavorites).not.toHaveBeenCalled();
    });
  });

  // ---- Add ----

  describe('add to favorites', () => {
    it('dispatches addToFavorites and shows success toast', async () => {
      const recipe = makeRecipe('r1', 'Pasta');
      renderButton({ recipe });

      await userEvent.click(
        screen.getByRole('button', { name: /add to favorites/i })
      );

      expect(mockAddToFavorites).toHaveBeenCalledWith(recipe);
      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Pasta added to favorites',
        type: 'success',
      });
    });
  });

  // ---- Remove ----

  describe('remove from favorites', () => {
    it('dispatches removeFromFavorites and shows info toast', async () => {
      const recipe = makeRecipe('r1', 'Pasta');
      renderButton({ recipe }, { favorites: [recipe] });

      await userEvent.click(
        screen.getByRole('button', { name: /remove from favorites/i })
      );

      expect(mockRemoveFromFavorites).toHaveBeenCalledWith('r1');
      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Pasta removed from favorites',
        type: 'info',
      });
    });
  });

  // ---- Event handling ----

  describe('event handling', () => {
    it('stops propagation (does not trigger parent onClick)', async () => {
      const parentClick = vi.fn();

      render(
        <div onClick={parentClick}>
          <BookmarkButton recipe={makeRecipe('r1', 'Pasta')} />
        </div>
      );
    });
  });

  // ---- Disabled ----

  describe('disabled state', () => {
    it('disables button when loading=true', () => {
      renderButton({}, { loading: true });

      expect(
        screen.getByRole('button', { name: /add to favorites/i })
      ).toBeDisabled();
    });
  });

  // ---- useEffect fetch ----

  describe('useEffect fetchFavorites', () => {
    it('dispatches fetchFavorites when user is present', () => {
      renderButton();

      expect(mockDispatch).toHaveBeenCalled();
      const types = mockDispatch.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain('favorites/fetchFavorites');
    });

    it('does not dispatch fetchFavorites when no user', () => {
      renderButton({}, { user: null });

      const types = mockDispatch.mock.calls.map((c) => c[0]?.type);
      expect(types).not.toContain('favorites/fetchFavorites');
    });
  });
});