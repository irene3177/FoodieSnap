import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';

// ---------- Mocks ----------

vi.mock('@/components/ui', () => ({
  Avatar: ({ username, to }: { username?: string; to?: string }) => (
    <a data-testid="avatar" data-username={username} href={to} />
  ),
}));

// ---------- Test data ----------

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  _id: 'msg-1',
  conversationId: 'conv-1',
  senderId: {
    _id: 'user-1',
    username: 'alice',
    avatar: 'alice.jpg',
  },
  text: 'Hello world',
  createdAt: '2024-01-01T14:30:00.000Z',
  updatedAt: '2024-01-01T14:30:00.000Z',
  read: false,
  ...overrides,
});

// ---------- Render helper ----------

const renderBubble = (
  message: Message,
  isOwnMessage: boolean
) => {
  return render(
    <MemoryRouter>
      <MessageBubble message={message} isOwnMessage={isOwnMessage} />
    </MemoryRouter>
  );
};

// ---------- Tests ----------

describe('MessageBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Text ----

  describe('text', () => {
    it('renders the message text', () => {
      renderBubble(makeMessage({ text: 'Hello there!' }), false);

      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });

    it('renders empty string when text is missing', () => {
      const msg = makeMessage({ text: '' });
      renderBubble(msg, false);

      // Should not throw; paragraph should exist but be empty
      const { container } = renderBubble(makeMessage({ text: '' }), false);
const paragraph = container.querySelector('.bg-secondary p') as HTMLParagraphElement;
      expect(paragraph?.textContent).toBe('');
    });
  });

  // ---- Time ----

  describe('time formatting', () => {
    it('renders time in local HH:MM format', () => {
      const date = new Date();
      date.setHours(14, 30, 0, 0);

      renderBubble(makeMessage({ createdAt: date.toISOString() }), false);

      const expected = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('handles early morning time', () => {
      const date = new Date();
      date.setHours(9, 5, 0, 0);

      renderBubble(makeMessage({ createdAt: date.toISOString() }), false);

      const expected = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  // ---- Avatar (incoming) ----

  describe('avatar on incoming message', () => {
    it('renders avatar for incoming messages', () => {
      renderBubble(makeMessage(), false);

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('passes sender username to avatar', () => {
      renderBubble(
        makeMessage({
          senderId: { _id: 'user-2', username: 'bob', avatar: 'bob.jpg' },
        }),
        false
      );

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-username',
        'bob'
      );
    });

    it('links avatar to sender profile', () => {
      renderBubble(
        makeMessage({
          senderId: { _id: 'user-2', username: 'bob', avatar: 'bob.jpg' },
        }),
        false
      );

      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'href',
        '/user/user-2'
      );
    });
  });

  // ---- Avatar (outgoing) ----

  describe('avatar on outgoing message', () => {
    it('does NOT render avatar for own messages', () => {
      renderBubble(makeMessage(), true);

      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
    });
  });

  // ---- Layout classes ----

  describe('layout', () => {
    it('applies flex-row-reverse and self-end for own message', () => {
      const { container } = renderBubble(makeMessage(), true);
      const root = container.firstChild as HTMLElement;

      expect(root.className).toContain('flex-row-reverse');
      expect(root.className).toContain('self-end');
      expect(root.className).toContain('ml-auto');
    });

    it('applies self-start for incoming message', () => {
      const { container } = renderBubble(makeMessage(), false);
      const root = container.firstChild as HTMLElement;

      expect(root.className).toContain('self-start');
      expect(root.className).not.toContain('flex-row-reverse');
      expect(root.className).not.toContain('ml-auto');
    });
  });

  // ---- Bubble styles ----

  describe('bubble styles', () => {
    it('uses accent background for own message', () => {
      const { container } = renderBubble(makeMessage(), true);
      // Bubble is the second child of root (after avatar slot, but no avatar here)
      const bubble = container.querySelector('.bg-accent-secondary-bg');
      expect(bubble).not.toBeNull();
    });

    it('uses secondary background for incoming message', () => {
      const { container } = renderBubble(makeMessage(), false);
      // There could be multiple .bg-secondary; find the one with rounded-bl
      const bubbles = container.querySelectorAll('.bg-secondary');
      const hasBubble = Array.from(bubbles).some((el) =>
        el.className.includes('rounded-bl-[4px]')
      );
      expect(hasBubble).toBe(true);
    });

    it('applies rounded-br-[4px] for own message', () => {
      const { container } = renderBubble(makeMessage(), true);
      const bubble = container.querySelector('.rounded-br-\\[4px\\]');
      expect(bubble).not.toBeNull();
    });

    it('applies rounded-bl-[4px] for incoming message', () => {
      const { container } = renderBubble(makeMessage(), false);
      const bubble = container.querySelector('.rounded-bl-\\[4px\\]');
      expect(bubble).not.toBeNull();
    });
  });
});