import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import commentReducer, {
  fetchRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  clearComments,
  clearError,
} from '../../../store/commentsSlice';
import { commentsApi } from '../../../services/commentsApi';
import { Comment } from '../../../types';

// Mock commentsApi
vi.mock('../../../services/commentsApi', () => ({
  commentsApi: {
    getRecipeComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleLike: vi.fn(),
  },
}));

interface RootState {
  comments: ReturnType<typeof commentReducer>;
}

describe('commentSlice', () => {
  const mockRecipeId = 'recipe123';
  const mockCommentId = 'comment456';
  
  const mockComment: Comment = {
    _id: mockCommentId,
    text: 'Great recipe!',
    recipeId: mockRecipeId,
    userId: 'user789',
    userName: 'testuser',
    userAvatar: 'avatar.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    isEdited: false,
  };

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { comments: commentReducer },
    });
  });

  it('should return initial state', () => {
    const state = store.getState().comments;
    expect(state.comments).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear comments', () => {
    store.dispatch(clearComments());
    expect(store.getState().comments.comments).toEqual({});
  });

  it('should clear error', () => {
    // First set an error
    const action = { type: fetchRecipeComments.rejected.type, payload: 'Some error' };
    store.dispatch(action);
    expect(store.getState().comments.error).toBe('Some error');
    
    // Then clear it
    store.dispatch(clearError());
    expect(store.getState().comments.error).toBeNull();
  });

  describe('fetchRecipeComments', () => {
    it('should handle fetch fulfilled', async () => {
      const mockResponse = { success: true, data: [mockComment] };
      vi.mocked(commentsApi.getRecipeComments).mockResolvedValue(mockResponse);

      await store.dispatch(fetchRecipeComments(mockRecipeId));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
      expect(state.comments[mockRecipeId]).toEqual([mockComment]);
    });

    it('should handle fetch rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to fetch' };
      vi.mocked(commentsApi.getRecipeComments).mockResolvedValue(mockResponse);

      await store.dispatch(fetchRecipeComments(mockRecipeId));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
    });
  });

  describe('createComment', () => {
    it('should handle create comment', async () => {
      const mockResponse = { success: true, data: mockComment };
      vi.mocked(commentsApi.createComment).mockResolvedValue(mockResponse);
      vi.mocked(commentsApi.getRecipeComments).mockResolvedValue({ success: true, data: [mockComment] });

      await store.dispatch(createComment({ recipeId: mockRecipeId, text: 'Great recipe!' }));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
    });

    it('should handle create comment rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to create' };
      vi.mocked(commentsApi.createComment).mockResolvedValue(mockResponse);

      await store.dispatch(createComment({ recipeId: mockRecipeId, text: 'Great recipe!' }));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to create');
    });
  });

  describe('updateComment', () => {
    it('should handle update comment', async () => {
      const mockResponse = { success: true, data: mockComment };
      vi.mocked(commentsApi.updateComment).mockResolvedValue(mockResponse);
      vi.mocked(commentsApi.getRecipeComments).mockResolvedValue({ success: true, data: [mockComment] });

      await store.dispatch(updateComment({ commentId: mockCommentId, text: 'Updated text' }));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
    });
  });

  describe('deleteComment', () => {
    it('should handle delete comment', async () => {
      const mockResponse = { success: true, data: null };
      vi.mocked(commentsApi.deleteComment).mockResolvedValue(mockResponse);
      vi.mocked(commentsApi.getRecipeComments).mockResolvedValue({ success: true, data: [] });

      await store.dispatch(deleteComment(mockCommentId));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
    });
  });

  describe('toggleLike', () => {
    it('should handle toggle like', async () => {
      const mockResponse = { success: true, data: { likes: 1, hasLiked: true } };
      vi.mocked(commentsApi.toggleLike).mockResolvedValue(mockResponse);
      vi.mocked(commentsApi.getRecipeComments).mockResolvedValue({ success: true, data: [mockComment] });

      await store.dispatch(toggleLike({ commentId: mockCommentId, recipeId: mockRecipeId }));
      
      const state = store.getState().comments;
      expect(state.loading).toBe(false);
    });
  });
});