import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commentsApi } from '../../../services/commentsApi';
import * as apiClient from '../../../utils/apiClient';
import { Comment, LikeResponse, CreateCommentData } from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('commentsApi', () => {
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

  const mockLikeResponse: LikeResponse = {
    likes: 1,
    hasLiked: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecipeComments', () => {
    it('should fetch comments for a recipe', async () => {
      const mockResponse = { success: true, data: [mockComment] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await commentsApi.getRecipeComments(mockRecipeId);

      expect(apiClient.get).toHaveBeenCalledWith(`/comments/recipe/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when fetching comments', async () => {
      const mockError = { success: false, error: 'Failed to fetch' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await commentsApi.getRecipeComments(mockRecipeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch');
    });
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const createData: CreateCommentData = {
        text: 'Great recipe!',
        recipeId: mockRecipeId,
      };
      const mockResponse = { success: true, data: mockComment };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await commentsApi.createComment(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/comments', createData);
      expect(result).toEqual(mockResponse);
    });

    it('should create a comment with rating', async () => {
      const createData: CreateCommentData = {
        text: 'Great recipe!',
        recipeId: mockRecipeId,
        rating: 5,
      };
      const commentWithRating = { ...mockComment, rating: 5 };
      const mockResponse = { success: true, data: commentWithRating };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await commentsApi.createComment(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/comments', createData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const newText = 'Updated comment';
      const updatedComment = { ...mockComment, text: newText, isEdited: true };
      const mockResponse = { success: true, data: updatedComment };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await commentsApi.updateComment(mockCommentId, newText);

      expect(apiClient.put).toHaveBeenCalledWith(`/comments/${mockCommentId}`, { text: newText });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const mockResponse = { success: true, data: null };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await commentsApi.deleteComment(mockCommentId);

      expect(apiClient.del).toHaveBeenCalledWith(`/comments/${mockCommentId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('toggleLike', () => {
    it('should toggle like on a comment', async () => {
      const mockResponse = { success: true, data: mockLikeResponse };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await commentsApi.toggleLike(mockCommentId);

      expect(apiClient.post).toHaveBeenCalledWith(`/comments/${mockCommentId}/like`);
      expect(result).toEqual(mockResponse);
    });
  });
});