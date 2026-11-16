import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useChatOptions } from './useChatOptions';
import { messagesApi } from '@/services/messagesApi';
import toastReducer from '@/store/toastSlice';

// ---------- Mocks ----------

vi.mock('@/services/messagesApi');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------- Test store ----------

const createTestStore = () =>
  configureStore({
    reducer: {
      toast: toastReducer,
    },
  });

const renderUseChatOptions = (
  conversationId: string | undefined,
  onClearMessages = vi.fn()
) => {
  const store = createTestStore();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  const hookResult = renderHook(
    () => useChatOptions(conversationId, onClearMessages),
    { wrapper }
  );

  return { ...hookResult, store, onClearMessages };
};

// ---------- Tests ----------

describe('useChatOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (messagesApi.deleteConversation as any).mockResolvedValue({
      success: true,
    });
    (messagesApi.clearChat as any).mockResolvedValue({
      success: true,
    });
  });

  // ---- Menu state ----

  describe('menu state', () => {
    it('starts with isOpen=false', () => {
      const { result } = renderUseChatOptions('conv-1');

      expect(result.current.isOpen).toBe(false);
    });

    it('opens the menu via setIsOpen', () => {
      const { result } = renderUseChatOptions('conv-1');

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('closes the menu via onClose', () => {
      const { result } = renderUseChatOptions('conv-1');

      act(() => {
        result.current.setIsOpen(true);
      });
      act(() => {
        result.current.onClose();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('exposes optionsMenuRef', () => {
      const { result } = renderUseChatOptions('conv-1');

      expect(result.current.optionsMenuRef).toBeDefined();
      expect(result.current.optionsMenuRef.current).toBeNull();
    });
  });

  // ---- Delete conversation ----

  describe('handleDeleteConversation', () => {
    it('does nothing when conversationId is undefined', async () => {
      const { result } = renderUseChatOptions(undefined);

      await act(async () => {
        await result.current.handleDeleteConversation();
      });

      expect(messagesApi.deleteConversation).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('deletes conversation, shows toast and navigates to /chats', async () => {
      const { result, store } = renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleDeleteConversation();
      });

      expect(messagesApi.deleteConversation).toHaveBeenCalledWith('conv-1');
      expect(mockNavigate).toHaveBeenCalledWith('/chats');

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Conversation deleted successfully');
      expect(state.toast.type).toBe('success');
    });

    it('closes menu before deleting', async () => {
      const { result } = renderUseChatOptions('conv-1');

      act(() => {
        result.current.setIsOpen(true);
      });

      await act(async () => {
        await result.current.handleDeleteConversation();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('shows error toast when API returns success=false', async () => {
      (messagesApi.deleteConversation as any).mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      const { result, store } = renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleDeleteConversation();
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Not found');
      expect(state.toast.type).toBe('error');
    });

    it('shows fallback error toast when API rejects', async () => {
      (messagesApi.deleteConversation as any).mockRejectedValue(
        new Error('Network error')
      );

      const { result, store } = renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleDeleteConversation();
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Failed to delete conversation');
      expect(state.toast.type).toBe('error');
    });

    it('resets deleting to false after completion', async () => {
      const { result } = renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleDeleteConversation();
      });

      expect(result.current.deleting).toBe(false);
    });
  });

  // ---- Clear chat ----

  describe('handleClearChat', () => {
    it('does nothing when conversationId is undefined', async () => {
      const { result, onClearMessages } = renderUseChatOptions(undefined);

      await act(async () => {
        await result.current.handleClearChat();
      });

      expect(messagesApi.clearChat).not.toHaveBeenCalled();
      expect(onClearMessages).not.toHaveBeenCalled();
    });

    it('clears chat, calls onClearMessages and shows success toast', async () => {
      const { result, store, onClearMessages } =
        renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleClearChat();
      });

      expect(messagesApi.clearChat).toHaveBeenCalledWith('conv-1');
      expect(onClearMessages).toHaveBeenCalled();

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Chat history cleared');
      expect(state.toast.type).toBe('success');
    });

    it('closes menu before clearing', async () => {
      const { result } = renderUseChatOptions('conv-1');

      act(() => {
        result.current.setIsOpen(true);
      });

      await act(async () => {
        await result.current.handleClearChat();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('does not call onClearMessages when API returns success=false', async () => {
      (messagesApi.clearChat as any).mockResolvedValue({
        success: false,
        error: 'Forbidden',
      });

      const { result, store, onClearMessages } =
        renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleClearChat();
      });

      expect(onClearMessages).not.toHaveBeenCalled();

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Forbidden');
      expect(state.toast.type).toBe('error');
    });

    it('shows fallback error toast when API rejects', async () => {
      (messagesApi.clearChat as any).mockRejectedValue(
        new Error('Network error')
      );

      const { result, store, onClearMessages } =
        renderUseChatOptions('conv-1');

      await act(async () => {
        await result.current.handleClearChat();
      });

      expect(onClearMessages).not.toHaveBeenCalled();

      const state = store.getState() as any;
      expect(state.toast.message).toBe('Failed to clear chat');
      expect(state.toast.type).toBe('error');
    });
  });
});