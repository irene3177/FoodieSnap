import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Chats from '../../../pages/Chats/Chats';
import { useAuth } from '../../../hooks/useAuth';
import { messagesApi } from '../../../services/messagesApi';
import * as socket from '../../../services/socket';
import unreadReducer from '../../../store/unreadSlice';
import authReducer from '../../../store/authSlice';
import { User, Conversation, Participant, Message } from '../../../types';

// Mock hooks and services
vi.mock('../../../hooks/useAuth');
vi.mock('../../../services/messagesApi');
vi.mock('../../../services/socket');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

interface RootState {
  unread: ReturnType<typeof unreadReducer>;
  auth: ReturnType<typeof authReducer>;
}

describe('Chats', () => {
  const mockUser: User = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@test.com',
    avatar: 'avatar.jpg',
  };

  const mockOtherParticipant: Participant = {
    _id: 'user456',
    username: 'otheruser',
    avatar: 'avatar2.jpg',
  };

  const mockMessage: Message = {
    _id: 'msg1',
    conversationId: 'conv1',
    senderId: mockOtherParticipant,
    text: 'Hello message',
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockConversation: Conversation = {
    _id: 'conv1',
    participants: [mockUser, mockOtherParticipant],
    messages: [mockMessage],
    lastMessage: 'Hello message',
    lastMessageAt: new Date().toISOString(),
    unreadCount: { [mockUser._id]: 2 },
  };

  const mockConversations: Conversation[] = [mockConversation];

  let store: ReturnType<typeof configureStore<RootState>>;
  const mockNavigate = vi.fn();

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

    const mockGetConversations = vi.mocked(messagesApi.getConversations);
    mockGetConversations.mockResolvedValue({
      success: true,
      data: mockConversations,
    });

    const mockEnsureConnection = vi.mocked(socket.ensureConnection);
    mockEnsureConnection.mockImplementation(() => null);
    
    mockNavigate.mockReset();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Chats />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should show loader while loading', () => {
    renderComponent();
    
    expect(screen.getByText(/Loading conversations/i)).toBeDefined();
  });

  it('should show unauthorized message when no user', async () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ 
      user: null,
      isAuthenticated: false,
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

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Please log in')).toBeDefined();
      expect(screen.getByText('Go to Login')).toBeDefined();
    });
  });

  it('should show empty state when no conversations', async () => {
    const mockGetConversations = vi.mocked(messagesApi.getConversations);
    mockGetConversations.mockResolvedValue({
      success: true,
      data: [],
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeDefined();
      expect(screen.getByText('Find People to Chat With')).toBeDefined();
    });
  });

  it('should show conversations when loaded', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('otheruser')).toBeDefined();
      expect(screen.getByText('Hello message')).toBeDefined();
    });
  });

  it('should show error message on API failure', async () => {
    const mockGetConversations = vi.mocked(messagesApi.getConversations);
    mockGetConversations.mockResolvedValue({
      success: false,
      error: 'Failed to load conversations',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load conversations')).toBeDefined();
      expect(screen.getByText('Try Again')).toBeDefined();
    });
  });

  it('should show unread badge when there are unread messages', async () => {
    renderComponent();
    
    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toBeDefined();
      expect(badge.className).toContain('chat-item__badge');
    });
  });

  it('should navigate to chat on conversation click', async () => {
    const userEventSetup = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('otheruser')).toBeDefined();
    });
    
    const chatItem = screen.getByText('otheruser').closest('.chat-item');
    if (chatItem) {
      await userEventSetup.click(chatItem);
    }
    
    expect(mockNavigate).toHaveBeenCalledWith('/chat/conv1', {
      state: {
        recipientName: 'otheruser',
        recipientAvatar: 'avatar2.jpg',
        recipientId: 'user456',
      },
    });
  });

  it('should refresh conversations when page becomes visible', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(messagesApi.getConversations).toHaveBeenCalledTimes(1);
    });
    
    // Simulate page visibility change
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    await waitFor(() => {
      expect(messagesApi.getConversations).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle retry button click on error', async () => {
    const mockGetConversations = vi.mocked(messagesApi.getConversations);
    mockGetConversations.mockResolvedValueOnce({
      success: false,
      error: 'Failed to load conversations',
    }).mockResolvedValueOnce({
      success: true,
      data: mockConversations,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load conversations')).toBeDefined();
    });
    
    const retryButton = screen.getByText('Try Again');
    await userEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('otheruser')).toBeDefined();
    });
  });
});