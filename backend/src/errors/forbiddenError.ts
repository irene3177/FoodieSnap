import { constants } from 'http2';
import { ErrorWithStatus } from '../types/errors.types';

const ForbiddenError = (message: string): ErrorWithStatus => {
  const error = new Error(message) as ErrorWithStatus;
  error.name = 'ForbiddenError';
  error.statusCode = constants.HTTP_STATUS_FORBIDDEN; // 403
  return error;
};

export default ForbiddenError;