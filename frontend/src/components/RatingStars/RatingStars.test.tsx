import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingStars from './RatingStars';

// ---------- Hoisted mocks ----------

const {
  mockDispatch,
  mockUseAuth,
  mockRateRecipe,
  mockDeleteRating,
  mockFetchRecipeRating,
  mockFetchUserRatings,
  mockShowToast,
  mockStateHolder,
} = vi.hoisted(() => {
  const makeThunk = (type: string) =>
    Object.assign(
      vi.fn((payload: any) => ({ type, payload })),
      {
        fulfilled: { match: (a: any) => a?.type === `${type}/fulfilled` },
        rejected: { match: (a: any) => a?.type === `${type}/rejected` },
      }
    );

  return {
    mockDispatch: vi.fn(),
    mockUseAuth: vi.fn(),
    mockRateRecipe: makeThunk('ratings/rateRecipe'),
    mockDeleteRating: makeThunk('ratings/deleteRating'),
    mockFetchRecipeRating: makeThunk('ratings/fetchRecipeRating'),
    mockFetchUserRatings: makeThunk('ratings/fetchUserRatings'),
    mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
    mockStateHolder: { state: {} as any },
  };
});

vi.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(mockStateHolder.state),
  showToast: mockShowToast,
}));

vi.mock('@/store/ratingSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/ratingSlice')>();
  return {
    ...actual,
    rateRecipe: mockRateRecipe,
    deleteRating: mockDeleteRating,
    fetchRecipeRating: mockFetchRecipeRating,
    fetchUserRatings: mockFetchUserRatings,
  };
});

vi.mock('@/hooks', () => ({
  useAuth: () => mockUseAuth(),
}));

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

const mockUser = {
  _id: 'u1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: '',
};

const defaultStats = {
  averageRating: 4.5,
  totalRatings: 10,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 5 },
};

// ---------- Render helper ----------

const renderStars = (
  props: Partial<React.ComponentProps<typeof RatingStars>> = {},
  options: {
    stats?: typeof defaultStats | undefined;
    userRating?: number | undefined;
    loading?: boolean;
    user?: typeof mockUser | null;
  } = {}
) => {
  mockUseAuth.mockReturnValue({
    user: options.user === undefined ? mockUser : options.user,
  });

  mockStateHolder.state = {
    ratings: {
      stats: options.stats ? { 'recipe-1': options.stats } : {},
      userRatings: options.userRating !== undefined ? { 'recipe-1': options.userRating } : {},
      loading: options.loading ?? false,
      error: null,
    },
  };

  const defaults = {
    recipeId: 'recipe-1',
    size: 'medium' as const,
    showCount: true,
    interactive: true,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<RatingStars {...merged} />);
  return { ...utils, ...merged };
};

const getStarButtons = () =>
  screen.getAllByRole('button', { name: /^rate \d out of 5 stars$/i });

// ---------- Tests ----------

