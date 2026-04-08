import { constants } from 'http2';
import { ErrorWithStatus } from '../types/errors.types';

const BadRequestError = (message: string): ErrorWithStatus => {
  const error = new Error(message) as ErrorWithStatus;
  error.name = 'BadRequestError';
  error.statusCode = constants.HTTP_STATUS_BAD_REQUEST; // 400
  return error;
};

export default BadRequestError;