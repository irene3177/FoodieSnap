import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CommentSection from './CommentSection';
import commentsReducer from '@/store/commentsSlice';
import toastReducer from '@/store/toastSlice';
import { useAuth } from '@/hooks';
import type { Comment } from '@/types';

// ---------- Hoisted mocks ----------

const {
  mockFetchComments,
  mockCreateComment,
  mockUpdateComment,
  mockDeleteComment,
  mockToggleLike,
  mockShowToast,
} = vi.hoisted(() => {
  const makeThunk = (type: string) =>
    vi.fn((payload: any) => ({ type, payload }));

  return {
    mockFetchComments: makeThunk('comments/fetchRecipeComments'),
    mockCreateComment: makeThunk('comments/createComment'),
    mockUpdateComment: makeThunk('comments/updateComment'),
    mockDeleteComment: makeThunk('comments/deleteComment'),
    mockToggleLike: makeThunk('comments/toggleLike'),
    mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
  };
});

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
}));


vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();
  const { useDispatch, useSelector } = await import('react-redux');
  return {
    ...actual,
    useAppDispatch: () => useDispatch(),
    useAppSelector: (selector: any) => useSelector(selector),
    showToast: mockShowToast,
  };
});

vi.mock('@/store/commentsSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/commentsSlice')>();
  return {
    ...actual,
    fetchRecipeComments: mockFetchComments,
    createComment: mockCreateComment,
    updateComment: mockUpdateComment,
    deleteComment: mockDeleteComment,
    toggleLike: mockToggleLike,
  };
});

vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
}));

vi.mock('@/components/RatingStars/RatingStars', () => ({
  default: ({ interactive }: { interactive?: boolean }) => (
    <div data-testid="rating-stars" data-interactive={String(!!interactive)} />
  ),
}));

vi.mock('react-textarea-autosize', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { rows, minRows, maxRows, ...rest } = props;
      return <textarea ref={ref} {...rest} />;
    }),
  };
});

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { initial, animate, exit, layout, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Test data ----------

const mockUser = {
  _id: 'user-1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
};

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  _id: 'c1',
  text: 'Nice recipe!',
  recipeId: 'recipe-1',
  userId: 'user-1',
  userName: 'alice',
  userAvatar: 'alice.jpg',
  likes: 0,
  likedBy: [],
  isEdited: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// ---------- Render helper ----------

const renderSection = (
  props: Partial<{ recipeId: string; recipeTitle: string }> = {},
  comments: Comment[] = [],
  user: typeof mockUser | null = mockUser
) => {
  (useAuth as any).mockReturnValue({ user });

  const store = configureStore({
    reducer: {
      comments: commentsReducer,
      toast: toastReducer,
    } as any,
    preloadedState: {
      comments: {
        comments: { 'recipe-1': comments },
        loading: false,
        error: null,
      },
    } as any,
  });

  const defaults = { recipeId: 'recipe-1', recipeTitle: 'Test Recipe' };
  const merged = { ...defaults, ...props };

  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <CommentSection {...merged} />
      </MemoryRouter>
    </Provider>
  );

  return { ...utils, ...merged, store };
};

// ---------- Tests ----------

