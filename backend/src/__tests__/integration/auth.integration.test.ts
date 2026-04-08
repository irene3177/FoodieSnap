import { Request, Response } from 'express';
import { register, login, getMe, updateProfile, changePassword, logout, deleteUser } from '../../controllers/auth.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';
import { CommentModel } from '../../models/Comment.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Auth Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string; file?: any }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;
  let clearCookieMock: jest.Mock;
  let testUserId: string;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    cookieMock = jest.fn();
    clearCookieMock = jest.fn();
    next = jest.fn();
    res = {
      json: jsonMock,
      status: statusMock,
      cookie: cookieMock,
      clearCookie: clearCookieMock
    };
  };

  beforeAll(async () => {
    // Database connection is handled by global setup
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId
    };
  });

  describe('register and login flow', () => {
    it('should register a new user and then login successfully', async () => {
      // Register
      req.body = {
        username: 'integrationuser',
        email: 'integration@test.com',
        password: 'password123'
      };

      await register(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(cookieMock).toHaveBeenCalled();

      // Login
      setupResponseMocks();
      req.body = {
        email: 'integration@test.com',
        password: 'password123'
      };

      await login(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            username: 'integrationuser',
            email: 'integration@test.com'
          })
        })
      });
    });

    it('should not allow duplicate registration', async () => {
      // First registration
      req.body = {
        username: 'duplicateuser',
        email: 'duplicate@test.com',
        password: 'password123'
      };

      await register(req as Request, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(201);

      // Second registration with same email
      setupResponseMocks();
      await register(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('User already exists');
      expect(next.mock.calls[0][0].statusCode).toBe(409);
    });
  });

  describe('getMe after login', () => {

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await UserModel.create({
        username: 'testuser',
        email: 'test@test.com',
        password: hashedPassword,
        avatar: 'https://picsum.photos/200/200'
      });
      testUserId = user._id.toString();
      jwt.sign({ userId: testUserId }, config.jwtSecret!, { expiresIn: '1h' });
    });

    it('should get current user profile', async () => {
      req.userId = testUserId;

      await getMe(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'testuser',
          email: 'test@test.com'
        })
      });
    });
  });

  describe('updateProfile', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await UserModel.create({
        username: 'testuser',
        email: 'test@test.com',
        password: hashedPassword,
        avatar: 'https://picsum.photos/200/200',
        bio: 'Original bio'
      });
      testUserId = user._id.toString();
    });

    it('should update user profile', async () => {
      req.userId = testUserId;
      req.body = {
        username: 'updateduser',
        bio: 'Updated bio'
      };

      await updateProfile(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'updateduser',
          bio: 'Updated bio'
        })
      });

      // Verify in database
      const updatedUser = await UserModel.findById(testUserId);
      expect(updatedUser?.username).toBe('updateduser');
      expect(updatedUser?.bio).toBe('Updated bio');
    });
  });

  describe('changePassword', () => {
    beforeEach(async () => {
      const user = await UserModel.create({
        username: 'testuser',
        email: 'test@test.com',
        password: 'oldpassword123',
        avatar: 'https://picsum.photos/200/200'
      });
      testUserId = user._id.toString();
      await UserModel.findById(testUserId).select('+password');
    });

    it('should change password successfully', async () => {
      req.userId = testUserId;
      req.body = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123'
      };

      await changePassword(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully'
      });

      // Verify new password works
      const user = await UserModel.findById(testUserId).select('+password');
      const isPasswordValid = await bcrypt.compare('newpassword123', user!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should not change password with wrong current password', async () => {
      req.userId = testUserId;
      req.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      await changePassword(req as any, res as Response, next);

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Current password is incorrect');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('deleteUser', () => {
    let testUserId: string;
    let testUser: any;
    let testRecipeId: string;

    beforeEach(async () => {
      // Create test user
      testUser = await UserModel.create({
        username: 'todelete',
        email: 'delete@test.com',
        password: 'password123',
        avatar: 'https://picsum.photos/200/200'
      });
      testUserId = testUser._id.toString();
      
      // Create some recipes for the user
      const recipes = await RecipeModel.create([
        {
          title: 'User Recipe 1',
          author: testUserId,
          ingredients: ['ingredient 1'],
          instructions: ['step 1'],
          source: 'user'
        },
        {
          title: 'User Recipe 2',
          author: testUserId,
          ingredients: ['ingredient 1'],
          instructions: ['step 1'],
          source: 'user'
        }
      ]);
      testRecipeId = recipes[0]._id.toString();

      await CommentModel.create([
        {
          text: 'User comment 1',
          userId: testUserId,
          recipeId: testRecipeId,
          userName: testUser.username
        },
        {
          text: 'User comment 2',
          userId: testUserId,
          recipeId: testRecipeId,
          userName: testUser.username
        }
      ]);

      const anotherUser = await UserModel.create({
        username: 'anotheruser',
        email: 'another@test.com',
        password: 'password123',
        avatar: 'https://picsum.photos/200/200'
      });

      await CommentModel.create({
        text: 'Comment from another user',
        userId: anotherUser._id,
        recipeId: testRecipeId,
        userName: anotherUser.username
      });
      
    });

    it('should delete user and all associated data', async () => {
      // Arrange
      req.userId = testUserId;

      // Verify data exists before deletion
      let userBefore = await UserModel.findById(testUserId);
      expect(userBefore).toBeTruthy();
      
      let userRecipesBefore = await RecipeModel.find({ author: testUserId });
      expect(userRecipesBefore).toHaveLength(2);
      
      let userCommentsBefore = await CommentModel.find({ userId: testUserId });
      expect(userCommentsBefore).toHaveLength(2);
      
      let allCommentsBefore = await CommentModel.countDocuments();
      expect(allCommentsBefore).toBe(3);
      
      // Act
      await deleteUser(req as any, res as Response, next);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'User account deleted successfully'
      });
      expect(clearCookieMock).toHaveBeenCalled();
      
      // Verify user is deleted
      const deletedUser = await UserModel.findById(testUserId);
      expect(deletedUser).toBeNull();
      
      // Verify user's recipes are deleted
      const userRecipes = await RecipeModel.find({ userId: testUserId });
      expect(userRecipes).toHaveLength(0);

      // Verify user's comments are deleted
      const userComments = await CommentModel.find({ userId: testUserId });
      expect(userComments).toHaveLength(0);

      // Verify comments from other users on this user's recipes are NOT deleted
      const allComments = await CommentModel.find();
      expect(allComments).toHaveLength(1); // Only the comment from another user remains
      expect(allComments[0].text).toBe('Comment from another user');
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success', async () => {
      await logout(req as any, res as Response, next);

      expect(clearCookieMock).toHaveBeenCalledWith('token', expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});