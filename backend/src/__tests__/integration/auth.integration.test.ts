import { Request, Response } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  deleteUser,
  updateAvatar,
} from '../../controllers/auth.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';
import { CommentModel } from '../../models/Comment.model';
import { deleteOldAvatarFromCloudinary } from '../../middleware/upload.middleware';
import bcrypt from 'bcryptjs';

jest.mock('../../middleware/upload.middleware');

describe('Auth Controller Integration Tests', () => {
  let req: any;
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
      clearCookie: clearCookieMock,
    };
  };

  beforeEach(async () => {
    await UserModel.deleteMany({ email: /@authtest\.com$/ });
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId,
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@authtest\.com$/ });
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});
  });

  // ---------- register + login flow ----------

  describe('register and login flow', () => {
    it('should register a new user and then login successfully', async () => {
      req.body = {
        username: 'integrationuser',
        email: 'integration@authtest.com',
        password: 'password123',
      };

      await register(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(cookieMock).toHaveBeenCalled();

      setupResponseMocks();
      req.body = {
        email: 'integration@authtest.com',
        password: 'password123',
      };

      await login(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            username: 'integrationuser',
            email: 'integration@authtest.com',
          }),
        }),
      });
    });

    it('should hash the password on register', async () => {
      req.body = {
        username: 'hashuser',
        email: 'hash@authtest.com',
        password: 'plainpassword',
      };

      await register(req as Request, res as Response, next);

      const user = await UserModel.findOne({ email: 'hash@authtest.com' }).select('+password');
      expect(user?.password).not.toBe('plainpassword');
      expect(user?.password.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('should not allow duplicate registration', async () => {
      req.body = {
        username: 'duplicateuser',
        email: 'duplicate@authtest.com',
        password: 'password123',
      };
      await register(req as Request, res as Response, next);

      setupResponseMocks();
      await register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should return 401 on login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      await UserModel.create({
        username: 'wrongpass',
        email: 'wrongpass@authtest.com',
        password: hashedPassword,
      });

      req.body = {
        email: 'wrongpass@authtest.com',
        password: 'wrongpassword',
      };

      await login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should return 401 on login with non-existent email', async () => {
      req.body = {
        email: 'nonexistent@authtest.com',
        password: 'whatever',
      };

      await login(req as Request, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });
  });

  // ---------- getMe ----------

  describe('getMe after login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await UserModel.create({
        username: 'meuser',
        email: 'me@authtest.com',
        password: hashedPassword,
        avatar: 'https://picsum.photos/200/200',
      });
      testUserId = user._id.toString();
    });

    it('should get current user profile', async () => {
      req.userId = testUserId;

      await getMe(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'meuser',
          email: 'me@authtest.com',
        }),
      });
    });

    it('should return 404 if user not found', async () => {
      req.userId = '507f1f77bcf86cd799439011';

      await getMe(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- updateProfile ----------

  describe('updateProfile', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await UserModel.create({
        username: 'profuser',
        email: 'prof@authtest.com',
        password: hashedPassword,
        avatar: 'https://picsum.photos/200/200',
        bio: 'Original bio',
      });
      testUserId = user._id.toString();
    });

    it('should update user profile', async () => {
      req.userId = testUserId;
      req.body = {
        username: 'updateduser',
        bio: 'Updated bio',
      };

      await updateProfile(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'updateduser',
          bio: 'Updated bio',
        }),
      });

      const updatedUser = await UserModel.findById(testUserId);
      expect(updatedUser?.username).toBe('updateduser');
      expect(updatedUser?.bio).toBe('Updated bio');
    });

    it('should return 404 if user not found', async () => {
      req.userId = '507f1f77bcf86cd799439011';
      req.body = { username: 'whatever' };

      await updateProfile(req, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
    });
  });

  // ---------- changePassword ----------

  describe('changePassword', () => {
    beforeEach(async () => {
      const user = await UserModel.create({
        username: 'pwuser',
        email: 'pw@authtest.com',
        password: 'oldpassword123',
        avatar: 'https://picsum.photos/200/200',
      });
      testUserId = user._id.toString();
    });

    it('should change password successfully', async () => {
      req.userId = testUserId;
      req.body = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      await changePassword(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });

      const user = await UserModel.findById(testUserId).select('+password');
      const isPasswordValid = await bcrypt.compare('newpassword123', user!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should not change password with wrong current password', async () => {
      req.userId = testUserId;
      req.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      await changePassword(req, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Current password is incorrect');
      expect(error.statusCode).toBe(401);
    });

    it('should return 404 if user not found', async () => {
      req.userId = '507f1f77bcf86cd799439011';
      req.body = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      await changePassword(req, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
    });
  });

  // ---------- updateAvatar ----------

  describe('updateAvatar', () => {
    beforeEach(async () => {
      const user = await UserModel.create({
        username: 'avataruser',
        email: 'avatar@authtest.com',
        password: 'password123',
        avatar: 'https://old.cloudinary.com/old-avatar.jpg',
      });
      testUserId = user._id.toString();
    });

    it('should update avatar successfully', async () => {
      req.userId = testUserId;
      req.file = { path: 'https://new.cloudinary.com/new-avatar.jpg' };

      await updateAvatar(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { avatar: 'https://new.cloudinary.com/new-avatar.jpg' },
      });

      const user = await UserModel.findById(testUserId);
      expect(user?.avatar).toBe('https://new.cloudinary.com/new-avatar.jpg');
      expect(deleteOldAvatarFromCloudinary).toHaveBeenCalledWith(
        'https://old.cloudinary.com/old-avatar.jpg'
      );
    });

    it('should return 400 if no file uploaded', async () => {
      req.userId = testUserId;
      req.file = undefined;

      await updateAvatar(req, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('No file uploaded');
      expect(error.statusCode).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      req.userId = '507f1f77bcf86cd799439011';
      req.file = { path: 'https://new.cloudinary.com/new-avatar.jpg' };

      await updateAvatar(req, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
    });
  });

  // ---------- deleteUser ----------

  describe('deleteUser', () => {
    let testRecipeId: string;

    beforeEach(async () => {
      const user = await UserModel.create({
        username: 'todelete',
        email: 'delete@authtest.com',
        password: 'password123',
        avatar: 'https://picsum.photos/200/200',
      });
      testUserId = user._id.toString();

      const recipes = await RecipeModel.create([
        {
          title: 'User Recipe 1',
          author: testUserId,
          ingredients: ['ingredient 1'],
          instructions: ['step 1'],
          source: 'user',
        },
        {
          title: 'User Recipe 2',
          author: testUserId,
          ingredients: ['ingredient 1'],
          instructions: ['step 1'],
          source: 'user',
        },
      ]);
      testRecipeId = recipes[0]._id.toString();

      await CommentModel.create([
        {
          text: 'User comment 1',
          userId: testUserId,
          recipeId: testRecipeId,
          userName: 'todelete',
        },
        {
          text: 'User comment 2',
          userId: testUserId,
          recipeId: testRecipeId,
          userName: 'todelete',
        },
      ]);

      const anotherUser = await UserModel.create({
        username: 'anotheruser',
        email: 'another@authtest.com',
        password: 'password123',
        avatar: 'https://picsum.photos/200/200',
      });

      await CommentModel.create({
        text: 'Comment from another user',
        userId: anotherUser._id,
        recipeId: testRecipeId,
        userName: 'anotheruser',
      });
    });

    it('should delete user and all associated data', async () => {
      req.userId = testUserId;

      const userRecipesBefore = await RecipeModel.find({ author: testUserId });
      expect(userRecipesBefore).toHaveLength(2);

      const userCommentsBefore = await CommentModel.find({ userId: testUserId });
      expect(userCommentsBefore).toHaveLength(2);

      const allCommentsBefore = await CommentModel.countDocuments();
      expect(allCommentsBefore).toBe(3);

      await deleteUser(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'User account deleted successfully',
      });
      expect(clearCookieMock).toHaveBeenCalled();

      const deletedUser = await UserModel.findById(testUserId);
      expect(deletedUser).toBeNull();

      const userRecipes = await RecipeModel.find({ author: testUserId });
      expect(userRecipes).toHaveLength(0);

      const userComments = await CommentModel.find({ userId: testUserId });
      expect(userComments).toHaveLength(0);

      // Комментарий другого юзера должен остаться
      const allComments = await CommentModel.find();
      expect(allComments).toHaveLength(1);
      expect(allComments[0].text).toBe('Comment from another user');
    });

    it('should return 404 if user not found', async () => {
      req.userId = '507f1f77bcf86cd799439011';

      await deleteUser(req, res as Response, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- logout ----------

  describe('logout', () => {
    it('should clear cookie and return success', async () => {
      await logout(req as AuthRequest, res as Response, next);

      expect(clearCookieMock).toHaveBeenCalledWith('token', expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});