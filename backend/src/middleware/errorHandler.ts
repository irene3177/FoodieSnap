import { ErrorRequestHandler } from 'express';
import { constants } from 'http2';
import { ErrorWithStatus } from '../types/errors.types';

const errorHandler: ErrorRequestHandler = (err: ErrorWithStatus, _req, res, _next) => {
  console.error('❌ Error:', err);
  
  let statusCode = err.statusCode || constants.HTTP_STATUS_INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  
  // Handle specific Mongoose errors
  if (err.code === 11000 && err.keyValue) {
    statusCode = constants.HTTP_STATUS_BAD_REQUEST;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }
  
  // Validation error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = constants.HTTP_STATUS_BAD_REQUEST;
    message = 'Validation Error';
  }
  
  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = constants.HTTP_STATUS_BAD_REQUEST;
    message = 'Invalid ID format';
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = constants.HTTP_STATUS_UNAUTHORIZED;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = constants.HTTP_STATUS_UNAUTHORIZED;
    message = 'Token has expired';
  }
  
  // Don't expose internal errors in production
  if (statusCode === constants.HTTP_STATUS_INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;