describe('RatingStars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue(undefined),
    });
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders 5 star buttons', () => {
      renderStars();

      expect(getStarButtons()).toHaveLength(5);
    });

    it('dispatches fetchRecipeRating on mount', () => {
      renderStars();

      expect(mockFetchRecipeRating).toHaveBeenCalledWith('recipe-1');
    });

    it('dispatches fetchUserRatings when user exists', () => {
      renderStars();

      expect(mockFetchUserRatings).toHaveBeenCalled();
    });

    it('does not dispatch fetchUserRatings when user is null', () => {
      renderStars({}, { user: null });

      expect(mockFetchUserRatings).not.toHaveBeenCalled();
    });
  });

  // ---- Count display ----

  describe('count display', () => {
    it('shows average and total when totalRatings > 0', () => {
      renderStars({ showCount: true }, { stats: defaultStats });

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText(/\(10 ratings\)/i)).toBeInTheDocument();
    });

    it('does not show count when totalRatings is 0', () => {
      renderStars(
        { showCount: true },
        { stats: { ...defaultStats, totalRatings: 0 } }
      );

      expect(screen.queryByText(/ratings/i)).not.toBeInTheDocument();
    });

    it('does not show count when showCount=false', () => {
      renderStars({ showCount: false }, { stats: defaultStats });

      expect(screen.queryByText(/ratings/i)).not.toBeInTheDocument();
    });

    it('uses singular "rating" when totalRatings === 1', () => {
      renderStars(
        { showCount: true },
        { stats: { ...defaultStats, totalRatings: 1 } }
      );

      expect(screen.getByText(/\(1 rating\)/i)).toBeInTheDocument();
    });
  });

  // ---- Guest ----

  describe('guest', () => {
    it('shows toast when guest clicks star', async () => {
      renderStars({}, { user: null });

      await userEvent.click(getStarButtons()[2]);

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Please log in to rate recipes',
        type: 'error',
      });
      expect(mockRateRecipe).not.toHaveBeenCalled();
      expect(mockDeleteRating).not.toHaveBeenCalled();
    });

    it('shows "Please log in" tooltip', async () => {
      renderStars({}, { user: null });

      const root = getStarButtons()[0].parentElement?.parentElement as HTMLElement;
      fireEvent.mouseEnter(root);

      await waitFor(() => {
        expect(
          screen.getByText(/please log in to rate recipes/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ---- Loading ----

  describe('loading', () => {
    it('disables star buttons', () => {
      renderStars({}, { loading: true });

      getStarButtons().forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  // ---- Rate ----

  describe('rate', () => {
    it('dispatches rateRecipe on new rating', async () => {
      renderStars({}, { userRating: undefined });

      await userEvent.click(getStarButtons()[3]); // 4th star

      expect(mockRateRecipe).toHaveBeenCalledWith({
        recipeId: 'recipe-1',
        value: 4,
      });
    });

    it('shows success toast after rate', async () => {
      renderStars();

      await userEvent.click(getStarButtons()[3]);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Rating saved',
          type: 'success',
        });
      });
    });

    it('dispatches deleteRating when clicking own rating', async () => {
      renderStars({}, { userRating: 4 });

      await userEvent.click(getStarButtons()[3]); // 4th star (same as userRating)

      expect(mockDeleteRating).toHaveBeenCalledWith('recipe-1');
    });

    it('shows info toast after delete', async () => {
      renderStars({}, { userRating: 4 });

      await userEvent.click(getStarButtons()[3]);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Rating removed',
          type: 'info',
        });
      });
    });

    it('shows error toast on API failure', async () => {
      // Replace all dispatch calls: only rateRecipe rejects
      mockDispatch.mockImplementation((action: any) => {
        if (action?.type === 'ratings/rateRecipe') {
          return { unwrap: vi.fn().mockRejectedValue(new Error('Network error')) };
        }
        return { unwrap: vi.fn().mockResolvedValue(undefined) };
      });

      renderStars();

      await userEvent.click(getStarButtons()[3]);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Failed to save rating',
          type: 'error',
        });
      });
    });
  });

  // ---- Tooltip ----

  describe('tooltip', () => {
    it('shows "Your rating: N" when user has rated', async () => {
      renderStars({}, { userRating: 3 });

      const root = getStarButtons()[0].parentElement?.parentElement as HTMLElement;
      fireEvent.mouseEnter(root);

      await waitFor(() => {
        expect(screen.getByText(/your rating:\s*3/i)).toBeInTheDocument();
      });
    });

    it('shows "Click to rate" when user has not rated', async () => {
      renderStars({}, { userRating: undefined });

      const root = getStarButtons()[0].parentElement?.parentElement as HTMLElement;
      fireEvent.mouseEnter(root);

      await waitFor(() => {
        expect(screen.getByText(/click to rate/i)).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      renderStars();

      const root = getStarButtons()[0].parentElement?.parentElement as HTMLElement;

      fireEvent.mouseEnter(root);
      await waitFor(() => {
        expect(screen.getByText(/click to rate/i)).toBeInTheDocument();
      });

      fireEvent.mouseLeave(root);
      await waitFor(() => {
        expect(screen.queryByText(/click to rate/i)).not.toBeInTheDocument();
      });
    });
  });
});