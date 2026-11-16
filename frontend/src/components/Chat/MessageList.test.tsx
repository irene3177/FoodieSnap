import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from './MessageList';
import { Message } from '@/types';

// ---------- Mocks ----------

vi.mock('./MessageBubble', () => ({
  MessageBubble: ({
    message,
    isOwnMessage,
  }: {
    message: Message;
    isOwnMessage: boolean;
  }) => (
    <div
      data-testid="message-bubble"
      data-id={message._id}
      data-own={String(isOwnMessage)}
    >
      {message.text}
    </div>
  ),
}));

// ---------- Test data ----------

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const lastWeek = new Date();
lastWeek.setDate(today.getDate() - 7);

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  _id: 'msg-1',
  conversationId: 'conv-1',
  senderId: { _id: 'user-1', username: 'alice', avatar: '' },
  text: 'Hello',
  createdAt: today.toISOString(),
  updatedAt: today.toISOString(),
  read: false,
  ...overrides,
});

// ---------- Render helper ----------

const renderList = (
  props: Partial<React.ComponentProps<typeof MessageList>> = {}
) => {
  const messagesContainerRef = { current: null };
  const messagesEndRef = { current: null };

  const defaults = {
    messages: [],
    messagesContainerRef,
    messagesEndRef,
    onScroll: vi.fn(),
    currentUserId: 'user-1',
    className: '',
  };
  const merged = { ...defaults, ...props };

  const utils = render(<MessageList {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering messages ----

  describe('rendering messages', () => {
    it('renders all messages', () => {
      const messages = [
        makeMessage({ _id: 'm1', text: 'First' }),
        makeMessage({ _id: 'm2', text: 'Second' }),
        makeMessage({ _id: 'm3', text: 'Third' }),
      ];
      renderList({ messages });

      expect(screen.getAllByTestId('message-bubble')).toHaveLength(3);
    });

    it('passes correct text to each bubble', () => {
      const messages = [
        makeMessage({ _id: 'm1', text: 'First' }),
        makeMessage({ _id: 'm2', text: 'Second' }),
      ];
      renderList({ messages });

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  // ---- isOwnMessage ----

  describe('isOwnMessage', () => {
    it('sets isOwnMessage=true for messages from currentUser', () => {
      const messages = [
        makeMessage({
          _id: 'm1',
          senderId: { _id: 'user-1', username: 'alice', avatar: '' },
        }),
      ];
      renderList({ messages, currentUserId: 'user-1' });

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveAttribute('data-own', 'true');
    });

    it('sets isOwnMessage=false for messages from others', () => {
      const messages = [
        makeMessage({
          _id: 'm1',
          senderId: { _id: 'user-2', username: 'bob', avatar: '' },
        }),
      ];
      renderList({ messages, currentUserId: 'user-1' });

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveAttribute('data-own', 'false');
    });

    it('handles missing currentUserId (all messages are incoming)', () => {
      const messages = [
        makeMessage({
          _id: 'm1',
          senderId: { _id: 'user-1', username: 'alice', avatar: '' },
        }),
      ];
      renderList({ messages, currentUserId: undefined });

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveAttribute('data-own', 'false');
    });
  });

  // ---- Date grouping ----

  describe('date grouping', () => {
    it('groups messages by date and shows one divider per date', () => {
      const messages = [
        makeMessage({ _id: 'm1', createdAt: today.toISOString() }),
        makeMessage({ _id: 'm2', createdAt: today.toISOString() }),
        makeMessage({ _id: 'm3', createdAt: yesterday.toISOString() }),
      ];
      renderList({ messages });

      // Should have 2 dividers: Today and Yesterday
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('shows "Today" for messages created today', () => {
      const messages = [makeMessage({ createdAt: today.toISOString() })];
      renderList({ messages });

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('shows "Yesterday" for messages created yesterday', () => {
      const messages = [makeMessage({ createdAt: yesterday.toISOString() })];
      renderList({ messages });

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('shows full date for older messages', () => {
      const messages = [makeMessage({ createdAt: lastWeek.toISOString() })];
      renderList({ messages });

      // Should NOT be Today or Yesterday
      expect(screen.queryByText('Today')).not.toBeInTheDocument();
      expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();

      // Should be the long form: "Monday, January 1" etc.
      // The exact string depends on the locale, but should contain month
      const expectedDate = lastWeek.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it('renders no dividers when there are no messages', () => {
      renderList({ messages: [] });

      expect(screen.queryByText('Today')).not.toBeInTheDocument();
      expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();
      expect(screen.queryAllByTestId('message-bubble')).toHaveLength(0);
    });

    it('groups messages from the same day together', () => {
      const messages = [
        makeMessage({ _id: 'm1', createdAt: today.toISOString() }),
        makeMessage({ _id: 'm2', createdAt: today.toISOString() }),
        makeMessage({ _id: 'm3', createdAt: today.toISOString() }),
      ];
      renderList({ messages });

      // Only one divider for "Today"
      expect(screen.getAllByText('Today')).toHaveLength(1);
      // All 3 bubbles rendered
      expect(screen.getAllByTestId('message-bubble')).toHaveLength(3);
    });
  });

  // ---- Scroll ----

  describe('scroll', () => {
    it('calls onScroll when container is scrolled', () => {
      const onScroll = vi.fn();
      const { container } = renderList({ onScroll });

      const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
      expect(scrollContainer).not.toBeNull();

      fireEvent.scroll(scrollContainer);

      expect(onScroll).toHaveBeenCalledTimes(1);
    });
  });

  // ---- className ----

  describe('className', () => {
    it('applies custom className to container', () => {
      const { container } = renderList({ className: 'my-custom-class' });

      const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
      expect(scrollContainer.className).toContain('my-custom-class');
    });
  });

  // ---- Refs ----

  describe('refs', () => {
    it('attaches messagesEndRef to the last element', () => {
      const messagesEndRef = { current: null as HTMLDivElement | null };
      renderList({ messagesEndRef });

      expect(messagesEndRef.current).not.toBeNull();
    });

    it('attaches messagesContainerRef to the scroll container', () => {
      const messagesContainerRef = { current: null as HTMLDivElement | null };
      renderList({ messagesContainerRef });

      expect(messagesContainerRef.current).not.toBeNull();
      expect(messagesContainerRef.current?.className).toContain('overflow-y-auto');
    });
  });
});