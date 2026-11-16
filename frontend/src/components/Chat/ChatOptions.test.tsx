import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ChatOptions } from './ChatOptions';
import unreadReducer from '@/store/unreadSlice';
import { useScrollLock } from '@/hooks';

// ---------- Mocks ----------

vi.mock('@/hooks', () => ({
  useScrollLock: vi.fn(),
}));

vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
  ThemeToggle: () => <div data-testid="theme-toggle" />,
  ConfirmModal: ({
    isOpen,
    onClose,
    onConfirm,
    title,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid={`confirm-${title}`}>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

vi.mock('@/constants', () => ({
  NavLinks: [
    { path: '/recipes', label: 'Recipes', icon: () => <span>icon</span> },
    { path: '/search', label: 'Search', icon: () => <span>icon</span> },
  ],
  PersonalLinks: [
    { path: '/me', label: 'Profile', icon: () => <span>icon</span> },
    { path: '/chats', label: 'Chats', icon: () => <span>icon</span> },
  ],
}));

// ---------- Test data ----------

const mockCurrentUser = {
  _id: 'u1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
};

const renderOptions = (
  props: Partial<React.ComponentProps<typeof ChatOptions>> = {},
  unreadTotal = 0
) => {
  const store = configureStore({
    reducer: {
      unread: unreadReducer,
    } as any,
    preloadedState: {
      unread: {
        counts: unreadTotal > 0 ? { 'conv-1': unreadTotal } : {},
        lastMessages: {},
        total: unreadTotal,
        loading: false,
      },
    } as any,
  });

  const defaults = {
    isOpen: true,
    setIsOpen: vi.fn(),
    onClose: vi.fn(),
    optionsMenuRef: { current: null },
    onViewProfile: vi.fn(),
    onClearChat: vi.fn(),
    onDeleteChat: vi.fn(),
    deleting: false,
    currentUser: mockCurrentUser,
  };
  const merged = { ...defaults, ...props };

  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatOptions {...merged} />
      </MemoryRouter>
    </Provider>
  );

  return { ...utils, ...merged, store };
};

// ---------- Tests ----------

describe('ChatOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- User info ----

  describe('user info', () => {
    it('shows current user username and email', () => {
      renderOptions();

      expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });

    it('passes username to avatar', () => {
      renderOptions();

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-username',
        'alice'
      );
    });
  });

  // ---- Navigation links ----

  describe('navigation links', () => {
    it('renders NavLinks', () => {
      renderOptions();

      expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    });

    it('renders PersonalLinks', () => {
      renderOptions();

      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /chats/i })).toBeInTheDocument();
    });

    it('calls onClose when a NavLink is clicked', async () => {
      const onClose = vi.fn();
      renderOptions({ onClose });

      await userEvent.click(screen.getByRole('link', { name: /recipes/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Unread badge ----

  describe('unread badge', () => {
    it('shows badge when totalUnread > 0', () => {
      renderOptions({}, 5);

      const chatsLink = screen.getByRole('link', { name: /chats/i });
      expect(chatsLink).toHaveTextContent('5');
    });

    it('shows "99+" when totalUnread > 99', () => {
      renderOptions({}, 150);

      const chatsLink = screen.getByRole('link', { name: /chats/i });
      expect(chatsLink).toHaveTextContent('99+');
    });
  });

  // ---- Overlay ----

  describe('overlay', () => {
    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      const { container } = renderOptions({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();

      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- X button ----

  describe('close button', () => {
    it('calls onClose when X button is clicked', async () => {
      const onClose = vi.fn();
      renderOptions({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /close menu/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Clear chat ----

  describe('clear chat', () => {
    it('opens confirm modal and closes menu when Clear Chat History is clicked', async () => {
      const onClose = vi.fn();
      renderOptions({ onClose });

      expect(screen.queryByTestId('confirm-Clear Chat History')).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /clear chat history/i })
      );

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('confirm-Clear Chat History')).toBeInTheDocument();
    });

    it('calls onClearChat when Confirm is clicked', async () => {
      const onClearChat = vi.fn();
      const onClose = vi.fn();
      renderOptions({ onClearChat, onClose });

      // Open confirm
      await userEvent.click(
        screen.getByRole('button', { name: /clear chat history/i })
      );

      // Click confirm inside modal
      const confirmModal = screen.getByTestId('confirm-Clear Chat History');
      const confirmButton = within(confirmModal).getByRole('button', { name: /^confirm$/i });
      await userEvent.click(confirmButton);

      expect(onClearChat).toHaveBeenCalledTimes(1);
    });

    it('does not call onClearChat when Cancel is clicked', async () => {
      const onClearChat = vi.fn();
      renderOptions({ onClearChat });

      await userEvent.click(
        screen.getByRole('button', { name: /clear chat history/i })
      );

      const confirmModal = screen.getByTestId('confirm-Clear Chat History');
      const cancelButton = within(confirmModal).getByRole('button', { name: /^cancel$/i });
      await userEvent.click(cancelButton);

      expect(onClearChat).not.toHaveBeenCalled();
    });
  });

  // ---- Delete chat ----

  describe('delete chat', () => {
    it('opens confirm modal and closes menu when Delete Conversation is clicked', async () => {
      const onClose = vi.fn();
      renderOptions({ onClose });

      expect(screen.queryByTestId('confirm-Delete Conversation')).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /delete conversation/i })
      );

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('confirm-Delete Conversation')).toBeInTheDocument();
    });

    it('calls onDeleteChat when Confirm is clicked', async () => {
      const onDeleteChat = vi.fn();
      renderOptions({ onDeleteChat });

      await userEvent.click(
        screen.getByRole('button', { name: /delete conversation/i })
      );

      const confirmModal = screen.getByTestId('confirm-Delete Conversation');
      const confirmButton = within(confirmModal).getByRole('button', { name: /^confirm$/i });
      await userEvent.click(confirmButton);

      expect(onDeleteChat).toHaveBeenCalledTimes(1);
    });

    it('does not call onDeleteChat when Cancel is clicked', async () => {
      const onDeleteChat = vi.fn();
      renderOptions({ onDeleteChat });

      await userEvent.click(
        screen.getByRole('button', { name: /delete conversation/i })
      );

      const confirmModal = screen.getByTestId('confirm-Delete Conversation');
      const cancelButton = confirmModal.querySelector(
        'button:first-child'
      ) as HTMLButtonElement;
      await userEvent.click(cancelButton);

      expect(onDeleteChat).not.toHaveBeenCalled();
    });
  });

  // ---- Scroll lock ----

  describe('scroll lock', () => {
    it('calls useScrollLock(true)', () => {
      renderOptions();

      expect(useScrollLock).toHaveBeenCalledWith(true);
    });
  });
});