import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getOrCreateConversation,
  getConversationById,
  sendMessage,
  markAsRead,
  getUserConversations,
  deleteConversation,
  clearChat
} from '../controllers/message.controller';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', getUserConversations);
router.get('/conversation/:otherUserId', getOrCreateConversation);
router.get('/conversation-by-id/:conversationId', getConversationById);
router.post('/conversation/:conversationId/message', sendMessage);
router.put('/conversation/:conversationId/read', markAsRead);
router.delete('/conversation/:conversationId/messages', clearChat);
router.delete('/conversation/:conversationId', deleteConversation);

export default router;