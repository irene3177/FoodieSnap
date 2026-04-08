import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware';
import { UserModel } from '../../models/User.model';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User.model');
jest.mock('../../errors/unauthorizedError');
jest.mock('../../errors/notFoundError');

describe('Auth Middleware', () => {
  let req: Partial<Request & { userId?: string; user?: any; cookies?: any }>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
    req = {
      header: jest.fn(),
      cookies: {},
      userId: undefined,
      user: undefined
    };
    res = {};
  });

  describe('Token extraction', () => {
    it('should extract token from Authorization header', async () => {
      // Arrange
      const token = 'valid-token';
      const decoded = { userId: 'user123' };
      const mockUser = { _id: 'user123', username: 'testuser' };
      
      (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await authMiddleware(req as any, res as Response, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should extract token from cookies if header not present', async () => {
      // Arrange
      const token = 'token-from-cookie';
      const decoded = { userId: 'user123' };
      const mockUser = { _id: 'user123', username: 'testuser' };
      
      (req.header as jest.Mock).mockReturnValue(undefined);
      req.cookies = { token };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await authMiddleware(req as any, res as Response, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(next).toHaveBeenCalled();
    });
  });
});