import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  logout,
  deleteUser
} from '../../controllers/auth.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';
import { CommentModel } from '../../models/Comment.model';
import { deleteOldAvatarFromCloudinary } from '../../middleware/upload.middleware';
import ConflictError from '../../errors/conflictError';
import UnauthorizedError from '../../errors/unauthorizedError';
import NotFoundError from '../../errors/notFoundError';
import BadRequestError from '../../errors/badRequestError';

// Mock dependencies
jest.mock('../../models/User.model');
jest.mock('../../models/Recipe.model');
jest.mock('../../models/Comment.model');
jest.mock('jsonwebtoken');
jest.mock('../../middleware/upload.middleware');
jest.mock('../../errors/conflictError');
jest.mock('../../errors/unauthorizedError');
jest.mock('../../errors/notFoundError');
jest.mock('../../errors/badRequestError');
jest.mock('../../config', () => ({
  config: {
    jwtSecret: 'test-secret',
    jwtExpire: '7d',
    cookieOptions: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 604800000,
      path: '/',
      domain: undefined
    }
  }
}));

describe('Auth Controller', () => {
  let req: Partial<Request & { userId?: string; file?: any }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;
  let clearCookieMock: jest.Mock;

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

  beforeEach(() => {
    jest.clearAllMocks();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {}
    };
  });

  describe('register', () => {
    const registerData = {
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      req.body = registerData;
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        bio: '',
        avatar: null,
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel as any).mockImplementation(() => mockUser);
      
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await register(req as Request, res as Response, next);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'test@test.com' }, { username: 'testuser' }]
      });
      expect(cookieMock).toHaveBeenCalledWith('token', mockToken, expect.any(Object));
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@test.com'
          })
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 409 if user already exists', async () => {
      req.body = registerData;
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'test@test.com' });

      await register(req as Request, res as Response, next);

      expect(ConflictError).toHaveBeenCalledWith('User already exists');
      expect(next).toHaveBeenCalled();
    });

    it('should pass errors to next middleware', async () => {
      req.body = registerData;
      const error = new Error('Database error');
      (UserModel.findOne as jest.Mock).mockRejectedValue(error);

      await register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@test.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      req.body = loginData;
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        bio: '',
        avatar: 'https://res.cloudinary.com/...',
        comparePassword: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          username: 'testuser',
          email: 'test@test.com',
          bio: '',
          avatar: 'https://res.cloudinary.com/...'
        })
      };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await login(req as Request, res as Response, next);

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(cookieMock).toHaveBeenCalledWith('token', mockToken, expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@test.com'
          })
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      req.body = loginData;
      const mockSelect = jest.fn().mockResolvedValue(null);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await login(req as Request, res as Response, next);

      expect(UnauthorizedError).toHaveBeenCalledWith('Invalid credentials');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if password is invalid', async () => {
      req.body = loginData;
      const mockUser = {
        _id: '123',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await login(req as Request, res as Response, next);

      expect(UnauthorizedError).toHaveBeenCalledWith('Invalid credentials');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      req.userId = '123';
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://res.cloudinary.com/...',
        bio: 'Test bio'
      };
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await getMe(req as any, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('123');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 404 if user not found', async () => {
      req.userId = '123';
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getMe(req as any, res as Response, next);

      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      username: 'newusername',
      bio: 'New bio'
    };

    it('should update user profile successfully', async () => {
      req.userId = '123';
      req.body = updateData;
      const mockUser = {
        _id: '123',
        username: 'oldusername',
        email: 'test@test.com',
        bio: 'Old bio',
        avatar: 'https://res.cloudinary.com/...',
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await updateProfile(req as any, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('123');
      expect(mockUser.username).toBe('newusername');
      expect(mockUser.bio).toBe('New bio');
      expect(mockUser.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'newusername',
          bio: 'New bio'
        })
      });
    });

    it('should return 404 if user not found', async () => {
      req.userId = '123';
      req.body = updateData;
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await updateProfile(req as any, res as Response, next);

      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateAvatar', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/dyb6cegae/image/upload/v1234567890/avatars/avatar-123.jpg';

    it('should update avatar successfully with Cloudinary', async () => {
      req.userId = '123';
      req.file = { path: cloudinaryUrl };
      
      const mockUser = {
        _id: '123',
        avatar: 'https://res.cloudinary.com/.../old-avatar.jpg',
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await updateAvatar(req as any, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('123');
      expect(mockUser.avatar).toBe(cloudinaryUrl);
      expect(mockUser.save).toHaveBeenCalled();
      expect(deleteOldAvatarFromCloudinary).toHaveBeenCalledWith('https://res.cloudinary.com/.../old-avatar.jpg');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { avatar: cloudinaryUrl }
      });
    });

    it('should handle case when user had no previous avatar', async () => {
      req.userId = '123';
      req.file = { path: cloudinaryUrl };
      
      const mockUser = {
        _id: '123',
        avatar: null,
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await updateAvatar(req as any, res as Response, next);

      expect(mockUser.avatar).toBe(cloudinaryUrl);
      expect(deleteOldAvatarFromCloudinary).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { avatar: cloudinaryUrl }
      });
    });

    it('should return 400 if no file uploaded', async () => {
      req.userId = '123';
      req.file = undefined;

      await updateAvatar(req as any, res as Response, next);

      expect(BadRequestError).toHaveBeenCalledWith('No file uploaded');
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 if Cloudinary upload failed', async () => {
      req.userId = '123';
      req.file = { path: null };
      
      const mockUser = {
        _id: '123',
        avatar: null,
        save: jest.fn()
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await updateAvatar(req as any, res as Response, next);

      expect(BadRequestError).toHaveBeenCalledWith('Failed to upload avatar to Cloudinary');
      expect(next).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      req.userId = '123';
      req.file = { path: cloudinaryUrl };
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await updateAvatar(req as any, res as Response, next);

      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword123'
    };

    it('should change password successfully', async () => {
      req.userId = '123';
      req.body = passwordData;
      const mockUser = {
        _id: '123',
        comparePassword: jest.fn().mockResolvedValue(true),
        password: 'oldpassword',
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await changePassword(req as any, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('123');
      expect(mockSelect).toHaveBeenCalledWith('+password');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('oldpassword123');
      expect(mockUser.password).toBe('newpassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully'
      });
    });

    it('should return 404 if user not found', async () => {
      req.userId = '123';
      req.body = passwordData;
      const mockSelect = jest.fn().mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await changePassword(req as any, res as Response, next);

      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if current password is incorrect', async () => {
      req.userId = '123';
      req.body = passwordData;
      const mockUser = {
        _id: '123',
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn()
      };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await changePassword(req as any, res as Response, next);

      expect(UnauthorizedError).toHaveBeenCalledWith('Current password is incorrect');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear token cookie and return success', async () => {
      await logout(req as any, res as Response, next);

      expect(clearCookieMock).toHaveBeenCalledWith('token', expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    const userId = '123';

    it('should delete user successfully', async () => {
      req.userId = userId;
      
      const mockUser = {
        _id: userId,
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://res.cloudinary.com/.../avatar.jpg',
        save: jest.fn()
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (RecipeModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (CommentModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 });
      (UserModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      await deleteUser(req as any, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(deleteOldAvatarFromCloudinary).toHaveBeenCalledWith(mockUser.avatar);
      expect(RecipeModel.deleteMany).toHaveBeenCalledWith({ author: userId });
      expect(CommentModel.deleteMany).toHaveBeenCalledWith({ userId: userId });
      expect(UserModel.updateMany).toHaveBeenCalledWith(
        { favorites: userId },
        { $pull: { favorites: userId } }
      );
      expect(UserModel.updateMany).toHaveBeenCalledWith(
        { createdRecipes: userId },
        { $pull: { createdRecipes: userId } }
      );
      expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(clearCookieMock).toHaveBeenCalledWith('token', expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'User account deleted successfully'
      });
    });

    it('should handle user with no avatar', async () => {
      req.userId = userId;
      
      const mockUser = {
        _id: userId,
        username: 'testuser',
        email: 'test@test.com',
        avatar: null,
        save: jest.fn()
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (RecipeModel.deleteMany as jest.Mock).mockResolvedValue({});
      (CommentModel.deleteMany as jest.Mock).mockResolvedValue({});
      (UserModel.updateMany as jest.Mock).mockResolvedValue({});
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      await deleteUser(req as any, res as Response, next);

      expect(deleteOldAvatarFromCloudinary).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      req.userId = userId;
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteUser(req as any, res as Response, next);

      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
      expect(UserModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should pass database errors to next middleware', async () => {
      req.userId = userId;
      const error = new Error('Database error');
      (UserModel.findById as jest.Mock).mockRejectedValue(error);

      await deleteUser(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});