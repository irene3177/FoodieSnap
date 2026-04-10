import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import UnauthorizedError from '../errors/unauthorizedError';
import NotFoundError from '../errors/notFoundError';
import { AuthRequest } from '../types';

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
  
    if (!token) {
      return next(UnauthorizedError('Authorization required'));
    }
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await UserModel.findById(decoded.userId).select('-password');
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
    
    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch(error) {
    next(UnauthorizedError('Invalid or expired token'));
  }
};