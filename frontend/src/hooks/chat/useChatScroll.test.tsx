import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatScroll } from './useChatScroll';

// ---------- Helpers ----------

const makeMessage = (id: string) => ({
  _id: id,
  conversationId: 'conv-1',
  senderId: { _id: 'user-1', username: 'alice', avatar: '' },
  text: `Message ${id}`,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  read: false,
});

const makeContainer = (opts: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}) => {
  const node = document.createElement('div');
  Object.defineProperties(node, {
    scrollTop: { value: opts.scrollTop, writable: true, configurable: true },
    scrollHeight: { value: opts.scrollHeight, configurable: true },
    clientHeight: { value: opts.clientHeight, configurable: true },
  });
  return node;
};

const makeEndNode = () => {
  const node = document.createElement('div');
  node.scrollIntoView = vi.fn();
  return node;
};

// ---------- Tests ----------

describe('useChatScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- Initial state ----

  describe('initial state', () => {
    it('starts with showScrollButton=false', () => {
      const { result } = renderHook(() => useChatScroll([]));
      expect(result.current.showScrollButton).toBe(false);
    });

    it('exposes all refs and callbacks', () => {
      const { result } = renderHook(() => useChatScroll([]));
      expect(result.current.messagesContainerRef).toBeDefined();
      expect(result.current.messagesEndRef).toBeDefined();
      expect(typeof result.current.scrollToBottom).toBe('function');
      expect(typeof result.current.handleScroll).toBe('function');
    });
  });

  // ---- handleScroll ----

  describe('handleScroll', () => {
    it('sets showScrollButton=true when not at bottom', () => {
      const { result } = renderHook(() => useChatScroll([]));

      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = makeContainer({
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 500,
      });

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.showScrollButton).toBe(true);
    });

    it('sets showScrollButton=false when at bottom', () => {
      const { result } = renderHook(() => useChatScroll([]));

      // scrollHeight - scrollTop - clientHeight = 1000 - 500 - 500 = 0 (< 100)
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = makeContainer({
        scrollTop: 500,
        scrollHeight: 1000,
        clientHeight: 500,
      });

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.showScrollButton).toBe(false);
    });

    it('does nothing when container ref is null', () => {
      const { result } = renderHook(() => useChatScroll([]));

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.showScrollButton).toBe(false);
    });
  });

  // ---- scrollToBottom ----

  describe('scrollToBottom', () => {
    it('calls scrollIntoView on the end ref', () => {
      const { result } = renderHook(() => useChatScroll([]));

      const endNode = makeEndNode();
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = endNode;

      act(() => {
        result.current.scrollToBottom();
      });

      expect(endNode.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
    });

    it('does nothing when end ref is null', () => {
      const { result } = renderHook(() => useChatScroll([]));

      // Should not throw
      act(() => {
        result.current.scrollToBottom();
      });
    });
  });

  // ---- Auto-scroll on new messages ----

  describe('auto-scroll on new messages', () => {
    it('scrolls to bottom when a new message arrives and user was at bottom', () => {
      const initialMessages = [makeMessage('1')];

      const { result, rerender } = renderHook(
        ({ messages }) => useChatScroll(messages),
        { initialProps: { messages: initialMessages } }
      );

      const endNode = makeEndNode();
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = endNode;

      // Simulate user being at the bottom
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = makeContainer({
        scrollTop: 500,
        scrollHeight: 1000,
        clientHeight: 500,
      });
      act(() => {
        result.current.handleScroll();
      });

      // New message arrives
      rerender({ messages: [...initialMessages, makeMessage('2')] });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(endNode.scrollIntoView).toHaveBeenCalled();
    });

    it('does NOT scroll when user is not at bottom', () => {
      const initialMessages = [makeMessage('1')];

      const { result, rerender } = renderHook(
        ({ messages }) => useChatScroll(messages),
        { initialProps: { messages: initialMessages } }
      );

      const endNode = makeEndNode();
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = endNode;

      // Let the initial-load scroll fire and finish
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Now simulate "user scrolled up"
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = makeContainer({
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 500,
      });
      act(() => {
        result.current.handleScroll();
      });

      // Reset call history AFTER the initial scroll is done
      (endNode.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();

      // New message arrives while user is reading history
      rerender({ messages: [...initialMessages, makeMessage('2')] });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(endNode.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  // ---- Initial scroll ----

  describe('initial scroll', () => {
    it('scrolls to bottom on first load with messages', () => {
      const messages = [makeMessage('1'), makeMessage('2')];

      const { result } = renderHook(() => useChatScroll(messages));

      const endNode = makeEndNode();
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = endNode;

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(endNode.scrollIntoView).toHaveBeenCalled();
    });

    it('does NOT scroll when messages are empty', () => {
      const { result } = renderHook(() => useChatScroll([]));

      const endNode = makeEndNode();
      (result.current.messagesContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = endNode;

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(endNode.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});