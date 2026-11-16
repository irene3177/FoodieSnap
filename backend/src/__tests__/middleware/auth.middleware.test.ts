import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware';
import { UserModel } from '../../models/User.model';

jest.mock('jsonwebtoken');
jest.mock('../../models/User.model');

describe('Auth Middleware', () => {
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
    req = {
      header: jest.fn(),
      cookies: {},
      userId: undefined,
      user: undefined,
    };
    res = {};
  });

  const getNextError = (): any => {
    expect(next).toHaveBeenCalled();
    const call = next.mock.calls[0];
    return call[0];
  };

  // ---------- Happy path: token from header ----------

  describe('Token from Authorization header', () => {
    it('should extract token and authenticate user', async () => {
      const token = 'valid-token';
      const decoded = { userId: 'user123' };
      const mockUser = { _id: 'user123', username: 'testuser' };

      (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ---------- Happy path: token from cookie ----------

  describe('Token from cookies', () => {
    it('should extract token from cookie if header not present', async () => {
      const token = 'token-from-cookie';
      const decoded = { userId: 'user123' };
      const mockUser = { _id: 'user123', username: 'testuser' };

      (req.header as jest.Mock).mockReturnValue(undefined);
      req.cookies = { token };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should prefer header over cookie when both present', async () => {
      const headerToken = 'header-token';
      const cookieToken = 'cookie-token';
      const decoded = { userId: 'user123' };
      const mockUser = { _id: 'user123', username: 'testuser' };

      (req.header as jest.Mock).mockReturnValue(`Bearer ${headerToken}`);
      req.cookies = { token: cookieToken };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith(headerToken, process.env.JWT_SECRET);
      expect(jwt.verify).not.toHaveBeenCalledWith(cookieToken, expect.anything());
    });
  });

  // ---------- No token ----------

  describe('Missing token', () => {
    it('should call next with UnauthorizedError when no token anywhere', async () => {
      (req.header as jest.Mock).mockReturnValue(undefined);
      req.cookies = {};

      await authMiddleware(req, res as Response, next);

      const error = getNextError();
      expect(error.message).toBe('Authorization required');
      expect(error.statusCode).toBe(401);
    });
  });

  // ---------- Invalid token ----------

  describe('Invalid token', () => {
    it('should call next with UnauthorizedError when jwt.verify throws', async () => {
      (req.header as jest.Mock).mockReturnValue('Bearer invalid-token');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await authMiddleware(req, res as Response, next);

      const error = getNextError();
      expect(error.message).toBe('Invalid or expired token');
      expect(error.statusCode).toBe(401);
    });

    it('should call next with UnauthorizedError when token is expired', async () => {
      (req.header as jest.Mock).mockReturnValue('Bearer expired-token');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const err: any = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        throw err;
      });

      await authMiddleware(req, res as Response, next);

      const error = getNextError();
      expect(error.message).toBe('Invalid or expired token');
      expect(error.statusCode).toBe(401);
    });
  });

  // ---------- User not found ----------

  describe('User not found in DB', () => {
    it('should call next with NotFoundError when user does not exist', async () => {
      const token = 'valid-token';
      const decoded = { userId: 'missingUser' };

      (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authMiddleware(req, res as Response, next);

      const error = getNextError();
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(req.userId).toBeUndefined();
      expect(req.user).toBeUndefined();
    });
  });

  // ---------- DB error ----------

  describe('DB errors', () => {
    it('should call next with UnauthorizedError when findById throws', async () => {
      const token = 'valid-token';
      const decoded = { userId: 'user123' };

      (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await authMiddleware(req, res as Response, next);

      const error = getNextError();
      expect(error.message).toBe('Invalid or expired token');
      expect(error.statusCode).toBe(401);
    });
  });
});