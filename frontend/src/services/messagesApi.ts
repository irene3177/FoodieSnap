import { get, post, put, del } from '../utils/apiClient';
import {
  ApiResponse,
  Message,
  Conversation,
  ConversationResponse
} from '../types';

export const messagesApi = {
  // Get all conversations for current user
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    return get<Conversation[]>('/messages/conversations');
  },
  
  // Get or create conversation with another user
  getConversation: async (otherUserId: string): Promise<ApiResponse<Conversation>> => {
    return get<Conversation>(`/messages/conversation/${otherUserId}`);
  },

  // Get conversation by ID with messages
  getConversationById: async (conversationId: string): Promise<ApiResponse<ConversationResponse>> => {
    return get<ConversationResponse>(`/messages/conversation-by-id/${conversationId}`);
  },
  
  // Send a message
  sendMessage: async (
    conversationId: string,
    text: string
  ): Promise<ApiResponse<Message>> => {
    return post<Message>(`/messages/conversation/${conversationId}/message`, { text });
  },
  
  // Mark messages as read
  markAsRead: async (conversationId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return put<{ success: boolean }>(`/messages/conversation/${conversationId}/read`);
  },

  // Delete conversation
  deleteConversation: async (conversationId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return del<{ success: boolean }>(`/messages/conversation/${conversationId}`);
  },

  // Clear chat (delete all messages in conversation)
  clearChat: async (conversationId: string): Promise<ApiResponse<{ success: boolean}>> => {
    return del<{ success: boolean }>(`/messages/conversation/${conversationId}/messages`);
  }
};
