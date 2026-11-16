import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useUnreadListener } from './useUnreadListener';
import * as socket from '@/services/socket';
import unreadReducer from '@/store/unreadSlice';
import { Message } from '@/types';

// ---------- Mocks ----------

vi.mock('@/services/socket');

// ---------- Helpers ----------

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  _id: 'msg-1',
  conversationId: 'conv-1',
  senderId: { _id: 'user-2', username: 'bob', avatar: '' },
  text: 'Hello',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  read: false,
  ...overrides,
});

let messageCallback: ((msg: Message) => void) | null = null;
let readCallback: ((data: { userId: string; conversationId: string }) => void) | null = null;

const unsubscribeMessageMock = vi.fn();
const unsubscribeReadMock = vi.fn();

const setPathname = (pathname: string) => {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { ...window.location, pathname },
  });
};

const renderUseUnreadListener = (userId: string | undefined | null) => {
  const store = configureStore({
    reducer: { unread: unreadReducer },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const hookResult = renderHook(() => useUnreadListener(userId), { wrapper });

  return { ...hookResult, store };
};

// ---------- Tests ----------

describe('useUnreadListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageCallback = null;
    readCallback = null;
    setPathname('/');

    (socket.onMessage as any).mockImplementation((cb: (msg: Message) => void) => {
      messageCallback = cb;
      return unsubscribeMessageMock;
    });

    (socket.onMessagesRead as any).mockImplementation(
      (cb: (data: { userId: string; conversationId: string }) => void) => {
        readCallback = cb;
        return unsubscribeReadMock;
      }
    );

    (socket.markRead as any).mockImplementation(() => {});
  });

  // ---- Registration ----

  describe('registration', () => {
    it('does not subscribe when userId is undefined', () => {
      renderUseUnreadListener(undefined);

      expect(socket.onMessage).not.toHaveBeenCalled();
      expect(socket.onMessagesRead).not.toHaveBeenCalled();
    });

    it('does not subscribe when userId is null', () => {
      renderUseUnreadListener(null);

      expect(socket.onMessage).not.toHaveBeenCalled();
      expect(socket.onMessagesRead).not.toHaveBeenCalled();
    });

    it('subscribes when userId is provided', () => {
      renderUseUnreadListener('user-1');

      expect(socket.onMessage).toHaveBeenCalledTimes(1);
      expect(socket.onMessagesRead).toHaveBeenCalledTimes(1);
    });

    it('does not register twice on rerender with same userId', () => {
      const { rerender } = renderUseUnreadListener('user-1');

      rerender();
      rerender();

      expect(socket.onMessage).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes and resets registration on unmount', () => {
      const { unmount } = renderUseUnreadListener('user-1');

      unmount();

      expect(unsubscribeMessageMock).toHaveBeenCalled();
      expect(unsubscribeReadMock).toHaveBeenCalled();
    });
  });

  // ---- handleNewMessage ----

  describe('handleNewMessage', () => {
    it('ignores messages sent by the current user', () => {
      const { store } = renderUseUnreadListener('user-1');

      act(() => {
        messageCallback?.(
          makeMessage({
            senderId: { _id: 'user-1', username: 'me', avatar: '' },
          })
        );
      });

      const state = store.getState() as any;
      expect(state.unread.counts).toEqual({});
      expect(state.unread.total).toBe(0);
    });

    it('ignores duplicate messages with the same id', () => {
      const { store } = renderUseUnreadListener('user-1');
      const msg = makeMessage({ _id: 'dup-1' });

      act(() => {
        messageCallback?.(msg);
        messageCallback?.(msg);
        messageCallback?.(msg);
      });

      const state = store.getState() as any;
      expect(state.unread.counts['conv-1']).toBe(1);
      expect(state.unread.total).toBe(1);
    });

    it('increments unread and updates last message when not in the current chat', () => {
      setPathname('/chats');
      const { store } = renderUseUnreadListener('user-1');

      act(() => {
        messageCallback?.(
          makeMessage({ _id: 'm1', conversationId: 'conv-1', text: 'Hi!' })
        );
      });

      const state = store.getState() as any;
      expect(state.unread.counts['conv-1']).toBe(1);
      expect(state.unread.total).toBe(1);
      expect(state.unread.lastMessages['conv-1']).toEqual({
        text: 'Hi!',
        createdAt: '2024-01-01T00:00:00Z',
        senderId: 'user-2',
      });
    });

    it('calls socket.markRead when the message is for the current chat', () => {
      setPathname('/chat/conv-1');
      renderUseUnreadListener('user-1');

      act(() => {
        messageCallback?.(makeMessage({ _id: 'm1', conversationId: 'conv-1' }));
      });

      expect(socket.markRead).toHaveBeenCalledWith('conv-1', 'user-1');
    });

    it('does not increment unread when in the current chat', () => {
      setPathname('/chat/conv-1');
      const { store } = renderUseUnreadListener('user-1');

      act(() => {
        messageCallback?.(makeMessage({ _id: 'm1', conversationId: 'conv-1' }));
      });

      const state = store.getState() as any;
      expect(state.unread.counts['conv-1']).toBeUndefined();
    });
  });

  // ---- handleMessagesRead ----

  describe('handleMessagesRead', () => {
    it('resets unread for the matching user', () => {
      setPathname('/chats');
      const { store } = renderUseUnreadListener('user-1');

      act(() => {
        messageCallback?.(
          makeMessage({ _id: 'm1', conversationId: 'conv-1' })
        );
      });

      expect((store.getState() as any).unread.counts['conv-1']).toBe(1);

      act(() => {
        readCallback?.({ userId: 'user-1', conversationId: 'conv-1' });
      });

      expect((store.getState() as any).unread.counts['conv-1']).toBe(0);
      expect((store.getState() as any).unread.total).toBe(0);
    });

    it('ignores read events for other users', () => {
      setPathname('/chats');
      const { store } = renderUseUnreadListener('user-1');

      act(() => {
        messageCallback?.(
          makeMessage({ _id: 'm1', conversationId: 'conv-1' })
        );
      });

      expect((store.getState() as any).unread.counts['conv-1']).toBe(1);

      act(() => {
        readCallback?.({ userId: 'user-2', conversationId: 'conv-1' });
      });

      expect((store.getState() as any).unread.counts['conv-1']).toBe(1);
    });
  });
});