import { describe, it, expect, beforeEach, vi } from 'vitest';
import { messagesApi } from '../../../services/messagesApi';
import * as apiClient from '../../../utils/apiClient';
import { 
  Message, 
  Conversation, 
  ConversationResponse,
  Participant 
} from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('messagesApi', () => {
  const mockConversationId = 'conv123';
  const mockOtherUserId = 'user456';
  const mockMessageId = 'msg789';

  const mockParticipant: Participant = {
    _id: 'user123',
    username: 'testuser',
    avatar: 'avatar.jpg',
  };

  const mockOtherParticipant: Participant = {
    _id: mockOtherUserId,
    username: 'otheruser',
    avatar: 'avatar2.jpg',
  };

  const mockMessage: Message = {
    _id: mockMessageId,
    conversationId: mockConversationId,
    senderId: mockParticipant,
    text: 'Hello message',
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockConversation: Conversation = {
    _id: mockConversationId,
    participants: [mockParticipant, mockOtherParticipant],
    messages: [mockMessage],
    lastMessage: 'Hello message',
    lastMessageAt: new Date().toISOString(),
    unreadCount: { [mockParticipant._id]: 0, [mockOtherParticipant._id]: 1 },
  };

  const mockConversationResponse: ConversationResponse = {
    conversationId: mockConversationId,
    participants: [mockParticipant, mockOtherParticipant],
    messages: [mockMessage],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should get all conversations', async () => {
      const mockResponse = { success: true, data: [mockConversation] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await messagesApi.getConversations();

      expect(apiClient.get).toHaveBeenCalledWith('/messages/conversations');
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when getting conversations', async () => {
      const mockError = { success: false, error: 'Failed to fetch conversations' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await messagesApi.getConversations();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch conversations');
    });
  });

  describe('getConversation', () => {
    it('should get or create conversation with another user', async () => {
      const mockResponse = { success: true, data: mockConversation };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await messagesApi.getConversation(mockOtherUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/messages/conversation/${mockOtherUserId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getConversationById', () => {
    it('should get conversation by ID with messages', async () => {
      const mockResponse = { success: true, data: mockConversationResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await messagesApi.getConversationById(mockConversationId);

      expect(apiClient.get).toHaveBeenCalledWith(`/messages/conversation-by-id/${mockConversationId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const messageText = 'Hello message';
      const mockResponse = { success: true, data: mockMessage };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await messagesApi.sendMessage(mockConversationId, messageText);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/messages/conversation/${mockConversationId}/message`,
        { text: messageText }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      const mockResponse = { success: true, data: { success: true } };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await messagesApi.markAsRead(mockConversationId);

      expect(apiClient.put).toHaveBeenCalledWith(`/messages/conversation/${mockConversationId}/read`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation', async () => {
      const mockResponse = { success: true, data: { success: true } };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await messagesApi.deleteConversation(mockConversationId);

      expect(apiClient.del).toHaveBeenCalledWith(`/messages/conversation/${mockConversationId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('clearChat', () => {
    it('should clear all messages in conversation', async () => {
      const mockResponse = { success: true, data: { success: true } };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await messagesApi.clearChat(mockConversationId);

      expect(apiClient.del).toHaveBeenCalledWith(`/messages/conversation/${mockConversationId}/messages`);
      expect(result).toEqual(mockResponse);
    });
  });
});