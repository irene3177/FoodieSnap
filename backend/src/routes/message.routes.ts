import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validationHandler';
import {
  getOrCreateConversation,
  getConversationById,
  sendMessage,
  markAsRead,
  getUserConversations,
  deleteConversation,
  clearChat
} from '../controllers/messages.controller';
import {
  validateOtherUserId,
  validateConversationId,
  validateSendMessage
} from '../validations/messages.validation';


const router = Router();

router.use(authMiddleware);

router.get('/conversations', getUserConversations);
router.get('/conversation/:otherUserId', validate(validateOtherUserId), getOrCreateConversation);
router.get('/conversation-by-id/:conversationId', validate(validateConversationId), getConversationById);
router.post('/conversation/:conversationId/message', validate(validateSendMessage), sendMessage);
router.put('/conversation/:conversationId/read', validate(validateConversationId), markAsRead);
router.delete('/conversation/:conversationId/messages', validate(validateConversationId), clearChat);
router.delete('/conversation/:conversationId', validate(validateConversationId), deleteConversation);

export default router;