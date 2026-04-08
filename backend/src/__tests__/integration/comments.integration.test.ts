import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getRecipeComments,
  createComment,
  updateComment,
  toggleLike,
  deleteComment
} from '../../controllers/comments.controller';
import { CommentModel } from '../../models/Comment.model';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Comment Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string; user?: any }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId: string;
  let testRecipeId: string;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = {
      json: jsonMock,
      status: statusMock
    };
  };

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await UserModel.create({
      username: 'testuser',
      email: 'test@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200'
    });
    testUserId = user._id.toString();

    // Create test recipe
    const recipe = await RecipeModel.create({
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user'
    });
    testRecipeId = recipe._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});
  });

  beforeEach(async () => {
    await CommentModel.deleteMany({});
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId,
      user: { username: 'testuser', avatar: 'https://picsum.photos/200/200' }
    };
  });

  describe('getRecipeComments', () => {
    beforeEach(async () => {
      await CommentModel.create([
        {
          text: 'Comment 1',
          recipeId: testRecipeId,
          userId: testUserId,
          userName: 'testuser',
          userAvatar: 'avatar.jpg'
        },
        {
          text: 'Comment 2',
          recipeId: testRecipeId,
          userId: testUserId,
          userName: 'testuser',
          userAvatar: 'avatar.jpg'
        }
      ]);
    });

    it('should return all comments for a recipe', async () => {
      req.params = { recipeId: testRecipeId };

      await getRecipeComments(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      req.body = {
        text: 'Great recipe!',
        recipeId: testRecipeId,
        rating: 5
      };

      await createComment(req as any, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.text).toBe('Great recipe!');
      expect(responseData.data.rating).toBe(5);
      expect(next).not.toHaveBeenCalled();

      // Verify in database
      const comment = await CommentModel.findOne({ recipeId: testRecipeId });
      expect(comment).toBeTruthy();
    });
  });

  describe('updateComment', () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await CommentModel.create({
        text: 'Original comment',
        recipeId: testRecipeId,
        userId: testUserId,
        userName: 'testuser',
        userAvatar: 'avatar.jpg'
      });
      commentId = comment._id.toString();
    });

    it('should update comment successfully', async () => {
      req.params = { id: commentId };
      req.body = { text: 'Updated comment' };

      await updateComment(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.text).toBe('Updated comment');
      expect(responseData.data.isEdited).toBe(true);
      expect(next).not.toHaveBeenCalled();

      // Verify in database
      const comment = await CommentModel.findById(commentId);
      expect(comment?.text).toBe('Updated comment');
    });

    it('should return 404 if comment not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { text: 'Updated comment' };

      await updateComment(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('toggleLike', () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await CommentModel.create({
        text: 'Test comment',
        recipeId: testRecipeId,
        userId: testUserId,
        userName: 'testuser',
        userAvatar: 'avatar.jpg',
        likes: 0,
        likedBy: []
      });
      commentId = comment._id.toString();
    });

    it('should add like to comment', async () => {
      req.params = { id: commentId };

      await toggleLike(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.hasLiked).toBe(true);
      expect(responseData.data.likes).toBe(1);
      expect(next).not.toHaveBeenCalled();

      // Verify in database
      const comment = await CommentModel.findById(commentId);
      expect(comment?.likes).toBe(1);
      const likedByStrings = comment?.likedBy.map(id => id.toString());
      expect(likedByStrings).toContain(testUserId);
    });

    it('should remove like from comment', async () => {
      // First add like
      req.params = { id: commentId };
      await toggleLike(req as any, res as Response, next);

      // Then remove like
      await toggleLike(req as any, res as Response, next);

      const responseData = jsonMock.mock.calls[1][0];
      expect(responseData.data.hasLiked).toBe(false);
      expect(responseData.data.likes).toBe(0);
    });

    it('should return 404 if comment not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await toggleLike(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('deleteComment', () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await CommentModel.create({
        text: 'Comment to delete',
        recipeId: testRecipeId,
        userId: testUserId,
        userName: 'testuser',
        userAvatar: 'avatar.jpg'
      });
      commentId = comment._id.toString();
    });

    it('should delete comment successfully', async () => {
      req.params = { id: commentId };

      await deleteComment(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Comment deleted successfully');
      expect(next).not.toHaveBeenCalled();

      // Verify in database
      const comment = await CommentModel.findById(commentId);
      expect(comment).toBeNull();
    });

    it('should return 404 if comment not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await deleteComment(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);
    });
  });
});