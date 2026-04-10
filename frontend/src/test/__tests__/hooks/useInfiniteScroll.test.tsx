import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect,afterEach, beforeEach, vi } from 'vitest';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

// Helper to clean up IntersectionObserver
function cleanupIntersectionObserver(): void {
  delete (window as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
}

describe('useInfiniteScroll', () => {
  let mockLoadMore: () => Promise<void>;
  let intersectionObserverCallback: (entries: IntersectionObserverEntry[]) => void;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLoadMore = vi.fn().mockResolvedValue(undefined);
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    
    // Mock IntersectionObserver
    class MockIntersectionObserverImpl {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        intersectionObserverCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    }
    
    window.IntersectionObserver = MockIntersectionObserverImpl as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanupIntersectionObserver();
  });

  it('should return lastElementRef and loading state', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loadMore: mockLoadMore,
        threshold: 100
      })
    );

    expect(result.current.loading).toBe(false);
    expect(typeof result.current.lastElementRef).toBe('function');
  });

  it('should observe element when lastElementRef is called with node', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loadMore: mockLoadMore,
        threshold: 100
      })
    );

    const mockNode = document.createElement('div');
    
    act(() => {
      result.current.lastElementRef(mockNode);
    });

    expect(mockObserve).toHaveBeenCalledWith(mockNode);
  });

  it('should call loadMore when element becomes visible', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loadMore: mockLoadMore,
        threshold: 100
      })
    );

    const mockNode = document.createElement('div');
    act(() => {
      result.current.lastElementRef(mockNode);
    });

    const mockEntry = {
      isIntersecting: true,
      target: mockNode,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: 1,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now()
    } as IntersectionObserverEntry;

    act(() => {
      intersectionObserverCallback([mockEntry]);
    });

    expect(result.current.loading).toBe(true);
    expect(mockLoadMore).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should not call loadMore if hasMore is false', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: false,
        loadMore: mockLoadMore,
        threshold: 100
      })
    );

    const mockNode = document.createElement('div');
    act(() => {
      result.current.lastElementRef(mockNode);
    });

    const mockEntry = {
      isIntersecting: true,
      target: mockNode,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: 1,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now()
    } as IntersectionObserverEntry;

    act(() => {
      intersectionObserverCallback([mockEntry]);
    });

    expect(mockLoadMore).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should not create observer if node is null', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loadMore: mockLoadMore,
        threshold: 100
      })
    );

    act(() => {
      result.current.lastElementRef(null);
    });

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('should use default threshold value', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loadMore: mockLoadMore
      })
    );

    const mockNode = document.createElement('div');
    act(() => {
      result.current.lastElementRef(mockNode);
    });

    expect(mockObserve).toHaveBeenCalledWith(mockNode);
  });
});