import { renderHook, act } from '@testing-library/react';
import { describe,afterEach, it, expect, beforeEach, vi } from 'vitest';
import { useDebounce } from '../../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not have changed yet
    expect(result.current).toBe('initial');
    
    // Fast forward time but not enough
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe('initial');
  });

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });

  it('should reset timer if value changes during delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // First change
    rerender({ value: 'first', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Second change before first delay finishes
    rerender({ value: 'second', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Should still be initial
    expect(result.current).toBe('initial');
    
    // Complete the delay after second change
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    expect(result.current).toBe('second');
  });

  it('should handle multiple value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );
    
    rerender({ value: 'second', delay: 500 });
    rerender({ value: 'third', delay: 500 });
    rerender({ value: 'fourth', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('fourth');
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 500 });
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should update value when delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 1000 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Should still be initial because delay is now 1000ms
    expect(result.current).toBe('initial');
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );
    
    rerender({ value: 'updated', delay: 0 });
    
    act(() => {
      vi.advanceTimersByTime(0);
    });
    
    expect(result.current).toBe('updated');
  });
});