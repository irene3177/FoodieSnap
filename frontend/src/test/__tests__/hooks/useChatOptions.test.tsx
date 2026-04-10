import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { useChatOptions } from '../../../hooks/chat/useChatOptions';
import { messagesApi } from '../../../services/messagesApi';
import toastReducer from '../../../store/toastSlice';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock messagesApi
vi.mock('../../../services/messagesApi', () => ({
  messagesApi: {
    deleteConversation: vi.fn(),
    clearChat: vi.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

describe('useChatOptions', () => {
  let store: ReturnType<typeof configureStore>;
  const mockConversationId = 'conv123';
  const onClearMessages = vi.fn();

  beforeEach(() => {
    store = configureStore({
      reducer: { toast: toastReducer },
    });
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );

  it('should return initial state', () => {
    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    expect(result.current.showOptions).toBe(false);
    expect(result.current.deleting).toBe(false);
    expect(result.current.optionsMenuRef.current).toBe(null);
    expect(typeof result.current.handleDeleteConversation).toBe('function');
    expect(typeof result.current.handleClearChat).toBe('function');
    expect(typeof result.current.setShowOptions).toBe('function');
  });

  it('should toggle showOptions', () => {
    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    act(() => {
      result.current.setShowOptions(true);
    });

    expect(result.current.showOptions).toBe(true);

    act(() => {
      result.current.setShowOptions(false);
    });

    expect(result.current.showOptions).toBe(false);
  });

  it('should handle delete conversation successfully', async () => {
    vi.mocked(messagesApi.deleteConversation).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDeleteConversation();
    });

    expect(messagesApi.deleteConversation).toHaveBeenCalledWith(mockConversationId);
    expect(mockNavigate).toHaveBeenCalledWith('/chats');
    expect(result.current.deleting).toBe(false);
  });

  it('should not delete conversation if no conversationId', async () => {
    const { result } = renderHook(
      () => useChatOptions(undefined, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDeleteConversation();
    });

    expect(messagesApi.deleteConversation).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not delete conversation if user cancels confirm', async () => {
    mockConfirm.mockReturnValueOnce(false);
    
    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDeleteConversation();
    });

    expect(messagesApi.deleteConversation).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle delete conversation API error', async () => {
    vi.mocked(messagesApi.deleteConversation).mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDeleteConversation();
    });

    expect(messagesApi.deleteConversation).toHaveBeenCalledWith(mockConversationId);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.deleting).toBe(false);
  });

  it('should handle delete conversation exception', async () => {
    vi.mocked(messagesApi.deleteConversation).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDeleteConversation();
    });

    expect(messagesApi.deleteConversation).toHaveBeenCalledWith(mockConversationId);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.deleting).toBe(false);
  });

  it('should handle clear chat successfully', async () => {
    vi.mocked(messagesApi.clearChat).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleClearChat();
    });

    expect(messagesApi.clearChat).toHaveBeenCalledWith(mockConversationId);
    expect(onClearMessages).toHaveBeenCalled();
  });

  it('should not clear chat if no conversationId', async () => {
    const { result } = renderHook(
      () => useChatOptions(undefined, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleClearChat();
    });

    expect(messagesApi.clearChat).not.toHaveBeenCalled();
    expect(onClearMessages).not.toHaveBeenCalled();
  });

  it('should not clear chat if user cancels confirm', async () => {
    mockConfirm.mockReturnValueOnce(false);
    
    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleClearChat();
    });

    expect(messagesApi.clearChat).not.toHaveBeenCalled();
    expect(onClearMessages).not.toHaveBeenCalled();
  });

  it('should handle clear chat API error', async () => {
    vi.mocked(messagesApi.clearChat).mockResolvedValue({
      success: false,
      error: 'Clear failed',
    });

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleClearChat();
    });

    expect(messagesApi.clearChat).toHaveBeenCalledWith(mockConversationId);
    expect(onClearMessages).not.toHaveBeenCalled();
  });

  it('should handle clear chat exception', async () => {
    vi.mocked(messagesApi.clearChat).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleClearChat();
    });

    expect(messagesApi.clearChat).toHaveBeenCalledWith(mockConversationId);
    expect(onClearMessages).not.toHaveBeenCalled();
  });

  it('should close options menu when showOptions is set to false', () => {
    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    act(() => {
      result.current.setShowOptions(true);
    });

    expect(result.current.showOptions).toBe(true);

    act(() => {
      result.current.setShowOptions(false);
    });

    expect(result.current.showOptions).toBe(false);
  });

  it('should set deleting state during delete operation', async () => {
    vi.mocked(messagesApi.deleteConversation).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    const { result } = renderHook(
      () => useChatOptions(mockConversationId, onClearMessages),
      { wrapper }
    );

    act(() => {
      result.current.handleDeleteConversation();
    });

    expect(result.current.deleting).toBe(true);

    await waitFor(() => {
      expect(result.current.deleting).toBe(false);
    });
  });
});