import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useChatRecipient } from './useChatRecipient';
import { messagesApi } from '@/services/messagesApi';

// ---------- Mocks ----------

vi.mock('@/services/messagesApi');

const mockUseLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  };
});

// ---------- Helpers ----------

const userId = 'user-1';

const recipientFromState = {
  _id: 'user-2',
  username: 'bob',
  avatar: 'bob.jpg',
};

const recipientFromApi = {
  _id: 'user-2',
  username: 'bob',
  avatar: 'bob.jpg',
};

const renderUseChatRecipient = (
  conversationId: string | undefined,
  currentUserId: string | undefined
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );

  return renderHook(
    () => useChatRecipient(conversationId, currentUserId),
    { wrapper }
  );
};

// ---------- Tests ----------

describe('useChatRecipient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ state: null });
    (messagesApi.getConversationById as any).mockResolvedValue({
      success: true,
      data: { participants: [] },
    });
  });

  // ---- From location.state ----

  describe('recipient from location state', () => {
    it('picks up recipient from location.state on mount', () => {
      mockUseLocation.mockReturnValue({
        state: { recipient: recipientFromState },
      });

      const { result } = renderUseChatRecipient('conv-1', userId);

      expect(result.current.recipient).toEqual(recipientFromState);
    });

    it('does not call the API when recipient is in state', () => {
      mockUseLocation.mockReturnValue({
        state: { recipient: recipientFromState },
      });

      renderUseChatRecipient('conv-1', userId);

      expect(messagesApi.getConversationById).not.toHaveBeenCalled();
    });

    it('does nothing when state has no recipient', async () => {
      mockUseLocation.mockReturnValue({ state: null });

      const { result } = renderUseChatRecipient('conv-1', userId);

      expect(result.current.recipient).toBeNull();
    });
  });

  // ---- From API ----

  describe('loading recipient from API', () => {
    it('loads recipient from API when not in state', async () => {
      mockUseLocation.mockReturnValue({ state: null });
      (messagesApi.getConversationById as any).mockResolvedValue({
        success: true,
        data: {
          participants: [
            { _id: 'user-1', username: 'alice' },
            recipientFromApi,
          ],
        },
      });

      const { result } = renderUseChatRecipient('conv-1', userId);

      await waitFor(() => {
        expect(result.current.recipient).toEqual(recipientFromApi);
      });

      expect(messagesApi.getConversationById).toHaveBeenCalledWith('conv-1');
    });

    it('finds the other participant excluding current user', async () => {
      mockUseLocation.mockReturnValue({ state: null });
      (messagesApi.getConversationById as any).mockResolvedValue({
        success: true,
        data: {
          participants: [
            { _id: 'user-1', username: 'alice' },
            { _id: 'user-2', username: 'bob' },
            { _id: 'user-3', username: 'carol' },
          ],
        },
      });

      const { result } = renderUseChatRecipient('conv-1', 'user-1');

      await waitFor(() => {
        expect(result.current.recipient?._id).toBe('user-2');
      });
    });

    it('does not load from API when conversationId is undefined', () => {
      mockUseLocation.mockReturnValue({ state: null });

      renderUseChatRecipient(undefined, userId);

      expect(messagesApi.getConversationById).not.toHaveBeenCalled();
    });

    it('does not load from API when userId is undefined', () => {
      mockUseLocation.mockReturnValue({ state: null });

      renderUseChatRecipient('conv-1', undefined);

      expect(messagesApi.getConversationById).not.toHaveBeenCalled();
    });

    it('does not load from API when recipient is already set', async () => {
      mockUseLocation.mockReturnValue({
        state: { recipient: recipientFromState },
      });

      renderUseChatRecipient('conv-1', userId);

      // Give effects time to run
      await new Promise((r) => setTimeout(r, 0));

      expect(messagesApi.getConversationById).not.toHaveBeenCalled();
    });

    it('handles API error without crashing', async () => {
      mockUseLocation.mockReturnValue({ state: null });
      (messagesApi.getConversationById as any).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderUseChatRecipient('conv-1', userId);

      // Give the effect time to run and the promise to reject
      await new Promise((r) => setTimeout(r, 0));

      expect(result.current.recipient).toBeNull();
    });

    it('handles success=false from API', async () => {
      mockUseLocation.mockReturnValue({ state: null });
      (messagesApi.getConversationById as any).mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      const { result } = renderUseChatRecipient('conv-1', userId);

      await new Promise((r) => setTimeout(r, 0));

      expect(result.current.recipient).toBeNull();
    });

    it('does not set recipient if no other participant exists', async () => {
      mockUseLocation.mockReturnValue({ state: null });
      (messagesApi.getConversationById as any).mockResolvedValue({
        success: true,
        data: {
          participants: [{ _id: 'user-1', username: 'alice' }],
        },
      });

      const { result } = renderUseChatRecipient('conv-1', userId);

      await new Promise((r) => setTimeout(r, 0));

      expect(result.current.recipient).toBeNull();
    });
  });
});