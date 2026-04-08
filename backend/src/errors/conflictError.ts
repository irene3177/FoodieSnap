import { constants } from 'http2';
import { ErrorWithStatus } from '../types/errors.types';

const ConflictError = (message: string): ErrorWithStatus => {
  const error = new Error(message) as ErrorWithStatus;
  error.name = 'ConflictError';
  error.statusCode = constants.HTTP_STATUS_CONFLICT; // 409
  return error;
};

export default ConflictError;