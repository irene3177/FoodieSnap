import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChatDetail from '../../../pages/ChatDetail/ChatDetail';
import { useAuth } from '../../../hooks/useAuth';
import { useChatRecipient } from '../../../hooks/chat/useChatRecipient';
import { useChatMessages } from '../../../hooks/chat/useChatMessages';
import { useChatScroll } from '../../../hooks/chat/useChatScroll';
import { useChatOptions } from '../../../hooks/chat/useChatOptions';
import * as socket from '../../../services/socket';
import unreadReducer from '../../../store/unreadSlice';
import authReducer from '../../../store/authSlice';
import { User, Message } from '../../../types';

// Mock all hooks
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/chat/useChatRecipient');
vi.mock('../../../hooks/chat/useChatMessages');
vi.mock('../../../hooks/chat/useChatScroll');
vi.mock('../../../hooks/chat/useChatOptions');
vi.mock('../../../services/socket');

// Mock components
vi.mock('../../../components/Chat/ChatHeader', () => ({
  ChatHeader: ({ recipientName, onBack, onViewProfile }: { recipientName: string; onBack: () => void; onViewProfile: () => void }) => (
    <div data-testid="chat-header">
      <span>{recipientName}</span>
      <button onClick={onBack}>Back</button>
      <button onClick={onViewProfile}>View Profile</button>
    </div>
  ),
}));

vi.mock('../../../components/Chat/MessageList', () => ({
  MessageList: ({ messages }: { messages: Message[] }) => (
    <div data-testid="message-list">
      {messages.map((msg) => (
        <div key={msg._id}>{msg.text}</div>
      ))}
    </div>
  ),
}));

vi.mock('../../../components/Chat/MessageInput', () => ({
  MessageInput: ({ onSendMessage }: { onSendMessage: (text: string) => Promise<boolean> }) => (
    <div data-testid="message-input">
      <button onClick={() => onSendMessage('Test message')}>Send</button>
    </div>
  ),
}));

vi.mock('../../../components/Chat/ScrollToBottomButton', () => ({
  ScrollToBottomButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="scroll-button" onClick={onClick}>
      Scroll
    </button>
  ),
}));

vi.mock('../../../components/Skeleton/MessageListSkeleton', () => ({
  MessageListSkeleton: () => <div data-testid="skeleton-messages">Loading messages...</div>,
}));

vi.mock('../../../components/Skeleton/ChatHeaderSkeleton', () => ({
  ChatHeaderSkeleton: () => <div data-testid="skeleton-header">Loading header...</div>,
}));

vi.mock('../../../components/Skeleton/MessageInputSkeleton', () => ({
  MessageInputSkeleton: () => <div data-testid="skeleton-input">Loading input...</div>,
}));

interface RootState {
  unread: ReturnType<typeof unreadReducer>;
  auth: ReturnType<typeof authReducer>;
}

describe('ChatDetail', () => {
  const mockUser: User = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@test.com',
    avatar: 'avatar.jpg',
  };

  const mockMessages: Message[] = [
    {
      _id: 'msg1',
      text: 'Hello',
      conversationId: 'conv123',
      senderId: { _id: 'user123', username: 'testuser', avatar: 'avatar.jpg' },
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'msg2',
      text: 'Hi there',
      conversationId: 'conv123',
      senderId: { _id: 'user456', username: 'otheruser', avatar: 'avatar2.jpg' },
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockRecipient = {
    recipientName: 'Other User',
    recipientAvatar: 'avatar.jpg',
    recipientId: 'user456',
  };

  const mockChatOptions = {
    showOptions: false,
    setShowOptions: vi.fn(),
    deleting: false,
    optionsMenuRef: { current: null },
    handleDeleteConversation: vi.fn(),
    handleClearChat: vi.fn(),
  };

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = configureStore({
      reducer: {
        unread: unreadReducer,
        auth: authReducer,
      },
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ 
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasCheckedSession: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      refreshUser: vi.fn(),
    });

    const mockUseChatRecipient = vi.mocked(useChatRecipient);
    mockUseChatRecipient.mockReturnValue(mockRecipient);

    const mockUseChatMessages = vi.mocked(useChatMessages);
    mockUseChatMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sending: false,
      sendMessage: vi.fn().mockResolvedValue(true),
      setMessages: vi.fn(),
      handleMessage: vi.fn(),
    });

    const mockUseChatScroll = vi.mocked(useChatScroll);
    mockUseChatScroll.mockReturnValue({
      showScrollButton: false,
      scrollToBottom: vi.fn(),
      messagesContainerRef: { current: null },
      messagesEndRef: { current: null },
      handleScroll: vi.fn(),
    });

    const mockUseChatOptions = vi.mocked(useChatOptions);
    mockUseChatOptions.mockReturnValue(mockChatOptions);

    const mockJoinChat = vi.mocked(socket.joinChat);
    mockJoinChat.mockImplementation(() => {});
    
    const mockLeaveChat = vi.mocked(socket.leaveChat);
    mockLeaveChat.mockImplementation(() => {});
    
    const mockMarkRead = vi.mocked(socket.markRead);
    mockMarkRead.mockImplementation(() => {});
    
    const mockOnMessagesRead = vi.mocked(socket.onMessagesRead);
    mockOnMessagesRead.mockReturnValue(vi.fn());
    
    const mockEnsureConnection = vi.mocked(socket.ensureConnection);
    mockEnsureConnection.mockImplementation(() => null);
  });

  const renderComponent = (conversationId = 'conv123') => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/chat/${conversationId}`]}>
          <Routes>
            <Route path="/chat/:conversationId" element={<ChatDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  it('should render loading skeletons when loading', () => {
    const mockUseChatMessages = vi.mocked(useChatMessages);
    mockUseChatMessages.mockReturnValue({
      messages: [],
      loading: true,
      sending: false,
      sendMessage: vi.fn().mockResolvedValue(true),
      setMessages: vi.fn(),
      handleMessage: vi.fn(),
    });

    renderComponent();
    
    expect(screen.getByTestId('skeleton-header')).toBeDefined();
    expect(screen.getByTestId('skeleton-messages')).toBeDefined();
    expect(screen.getByTestId('skeleton-input')).toBeDefined();
  });

  it('should render chat when loaded', () => {
    renderComponent();
    
    expect(screen.getByTestId('chat-header')).toBeDefined();
    expect(screen.getByTestId('message-list')).toBeDefined();
    expect(screen.getByTestId('message-input')).toBeDefined();
    expect(screen.getByText('Other User')).toBeDefined();
    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('Hi there')).toBeDefined();
  });

  it('should show scroll button when needed', () => {
    const mockUseChatScroll = vi.mocked(useChatScroll);
    mockUseChatScroll.mockReturnValue({
      showScrollButton: true,
      scrollToBottom: vi.fn(),
      messagesContainerRef: { current: null },
      messagesEndRef: { current: null },
      handleScroll: vi.fn(),
    });

    renderComponent();
    
    expect(screen.getByTestId('scroll-button')).toBeDefined();
  });
});