describe('CommentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  // ---- Initial load ----

  describe('initial load', () => {
    it('dispatches fetchRecipeComments on mount', () => {
      renderSection();

      expect(mockFetchComments).toHaveBeenCalledWith('recipe-1');
    });
  });

  // ---- Form (authenticated) ----

  describe('form (authenticated)', () => {
    it('shows "Share your thoughts" placeholder', () => {
      renderSection();

      expect(
        screen.getByPlaceholderText(/share your thoughts/i)
      ).toBeInTheDocument();
    });

    it('submit button is disabled with empty input', () => {
      renderSection();

      expect(
        screen.getByRole('button', { name: /post comment/i })
      ).toBeDisabled();
    });

    it('opens and closes RatingStars via toggle', async () => {
      renderSection();

      expect(screen.queryByTestId('rating-stars')).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /\+ add rating/i })
      );
      expect(screen.getByTestId('rating-stars')).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /- remove rating/i })
      );
      expect(screen.queryByTestId('rating-stars')).not.toBeInTheDocument();
    });

    it('dispatches createComment with trimmed text', async () => {
      renderSection();

      await userEvent.type(
        screen.getByPlaceholderText(/share your thoughts/i),
        '  Great recipe!  '
      );

      await userEvent.click(
        screen.getByRole('button', { name: /post comment/i })
      );

      expect(mockCreateComment).toHaveBeenCalledWith({
        recipeId: 'recipe-1',
        text: 'Great recipe!',
        rating: undefined,
      });
    });

    it('clears input after submit', async () => {
      renderSection();

      const textarea = screen.getByPlaceholderText(/share your thoughts/i);
      await userEvent.type(textarea, 'Great recipe!');
      await userEvent.click(
        screen.getByRole('button', { name: /post comment/i })
      );

      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  // ---- Form (guest) ----

  describe('form (guest)', () => {
    it('shows "Please log in" placeholder', () => {
      renderSection({}, [], null);

      expect(
        screen.getByPlaceholderText(/please log in to leave a comment/i)
      ).toBeInTheDocument();
    });

    it('textarea is disabled', () => {
      renderSection({}, [], null);

      expect(
        screen.getByPlaceholderText(/please log in to leave a comment/i)
      ).toBeDisabled();
    });

    it('does not show submit button', () => {
      renderSection({}, [], null);

      expect(
        screen.queryByRole('button', { name: /post comment/i })
      ).not.toBeInTheDocument();
    });
  });

  // ---- Comments list ----

  describe('comments list', () => {
    it('renders comments from store', () => {
      const comments = [
        makeComment({ _id: 'c1', text: 'First comment' }),
        makeComment({ _id: 'c2', text: 'Second comment' }),
      ];
      renderSection({}, comments);

      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });

    it('shows empty when no comments', () => {
      renderSection({}, []);

      expect(screen.queryByText(/nice recipe/i)).not.toBeInTheDocument();
    });

    it('shows "(edited)" for edited comments', () => {
      const comments = [makeComment({ isEdited: true })];
      renderSection({}, comments);

      expect(screen.getByText(/\(edited\)/i)).toBeInTheDocument();
    });

    it('shows username in comment', () => {
      const comments = [makeComment({ userName: 'bob' })];
      renderSection({}, comments);

      expect(screen.getByText('bob')).toBeInTheDocument();
    });
  });

  // ---- Like ----

  describe('like', () => {
    it('guest click on like shows toast', async () => {
      const comments = [makeComment({ likes: 0 })];
      renderSection({}, comments, null);

      await userEvent.click(screen.getByText(/like comment/i));

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Please log in to like a comment',
        type: 'error',
      });
      expect(mockToggleLike).not.toHaveBeenCalled();
    });

    it('authenticated click dispatches toggleLike', async () => {
      const comments = [makeComment({ _id: 'c1', likes: 0 })];
      renderSection({}, comments);

      await userEvent.click(screen.getByText(/like comment/i));

      expect(mockToggleLike).toHaveBeenCalledWith({
        commentId: 'c1',
        recipeId: 'recipe-1',
      });
    });

    it('shows "Like comment" when likes=0', () => {
      const comments = [makeComment({ likes: 0 })];
      renderSection({}, comments);

      expect(screen.getByText(/like comment/i)).toBeInTheDocument();
    });

    it('shows number when likes > 0', () => {
      const comments = [makeComment({ likes: 5 })];
      renderSection({}, comments);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  // ---- Edit ----

  describe('edit', () => {
    it('shows Edit button for own comment', () => {
      const comments = [makeComment({ userId: 'user-1' })];
      renderSection({}, comments);

      expect(
        screen.getByRole('button', { name: /edit comment/i })
      ).toBeInTheDocument();
    });

    it('does not show Edit for other user comment', () => {
      const comments = [makeComment({ userId: 'other-user' })];
      renderSection({}, comments);

      expect(
        screen.queryByRole('button', { name: /edit comment/i })
      ).not.toBeInTheDocument();
    });

    it('opens editor with existing text', async () => {
      const comments = [makeComment({ text: 'Original' })];
      renderSection({}, comments);

      await userEvent.click(
        screen.getByRole('button', { name: /edit comment/i })
      );

      const editor = screen.getByDisplayValue('Original') as HTMLTextAreaElement;
      expect(editor).toBeInTheDocument();
    });

    it('Cancel closes editor', async () => {
      const comments = [makeComment({ text: 'Original' })];
      renderSection({}, comments);

      await userEvent.click(
        screen.getByRole('button', { name: /edit comment/i })
      );
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });

    it('Save dispatches updateComment with new text', async () => {
      const comments = [makeComment({ _id: 'c1', text: 'Original' })];
      renderSection({}, comments);

      await userEvent.click(
        screen.getByRole('button', { name: /edit comment/i })
      );

      const editor = screen.getByDisplayValue('Original');
      await userEvent.clear(editor);
      await userEvent.type(editor, 'Updated');

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(mockUpdateComment).toHaveBeenCalledWith({
        commentId: 'c1',
        text: 'Updated',
      });
    });

    it('Save with empty text does not dispatch', async () => {
      const comments = [makeComment({ _id: 'c1', text: 'Original' })];
      renderSection({}, comments);

      await userEvent.click(
        screen.getByRole('button', { name: /edit comment/i })
      );

      const editor = screen.getByDisplayValue('Original');
      await userEvent.clear(editor);

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(mockUpdateComment).not.toHaveBeenCalled();
    });
  });

  // ---- Delete ----

  describe('delete', () => {
    it('shows Delete button for own comment', () => {
      const comments = [makeComment({ userId: 'user-1' })];
      renderSection({}, comments);

      expect(
        screen.getByRole('button', { name: /delete comment/i })
      ).toBeInTheDocument();
    });

    it('does not show Delete for other user comment', () => {
      const comments = [makeComment({ userId: 'other-user' })];
      renderSection({}, comments);

      expect(
        screen.queryByRole('button', { name: /delete comment/i })
      ).not.toBeInTheDocument();
    });

    it('dispatches deleteComment after confirm(true)', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const comments = [makeComment({ _id: 'c1' })];
      renderSection({}, comments);

      await userEvent.click(
        screen.getByRole('button', { name: /delete comment/i })
      );

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteComment).toHaveBeenCalledWith('c1');
    });

    it('does not dispatch when confirm(false)', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const comments = [makeComment({ _id: 'c1' })];
      renderSection({}, comments);

      await userEvent.click(
        screen.getByRole('button', { name: /delete comment/i })
      );

      expect(mockDeleteComment).not.toHaveBeenCalled();
    });
  });
});