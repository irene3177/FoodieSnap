import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageModal from './MessageModal';
import { useAuth, useScrollLock, useChatMessages, useChatScroll } from '@/hooks';
import { messagesApi } from '@/services/messagesApi';
import * as socket from '@/services/socket';

// ---------- Hoisted mocks ----------

const { mockDispatch, mockResetUnread } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockResetUnread: vi.fn((id: string) => ({ type: 'unread/resetUnread', payload: id })),
}));

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useScrollLock: vi.fn(),
  useChatMessages: vi.fn(),
  useChatScroll: vi.fn(),
}));

vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();
  return {
    ...actual,
    useAppDispatch: () => mockDispatch,
    resetUnread: mockResetUnread,
  };
});

vi.mock('@/services/messagesApi');
vi.mock('@/services/socket');

vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
}));

vi.mock('@/components/ui/Skeleton/MessageModalSkeleton', () => ({
  MessageModalSkeleton: () => <div data-testid="message-modal-skeleton" />,
}));

vi.mock('@/components/Chat/MessageList', () => ({
  MessageList: ({ messages, className }: any) => (
    <div data-testid="message-list" data-count={messages.length} data-class={className} />
  ),
}));

vi.mock('@/components/Chat/MessageInput', () => ({
  MessageInput: ({ conversationId, userId, disabled }: any) => (
    <div
      data-testid="message-input"
      data-conversation={conversationId}
      data-user={userId}
      data-disabled={String(disabled)}
    />
  ),
}));

