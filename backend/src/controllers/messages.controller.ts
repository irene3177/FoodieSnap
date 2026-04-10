import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import { ConversationModel } from '../models/Conversation.model';
import { MessageModel } from '../models/Message.model';
import mongoose from 'mongoose';
import NotFoundError from '../errors/notFoundError';
import ForbiddenError from '../errors/forbiddenError';

// Helper function to get string from param
const getStringId = (id: string | string[]): string => {
  return Array.isArray(id) ? id[0] : id;
};

// GET /api/messages/conversation/:otherUserId
export const getOrCreateConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const otherUserId = getStringId(req.params.otherUserId);

    // Convert to ObjectId objects
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);

    // Find existing conversation
    let conversation = await ConversationModel.findOne({
      participants: { $all: [userObjectId, otherUserObjectId] }
    });

    // If not exists, create new
    if (!conversation) {
      // Use plain object for unreadCount
      const unreadCount = {
        [userId]: 0,
        [otherUserId]: 0
      };
      
      conversation = await ConversationModel.create({
        participants: [userObjectId, otherUserObjectId],
        unreadCount: unreadCount,
        lastMessageAt: new Date(),
        lastMessage: ''
      });
    }

    await conversation.populate('participants', 'username avatar');

    // Get messages
    const messages = await MessageModel.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username avatar');

    res.json({
      success: true,
      data: {
        _id: conversation._id,
        messages,
        participants: conversation.participants
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/conversation-by-id/:conversationId
export const getConversationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    const conversation = await ConversationModel.findById(conversationId)
      .populate('participants', 'username avatar');

    if (!conversation) {
      return next(NotFoundError('Conversation not found'));
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId
    );
    if (!isParticipant) {
      return next(ForbiddenError('Not authorized to view this conversation'));
    }

    // Get messages
    const messages = await MessageModel.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username avatar');
  

    res.json({
      success: true,
      data: {
        _id: conversation._id,
        messages,
        participants: conversation.participants
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/messages/conversation/:conversationId/message
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);
    const { text } = req.body;

    // Find conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return next(NotFoundError('Conversation not found'));
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === senderId
    );
    if (!isParticipant) {
      return next(ForbiddenError('Not authorized to send messages in this conversation'));
    }

    // Create message
    const message = await MessageModel.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: new mongoose.Types.ObjectId(senderId),
      text: text.trim()
    });

    await ConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: text.trim(),
      lastMessageAt: new Date()
    });

    const populatedMessage = await MessageModel
      .findById(message._id)
      .populate('senderId', 'username avatar');

    res.json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/messages/conversation/:conversationId/read
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return next(NotFoundError('Conversation not found'));
    }
    if (!conversation.unreadCount) conversation.unreadCount = {};
    conversation.unreadCount[userId] = 0;
    await conversation.save();


    // Update all unread messages from other user
    await MessageModel.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/conversations
export const getUserConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await ConversationModel.find({
      participants: userObjectId
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar')
      .lean();

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/messages/conversation/:conversationId
export const deleteConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    // Find conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return next(NotFoundError('Conversation not found'));
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === userId
    );
    if (!isParticipant) {
      return next(ForbiddenError('Not authorized to delete this conversation'));
    }

    // Delete all messages in the conversation
    await MessageModel.deleteMany({ conversationId: conversation._id });
    
    // Delete the conversation
    await ConversationModel.findByIdAndDelete(conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/messages/conversation/:conversationId/messages
export const clearChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return next(NotFoundError('Conversation not found'));
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId
    );
    if (!isParticipant) {
      return next(ForbiddenError('Not authorized to clear this chat'));
    }

    // Delete all messages
    await MessageModel.deleteMany({ conversationId: conversation._id });
    
    // Reset last message
    await ConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: '',
      lastMessageAt: new Date()
    });

    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    next(error);
  }
};