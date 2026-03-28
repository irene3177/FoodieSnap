// backend/services/socket.service.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { MessageModel } from '../models/Message.model';
import { ConversationModel } from '../models/Conversation.model';
import { Types } from 'mongoose';

interface PopulatedMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: {
    _id: Types.ObjectId;
    username: string;
    avatar?: string;
  };
  text: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Simple online users tracking
const onlineUsers = new Map<string, string>(); // userId -> socketId

const saveMessage = async (conversationId: string, senderId: string, text: string) => {
  const message = await MessageModel.create({ conversationId, senderId, text: text.trim() });
  await ConversationModel.findByIdAndUpdate(conversationId, {
    lastMessage: text.trim(),
    lastMessageAt: new Date()
  });
  
  const populated = await MessageModel.findById(message._id)
    .populate('senderId', 'username avatar')
    .lean() as unknown as PopulatedMessage;
  
  if (!populated) {
    throw new Error('Failed to populate message');
  }

  return {
    _id: populated._id.toString(),
    conversationId: populated.conversationId.toString(),
    senderId: {
      _id: populated.senderId._id.toString(),
      username: populated.senderId.username,
      avatar: populated.senderId.avatar || ''
    },
    text: populated.text,
    read: populated.read,
    readAt: populated.readAt,
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt
  };
};

export const initializeSocketIO = (server: HttpServer, corsOrigin: string) => {
  const io = new Server(server, {
    cors: { origin: corsOrigin, credentials: true },
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    let currentUserId: string | null = null;

    socket.on('register', async (userId: string) => {
      currentUserId = userId;
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User ${userId} online`);

      const conversations = await ConversationModel.find({ participants: userId });

      conversations.forEach(conv => {
        socket.join(conv._id.toString());
        console.log(`📢 Auto-joined user ${userId} to conversation ${conv._id}`);
        console.log(`   📊 unreadCount from DB:`, conv.unreadCount);
      });
      
      
      // Send online status to everyone
      socket.broadcast.emit('user-online', { userId, online: true });
      const allOnlineUsers = Array.from(onlineUsers.keys());
      console.log(`📡 Sending online users list to ${userId}:`, allOnlineUsers);
      socket.emit('online-users', { users: allOnlineUsers });
    });

    // NEW: Handle request for specific user's online status
    socket.on('check-online-status', (userId: string) => {
      const isOnline = onlineUsers.has(userId);
      console.log(`🔍 Checking online status for ${userId}: ${isOnline}`);
      socket.emit('online-status-response', { userId, online: isOnline });
    });

    socket.on('join-chat', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`📢 User ${currentUserId} joined chat ${conversationId}`);
    });

    socket.on('leave-chat', (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`👋 User ${currentUserId} left chat ${conversationId}`);
    });

    socket.on('message', async (data) => {
      const { conversationId, text, senderId } = data;
      const message = await saveMessage(conversationId, senderId, text);

      try {
        const conversation = await ConversationModel.findById(conversationId);
        if (conversation) {
          console.log('📊 BEFORE unread update:', JSON.stringify(conversation.unreadCount));
          if (!conversation.unreadCount) {
            conversation.unreadCount = {};
          }
          
          conversation.participants.forEach(participantId => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== senderId) {
              const currentCount = conversation.unreadCount?.[participantIdStr] || 0;
              conversation.unreadCount[participantIdStr] = currentCount + 1;
              console.log(`📊 Updated unread for ${participantIdStr}: ${currentCount} -> ${conversation.unreadCount[participantIdStr]}`);
            }
          });

          conversation.markModified('unreadCount');
          
          await conversation.save();
          console.log('📊 AFTER unread update:', JSON.stringify(conversation.unreadCount));
          const verify = await ConversationModel.findById(conversationId);
          console.log('📊 VERIFY after save:', JSON.stringify(verify?.unreadCount));
        }
      } catch (error) {
        console.error('Error updating unreadCount:', error);
      }

      io.to(conversationId).emit('message', message);
      console.log('📨 Broadcasted message to room:', conversationId);
    });

    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('typing', { userId: data.userId, isTyping: data.isTyping });
    });

    socket.on('mark-read', async (data) => {
      const { conversationId, userId } = data;
      console.log('📖 mark-read received on backend:', { conversationId, userId });

      try {
        // Update unread count in conversation
        const result = await ConversationModel.findByIdAndUpdate(
          conversationId,
          { $set: { [`unreadCount.${userId}`]: 0 } },
          { new: true }
        );
        
        console.log('✅ unreadCount reset in DB for user:', userId);
        console.log('📊 Updated conversation:', result?.unreadCount);
        
        // Also update all messages as read (optional)
        await MessageModel.updateMany(
          { conversationId, senderId: { $ne: userId }, read: false },
          { read: true, readAt: new Date() }
        );
        
        // Notify other participants that messages were read
        io.to(conversationId).emit('messages-read', { userId, conversationId });
        console.log('📖 messages-read emitted to room:', conversationId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        io.emit('user-online', { userId: currentUserId, online: false });
        console.log(`🔌 User ${currentUserId} offline`);
      }
    });
  });

  return io;
};
