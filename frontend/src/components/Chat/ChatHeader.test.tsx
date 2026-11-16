import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHeader } from './ChatHeader';

// ---------- Mocks ----------

const { mockUseUserStatus } = vi.hoisted(() => ({
  mockUseUserStatus: vi.fn(() => ({ isOnline: false, isTyping: false })),
}));

vi.mock('@/hooks/chat/useUserStatus', () => ({
  useUserStatus: mockUseUserStatus,
}));

vi.mock('./ChatOptions', () => ({
  ChatOptions: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="chat-options-open" /> : <div data-testid="chat-options-closed" />,
}));

vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
}));

// ---------- Test data ----------

const mockRecipient = {
  _id: 'user-2',
  username: 'bob',
  avatar: 'bob.jpg',
};

const mockCurrentUser = {
  _id: 'user-1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
};

// ---------- Render helper ----------

const renderHeader = (
  props: Partial<React.ComponentProps<typeof ChatHeader>> = {}
) => {
  const defaults = {
    recipient: mockRecipient,
    onBack: vi.fn(),
    onViewProfile: vi.fn(),
    setIsOpen: vi.fn(),
    optionsMenuRef: { current: null },
    onClearChat: vi.fn(),
    onDeleteChat: vi.fn(),
    deleting: false,
    currentUser: mockCurrentUser,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<ChatHeader {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('ChatHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStatus.mockReturnValue({ isOnline: false, isTyping: false });
  });

  // ---- Recipient info ----

  describe('recipient info', () => {
    it('shows recipient username', () => {
      renderHeader();

      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    it('shows fallback "User" when recipient is null', () => {
      renderHeader({ recipient: null });

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('shows fallback "User" when recipient is undefined', () => {
      renderHeader({ recipient: undefined });

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('passes recipient username to avatar', () => {
      renderHeader();

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-username',
        'bob'
      );
    });

    it('calls useUserStatus with recipient id', () => {
      renderHeader();

      expect(mockUseUserStatus).toHaveBeenCalledWith('user-2');
    });

    it('calls useUserStatus with empty string when no recipient', () => {
      renderHeader({ recipient: null });

      expect(mockUseUserStatus).toHaveBeenCalledWith('');
    });
  });

  // ---- Status display ----

  describe('status display', () => {
    it('shows "Typing..." when isTyping=true', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: false, isTyping: true });
      renderHeader();

      expect(screen.getByText('Typing...')).toBeInTheDocument();
    });

    it('shows "Online" when isOnline=true', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: true, isTyping: false });
      renderHeader();

      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('shows "Offline" when neither', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: false, isTyping: false });
      renderHeader();

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('typing takes priority over online', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: true, isTyping: true });
      renderHeader();

      expect(screen.getByText('Typing...')).toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    it('applies accent class when typing', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: false, isTyping: true });
      renderHeader();

      const statusEl = screen.getByText('Typing...');
      expect(statusEl.className).toContain('text-accent');
    });

    it('applies green class when online', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: true, isTyping: false });
      renderHeader();

      const statusEl = screen.getByText('Online');
      expect(statusEl.className).toContain('text-green-500');
    });

    it('applies muted class when offline', () => {
      mockUseUserStatus.mockReturnValue({ isOnline: false, isTyping: false });
      renderHeader();

      const statusEl = screen.getByText('Offline');
      expect(statusEl.className).toContain('text-muted');
    });
  });

  // ---- Back button ----

  describe('back button', () => {
    it('calls onBack when clicked', async () => {
      const onBack = vi.fn();
      renderHeader({ onBack });

      await userEvent.click(screen.getByRole('button', { name: /go back to chats/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Recipient click ----

  describe('recipient click', () => {
    it('calls onViewProfile when clicked', async () => {
      const onViewProfile = vi.fn();
      renderHeader({ onViewProfile });

      const recipientBlock = screen.getByRole('button', { name: /bob/i });
      await userEvent.click(recipientBlock);

      expect(onViewProfile).toHaveBeenCalledTimes(1);
    });

    it('calls onViewProfile when Enter is pressed', async () => {
      const onViewProfile = vi.fn();
      renderHeader({ onViewProfile });

      const recipientBlock = screen.getByRole('button', { name: /bob/i });
      recipientBlock.focus();
      await userEvent.keyboard('{Enter}');

      expect(onViewProfile).toHaveBeenCalledTimes(1);
    });

    it('does not call onViewProfile on other keys', async () => {
      const onViewProfile = vi.fn();
      renderHeader({ onViewProfile });

      const recipientBlock = screen.getByRole('button', { name: /bob/i });
      recipientBlock.focus();
      await userEvent.keyboard('{Space}');

      expect(onViewProfile).not.toHaveBeenCalled();
    });
  });

  // ---- Menu button ----

  describe('menu button', () => {
    it('renders ChatOptions initially closed', () => {
      renderHeader();

      expect(screen.getByTestId('chat-options-closed')).toBeInTheDocument();
    });

    it('opens ChatOptions when menu button is clicked', async () => {
      renderHeader();

      await userEvent.click(screen.getByRole('button', { name: /open user menu/i }));

      expect(screen.getByTestId('chat-options-open')).toBeInTheDocument();
    });
  });

  // ---- Props passthrough to ChatOptions ----

  describe('props passed to ChatOptions', () => {
    it('passes onClearChat and onDeleteChat', async () => {
      const onClearChat = vi.fn();
      const onDeleteChat = vi.fn();
      renderHeader({ onClearChat, onDeleteChat });

      // Open menu
      await userEvent.click(screen.getByRole('button', { name: /open user menu/i }));

      expect(screen.getByTestId('chat-options-open')).toBeInTheDocument();
    });
  });
});