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
import { deleteOldAvatarIfLocal } from '../../middleware/upload.middleware';
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
      // Arrange
      req.body = registerData;
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        bio: '',
        avatar: 'https://picsum.photos/200/200',
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel as any).mockImplementation(() => mockUser);
      
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      // Act
      await register(req as Request, res as Response, next);

      // Assert
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
      // Arrange
      req.body = registerData;
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'test@test.com' });

      // Act
      await register(req as Request, res as Response, next);

      // Assert
      expect(ConflictError).toHaveBeenCalledWith('User already exists');
      expect(next).toHaveBeenCalled();
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      req.body = registerData;
      const error = new Error('Database error');
      (UserModel.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await register(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@test.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      req.body = loginData;
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        bio: '',
        avatar: 'https://picsum.photos/200/200',
        comparePassword: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          username: 'testuser',
          email: 'test@test.com',
          bio: '',
          avatar: 'https://picsum.photos/200/200',
          password: 'hashed'
        })
      };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      // Act
      await login(req as Request, res as Response, next);

      // Assert
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
      // Arrange
      req.body = loginData;
      const mockSelect = jest.fn().mockResolvedValue(null);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      // Act
      await login(req as Request, res as Response, next);

      // Assert
      expect(UnauthorizedError).toHaveBeenCalledWith('Invalid credentials');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if password is invalid', async () => {
      // Arrange
      req.body = loginData;
      const mockUser = {
        _id: '123',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      // Act
      await login(req as Request, res as Response, next);

      // Assert
      expect(UnauthorizedError).toHaveBeenCalledWith('Invalid credentials');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      // Arrange
      req.userId = '123';
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://picsum.photos/200/200',
        bio: 'Test bio'
      };
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await getMe(req as any, res as Response, next);

      // Assert
      expect(UserModel.findById).toHaveBeenCalledWith('123');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.userId = '123';
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await getMe(req as any, res as Response, next);

      // Assert
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
      // Arrange
      req.userId = '123';
      req.body = updateData;
      const mockUser = {
        _id: '123',
        username: 'oldusername',
        email: 'test@test.com',
        bio: 'Old bio',
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await updateProfile(req as any, res as Response, next);

      // Assert
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

    it('should delete old avatar if changed', async () => {
      // Arrange
      req.userId = '123';
      req.body = { avatar: 'https://new-avatar.com/image.jpg' };
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://old-avatar.com/old.jpg',
        bio: '',
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await updateProfile(req as any, res as Response, next);
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.userId = '123';
      req.body = updateData;
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await updateProfile(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar successfully', async () => {
      // Arrange
      req.userId = '123';
      req.file = { filename: 'new-avatar.jpg' };

      jest.mock('../../config', () => ({
        config: {
          baseUrl: 'https://localhost:5001'
        }
      }));

      const mockReq = {
        ...req,
        userId: '123',
        file: { filename: 'new-avatar.jpg' },
        protocol: 'https',
        get: jest.fn().mockReturnValue('localhost:5001')
      };
      
      const mockUser = {
        _id: '123',
        avatar: 'https://old-avatar.com/old.jpg',
        save: jest.fn().mockResolvedValue(true)
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await updateAvatar(mockReq as any, res as Response, next);

      // Assert
      expect(UserModel.findById).toHaveBeenCalledWith('123');
      expect(mockUser.avatar).toBe('https://localhost:5001/uploads/avatars/new-avatar.jpg');
      expect(mockUser.save).toHaveBeenCalled();
      expect(deleteOldAvatarIfLocal).toHaveBeenCalledWith('https://old-avatar.com/old.jpg');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { avatar: 'https://localhost:5001/uploads/avatars/new-avatar.jpg' }
      });
    });

    it('should return 400 if no file uploaded', async () => {
      // Arrange
      req.userId = '123';
      req.file = undefined;

      // Act
      await updateAvatar(req as any, res as Response, next);

      // Assert
      expect(BadRequestError).toHaveBeenCalledWith('No file uploaded');
      expect(next).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.userId = '123';
      req.file = { filename: 'new-avatar.jpg' };
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await updateAvatar(req as any, res as Response, next);

      // Assert
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
      // Arrange
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

      // Act
      await changePassword(req as any, res as Response, next);

      // Assert
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
      // Arrange
      req.userId = '123';
      req.body = passwordData;
      const mockSelect = jest.fn().mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      // Act
      await changePassword(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if current password is incorrect', async () => {
      // Arrange
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

      // Act
      await changePassword(req as any, res as Response, next);

      // Assert
      expect(UnauthorizedError).toHaveBeenCalledWith('Current password is incorrect');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear token cookie and return success', async () => {
      // Act
      await logout(req as any, res as Response, next);

      // Assert
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
      // Arrange
      req.userId = userId;
      
      const mockUser = {
        _id: userId,
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://picsum.photos/200/200',
        save: jest.fn()
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (RecipeModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (CommentModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 });
      (UserModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await deleteUser(req as any, res as Response, next);

      // Assert
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
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

    it('should delete local avatar if exists', async () => {
      // Arrange
      req.userId = userId;
      
      const mockUser = {
        _id: userId,
        username: 'testuser',
        email: 'test@test.com',
        avatar: '/uploads/avatars/user-avatar.jpg',
        save: jest.fn()
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (RecipeModel.deleteMany as jest.Mock).mockResolvedValue({});
      (CommentModel.deleteMany as jest.Mock).mockResolvedValue({});
      (UserModel.updateMany as jest.Mock).mockResolvedValue({});
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await deleteUser(req as any, res as Response, next);

      // Assert
      expect(deleteOldAvatarIfLocal).toHaveBeenCalledWith('/uploads/avatars/user-avatar.jpg');
    });

    it('should not delete non-local avatar', async () => {
      // Arrange
      req.userId = userId;
      
      const mockUser = {
        _id: userId,
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://picsum.photos/200/200', // external URL
        save: jest.fn()
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (RecipeModel.deleteMany as jest.Mock).mockResolvedValue({});
      (CommentModel.deleteMany as jest.Mock).mockResolvedValue({});
      (UserModel.updateMany as jest.Mock).mockResolvedValue({});
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await deleteUser(req as any, res as Response, next);

      // Assert
      expect(deleteOldAvatarIfLocal).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.userId = userId;
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteUser(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
      expect(UserModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should pass database errors to next middleware', async () => {
      // Arrange
      req.userId = userId;
      const error = new Error('Database error');
      (UserModel.findById as jest.Mock).mockRejectedValue(error);

      // Act
      await deleteUser(req as any, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});