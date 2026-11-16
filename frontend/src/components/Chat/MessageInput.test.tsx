import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';
import * as socket from '@/services/socket';

// ---------- Mocks ----------

vi.mock('@/services/socket');

vi.mock('react-textarea-autosize', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { minRows, maxRows, ...rest } = props;
      return <textarea ref={ref} {...rest} />;
    }),
  };
});

// ---------- Render helper ----------

const renderInput = (
  props: Partial<React.ComponentProps<typeof MessageInput>> = {}
) => {
  const defaults = {
    conversationId: 'conv-1',
    userId: 'user-1',
    onSendMessage: vi.fn().mockResolvedValue(true),
    disabled: false,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<MessageInput {...merged} />);
  return { ...utils, ...merged };
};

const getTextarea = () =>
  screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;

const getSubmitButton = () =>
  screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement;

// ---------- Tests ----------

describe('MessageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders textarea with placeholder', () => {
      renderInput();

      expect(getTextarea()).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderInput();

      expect(getSubmitButton()).toBeInTheDocument();
    });

    it('submit button is disabled when textarea is empty', () => {
      renderInput();

      expect(getSubmitButton()).toBeDisabled();
    });
  });

  // ---- Input ----

  describe('input handling', () => {
    it('updates textarea value on input', async () => {
      renderInput();

      await userEvent.type(getTextarea(), 'Hello');

      expect(getTextarea().value).toBe('Hello');
    });

    it('enables submit button when text is present', async () => {
      renderInput();

      await userEvent.type(getTextarea(), 'Hello');

      expect(getSubmitButton()).not.toBeDisabled();
    });

    it('truncates input longer than MAX_MESSAGE_LENGTH', async () => {
      renderInput();

      const longText = 'a'.repeat(1500);
      // Paste directly to bypass userEvent typing perf issues
      fireEvent.change(getTextarea(), { target: { value: longText } });

      expect(getTextarea().value.length).toBe(1000);
    });

    it('keeps whitespace-only text in the field but submit stays disabled', async () => {
      renderInput();

      await userEvent.type(getTextarea(), '   ');

      expect(getTextarea().value).toBe('   ');
      expect(getSubmitButton()).toBeDisabled();
    });
  });

  // ---- Disabled ----

  describe('disabled state', () => {
    it('disables textarea when disabled=true', () => {
      renderInput({ disabled: true });

      expect(getTextarea()).toBeDisabled();
    });

    it('disables submit when disabled=true', () => {
      renderInput({ disabled: true });

      expect(getSubmitButton()).toBeDisabled();
    });
  });

  // ---- Keyboard: Enter / Shift+Enter ----

  describe('keyboard handling', () => {
    it('sends message on Enter', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), 'Hello{Enter}');

      expect(onSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('does NOT send message on Shift+Enter', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), 'Hello{Shift>}{Enter}{/Shift}');

      expect(onSendMessage).not.toHaveBeenCalled();
      expect(getTextarea().value).toContain('Hello');
    });

    it('does not send empty message on Enter', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), '{Enter}');

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('does not send whitespace-only message on Enter', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), '   {Enter}');

      expect(onSendMessage).not.toHaveBeenCalled();
    });
  });

  // ---- Submit ----

  describe('submit', () => {
    it('calls onSendMessage with trimmed text', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), '  Hello  ');
      await userEvent.click(getSubmitButton());

      expect(onSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('clears the input after successful send', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), 'Hello');
      await userEvent.click(getSubmitButton());

      await vi.waitFor(() => {
        expect(getTextarea().value).toBe('');
      });
    });

    it('keeps input when send fails', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(false);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), 'Hello');
      await userEvent.click(getSubmitButton());

      await vi.waitFor(() => {
        expect(onSendMessage).toHaveBeenCalled();
      });
      expect(getTextarea().value).toBe('Hello');
    });

    it('does not submit when already sending', async () => {
      let resolveSend: (v: boolean) => void = () => {};
      const onSendMessage = vi.fn(
        () => new Promise<boolean>((resolve) => { resolveSend = resolve; })
      );

      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), 'Hello');
      await userEvent.click(getSubmitButton());

      // Second click while first is pending
      fireEvent.submit(getTextarea().closest('form')!);

      expect(onSendMessage).toHaveBeenCalledTimes(1);

      resolveSend(true);
    });
  });

  // ---- Typing indicator ----

  describe('typing indicator', () => {
    it('sends typing=true on input', async () => {
      renderInput();

      await userEvent.type(getTextarea(), 'a');

      expect(socket.sendTyping).toHaveBeenCalledWith('conv-1', 'user-1', true);
    });

    it('sends typing=false after 1s of inactivity', async () => {
      renderInput();

      await userEvent.type(getTextarea(), 'a');
      (socket.sendTyping as any).mockClear();

      await vi.advanceTimersByTimeAsync(1000);

      expect(socket.sendTyping).toHaveBeenCalledWith('conv-1', 'user-1', false);
    });

    it('sends typing=false on submit', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      renderInput({ onSendMessage });

      await userEvent.type(getTextarea(), 'Hello');
      (socket.sendTyping as any).mockClear();

      await userEvent.click(getSubmitButton());

      expect(socket.sendTyping).toHaveBeenCalledWith('conv-1', 'user-1', false);
    });

    it('sends typing=false on unmount', async () => {
      const { unmount } = renderInput();

      await userEvent.type(getTextarea(), 'a');
      (socket.sendTyping as any).mockClear();

      unmount();

      expect(socket.sendTyping).toHaveBeenCalledWith('conv-1', 'user-1', false);
    });

    it('does not send typing when conversationId is missing', async () => {
      renderInput({ conversationId: '' });

      await userEvent.type(getTextarea(), 'a');

      expect(socket.sendTyping).not.toHaveBeenCalled();
    });

    it('does not send typing when userId is missing', async () => {
      renderInput({ userId: '' });

      await userEvent.type(getTextarea(), 'a');

      expect(socket.sendTyping).not.toHaveBeenCalled();
    });
  });
});