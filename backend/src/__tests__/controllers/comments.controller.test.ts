import { Request, Response } from 'express';
import {
  getRecipeComments,
  createComment,
  updateComment,
  toggleLike,
  deleteComment,
} from '../../controllers/comments.controller';
import { CommentModel } from '../../models/Comment.model';
import { validateNumber } from '../../utils/validation';

jest.mock('../../models/Comment.model');
jest.mock('../../utils/validation');

describe('Comment Controller Unit Tests', () => {
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = { json: jsonMock, status: statusMock };
  };

  const getNextError = (): any => {
    expect(next).toHaveBeenCalled();
    return (next as jest.Mock).mock.calls[0][0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: 'user123',
      user: { username: 'testuser', avatar: 'avatar.jpg' },
    };
  });

  // ---------- getRecipeComments ----------

  describe('getRecipeComments', () => {
    it('should return comments for a recipe', async () => {
      req.params = { recipeId: 'recipe123' };
      const mockComments = [{ _id: '1', text: 'Great recipe!' }];

      (CommentModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockComments),
      });

      await getRecipeComments(
        req as Request<{ recipeId: string }>,
        res as Response,
        next
      );

      expect(CommentModel.find).toHaveBeenCalledWith({ recipeId: 'recipe123' });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockComments,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return empty array when no comments', async () => {
      req.params = { recipeId: 'recipe123' };

      (CommentModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await getRecipeComments(
        req as Request<{ recipeId: string }>,
        res as Response,
        next
      );

      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  // ---------- createComment ----------

  describe('createComment', () => {
    it('should create a comment with rating', async () => {
      req.body = { text: 'Great recipe!', recipeId: 'recipe123', rating: 5 };

      (validateNumber as jest.Mock).mockReturnValue(5);

      const mockComment = {
        text: 'Great recipe!',
        recipeId: 'recipe123',
        userId: 'user123',
        userName: 'testuser',
        userAvatar: 'avatar.jpg',
        rating: 5,
        likes: 0,
        likedBy: [],
        save: jest.fn().mockResolvedValue(true),
      };
      (CommentModel as any).mockImplementation(() => mockComment);

      await createComment(req, res as Response, next);

      expect(validateNumber).toHaveBeenCalledWith(5, 0, 1, 5);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockComment,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should create a comment without rating', async () => {
      req.body = { text: 'Great recipe!', recipeId: 'recipe123' };

      const mockComment = {
        text: 'Great recipe!',
        recipeId: 'recipe123',
        userId: 'user123',
        rating: undefined,
        save: jest.fn().mockResolvedValue(true),
      };
      (CommentModel as any).mockImplementation(() => mockComment);

      await createComment(req, res as Response, next);

      // validateNumber НЕ должен вызываться, если рейтинг не передан
      expect(validateNumber).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ---------- updateComment ----------

  describe('updateComment', () => {
    const updateData = { text: 'Updated comment' };

    it('should update comment successfully', async () => {
      req.params = { id: 'comment123' };
      req.body = updateData;

      const mockComment = {
        _id: 'comment123',
        text: 'Updated comment',
        isEdited: true,
      };
      (CommentModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockComment);

      await updateComment(req, res as Response, next);

      expect(CommentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'comment123', userId: 'user123' },
        { ...updateData, isEdited: true },
        { returnDocument: 'after', runValidators: true }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockComment,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with NotFoundError if comment not found', async () => {
      req.params = { id: 'comment123' };
      req.body = updateData;
      (CommentModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await updateComment(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Comment not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- toggleLike ----------

  describe('toggleLike', () => {
    it('should add like to comment', async () => {
      req.params = { id: 'comment123' };

      const mockComment = {
        _id: 'comment123',
        likes: 0,
        likedBy: [],
        save: jest.fn().mockResolvedValue(true),
      };
      (CommentModel.findById as jest.Mock).mockResolvedValue(mockComment);

      await toggleLike(req, res as Response, next);

      expect(mockComment.likes).toBe(1);
      expect(mockComment.likedBy).toHaveLength(1);
      expect(mockComment.likedBy[0]).toBe('user123');
      expect(mockComment.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          likes: 1,
          likedBy: ['user123'],
          hasLiked: true,
        },
      });
    });

    it('should remove like from comment when already liked', async () => {
      req.params = { id: 'comment123' };

      const mockComment = {
        _id: 'comment123',
        likes: 1,
        likedBy: [{ toString: () => 'user123' }],
        save: jest.fn().mockResolvedValue(true),
      };
      (CommentModel.findById as jest.Mock).mockResolvedValue(mockComment);

      await toggleLike(req, res as Response, next);

      expect(mockComment.likes).toBe(0);
      expect(mockComment.likedBy).toHaveLength(0);
      expect(mockComment.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          likes: 0,
          likedBy: [],
          hasLiked: false,
        },
      });
    });

    it('should call next with NotFoundError if comment not found', async () => {
      req.params = { id: 'comment123' };
      (CommentModel.findById as jest.Mock).mockResolvedValue(null);

      await toggleLike(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Comment not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- deleteComment ----------

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      req.params = { id: 'comment123' };

      const mockComment = { _id: 'comment123' };
      (CommentModel.findOneAndDelete as jest.Mock).mockResolvedValue(mockComment);

      await deleteComment(req, res as Response, next);

      expect(CommentModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'comment123',
        userId: 'user123',
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully',
      });
    });

    it('should call next with NotFoundError if comment not found', async () => {
      req.params = { id: 'comment123' };
      (CommentModel.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteComment(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Comment not found');
      expect(err.statusCode).toBe(404);
    });
  });
});