import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatRecipient } from '../../../hooks/chat/useChatRecipient';
import { messagesApi } from '../../../services/messagesApi';
import { MemoryRouter } from 'react-router-dom';

// Mock messagesApi
vi.mock('../../../services/messagesApi', () => ({
  messagesApi: {
    getConversationById: vi.fn(),
  },
}));

describe('useChatRecipient', () => {
  const mockUserId = 'user123';
  const mockConversationId = 'conv123';
  const mockOtherUserId = 'user456';
  const mockOtherUsername = 'Other User';
  const mockOtherAvatar = 'avatar.jpg';

  const mockConversationResponse = {
    conversationId: mockConversationId,
    participants: [
      {
        _id: mockUserId,
        username: 'Current User',
        avatar: 'current-avatar.jpg',
      },
      {
        _id: mockOtherUserId,
        username: mockOtherUsername,
        avatar: mockOtherAvatar,
      },
    ],
    messages: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(
      () => useChatRecipient(undefined, undefined),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    expect(result.current.recipientName).toBe('');
    expect(result.current.recipientAvatar).toBe('');
    expect(result.current.recipientId).toBe('');
  });

  it('should get recipient info from location state', () => {
    const locationState = {
      recipientName: 'Location User',
      recipientAvatar: 'location-avatar.jpg',
      recipientId: 'location456',
    };

    const { result } = renderHook(
      () => useChatRecipient(undefined, undefined),
      {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={[{ state: locationState }]}>
            {children}
          </MemoryRouter>
        ),
      }
    );

    expect(result.current.recipientName).toBe('Location User');
    expect(result.current.recipientAvatar).toBe('location-avatar.jpg');
    expect(result.current.recipientId).toBe('location456');
  });

  it('should load recipient from conversation when not in location state', async () => {
    vi.mocked(messagesApi.getConversationById).mockResolvedValue({
      success: true,
      data: mockConversationResponse,
    });

    const { result } = renderHook(
      () => useChatRecipient(mockConversationId, mockUserId),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(result.current.recipientId).toBe(mockOtherUserId);
    });

    expect(result.current.recipientName).toBe(mockOtherUsername);
    expect(result.current.recipientAvatar).toBe(mockOtherAvatar);
    expect(messagesApi.getConversationById).toHaveBeenCalledWith(mockConversationId);
  });

  it('should not load recipient if conversationId is undefined', async () => {
    const { result } = renderHook(
      () => useChatRecipient(undefined, mockUserId),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(result.current.recipientId).toBe('');
    });

    expect(messagesApi.getConversationById).not.toHaveBeenCalled();
  });

  it('should not load recipient if userId is undefined', async () => {
    const { result } = renderHook(
      () => useChatRecipient(mockConversationId, undefined),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(result.current.recipientId).toBe('');
    });

    expect(messagesApi.getConversationById).not.toHaveBeenCalled();
  });

  it('should handle API error gracefully', async () => {
    vi.mocked(messagesApi.getConversationById).mockResolvedValue({
      success: false,
      error: 'Failed to load',
    });

    const { result } = renderHook(
      () => useChatRecipient(mockConversationId, mockUserId),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(messagesApi.getConversationById).toHaveBeenCalled();
    });

    expect(result.current.recipientName).toBe('');
    expect(result.current.recipientAvatar).toBe('');
    expect(result.current.recipientId).toBe('');
  });

  it('should handle exception during API call', async () => {
    vi.mocked(messagesApi.getConversationById).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useChatRecipient(mockConversationId, mockUserId),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(messagesApi.getConversationById).toHaveBeenCalled();
    });

    expect(result.current.recipientName).toBe('');
    expect(result.current.recipientAvatar).toBe('');
    expect(result.current.recipientId).toBe('');
  });

  it('should handle conversation without participants', async () => {
    const emptyConversation = {
      conversationId: mockConversationId,
      participants: [],
      messages: [],
    };

    vi.mocked(messagesApi.getConversationById).mockResolvedValue({
      success: true,
      data: emptyConversation,
    });

    const { result } = renderHook(
      () => useChatRecipient(mockConversationId, mockUserId),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(messagesApi.getConversationById).toHaveBeenCalled();
    });

    expect(result.current.recipientName).toBe('');
    expect(result.current.recipientAvatar).toBe('');
    expect(result.current.recipientId).toBe('');
  });

  it('should handle conversation with only current user', async () => {
    const singleUserConversation = {
      conversationId: mockConversationId,
      participants: [
        {
          _id: mockUserId,
          username: 'Current User',
          avatar: 'current-avatar.jpg',
        },
      ],
      messages: [],
    };

    vi.mocked(messagesApi.getConversationById).mockResolvedValue({
      success: true,
      data: singleUserConversation,
    });

    const { result } = renderHook(
      () => useChatRecipient(mockConversationId, mockUserId),
      { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> }
    );

    await waitFor(() => {
      expect(messagesApi.getConversationById).toHaveBeenCalled();
    });

    expect(result.current.recipientName).toBe('');
    expect(result.current.recipientAvatar).toBe('');
    expect(result.current.recipientId).toBe('');
  });
});