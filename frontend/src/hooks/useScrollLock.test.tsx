import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollLock } from './useScrollLock';

// ---------- Tests ----------

describe('useScrollLock', () => {
  const originalOverflow = document.body.style.overflow;

  beforeEach(() => {
    // Ensure a clean state before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  // ---- Initial state ----

  describe('initial state', () => {
    it('does not lock when isLocked=false', () => {
      renderHook(() => useScrollLock(false));

      expect(document.body.style.overflow).toBe('');
    });

    it('locks immediately when isLocked=true', () => {
      renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // ---- Toggle ----

  describe('toggling isLocked', () => {
    it('locks when isLocked changes from false to true', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      expect(document.body.style.overflow).toBe('');

      rerender({ locked: true });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks when isLocked changes from true to false', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });

      expect(document.body.style.overflow).toBe('');
    });

    it('handles multiple toggles', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      rerender({ locked: true });
      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });
      expect(document.body.style.overflow).toBe('');

      rerender({ locked: true });
      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });
      expect(document.body.style.overflow).toBe('');
    });
  });

  // ---- Unmount ----

  describe('cleanup on unmount', () => {
    it('unlocks on unmount when was locked', () => {
      const { unmount } = renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });

    it('keeps overflow empty on unmount when was not locked', () => {
      const { unmount } = renderHook(() => useScrollLock(false));

      expect(document.body.style.overflow).toBe('');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });
});