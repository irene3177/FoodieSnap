
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getRecipeComments,
  createComment,
  updateComment,
  toggleLike,
  deleteComment,
} from '../../controllers/comments.controller';
import { CommentModel } from '../../models/Comment.model';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Comment Controller Integration Tests', () => {
  let req: any;
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
    res = { json: jsonMock, status: statusMock };
  };

  const createTestUser = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return UserModel.create({
      username: `cm_${Math.random().toString(36).slice(2, 8)}`,
      email: `cm_${Date.now()}@cmtest.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
    });
  };

  beforeEach(async () => {
    await CommentModel.deleteMany({});
    await RecipeModel.deleteMany({});
    await UserModel.deleteMany({ email: /@cmtest\.com$/ });

    const user = await createTestUser();
    testUserId = user._id.toString();

    const recipe = await RecipeModel.create({
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user',
    });
    testRecipeId = recipe._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId,
      user: {
        username: user.username,
        avatar: user.avatar,
      },
    };
  });

  afterAll(async () => {
    await CommentModel.deleteMany({});
    await RecipeModel.deleteMany({});
    await UserModel.deleteMany({ email: /@cmtest\.com$/ });
  });

  // ---------- getRecipeComments ----------

  describe('getRecipeComments', () => {
    beforeEach(async () => {
      await CommentModel.create([
        {
          text: 'Comment 1',
          recipeId: testRecipeId,
          userId: testUserId,
          userName: 'testuser',
          userAvatar: 'avatar.jpg',
        },
        {
          text: 'Comment 2',
          recipeId: testRecipeId,
          userId: testUserId,
          userName: 'testuser',
          userAvatar: 'avatar.jpg',
        },
      ]);
    });

    it('should return all comments for a recipe', async () => {
      req.params = { recipeId: testRecipeId };

      await getRecipeComments(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return empty array when recipe has no comments', async () => {
      const anotherRecipe = await RecipeModel.create({
        title: 'No Comments Recipe',
        ingredients: ['a'],
        instructions: ['b'],
        author: testUserId,
        source: 'user',
      });
      req.params = { recipeId: anotherRecipe._id.toString() };

      await getRecipeComments(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(0);
    });
  });

  // ---------- createComment ----------

  describe('createComment', () => {
    it('should create a comment with rating successfully', async () => {
      req.body = {
        text: 'Great recipe!',
        recipeId: testRecipeId,
        rating: 5,
      };

      await createComment(req, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.text).toBe('Great recipe!');
      expect(responseData.data.rating).toBe(5);
      expect(responseData.data.likes).toBe(0);
      expect(responseData.data.likedBy).toEqual([]);
      expect(next).not.toHaveBeenCalled();

      const comment = await CommentModel.findOne({ recipeId: testRecipeId });
      expect(comment).toBeTruthy();
    });

    it('should create a comment without rating', async () => {
      req.body = {
        text: 'Nice!',
        recipeId: testRecipeId,
      };

      await createComment(req, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      const comment = await CommentModel.findOne({ recipeId: testRecipeId });
      expect(comment?.rating).toBeUndefined();
    });
  });

  // ---------- updateComment ----------

  describe('updateComment', () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await CommentModel.create({
        text: 'Original comment',
        recipeId: testRecipeId,
        userId: testUserId,
        userName: 'testuser',
        userAvatar: 'avatar.jpg',
      });
      commentId = comment._id.toString();
    });

    it('should update comment successfully', async () => {
      req.params = { id: commentId };
      req.body = { text: 'Updated comment' };

      await updateComment(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.text).toBe('Updated comment');
      expect(responseData.data.isEdited).toBe(true);
      expect(next).not.toHaveBeenCalled();

      const comment = await CommentModel.findById(commentId);
      expect(comment?.text).toBe('Updated comment');
      expect(comment?.isEdited).toBe(true);
    });

    it('should return 404 if comment not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { text: 'Updated comment' };

      await updateComment(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 404 if user is not the author', async () => {
      const otherUser = await createTestUser();
      req.userId = otherUser._id.toString();
      req.params = { id: commentId };
      req.body = { text: 'Hacked' };

      await updateComment(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);

      const comment = await CommentModel.findById(commentId);
      expect(comment?.text).toBe('Original comment');
    });
  });

  // ---------- toggleLike ----------

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
        likedBy: [],
      });
      commentId = comment._id.toString();
    });

    it('should add like to comment', async () => {
      req.params = { id: commentId };

      await toggleLike(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.hasLiked).toBe(true);
      expect(responseData.data.likes).toBe(1);
      expect(next).not.toHaveBeenCalled();

      const comment = await CommentModel.findById(commentId);
      expect(comment?.likes).toBe(1);
      expect(comment?.likedBy).toHaveLength(1);
      expect(comment?.likedBy.map((id) => id.toString())).toContain(testUserId);
    });

    it('should remove like from comment', async () => {
      req.params = { id: commentId };
      await toggleLike(req, res as Response, next);
      await toggleLike(req, res as Response, next);

      const responseData = jsonMock.mock.calls[1][0];
      expect(responseData.data.hasLiked).toBe(false);
      expect(responseData.data.likes).toBe(0);

      const comment = await CommentModel.findById(commentId);
      expect(comment?.likes).toBe(0);
      expect(comment?.likedBy).toHaveLength(0);
    });

    it('should return 404 if comment not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await toggleLike(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- deleteComment ----------

  describe('deleteComment', () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await CommentModel.create({
        text: 'Comment to delete',
        recipeId: testRecipeId,
        userId: testUserId,
        userName: 'testuser',
        userAvatar: 'avatar.jpg',
      });
      commentId = comment._id.toString();
    });

    it('should delete comment successfully', async () => {
      req.params = { id: commentId };

      await deleteComment(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Comment deleted successfully');
      expect(next).not.toHaveBeenCalled();

      const comment = await CommentModel.findById(commentId);
      expect(comment).toBeNull();
    });

    it('should return 404 if comment not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await deleteComment(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 404 if user is not the author', async () => {
      const otherUser = await createTestUser();
      req.userId = otherUser._id.toString();
      req.params = { id: commentId };

      await deleteComment(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Comment not found');
      expect(error.statusCode).toBe(404);

      const comment = await CommentModel.findById(commentId);
      expect(comment).not.toBeNull();
    });
  });
});