import { describe, it, beforeEach, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import toastReducer, {
  showToast,
  hideToast,
  clearToast
} from '../../../store/toastSlice';

interface RootState {
  toast: ReturnType<typeof toastReducer>;
}

describe('toastSlice', () => {
  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    store = configureStore({
      reducer: { toast: toastReducer },
    });
  });

  it('should return initial state', () => {
    const state = store.getState().toast;
    expect(state.message).toBeNull();
    expect(state.type).toBe('info');
    expect(state.isVisible).toBe(false);
  });

  it('should show toast with success type', () => {
    store.dispatch(showToast({ message: 'Operation successful', type: 'success' }));
    
    const state = store.getState().toast;
    expect(state.message).toBe('Operation successful');
    expect(state.type).toBe('success');
    expect(state.isVisible).toBe(true);
  });

  it('should show toast with error type', () => {
    store.dispatch(showToast({ message: 'Something went wrong', type: 'error' }));
    
    const state = store.getState().toast;
    expect(state.message).toBe('Something went wrong');
    expect(state.type).toBe('error');
    expect(state.isVisible).toBe(true);
  });

  it('should show toast with info type', () => {
    store.dispatch(showToast({ message: 'New update available', type: 'info' }));
    
    const state = store.getState().toast;
    expect(state.message).toBe('New update available');
    expect(state.type).toBe('info');
    expect(state.isVisible).toBe(true);
  });

  it('should hide toast', () => {
    // First show toast
    store.dispatch(showToast({ message: 'Test message', type: 'success' }));
    expect(store.getState().toast.isVisible).toBe(true);
    
    // Then hide
    store.dispatch(hideToast());
    expect(store.getState().toast.isVisible).toBe(false);
    // Message and type should remain
    expect(store.getState().toast.message).toBe('Test message');
    expect(store.getState().toast.type).toBe('success');
  });

  it('should clear toast completely', () => {
    // First show toast
    store.dispatch(showToast({ message: 'Test message', type: 'error' }));
    expect(store.getState().toast.isVisible).toBe(true);
    expect(store.getState().toast.message).toBe('Test message');
    
    // Then clear
    store.dispatch(clearToast());
    const state = store.getState().toast;
    expect(state.message).toBeNull();
    expect(state.type).toBe('info');
    expect(state.isVisible).toBe(false);
  });
});