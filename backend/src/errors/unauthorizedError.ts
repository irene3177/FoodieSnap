import { constants } from 'http2';
import { ErrorWithStatus } from '../types/errors.types';

const UnauthorizedError = (message: string): ErrorWithStatus => {
  const error = new Error(message) as ErrorWithStatus;
  error.name = 'UnauthorizedError';
  error.statusCode = constants.HTTP_STATUS_UNAUTHORIZED; // 401
  return error;
};

export default UnauthorizedError;