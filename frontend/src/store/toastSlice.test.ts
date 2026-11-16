import { describe, it, expect } from 'vitest';
import toastReducer, { showToast, hideToast, clearToast } from './toastSlice';

// ---------- Test data ----------

const makeState = (
  overrides: Partial<ReturnType<typeof toastReducer>> = {}
) => ({
  message: null,
  type: 'info' as const,
  isVisible: false,
  ...overrides,
});

// ---------- Tests ----------

describe('toastSlice', () => {
  // ---- Initial state ----

  describe('initial state', () => {
    it('starts hidden with no message', () => {
      const state = toastReducer(undefined, { type: '@@INIT' });

      expect(state.message).toBeNull();
      expect(state.type).toBe('info');
      expect(state.isVisible).toBe(false);
    });
  });

  // ---- showToast ----

  describe('showToast', () => {
    it('sets message, type and isVisible=true', () => {
      const state = makeState();

      const next = toastReducer(
        state,
        showToast({ message: 'Saved!', type: 'success' })
      );

      expect(next.message).toBe('Saved!');
      expect(next.type).toBe('success');
      expect(next.isVisible).toBe(true);
    });

    it('overwrites a previous toast', () => {
      const state = makeState({
        message: 'Old message',
        type: 'error',
        isVisible: true,
      });

      const next = toastReducer(
        state,
        showToast({ message: 'New message', type: 'info' })
      );

      expect(next.message).toBe('New message');
      expect(next.type).toBe('info');
      expect(next.isVisible).toBe(true);
    });

    it('accepts error type', () => {
      const state = makeState();

      const next = toastReducer(
        state,
        showToast({ message: 'Failed', type: 'error' })
      );

      expect(next.type).toBe('error');
    });
  });

  // ---- hideToast ----

  describe('hideToast', () => {
    it('sets isVisible=false but keeps message and type', () => {
      const state = makeState({
        message: 'Saved!',
        type: 'success',
        isVisible: true,
      });

      const next = toastReducer(state, hideToast());

      expect(next.isVisible).toBe(false);
      expect(next.message).toBe('Saved!');
      expect(next.type).toBe('success');
    });

    it('is a no-op if already hidden', () => {
      const state = makeState({
        message: 'Saved!',
        type: 'success',
        isVisible: false,
      });

      const next = toastReducer(state, hideToast());

      expect(next.isVisible).toBe(false);
      expect(next.message).toBe('Saved!');
    });
  });

  // ---- clearToast ----

  describe('clearToast', () => {
    it('resets all fields to initial values', () => {
      const state = makeState({
        message: 'Saved!',
        type: 'success',
        isVisible: true,
      });

      const next = toastReducer(state, clearToast());

      expect(next.message).toBeNull();
      expect(next.type).toBe('info');
      expect(next.isVisible).toBe(false);
    });

    it('works on empty state', () => {
      const state = makeState();

      const next = toastReducer(state, clearToast());

      expect(next).toEqual(makeState());
    });
  });
});