vi.mock('@/components/Chat/ScrollToBottomButton', () => ({
  ScrollToBottomButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="scroll-to-bottom" onClick={onClick}>
      Scroll
    </button>
  ),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { initial, animate, exit, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Test data ----------

const mockUser = {
  _id: 'me',
  username: 'alice',
  email: 'alice@test.com',
  avatar: '',
};

const mockRecipient = {
  _id: 'user-2',
  username: 'bob',
  avatar: 'bob.jpg',
};

const mockScrollToBottom = vi.fn();

const setupChatScroll = (showButton = false) => {
  (useChatScroll as any).mockReturnValue({
    showScrollButton: showButton,
    scrollToBottom: mockScrollToBottom,
    messagesContainerRef: { current: null },
    messagesEndRef: { current: null },
    handleScroll: vi.fn(),
  });
};

const setupChatMessages = (overrides: Partial<{
  messages: any[];
  loading: boolean;
  sendMessage: any;
}> = {}) => {
  (useChatMessages as any).mockReturnValue({
    messages: overrides.messages ?? [],
    loading: overrides.loading ?? false,
    sendMessage: overrides.sendMessage ?? vi.fn().mockResolvedValue(true),
  });
};

// ---------- Render helper ----------

const renderModal = (
  props: Partial<React.ComponentProps<typeof MessageModal>> = {}
) => {
  (useAuth as any).mockReturnValue({ user: mockUser });


  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    recipient: mockRecipient,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<MessageModal {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('MessageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (messagesApi.getConversation as any).mockResolvedValue({
      success: true,
      data: { _id: 'conv-1' },
    });
    (messagesApi.markAsRead as any).mockResolvedValue({ success: true });

    setupChatMessages();
    setupChatScroll();
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(screen.queryByTestId('message-list')).not.toBeInTheDocument();
    });

    it('renders when isOpen=true', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
      });
    });

    it('shows recipient username in header', () => {
      renderModal();

      expect(screen.getByText('bob')).toBeInTheDocument();
    });
  });

  // ---- Load conversation ----

  describe('load conversation', () => {
    it('calls getConversation with recipient id', async () => {
      renderModal();

      await waitFor(() => {
        expect(messagesApi.getConversation).toHaveBeenCalledWith('user-2');
      });
    });

    it('calls markAsRead with conversation id', async () => {
      renderModal();

      await waitFor(() => {
        expect(messagesApi.markAsRead).toHaveBeenCalledWith('conv-1');
      });
    });

    it('dispatches resetUnread with conversation id', async () => {
      renderModal();

      await waitFor(() => {
        expect(mockResetUnread).toHaveBeenCalledWith('conv-1');
      });
    });

    it('does not fetch when recipient is null', () => {
      renderModal({ recipient: null });

      expect(messagesApi.getConversation).not.toHaveBeenCalled();
    });

    it('does not fetch when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(messagesApi.getConversation).not.toHaveBeenCalled();
    });
  });

  // ---- Loading ----

  describe('loading', () => {
    it('shows skeleton while loading conversation', () => {
      (messagesApi.getConversation as any).mockImplementation(
        () => new Promise(() => {})
      );

      renderModal();

      expect(screen.getByTestId('message-modal-skeleton')).toBeInTheDocument();
    });

    it('shows skeleton while useChatMessages loading', async () => {
      setupChatMessages({ loading: true });

      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId('message-modal-skeleton')).toBeInTheDocument();
      });
    });

    it('hides skeleton after loading completes', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.queryByTestId('message-modal-skeleton')).not.toBeInTheDocument();
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
      });
    });
  });

  // ---- MessageList / MessageInput ----

  describe('after load', () => {
    it('renders MessageInput with conversationId', async () => {
      renderModal();

      await waitFor(() => {
        const input = screen.getByTestId('message-input');
        expect(input).toHaveAttribute('data-conversation', 'conv-1');
      });
    });

    it('passes current user id to MessageInput', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId('message-input')).toHaveAttribute(
          'data-user',
          'me'
        );
      });
    });

    it('passes messages to MessageList', async () => {
      const messages = [
        { _id: 'm1', text: 'Hi', conversationId: 'conv-1', senderId: { _id: 'user-2' }, createdAt: '', updatedAt: '', read: false },
      ];
      setupChatMessages({ messages });

      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toHaveAttribute(
          'data-count',
          '1'
        );
      });
    });
  });

  // ---- Socket join/leave ----

  describe('socket join/leave', () => {
    it('joins chat after conversation is loaded', async () => {
      renderModal();

      await waitFor(() => {
        expect(socket.joinChat).toHaveBeenCalledWith('conv-1');
      });
    });

    it('leaves chat on unmount', async () => {
      const { unmount } = renderModal();

      await waitFor(() => {
        expect(socket.joinChat).toHaveBeenCalledWith('conv-1');
      });

      unmount();

      expect(socket.leaveChat).toHaveBeenCalledWith('conv-1');
    });

    it('does not join when isOpen=false', async () => {
      renderModal({ isOpen: false });

      await new Promise((r) => setTimeout(r, 50));

      expect(socket.joinChat).not.toHaveBeenCalled();
    });
  });

  // ---- Scroll to bottom button ----

  describe('scroll to bottom button', () => {
    it('does not render button when showScrollButton=false', async () => {
      setupChatScroll(false);

      renderModal();

      await waitFor(() => {
        expect(screen.queryByTestId('scroll-to-bottom')).not.toBeInTheDocument();
      });
    });

    it('renders button when showScrollButton=true', async () => {
      setupChatScroll(true);

      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId('scroll-to-bottom')).toBeInTheDocument();
      });
    });

    it('calls scrollToBottom when button clicked', async () => {
      setupChatScroll(true);

      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId('scroll-to-bottom')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('scroll-to-bottom'));

      expect(mockScrollToBottom).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Close ----

  describe('close', () => {
    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on overlay click', async () => {
      const onClose = vi.fn();
      const { container } = renderModal({ onClose });

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
      });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the modal', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await waitFor(() => {
        expect(screen.getByText('bob')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('bob'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- Scroll lock ----

  describe('scroll lock', () => {
    it('calls useScrollLock(isOpen)', () => {
      renderModal({ isOpen: true });

      expect(useScrollLock).toHaveBeenCalledWith(true);
    });
  });
});