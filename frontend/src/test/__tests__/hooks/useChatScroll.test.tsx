import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { useChatScroll } from '../../../hooks/chat/useChatScroll';

describe('useChatScroll', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useChatScroll([]));

    expect(result.current.showScrollButton).toBe(false);
    expect(result.current.scrollToBottom).toBeInstanceOf(Function);
    expect(result.current.messagesContainerRef.current).toBe(null);
    expect(result.current.messagesEndRef.current).toBe(null);
    expect(result.current.handleScroll).toBeInstanceOf(Function);
  });

  it('should scroll to bottom when scrollToBottom is called', () => {
    const scrollIntoViewMock = vi.fn();
    const div = document.createElement('div');
    div.scrollIntoView = scrollIntoViewMock;
    
    const { result } = renderHook(() => useChatScroll([]));
    
    // Manually set the ref
    Object.defineProperty(result.current.messagesEndRef, 'current', {
      value: div,
      configurable: true,
    });

    act(() => {
      result.current.scrollToBottom();
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should update showScrollButton based on scroll position', () => {
    const { result } = renderHook(() => useChatScroll([]));

    const mockContainer = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    } as HTMLDivElement;
    
    Object.defineProperty(result.current.messagesContainerRef, 'current', {
      value: mockContainer,
      configurable: true,
    });

    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showScrollButton).toBe(true);
  });

  it('should hide scroll button when at bottom', () => {
    const { result } = renderHook(() => useChatScroll([]));

    const mockContainer = {
      scrollTop: 900,
      scrollHeight: 1000,
      clientHeight: 100,
    } as HTMLDivElement;
    
    Object.defineProperty(result.current.messagesContainerRef, 'current', {
      value: mockContainer,
      configurable: true,
    });

    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should handle scroll event when container is null', () => {
    const { result } = renderHook(() => useChatScroll([]));
    
    Object.defineProperty(result.current.messagesContainerRef, 'current', {
      value: null,
      configurable: true,
    });

    expect(() => {
      act(() => {
        result.current.handleScroll();
      });
    }).not.toThrow();
  });

  it('should handle scrollToBottom when messagesEndRef is null', () => {
    const { result } = renderHook(() => useChatScroll([]));
    
    Object.defineProperty(result.current.messagesEndRef, 'current', {
      value: null,
      configurable: true,
    });

    expect(() => {
      act(() => {
        result.current.scrollToBottom();
      });
    }).not.toThrow();
  });

  it('should show scroll button when scrolled up', () => {
    const { result } = renderHook(() => useChatScroll([]));

    const mockContainer = {
      scrollTop: 200,
      scrollHeight: 1000,
      clientHeight: 500,
    } as HTMLDivElement;
    
    Object.defineProperty(result.current.messagesContainerRef, 'current', {
      value: mockContainer,
      configurable: true,
    });

    act(() => {
      result.current.handleScroll();
    });

    // scrollHeight - scrollTop - clientHeight = 1000-200-500 = 300 > 100
    expect(result.current.showScrollButton).toBe(true);
  });

  it('should hide scroll button when very close to bottom', () => {
    const { result } = renderHook(() => useChatScroll([]));

    const mockContainer = {
      scrollTop: 950,
      scrollHeight: 1000,
      clientHeight: 100,
    } as HTMLDivElement;
    
    Object.defineProperty(result.current.messagesContainerRef, 'current', {
      value: mockContainer,
      configurable: true,
    });

    act(() => {
      result.current.handleScroll();
    });

    // scrollHeight - scrollTop - clientHeight = 1000-950-100 = -50 < 100
    expect(result.current.showScrollButton).toBe(false);
  });

  it('should update wasAtBottomRef when scrolling', () => {
    const { result } = renderHook(() => useChatScroll([]));

    const mockContainer = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    } as HTMLDivElement;
    
    Object.defineProperty(result.current.messagesContainerRef, 'current', {
      value: mockContainer,
      configurable: true,
    });

    act(() => {
      result.current.handleScroll();
    });

    // The wasAtBottomRef should be false because not at bottom
    // We can verify by checking that showScrollButton is true
    expect(result.current.showScrollButton).toBe(true);
  });

  it('should have working handleScroll function', () => {
    const { result } = renderHook(() => useChatScroll([]));
    
    expect(typeof result.current.handleScroll).toBe('function');
    
    // Should not throw when called
    expect(() => {
      act(() => {
        result.current.handleScroll();
      });
    }).not.toThrow();
  });

  it('should have working scrollToBottom function', () => {
    const { result } = renderHook(() => useChatScroll([]));
    
    expect(typeof result.current.scrollToBottom).toBe('function');
    
    // Should not throw when called
    expect(() => {
      act(() => {
        result.current.scrollToBottom();
      });
    }).not.toThrow();
  });
});