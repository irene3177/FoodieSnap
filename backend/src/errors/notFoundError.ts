import { constants } from 'http2';
import { ErrorWithStatus } from '../types/errors.types';

const NotFoundError = (message: string): ErrorWithStatus => {
  const error = new Error(message) as ErrorWithStatus;
  error.name = 'NotFoundError';
  error.statusCode = constants.HTTP_STATUS_NOT_FOUND; // 404
  return error;
};

export default NotFoundError;