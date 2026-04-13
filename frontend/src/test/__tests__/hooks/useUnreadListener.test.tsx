/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnreadListener } from '../../../hooks/chat/useUnreadListener';
import * as socket from '../../../services/socket';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

// Define types
interface UnreadState {
  unreadCounts: Record<string, number>;
  lastMessages: Record<string, { text: string; createdAt: string; senderId: string }>;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: { _id: string; username: string; avatar?: string };
  text: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
}

interface Participant {
  _id: string;
  username: string;
  avatar?: string;
}

// Mock reducer with proper Redux typing
const initialState: UnreadState = {
  unreadCounts: {},
  lastMessages: {},
};

const unreadReducer = (state: UnreadState = initialState, action: { type: string; payload?: any }): UnreadState => {
  switch (action.type) {
    case 'unread/incrementUnread':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: (state.unreadCounts[action.payload] || 0) + 1,
        },
      };
    case 'unread/resetUnread':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: 0,
        },
      };
    case 'unread/updateLastMessage':
      return {
        ...state,
        lastMessages: {
          ...state.lastMessages,
          [action.payload.conversationId]: {
            text: action.payload.text,
            createdAt: action.payload.createdAt,
            senderId: action.payload.senderId,
          },
        },
      };
    default:
      return state;
  }
};

// Mock socket
vi.mock('../../../services/socket', () => ({
  onMessage: vi.fn(() => vi.fn()),
  onMessagesRead: vi.fn(() => vi.fn()),
  markRead: vi.fn(),
}));

// Mock window location
const mockLocation = { pathname: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('useUnreadListener', () => {
  const mockUserId = 'user123';
  const mockConversationId = 'conv456';
  const mockOtherUserId = 'user789';
  
  const mockParticipant: Participant = {
    _id: mockOtherUserId,
    username: 'otheruser',
    avatar: 'avatar.jpg',
  };

  const mockMessage: Message = {
    _id: 'msg001',
    conversationId: mockConversationId,
    senderId: mockParticipant,
    text: 'Hello message',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    read: false,
  };

  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { unread: unreadReducer },
    });
    vi.clearAllMocks();
    mockLocation.pathname = '';
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  it('should not register listener when userId is undefined', () => {
    renderHook(() => useUnreadListener(undefined), { wrapper });
    
    expect(socket.onMessage).not.toHaveBeenCalled();
    expect(socket.onMessagesRead).not.toHaveBeenCalled();
  });

  it('should register socket listeners when userId is provided', () => {
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    expect(socket.onMessage).toHaveBeenCalledTimes(1);
    expect(socket.onMessagesRead).toHaveBeenCalledTimes(1);
  });

  it('should handle new message from other user when not in current chat', () => {
    let capturedCallback: (message: Message) => void = () => {};
    vi.mocked(socket.onMessage).mockImplementation((callback) => {
      capturedCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedCallback(mockMessage);
    
    const state = store.getState() as { unread: UnreadState };
    expect(state.unread.unreadCounts[mockConversationId]).toBe(1);
  });

  it('should not increment unread for user\'s own messages', () => {
    const ownMessage: Message = {
      ...mockMessage,
      senderId: { ...mockParticipant, _id: mockUserId },
    };
    
    let capturedCallback: (message: Message) => void = () => {};
    vi.mocked(socket.onMessage).mockImplementation((callback) => {
      capturedCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedCallback(ownMessage);
    
    const state = store.getState() as { unread: UnreadState };
    expect(state.unread.unreadCounts[mockConversationId]).toBeUndefined();
  });

  it('should mark as read when in current chat', () => {
    mockLocation.pathname = `/chat/${mockConversationId}`;
    
    let capturedCallback: (message: Message) => void = () => {};
    vi.mocked(socket.onMessage).mockImplementation((callback) => {
      capturedCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedCallback(mockMessage);
    
    expect(socket.markRead).toHaveBeenCalledWith(mockConversationId, mockUserId);
    const state = store.getState() as { unread: UnreadState };
    expect(state.unread.unreadCounts[mockConversationId]).toBeUndefined();
  });

  it('should update last message when receiving new message', () => {
    let capturedCallback: (message: Message) => void = () => {};
    vi.mocked(socket.onMessage).mockImplementation((callback) => {
      capturedCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedCallback(mockMessage);
    
    const state = store.getState() as { unread: UnreadState };
    expect(state.unread.lastMessages[mockConversationId]).toEqual({
      text: mockMessage.text,
      createdAt: mockMessage.createdAt,
      senderId: mockMessage.senderId._id,
    });
  });

  it('should not process duplicate messages', () => {
    let capturedCallback: (message: Message) => void = () => {};
    vi.mocked(socket.onMessage).mockImplementation((callback) => {
      capturedCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedCallback(mockMessage);
    capturedCallback(mockMessage);
    
    const state = store.getState() as { unread: UnreadState };
    expect(state.unread.unreadCounts[mockConversationId]).toBe(1);
  });

  it('should handle messages read event', () => {
    let capturedReadCallback: (data: { userId: string; conversationId: string }) => void = () => {};
    vi.mocked(socket.onMessagesRead).mockImplementation((callback) => {
      capturedReadCallback = callback;
      return vi.fn();
    });
    
    let capturedMessageCallback: (message: Message) => void = () => {};
    vi.mocked(socket.onMessage).mockImplementation((callback) => {
      capturedMessageCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedMessageCallback(mockMessage);
    const stateAfterMessage = store.getState() as { unread: UnreadState };
    expect(stateAfterMessage.unread.unreadCounts[mockConversationId]).toBe(1);
    
    capturedReadCallback({ userId: mockUserId, conversationId: mockConversationId });
    const stateAfterRead = store.getState() as { unread: UnreadState };
    expect(stateAfterRead.unread.unreadCounts[mockConversationId]).toBe(0);
  });

  it('should ignore read events for other users', () => {
    let capturedReadCallback: (data: { userId: string; conversationId: string }) => void = () => {};
    vi.mocked(socket.onMessagesRead).mockImplementation((callback) => {
      capturedReadCallback = callback;
      return vi.fn();
    });
    
    renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    capturedReadCallback({ userId: 'differentUser', conversationId: mockConversationId });
    
    const state = store.getState() as { unread: UnreadState };
    expect(state.unread.unreadCounts[mockConversationId]).toBeUndefined();
  });

  it('should cleanup listeners on unmount', () => {
    const mockUnsubscribeMessage = vi.fn();
    const mockUnsubscribeRead = vi.fn();
    
    vi.mocked(socket.onMessage).mockReturnValue(mockUnsubscribeMessage);
    vi.mocked(socket.onMessagesRead).mockReturnValue(mockUnsubscribeRead);
    
    const { unmount } = renderHook(() => useUnreadListener(mockUserId), { wrapper });
    
    unmount();
    
    expect(mockUnsubscribeMessage).toHaveBeenCalled();
    expect(mockUnsubscribeRead).toHaveBeenCalled();
  });
});