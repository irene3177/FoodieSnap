import { Request, Response } from 'express';
import {
  getOrCreateConversation,
  getConversationById,
  sendMessage,
  markAsRead,
  getUserConversations,
  deleteConversation,
  clearChat
} from '../../controllers/messages.controller';
import { ConversationModel } from '../../models/Conversation.model';
import { MessageModel } from '../../models/Message.model';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Messages Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId1: string;
  let testUserId2: string;
  let testUserId3: string;
  let testConversationId: string;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = {
      json: jsonMock,
      status: statusMock
    };
  };

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user1 = await UserModel.create({
      username: 'user1',
      email: 'user1@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: []
    });
    testUserId1 = user1._id.toString();

    const user2 = await UserModel.create({
      username: 'user2',
      email: 'user2@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: []
    });
    testUserId2 = user2._id.toString();

    const user3 = await UserModel.create({
      username: 'user3',
      email: 'user3@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: []
    });
    testUserId3 = user3._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId1
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await ConversationModel.deleteMany({});
    await MessageModel.deleteMany({});
  });

  describe('getOrCreateConversation', () => {
    it('should create a new conversation', async () => {
      req.params = { otherUserId: testUserId2 };

      await getOrCreateConversation(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.participants).toHaveLength(2);
      expect(next).not.toHaveBeenCalled();

      // Verify in database
      const conversation = await ConversationModel.findOne({
        participants: { $all: [testUserId1, testUserId2] }
      });
      expect(conversation).toBeTruthy();
    });

    it('should return existing conversation', async () => {
      // Create conversation first
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 }
      });

      const conversationId = conversation._id.toString();
      
      req.params = { otherUserId: testUserId2 };

      await getOrCreateConversation(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data._id.toString()).toBe(conversationId);
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 }
      });
      testConversationId = conversation._id.toString();
    });

    it('should send a message successfully', async () => {
      req.params = { conversationId: testConversationId };
      req.body = { text: 'Hello, this is a test message!' };

      await sendMessage(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.text).toBe('Hello, this is a test message!');
      expect(next).not.toHaveBeenCalled();

      // Verify in database
      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages).toHaveLength(1);
      
      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation?.lastMessage).toBe('Hello, this is a test message!');
    });

    it('should return 403 if user is not a participant', async () => {
      req.userId = testUserId3; // User not in conversation
      req.params = { conversationId: testConversationId };
      req.body = { text: 'Hello' };

      await sendMessage(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to send messages in this conversation');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('getConversationById', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 }
      });
      testConversationId = conversation._id.toString();
      
      // Add messages
      await MessageModel.create([
        {
          conversationId: testConversationId,
          senderId: testUserId1,
          text: 'First message'
        },
        {
          conversationId: testConversationId,
          senderId: testUserId2,
          text: 'Second message'
        }
      ]);
    });

    it('should get conversation by ID', async () => {
      req.params = { conversationId: testConversationId };

      await getConversationById(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.messages).toHaveLength(2);
    });

    it('should return 403 if user is not participant', async () => {
      req.userId = testUserId3;
      req.params = { conversationId: testConversationId };

      await getConversationById(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to view this conversation');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('getUserConversations', () => {
    beforeEach(async () => {
      await ConversationModel.create([
        {
          participants: [testUserId1, testUserId2],
          unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
          lastMessageAt: new Date()
        },
        {
          participants: [testUserId1, testUserId3],
          unreadCount: { [testUserId1]: 0, [testUserId3]: 0 },
          lastMessageAt: new Date()
        }
      ]);
    });

    it('should get all user conversations', async () => {
      await getUserConversations(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
    });
  });

  describe('markAsRead', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 2, [testUserId2]: 0 }
      });
      testConversationId = conversation._id.toString();
      
      await MessageModel.create([
        {
          conversationId: testConversationId,
          senderId: testUserId2,
          text: 'Message 1',
          read: false
        },
        {
          conversationId: testConversationId,
          senderId: testUserId2,
          text: 'Message 2',
          read: false
        }
      ]);
    });
    it('should mark messages as read', async () => {
      req.params = { conversationId: testConversationId };

      await markAsRead(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      expect(jsonMock.mock.calls[0][0].success).toBe(true);
      
      // Verify messages are marked as read
      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages.every(m => m.read === true)).toBe(true);
    });
  });

  describe('clearChat', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
        lastMessage: 'Hello',
        lastMessageAt: new Date()
      });
      testConversationId = conversation._id.toString();
      
      await MessageModel.create([
        {
          conversationId: testConversationId,
          senderId: testUserId1,
          text: 'Message 1'
        },
        {
          conversationId: testConversationId,
          senderId: testUserId2,
          text: 'Message 2'
        }
      ]);
    });

    it('should clear chat history', async () => {
      req.params = { conversationId: testConversationId };

      await clearChat(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      expect(jsonMock.mock.calls[0][0].success).toBe(true);
      
      // Verify in database
      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages).toHaveLength(0);
      
      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation?.lastMessage).toBe('');
    });

    it('should return 403 if user is not participant', async () => {
      req.userId = testUserId3;
      req.params = { conversationId: testConversationId };

      await clearChat(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to clear this chat');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('deleteConversation', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 }
      });
      testConversationId = conversation._id.toString();
      
      await MessageModel.create([
        {
          conversationId: testConversationId,
          senderId: testUserId1,
          text: 'Message 1'
        },
        {
          conversationId: testConversationId,
          senderId: testUserId2,
          text: 'Message 2'
        }
      ]);
    });

    it('should delete conversation', async () => {
      req.params = { conversationId: testConversationId };

      await deleteConversation(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      expect(jsonMock.mock.calls[0][0].success).toBe(true);
      
      // Verify in database
      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation).toBeNull();
      
      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages).toHaveLength(0);
    });
  });
});