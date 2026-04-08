import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
  
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = decoded.userId;
    }
  } catch (error) {
    // Ignore token errors - user just won't be authenticated
    console.log('Optional auth: invalid or no token');
  }
  next();
};