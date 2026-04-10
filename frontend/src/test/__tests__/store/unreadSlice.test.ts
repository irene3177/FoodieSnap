import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import unreadReducer, {
  loadUnreadCounts,
  incrementUnread,
  resetUnread,
  resetAll,
  setUnread,
  updateLastMessage,
} from '../../../store/unreadSlice';
import { messagesApi } from '../../../services/messagesApi';
import { Conversation, Participant, Message } from '../../../types';

// Mock messagesApi
vi.mock('../../../services/messagesApi', () => ({
  messagesApi: {
    getConversations: vi.fn(),
  },
}));

interface RootState {
  unread: ReturnType<typeof unreadReducer>;
}

describe('unreadSlice', () => {
  const mockUserId = 'user456';
  const mockConversationId1 = 'conv1';
  const mockConversationId2 = 'conv2';
  const mockConversationId3 = 'conv3';

  const mockParticipant: Participant = {
    _id: mockUserId,
    username: 'testuser',
    avatar: 'avatar.jpg',
  };

  const mockOtherParticipant: Participant = {
    _id: 'user789',
    username: 'otheruser',
    avatar: 'avatar2.jpg',
  };

  const mockMessage: Message = {
    _id: 'msg1',
    conversationId: mockConversationId1,
    senderId: mockOtherParticipant,
    text: 'Hello',
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockConversations: Conversation[] = [
    {
      _id: mockConversationId1,
      participants: [mockParticipant, mockOtherParticipant],
      messages: [mockMessage],
      lastMessage: 'Hello',
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [mockUserId]: 3 },
    },
    {
      _id: mockConversationId2,
      participants: [mockParticipant, mockOtherParticipant],
      messages: [],
      lastMessage: 'Hi',
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [mockUserId]: 1 },
    },
    {
      _id: mockConversationId3,
      participants: [mockParticipant, mockOtherParticipant],
      messages: [],
      lastMessage: undefined,
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [mockUserId]: 0 },
    },
  ];

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { unread: unreadReducer },
    });
  });

  it('should return initial state', () => {
    const state = store.getState().unread;
    expect(state.counts).toEqual({});
    expect(state.lastMessages).toEqual({});
    expect(state.total).toBe(0);
    expect(state.loading).toBe(false);
  });

  it('should increment unread count', () => {
    store.dispatch(incrementUnread(mockConversationId1));
    
    const state = store.getState().unread;
    expect(state.counts[mockConversationId1]).toBe(1);
    expect(state.total).toBe(1);
  });

  it('should increment unread count multiple times', () => {
    store.dispatch(incrementUnread(mockConversationId1));
    store.dispatch(incrementUnread(mockConversationId1));
    store.dispatch(incrementUnread(mockConversationId1));
    
    const state = store.getState().unread;
    expect(state.counts[mockConversationId1]).toBe(3);
    expect(state.total).toBe(3);
  });

  it('should reset unread count for conversation', () => {
    store.dispatch(incrementUnread(mockConversationId1));
    store.dispatch(incrementUnread(mockConversationId1));
    expect(store.getState().unread.counts[mockConversationId1]).toBe(2);
    expect(store.getState().unread.total).toBe(2);
    
    store.dispatch(resetUnread(mockConversationId1));
    
    const state = store.getState().unread;
    expect(state.counts[mockConversationId1]).toBe(0);
    expect(state.total).toBe(0);
  });

  it('should reset all unread counts', () => {
    store.dispatch(incrementUnread(mockConversationId1));
    store.dispatch(incrementUnread(mockConversationId2));
    store.dispatch(incrementUnread(mockConversationId3));
    expect(store.getState().unread.total).toBe(3);
    
    store.dispatch(resetAll());
    
    const state = store.getState().unread;
    expect(state.counts).toEqual({});
    expect(state.total).toBe(0);
  });

  it('should set unread count for conversation', () => {
    store.dispatch(setUnread({ convId: mockConversationId1, count: 5 }));
    
    const state = store.getState().unread;
    expect(state.counts[mockConversationId1]).toBe(5);
    expect(state.total).toBe(5);
  });

  it('should update last message', () => {
    const lastMessageData = {
      conversationId: mockConversationId1,
      text: 'Hello world',
      createdAt: new Date().toISOString(),
      senderId: 'user123',
    };
    
    store.dispatch(updateLastMessage(lastMessageData));
    
    const state = store.getState().unread;
    expect(state.lastMessages[mockConversationId1]).toEqual({
      text: 'Hello world',
      createdAt: lastMessageData.createdAt,
      senderId: 'user123',
    });
  });

  describe('loadUnreadCounts', () => {
    it('should handle load unread counts fulfilled', async () => {
      const mockResponse = { success: true, data: mockConversations };
      vi.mocked(messagesApi.getConversations).mockResolvedValue(mockResponse);

      await store.dispatch(loadUnreadCounts(mockUserId));
      
      const state = store.getState().unread;
      expect(state.loading).toBe(false);
      expect(state.counts).toEqual({
        conv1: 3,
        conv2: 1,
        conv3: 0,
      });
      expect(state.total).toBe(4);
    });

    it('should handle load unread counts rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to load' };
      vi.mocked(messagesApi.getConversations).mockResolvedValue(mockResponse);

      await store.dispatch(loadUnreadCounts(mockUserId));
      
      const state = store.getState().unread;
      expect(state.loading).toBe(false);
    });
  });
});