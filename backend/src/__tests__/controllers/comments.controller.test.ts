import { Request, Response } from 'express';
import {
  getRecipeComments,
  createComment,
  updateComment,
  toggleLike,
  deleteComment
} from '../../controllers/comments.controller';
import { CommentModel } from '../../models/Comment.model';
import { validateNumber } from '../../utils/validation';
import NotFoundError from '../../errors/notFoundError';

// Mock dependencies
jest.mock('../../models/Comment.model');
jest.mock('../../utils/validation');
jest.mock('../../errors/notFoundError');

describe('Comment Controller Unit Tests', () => {
  let req: Partial<Request & { userId?: string; user?: any }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = {
      json: jsonMock,
      status: statusMock
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: 'user123',
      user: { username: 'testuser', avatar: 'avatar.jpg' }
    };
  });

  describe('getRecipeComments', () => {
    it('should return comments for a recipe', async () => {
      // Arrange
      req.params = { recipeId: 'recipe123' };
      const mockComments = [{ _id: '1', text: 'Great recipe!' }];
      (CommentModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockComments)
      });

      // Act
      await getRecipeComments(req as Request<{ recipeId: string }>, res as Response, next);

      // Assert
      expect(CommentModel.find).toHaveBeenCalledWith({ recipeId: 'recipe123' });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockComments
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    const commentData = {
      text: 'Great recipe!',
      recipeId: 'recipe123',
      rating: 5
    };

    it('should create a comment successfully', async () => {
      // Arrange
      req.body = commentData;
      (validateNumber as jest.Mock).mockReturnValue(5);
      
      const mockComment = {
        ...commentData,
        userId: 'user123',
        userName: 'testuser',
        userAvatar: 'avatar.jpg',
        likes: 0,
        likedBy: [],
        save: jest.fn().mockResolvedValue(true)
      };
      (CommentModel as any).mockImplementation(() => mockComment);

      // Act
      await createComment(req as any, res as Response, next);

      // Assert
      expect(validateNumber).toHaveBeenCalledWith(5, 0, 1, 5);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockComment
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should create comment without rating', async () => {
      // Arrange
      req.body = { text: 'Great recipe!', recipeId: 'recipe123' };
      (validateNumber as jest.Mock).mockReturnValue(0);
      
      const mockComment = {
        text: 'Great recipe!',
        recipeId: 'recipe123',
        userId: 'user123',
        rating: undefined,
        save: jest.fn().mockResolvedValue(true)
      };
      (CommentModel as any).mockImplementation(() => mockComment);

      // Act
      await createComment(req as any, res as Response, next);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    const updateData = { text: 'Updated comment' };

    it('should update comment successfully', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      req.body = updateData;
      
      const mockComment = {
        _id: 'comment123',
        text: 'Updated comment',
        isEdited: true
      };
      (CommentModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockComment);

      // Act
      await updateComment(req as any, res as Response, next);

      // Assert
      expect(CommentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'comment123', userId: 'user123' },
        { ...updateData, isEdited: true },
        { returnDocument: 'after', runValidators: true }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockComment
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return NotFoundError if comment not found', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      req.body = updateData;
      (CommentModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await updateComment(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('Comment not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    it('should add like to comment', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      
      const mockComment = {
        _id: 'comment123',
        likes: 0,
        likedBy: [],
        save: jest.fn().mockResolvedValue(true)
      };
      (CommentModel.findById as jest.Mock).mockResolvedValue(mockComment);

      // Act
      await toggleLike(req as any, res as Response, next);

      // Assert
      expect(mockComment.likes).toBe(1);
      expect(mockComment.likedBy).toContain('user123');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          likes: 1,
          likedBy: ['user123'],
          hasLiked: true
        }
      });
    });

    it('should remove like from comment', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      
      const mockComment = {
        _id: 'comment123',
        likes: 1,
        likedBy: ['user123'],
        save: jest.fn().mockResolvedValue(true)
      };
      (CommentModel.findById as jest.Mock).mockResolvedValue(mockComment);

      // Act
      await toggleLike(req as any, res as Response, next);

      // Assert
      expect(mockComment.likes).toBe(0);
      expect(mockComment.likedBy).toHaveLength(0);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          likes: 0,
          likedBy: [],
          hasLiked: false
        }
      });
    });

    it('should return NotFoundError if comment not found', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      (CommentModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await toggleLike(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('Comment not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      
      const mockComment = { _id: 'comment123' };
      (CommentModel.findOneAndDelete as jest.Mock).mockResolvedValue(mockComment);

      // Act
      await deleteComment(req as any, res as Response, next);

      // Assert
      expect(CommentModel.findOneAndDelete).toHaveBeenCalledWith(
        { _id: 'comment123', userId: 'user123' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully'
      });
    });

    it('should return NotFoundError if comment not found', async () => {
      // Arrange
      req.params = { id: 'comment123' };
      (CommentModel.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteComment(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('Comment not found');
      expect(next).toHaveBeenCalled();
    });
  });
});