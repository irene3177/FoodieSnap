import { param, body } from 'express-validator';
import { isValidObjectId } from '../utils/validation';

export const validateParamId = (paramName: string = 'id') => {
  return param(paramName)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${paramName} format`);
};

export const validateBodyId = (fieldName: string = 'id') => {
  return body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${fieldName} format`);
};