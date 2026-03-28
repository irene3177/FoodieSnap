import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ConversationModel } from '../models/Conversation.model';
import { MessageModel } from '../models/Message.model';
import mongoose from 'mongoose';

// Helper function to get string from param
const getStringId = (id: string | string[]): string => {
  return Array.isArray(id) ? id[0] : id;
};

// Get or create conversation between two users
export const getOrCreateConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const otherUserId = getStringId(req.params.otherUserId);

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
      return;
    }

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
    console.error('❌ Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    });
  }
};

export const getConversationById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    const conversation = await ConversationModel.findById(conversationId)
      .populate('participants', 'username avatar');

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
      return;
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId
    );
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
      return;
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
    console.error('❌ Get conversation by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    });
  }
};

// Send a message
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);
    const { text } = req.body;

    if (!text?.trim()) {
      res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
      return;
    }

    // Find conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
      return;
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === senderId
    );
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
      return;
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
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Mark messages as read
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  console.log('🔍 REST markAsRead called for conversation:', req.params.conversationId);
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    const conversation = await ConversationModel.findById(conversationId);
    if (conversation) {
      if (!conversation.unreadCount) conversation.unreadCount = {};
      conversation.unreadCount[userId] = 0;
      await conversation.save();
    }

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
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
};

// Get user's conversations
export const getUserConversations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    console.log('🔍 getUserConversations called');

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await ConversationModel.find({
      participants: userObjectId
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar')
      .lean();


    conversations.forEach(conv => {
      console.log(`📊 Conversation ${conv._id}: unreadCount =`, conv.unreadCount);
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
};

// Delete a conversation
export const deleteConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    // Find conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
      return;
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === userId
    );
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
      return;
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
    console.error('❌ Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
};

// Delete all messages in a conversation (keep conversation)
export const clearChat = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const conversationId = getStringId(req.params.conversationId);

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
      return;
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId
    );
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
      return;
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
    console.error('❌ Clear chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat'
    });
  }
};