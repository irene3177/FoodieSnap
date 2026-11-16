import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserStatus } from './useUserStatus';
import * as socket from '@/services/socket';
import { useAuth } from '@/hooks/useAuth';

// ---------- Mocks ----------

vi.mock('@/services/socket');
vi.mock('@/hooks/useAuth');

// ---------- Helpers ----------

let onlineStatusCallback: ((data: { userId: string; online: boolean }) => void) | null = null;
let userOnlineCallback: ((data: { userId: string; online: boolean }) => void) | null = null;
let typingCallback: ((data: { userId: string; isTyping: boolean }) => void) | null = null;

const unsubStatusMock = vi.fn();
const unsubOnlineMock = vi.fn();
const unsubTypingMock = vi.fn();

const mockUser = { _id: 'user-1', username: 'alice', avatar: '' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();

  onlineStatusCallback = null;
  userOnlineCallback = null;
  typingCallback = null;

  (useAuth as any).mockReturnValue({ user: mockUser });

  (socket.checkOnlineStatus as any).mockImplementation(() => {});

  (socket.onOnlineStatusResponse as any).mockImplementation(
    (cb: (data: { userId: string; online: boolean }) => void) => {
      onlineStatusCallback = cb;
      return unsubStatusMock;
    }
  );

  (socket.onUserOnline as any).mockImplementation(
    (cb: (data: { userId: string; online: boolean }) => void) => {
      userOnlineCallback = cb;
      return unsubOnlineMock;
    }
  );

  (socket.onTyping as any).mockImplementation(
    (cb: (data: { userId: string; isTyping: boolean }) => void) => {
      typingCallback = cb;
      return unsubTypingMock;
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------- Tests ----------

describe('useUserStatus', () => {
  // ---- Initial state ----

  describe('initial state', () => {
    it('starts with isOnline=false and isTyping=false', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isTyping).toBe(false);
    });
  });

  // ---- Registration ----

  describe('registration', () => {
    it('does not subscribe when userId is empty', () => {
      renderHook(() => useUserStatus(''));

      expect(socket.checkOnlineStatus).not.toHaveBeenCalled();
      expect(socket.onOnlineStatusResponse).not.toHaveBeenCalled();
      expect(socket.onUserOnline).not.toHaveBeenCalled();
      expect(socket.onTyping).not.toHaveBeenCalled();
    });

    it('calls checkOnlineStatus on mount', () => {
      renderHook(() => useUserStatus('user-2'));

      expect(socket.checkOnlineStatus).toHaveBeenCalledWith('user-2');
    });

    it('subscribes to all three socket events', () => {
      renderHook(() => useUserStatus('user-2'));

      expect(socket.onOnlineStatusResponse).toHaveBeenCalledTimes(1);
      expect(socket.onUserOnline).toHaveBeenCalledTimes(1);
      expect(socket.onTyping).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes from all events on unmount', () => {
      const { unmount } = renderHook(() => useUserStatus('user-2'));

      unmount();

      expect(unsubStatusMock).toHaveBeenCalled();
      expect(unsubOnlineMock).toHaveBeenCalled();
      expect(unsubTypingMock).toHaveBeenCalled();
    });
  });

  // ---- onOnlineStatusResponse ----

  describe('onOnlineStatusResponse', () => {
    it('sets isOnline when the event matches userId', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        onlineStatusCallback?.({ userId: 'user-2', online: true });
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('ignores events for other users', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        onlineStatusCallback?.({ userId: 'other-user', online: true });
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  // ---- onUserOnline ----

  describe('onUserOnline', () => {
    it('sets isOnline when user comes online', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        userOnlineCallback?.({ userId: 'user-2', online: true });
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('sets isOnline=false when user goes offline', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        userOnlineCallback?.({ userId: 'user-2', online: true });
      });
      act(() => {
        userOnlineCallback?.({ userId: 'user-2', online: false });
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('ignores events for other users', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        userOnlineCallback?.({ userId: 'other-user', online: true });
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  // ---- onTyping ----

  describe('onTyping', () => {
    it('sets isTyping=true when the user starts typing', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        typingCallback?.({ userId: 'user-2', isTyping: true });
      });

      expect(result.current.isTyping).toBe(true);
    });

    it('auto-resets isTyping after 3 seconds', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        typingCallback?.({ userId: 'user-2', isTyping: true });
      });

      expect(result.current.isTyping).toBe(true);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isTyping).toBe(false);
    });

    it('does not auto-reset when isTyping is false', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        typingCallback?.({ userId: 'user-2', isTyping: true });
      });
      act(() => {
        typingCallback?.({ userId: 'user-2', isTyping: false });
      });

      expect(result.current.isTyping).toBe(false);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Still false, no crash
      expect(result.current.isTyping).toBe(false);
    });

    it('ignores typing events for other users', () => {
      const { result } = renderHook(() => useUserStatus('user-2'));

      act(() => {
        typingCallback?.({ userId: 'other-user', isTyping: true });
      });

      expect(result.current.isTyping).toBe(false);
    });
  });
});