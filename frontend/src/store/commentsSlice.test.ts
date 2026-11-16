import { describe, it, expect } from 'vitest';
import commentsReducer, {
  clearComments,
  clearError,
  selectCommentsByRecipeId,
  fetchRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
} from './commentsSlice';
import type { Comment } from '@/types';
import type { RootState } from './store';

// ---------- Test data ----------

const makeComment = (id: string, overrides: Partial<Comment> = {}): Comment => ({
  _id: id,
  text: `Comment ${id}`,
  recipeId: 'recipe-1',
  userId: 'user-1',
  userName: 'alice',
  userAvatar: '',
  likes: 0,
  likedBy: [],
  isEdited: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

const makeState = (overrides: Partial<ReturnType<typeof commentsReducer>> = {}) => ({
  comments: {},
  loading: false,
  error: null,
  ...overrides,
});

const makeRootState = (commentsState: ReturnType<typeof commentsReducer>): RootState =>
  ({ comments: commentsState } as unknown as RootState);

// ---------- Tests ----------

describe('commentsSlice', () => {
  // ---- Sync reducers ----

  describe('sync reducers', () => {
    it('clearComments resets comments to empty object', () => {
      const state = makeState({
        comments: { 'recipe-1': [makeComment('c1')] },
      });

      const next = commentsReducer(state, clearComments());

      expect(next.comments).toEqual({});
    });

    it('clearError resets error to null', () => {
      const state = makeState({ error: 'Something failed' });
      const next = commentsReducer(state, clearError());

      expect(next.error).toBeNull();
    });
  });

  // ---- fetchRecipeComments ----

  describe('fetchRecipeComments extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = commentsReducer(
        state,
        fetchRecipeComments.pending('req-id', 'recipe-1')
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled stores comments by recipeId', () => {
      const comments = [makeComment('c1'), makeComment('c2')];
      const state = makeState({ loading: true });

      const next = commentsReducer(
        state,
        fetchRecipeComments.fulfilled({ recipeId: 'recipe-1', comments }, 'req-id', 'recipe-1')
      );

      expect(next.loading).toBe(false);
      expect(next.comments['recipe-1']).toEqual(comments);
    });

    it('fulfilled keeps comments of other recipes', () => {
      const existing = { 'recipe-2': [makeComment('c-other')] };
      const state = makeState({ loading: true, comments: existing });

      const newComments = [makeComment('c1')];
      const next = commentsReducer(
        state,
        fetchRecipeComments.fulfilled({ recipeId: 'recipe-1', comments: newComments }, 'req-id', 'recipe-1')
      );

      expect(next.comments['recipe-1']).toEqual(newComments);
      expect(next.comments['recipe-2']).toEqual(existing['recipe-2']);
    });

    it('rejected sets loading=false and stores error', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        fetchRecipeComments.rejected(null, 'req-id', 'recipe-1', 'Network error')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Network error');
    });
  });

  // ---- createComment ----

  describe('createComment extra reducers', () => {
    it('pending sets loading=true', () => {
      const state = makeState();
      const next = commentsReducer(
        state,
        createComment.pending('req-id', { recipeId: 'recipe-1', text: 'hi' })
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled sets loading=false without modifying comments', () => {
      const state = makeState({
        loading: true,
        comments: { 'recipe-1': [makeComment('c1')] },
      });

      const next = commentsReducer(
        state,
        createComment.fulfilled(makeComment('c2'), 'req-id', { recipeId: 'recipe-1', text: 'x' })
      );

      expect(next.loading).toBe(false);
      expect(next.comments['recipe-1']).toHaveLength(1);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        createComment.rejected(null, 'req-id', { recipeId: 'r', text: 'x' }, 'Failed')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Failed');
    });
  });

  // ---- updateComment ----

  describe('updateComment extra reducers', () => {
    it('fulfilled sets loading=false', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        updateComment.fulfilled(makeComment('c1'), 'req-id', { commentId: 'c1', text: 'new' })
      );

      expect(next.loading).toBe(false);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        updateComment.rejected(null, 'req-id', { commentId: 'c1', text: 'x' }, 'Update failed')
      );

      expect(next.error).toBe('Update failed');
    });
  });

  // ---- deleteComment ----

  describe('deleteComment extra reducers', () => {
    it('fulfilled sets loading=false', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        deleteComment.fulfilled('c1', 'req-id', 'c1')
      );

      expect(next.loading).toBe(false);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        deleteComment.rejected(null, 'req-id', 'c1', 'Cannot delete')
      );

      expect(next.error).toBe('Cannot delete');
    });
  });

  // ---- toggleLike ----

  describe('toggleLike extra reducers', () => {
    it('fulfilled sets loading=false', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        toggleLike.fulfilled({ commentId: 'c1' }, 'req-id', { commentId: 'c1', recipeId: 'recipe-1' })
      );

      expect(next.loading).toBe(false);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = commentsReducer(
        state,
        toggleLike.rejected(null, 'req-id', { commentId: 'c1', recipeId: 'recipe-1' }, 'Like failed')
      );

      expect(next.error).toBe('Like failed');
    });
  });

  // ---- selectCommentsByRecipeId ----

  describe('selectCommentsByRecipeId', () => {
    it('returns comments for the given recipe', () => {
      const comments = [makeComment('c1'), makeComment('c2')];
      const rootState = makeRootState(makeState({
        comments: { 'recipe-1': comments },
      }));

      const selector = selectCommentsByRecipeId('recipe-1');
      const result = selector(rootState);

      expect(result).toEqual(comments);
    });

    it('returns empty array when recipe has no comments', () => {
      const rootState = makeRootState(makeState({ comments: {} }));

      const selector = selectCommentsByRecipeId('recipe-missing');
      const result = selector(rootState);

      expect(result).toEqual([]);
    });

    it('returns comments only for the specified recipe', () => {
      const recipe1Comments = [makeComment('c1')];
      const recipe2Comments = [makeComment('c2'), makeComment('c3')];

      const rootState = makeRootState(makeState({
        comments: {
          'recipe-1': recipe1Comments,
          'recipe-2': recipe2Comments,
        },
      }));

      expect(selectCommentsByRecipeId('recipe-1')(rootState)).toEqual(recipe1Comments);
      expect(selectCommentsByRecipeId('recipe-2')(rootState)).toEqual(recipe2Comments);
    });
  });
});