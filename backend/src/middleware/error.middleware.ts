import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: {
    [key: string]: {
      message: string;
      path?: string;
      kind?: string;
      value?: any;
    }
  };
}

export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err);

  // Default error response
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors: any = null;

  // Handle specific Mongoose errors

  // Duplicate key error
  if (err.code === 11000 && err.keyValue) {
    status = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Validation error
  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation Error';
    errors = Object.entries(err.errors).map(([field, error]) => ({
      field: field,
      message: error.message
    }));
  }

  // Cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token has expired';
  }

  // Send error response
  res.status(status).json({
    success: false,
    message,
    errors: errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as ErrorWithStatus;
  error.status = 404;
  next(error);
};