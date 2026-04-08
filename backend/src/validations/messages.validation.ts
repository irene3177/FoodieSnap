import { body } from 'express-validator';
import { validateParamId } from './common.validation';

// Validation for otherUserId in params (getOrCreateConversation)
export const validateOtherUserId = [
  validateParamId('otherUserId')
];

// Validation for conversationId in params
export const validateConversationId = [
  validateParamId('conversationId')
];

// Validation for sending a message
export const validateSendMessage = [
  validateParamId('conversationId'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
];
