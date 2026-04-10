import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { useUserStatus } from '../../../hooks/chat/useUserStatus';
import * as socket from '../../../services/socket';
import { useAuth } from '../../../hooks/useAuth';
import { User } from '../../../types';

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock socket
vi.mock('../../../services/socket', () => ({
  checkOnlineStatus: vi.fn(),
  onOnlineStatusResponse: vi.fn(() => vi.fn()),
  onUserOnline: vi.fn(() => vi.fn()),
  onTyping: vi.fn(() => vi.fn()),
}));

describe('useUserStatus', () => {
  const mockUserId = 'user123';
  const mockCurrentUser: User = {
    _id: 'current456',
    username: 'currentuser',
    email: 'current@test.com',
    avatar: 'avatar.jpg',
  };

  const mockAuthValue = {
    user: mockCurrentUser,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock useAuth return value
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue(mockAuthValue);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useUserStatus(mockUserId));

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isTyping).toBe(false);
  });

  it('should check online status when userId is provided', () => {
    renderHook(() => useUserStatus(mockUserId));

    expect(socket.checkOnlineStatus).toHaveBeenCalledWith(mockUserId);
  });

  it('should not check online status when userId is falsy', () => {
    renderHook(() => useUserStatus(''));

    expect(socket.checkOnlineStatus).not.toHaveBeenCalled();
  });

  it('should update isOnline from online status response', () => {
    let statusResponseCallback: (data: { userId: string; online: boolean }) => void = () => {};
    const onOnlineStatusResponseMock = vi.mocked(socket.onOnlineStatusResponse);
    onOnlineStatusResponseMock.mockImplementation((callback) => {
      statusResponseCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      statusResponseCallback({ userId: mockUserId, online: true });
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should ignore status response for other users', () => {
    let statusResponseCallback: (data: { userId: string; online: boolean }) => void = () => {};
    const onOnlineStatusResponseMock = vi.mocked(socket.onOnlineStatusResponse);
    onOnlineStatusResponseMock.mockImplementation((callback) => {
      statusResponseCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      statusResponseCallback({ userId: 'differentUser', online: true });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update isOnline from user online event', () => {
    let onlineCallback: (data: { userId: string; online: boolean }) => void = () => {};
    const onUserOnlineMock = vi.mocked(socket.onUserOnline);
    onUserOnlineMock.mockImplementation((callback) => {
      onlineCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      onlineCallback({ userId: mockUserId, online: true });
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should ignore online events for other users', () => {
    let onlineCallback: (data: { userId: string; online: boolean }) => void = () => {};
    const onUserOnlineMock = vi.mocked(socket.onUserOnline);
    onUserOnlineMock.mockImplementation((callback) => {
      onlineCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      onlineCallback({ userId: 'differentUser', online: true });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update typing status', () => {
    let typingCallback: (data: { userId: string; isTyping: boolean }) => void = () => {};
    const onTypingMock = vi.mocked(socket.onTyping);
    onTypingMock.mockImplementation((callback) => {
      typingCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      typingCallback({ userId: mockUserId, isTyping: true });
    });

    expect(result.current.isTyping).toBe(true);
  });

  it('should auto-reset typing status after 3 seconds', () => {
    let typingCallback: (data: { userId: string; isTyping: boolean }) => void = () => {};
    const onTypingMock = vi.mocked(socket.onTyping);
    onTypingMock.mockImplementation((callback) => {
      typingCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      typingCallback({ userId: mockUserId, isTyping: true });
    });

    expect(result.current.isTyping).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isTyping).toBe(false);
  });

  it('should ignore typing events for other users', () => {
    let typingCallback: (data: { userId: string; isTyping: boolean }) => void = () => {};
    const onTypingMock = vi.mocked(socket.onTyping);
    onTypingMock.mockImplementation((callback) => {
      typingCallback = callback;
      return vi.fn();
    });

    const { result } = renderHook(() => useUserStatus(mockUserId));

    act(() => {
      typingCallback({ userId: 'differentUser', isTyping: true });
    });

    expect(result.current.isTyping).toBe(false);
  });

  it('should cleanup listeners on unmount', () => {
    const mockUnsubscribeStatus = vi.fn();
    const mockUnsubscribeOnline = vi.fn();
    const mockUnsubscribeTyping = vi.fn();

    const onOnlineStatusResponseMock = vi.mocked(socket.onOnlineStatusResponse);
    const onUserOnlineMock = vi.mocked(socket.onUserOnline);
    const onTypingMock = vi.mocked(socket.onTyping);
    
    onOnlineStatusResponseMock.mockReturnValue(mockUnsubscribeStatus);
    onUserOnlineMock.mockReturnValue(mockUnsubscribeOnline);
    onTypingMock.mockReturnValue(mockUnsubscribeTyping);

    const { unmount } = renderHook(() => useUserStatus(mockUserId));

    unmount();

    expect(mockUnsubscribeStatus).toHaveBeenCalled();
    expect(mockUnsubscribeOnline).toHaveBeenCalled();
    expect(mockUnsubscribeTyping).toHaveBeenCalled();
  });

  it('should not setup listeners when userId is falsy', () => {
    renderHook(() => useUserStatus(''));

    expect(socket.onOnlineStatusResponse).not.toHaveBeenCalled();
    expect(socket.onUserOnline).not.toHaveBeenCalled();
    expect(socket.onTyping).not.toHaveBeenCalled();
  });
});