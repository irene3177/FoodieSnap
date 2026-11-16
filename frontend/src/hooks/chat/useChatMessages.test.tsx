import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages } from './useChatMessages';
import * as socket from '@/services/socket';
import { messagesApi } from '@/services/messagesApi';

// ---------- Mocks ----------

vi.mock('@/services/socket');
vi.mock('@/services/messagesApi');

// ---------- Helpers ----------

const currentUser = {
  _id: 'user-1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
};

const makeMessage = (overrides: Partial<any> = {}) => ({
  _id: 'msg-1',
  conversationId: 'conv-1',
  senderId: { _id: 'user-1', username: 'alice', avatar: 'alice.jpg' },
  text: 'Hello',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  read: false,
  ...overrides,
});

let messageCallback: ((msg: any) => void) | null = null;
const unsubscribeMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  messageCallback = null;

  // Capture the callback passed to socket.onMessage so we can emulate incoming messages
  (socket.onMessage as any).mockImplementation((cb: (msg: any) => void) => {
    messageCallback = cb;
    return unsubscribeMock;
  });

  (socket.joinChat as any).mockImplementation(() => {});
  (socket.leaveChat as any).mockImplementation(() => {});
  (socket.sendMessage as any).mockImplementation(() => {});

  // API returns an empty list by default
  (messagesApi.getConversationById as any).mockResolvedValue({
    success: true,
    data: { messages: [] },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------- Tests ----------

describe('useChatMessages', () => {
  // ---- Loading ----

  describe('loading messages', () => {
    it('loads messages on mount', async () => {
      const initialMessages = [
        makeMessage({ _id: 'm1', text: 'First' }),
        makeMessage({ _id: 'm2', text: 'Second' }),
      ];
      (messagesApi.getConversationById as any).mockResolvedValue({
        success: true,
        data: { messages: initialMessages },
      });

      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].text).toBe('First');
      expect(messagesApi.getConversationById).toHaveBeenCalledWith('conv-1');
    });

    it('sets empty array if API fails', async () => {
      (messagesApi.getConversationById as any).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.messages).toEqual([]);
    });

    it('does nothing if conversationId is undefined', () => {
      const { result } = renderHook(() =>
        useChatMessages(undefined, currentUser)
      );

      expect(result.current.messages).toEqual([]);
      // loading stays true because load is never called
      expect(result.current.loading).toBe(true);
      expect(messagesApi.getConversationById).not.toHaveBeenCalled();
    });
  });

  // ---- Socket: incoming messages ----

  describe('incoming socket messages', () => {
    it('adds incoming message to state', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        messageCallback?.(makeMessage({ _id: 'new-msg', text: 'Hi!' }));
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].text).toBe('Hi!');
    });

    it('ignores messages from other conversations', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        messageCallback?.(
          makeMessage({ _id: 'other-msg', conversationId: 'conv-999' })
        );
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('does not add duplicate messages', async () => {
      const existing = makeMessage({ _id: 'dup-1', text: 'Dup' });
      (messagesApi.getConversationById as any).mockResolvedValue({
        success: true,
        data: { messages: [existing] },
      });

      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.messages).toHaveLength(1));

      act(() => {
        messageCallback?.(existing);
      });

      expect(result.current.messages).toHaveLength(1);
    });

    it('unsubscribes from socket on unmount', async () => {
      const { unmount } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(socket.onMessage).toHaveBeenCalled());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  // ---- Sending ----

  describe('sendMessage', () => {
    it('does optimistic update and emits via socket', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Hello there');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].text).toBe('Hello there');
      expect(result.current.messages[0]._id).toMatch(/^temp-/);
      expect(socket.sendMessage).toHaveBeenCalledWith(
        'conv-1',
        'Hello there',
        'user-1'
      );
    });

    it('replaces temp message when server echoes it back', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      const tempId = result.current.messages[0]._id;
      expect(tempId).toMatch(/^temp-/);

      // Server sends back the real message with the same text
      act(() => {
        messageCallback?.(
          makeMessage({ _id: 'real-id-1', text: 'Hello' })
        );
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]._id).toBe('real-id-1');
    });

    it('does not send empty or whitespace-only messages', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        const ok1 = await result.current.sendMessage('');
        const ok2 = await result.current.sendMessage('   ');
        expect(ok1).toBe(false);
        expect(ok2).toBe(false);
      });

      expect(result.current.messages).toHaveLength(0);
      expect(socket.sendMessage).not.toHaveBeenCalled();
    });

    it('does not send if no conversationId', async () => {
      const { result } = renderHook(() =>
        useChatMessages(undefined, currentUser)
      );

      await act(async () => {
        const ok = await result.current.sendMessage('Hi');
        expect(ok).toBe(false);
      });

      expect(socket.sendMessage).not.toHaveBeenCalled();
    });

    it('does not send if no currentUser', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', null)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        const ok = await result.current.sendMessage('Hi');
        expect(ok).toBe(false);
      });

      expect(socket.sendMessage).not.toHaveBeenCalled();
    });

    it('trims message text before sending', async () => {
      const { result } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('  hello  ');
      });

      expect(result.current.messages[0].text).toBe('hello');
      expect(socket.sendMessage).toHaveBeenCalledWith(
        'conv-1',
        'hello',
        'user-1'
      );
    });
  });

  // ---- Join / leave ----

  describe('chat room join/leave', () => {
    it('joins chat room on mount', async () => {
      renderHook(() => useChatMessages('conv-1', currentUser));

      await waitFor(() => {
        expect(socket.joinChat).toHaveBeenCalledWith('conv-1');
      });
    });

    it('leaves chat room on unmount', async () => {
      const { unmount } = renderHook(() =>
        useChatMessages('conv-1', currentUser)
      );

      await waitFor(() => expect(socket.joinChat).toHaveBeenCalled());

      unmount();

      expect(socket.leaveChat).toHaveBeenCalledWith('conv-1');
    });
  });
});