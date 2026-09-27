import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getOrCreateConversation,
  getConversationById,
  sendMessage,
  markAsRead,
  getUserConversations,
  deleteConversation,
  clearChat,
} from '../../controllers/messages.controller';
import { ConversationModel } from '../../models/Conversation.model';
import { MessageModel } from '../../models/Message.model';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Messages Controller Integration Tests', () => {
  let req: any;
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
    res = { json: jsonMock, status: statusMock };
  };

  const createTestUser = async (prefix: string) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return UserModel.create({
      username: `${prefix}_${Math.random().toString(36).slice(2, 8)}`,
      email: `${prefix}_${Date.now()}@msgtest.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
    });
  };

  beforeEach(async () => {
    await ConversationModel.deleteMany({});
    await MessageModel.deleteMany({});
    await UserModel.deleteMany({ email: /@msgtest\.com$/ });

    const user1 = await createTestUser('m1');
    testUserId1 = user1._id.toString();

    const user2 = await createTestUser('m2');
    testUserId2 = user2._id.toString();

    const user3 = await createTestUser('m3');
    testUserId3 = user3._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId1,
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@msgtest\.com$/ });
    await ConversationModel.deleteMany({});
    await MessageModel.deleteMany({});
  });

  // ---------- getOrCreateConversation ----------

  describe('getOrCreateConversation', () => {
    it('should create a new conversation', async () => {
      req.params = { otherUserId: testUserId2 };

      await getOrCreateConversation(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.participants).toHaveLength(2);
      expect(next).not.toHaveBeenCalled();

      const conversation = await ConversationModel.findOne({
        participants: {
          $all: [
            new mongoose.Types.ObjectId(testUserId1),
            new mongoose.Types.ObjectId(testUserId2),
          ],
        },
      });
      expect(conversation).toBeTruthy();
    });

    it('should return existing conversation', async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
      });

      const conversationId = conversation._id.toString();
      req.params = { otherUserId: testUserId2 };

      await getOrCreateConversation(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data._id.toString()).toBe(conversationId);
    });

    it('should not create duplicate conversations', async () => {
      req.params = { otherUserId: testUserId2 };

      await getOrCreateConversation(req, res as Response, next);
      await getOrCreateConversation(req, res as Response, next);

      const count = await ConversationModel.countDocuments({
        participants: {
          $all: [
            new mongoose.Types.ObjectId(testUserId1),
            new mongoose.Types.ObjectId(testUserId2),
          ],
        },
      });
      expect(count).toBe(1);
    });
  });

  // ---------- sendMessage ----------

  describe('sendMessage', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
      });
      testConversationId = conversation._id.toString();
    });

    it('should send a message successfully', async () => {
      req.params = { conversationId: testConversationId };
      req.body = { text: 'Hello, this is a test message!' };

      await sendMessage(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.text).toBe('Hello, this is a test message!');
      expect(next).not.toHaveBeenCalled();

      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages).toHaveLength(1);

      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation?.lastMessage).toBe('Hello, this is a test message!');
    });

    it('should trim message text', async () => {
      req.params = { conversationId: testConversationId };
      req.body = { text: '   Hello world   ' };

      await sendMessage(req, res as Response, next);

      const message = await MessageModel.findOne({ conversationId: testConversationId });
      expect(message?.text).toBe('Hello world');
    });

    it('should return 404 if conversation not found', async () => {
      req.params = { conversationId: new mongoose.Types.ObjectId().toString() };
      req.body = { text: 'Hello' };

      await sendMessage(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Conversation not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 403 if user is not a participant', async () => {
      req.userId = testUserId3;
      req.params = { conversationId: testConversationId };
      req.body = { text: 'Hello' };

      await sendMessage(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to send messages in this conversation');
      expect(error.statusCode).toBe(403);
    });
  });

  // ---------- getConversationById ----------

  describe('getConversationById', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
      });
      testConversationId = conversation._id.toString();

      await MessageModel.create([
        { conversationId: testConversationId, senderId: testUserId1, text: 'First message' },
        { conversationId: testConversationId, senderId: testUserId2, text: 'Second message' },
      ]);
    });

    it('should get conversation by ID', async () => {
      req.params = { conversationId: testConversationId };

      await getConversationById(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.messages).toHaveLength(2);
    });

    it('should return 404 if conversation not found', async () => {
      req.params = { conversationId: new mongoose.Types.ObjectId().toString() };

      await getConversationById(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Conversation not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 403 if user is not participant', async () => {
      req.userId = testUserId3;
      req.params = { conversationId: testConversationId };

      await getConversationById(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to view this conversation');
      expect(error.statusCode).toBe(403);
    });
  });

  // ---------- getUserConversations ----------

  describe('getUserConversations', () => {
    beforeEach(async () => {
      await ConversationModel.create([
        {
          participants: [testUserId1, testUserId2],
          unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
          lastMessageAt: new Date(Date.now() - 1000),
        },
        {
          participants: [testUserId1, testUserId3],
          unreadCount: { [testUserId1]: 0, [testUserId3]: 0 },
          lastMessageAt: new Date(),
        },
      ]);
    });

    it('should get all user conversations', async () => {
      await getUserConversations(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
    });

    it('should return only conversations where user is participant', async () => {
      req.userId = testUserId3;

      await getUserConversations(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(1);
    });

    it('should return empty array when user has no conversations', async () => {
      const newUser = await createTestUser('lonely');
      req.userId = newUser._id.toString();

      await getUserConversations(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(0);
    });
  });

  // ---------- markAsRead ----------

  describe('markAsRead', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 2, [testUserId2]: 0 },
      });
      testConversationId = conversation._id.toString();

      await MessageModel.create([
        { conversationId: testConversationId, senderId: testUserId2, text: 'Message 1', read: false },
        { conversationId: testConversationId, senderId: testUserId2, text: 'Message 2', read: false },
      ]);
    });

    it('should mark messages as read', async () => {
      req.params = { conversationId: testConversationId };

      await markAsRead(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      expect(jsonMock.mock.calls[0][0].success).toBe(true);

      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages.every((m) => m.read === true)).toBe(true);
    });

    it('should reset unreadCount for current user', async () => {
      req.params = { conversationId: testConversationId };

      await markAsRead(req, res as Response, next);

      const conversation = await ConversationModel.findById(testConversationId).lean();
      const unread = conversation?.unreadCount as Record<string, number>;
      expect(unread?.[testUserId1]).toBe(0);
    });

    it('should return 404 if conversation not found', async () => {
      req.params = { conversationId: new mongoose.Types.ObjectId().toString() };

      await markAsRead(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Conversation not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- clearChat ----------

  describe('clearChat', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
      });
      testConversationId = conversation._id.toString();

      await MessageModel.create([
        { conversationId: testConversationId, senderId: testUserId1, text: 'Message 1' },
        { conversationId: testConversationId, senderId: testUserId2, text: 'Message 2' },
      ]);
    });

    it('should clear chat history', async () => {
      req.params = { conversationId: testConversationId };

      await clearChat(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      expect(jsonMock.mock.calls[0][0].success).toBe(true);

      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages).toHaveLength(0);

      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation?.lastMessage).toBe('');
    });

    it('should return 403 if user is not participant', async () => {
      req.userId = testUserId3;
      req.params = { conversationId: testConversationId };

      await clearChat(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to clear this chat');
      expect(error.statusCode).toBe(403);
    });
  });

  // ---------- deleteConversation ----------

  describe('deleteConversation', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        participants: [testUserId1, testUserId2],
        unreadCount: { [testUserId1]: 0, [testUserId2]: 0 },
      });
      testConversationId = conversation._id.toString();

      await MessageModel.create([
        { conversationId: testConversationId, senderId: testUserId1, text: 'Message 1' },
        { conversationId: testConversationId, senderId: testUserId2, text: 'Message 2' },
      ]);
    });

    it('should delete conversation and all its messages', async () => {
      req.params = { conversationId: testConversationId };

      await deleteConversation(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      expect(jsonMock.mock.calls[0][0].success).toBe(true);

      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation).toBeNull();

      const messages = await MessageModel.find({ conversationId: testConversationId });
      expect(messages).toHaveLength(0);
    });

    it('should return 404 if conversation not found', async () => {
      req.params = { conversationId: new mongoose.Types.ObjectId().toString() };

      await deleteConversation(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Conversation not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 403 if user is not participant', async () => {
      req.userId = testUserId3;
      req.params = { conversationId: testConversationId };

      await deleteConversation(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Not authorized to delete this conversation');
      expect(error.statusCode).toBe(403);
    });
  });
});