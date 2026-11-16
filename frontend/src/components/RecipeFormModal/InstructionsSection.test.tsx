import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstructionsSection } from './InstructionsSection';

// ---------- Mocks ----------

vi.mock('react-textarea-autosize', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { ...rest } = props;
      return <textarea ref={ref} {...rest} />;
    }),
  };
});

// ---------- Render helper ----------

const renderSection = (
  props: Partial<React.ComponentProps<typeof InstructionsSection>> = {}
) => {
  const defaults = {
    instructions: ['First step', 'Second step'],
    onAddInstruction: vi.fn(),
    onRemoveInstruction: vi.fn(),
    onUpdateInstruction: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<InstructionsSection {...merged} />);
  return { ...utils, ...merged };
};

const getAllTextareas = () =>
  screen.getAllByPlaceholderText(/describe this step/i) as HTMLTextAreaElement[];

// ---------- Tests ----------

describe('InstructionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders section heading', () => {
      renderSection();

      expect(
        screen.getByRole('heading', { name: /^instructions$/i })
      ).toBeInTheDocument();
    });

    it('renders hint text', () => {
      renderSection();

      expect(
        screen.getByText(/write each step clearly/i)
      ).toBeInTheDocument();
    });

    it('renders all instructions', () => {
      renderSection({ instructions: ['Step A', 'Step B', 'Step C'] });

      const textareas = getAllTextareas();
      expect(textareas).toHaveLength(3);
      expect(textareas[0].value).toBe('Step A');
      expect(textareas[1].value).toBe('Step B');
      expect(textareas[2].value).toBe('Step C');
    });

    it('renders step numbers', () => {
      renderSection({ instructions: ['A', 'B', 'C'] });

      // Numbers 1, 2, 3 appear in the numbered circles
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders Add Step button', () => {
      renderSection();

      expect(
        screen.getByRole('button', { name: /add step/i })
      ).toBeInTheDocument();
    });

    it('renders no instructions when list is empty', () => {
      renderSection({ instructions: [] });

      expect(screen.queryAllByPlaceholderText(/describe this step/i)).toHaveLength(0);
      // Add Step is still visible
      expect(
        screen.getByRole('button', { name: /add step/i })
      ).toBeInTheDocument();
    });
  });

  // ---- Update ----

  describe('update instruction', () => {
    it('calls onUpdateInstruction with index and new value', async () => {
      const onUpdateInstruction = vi.fn();
      renderSection({
        instructions: ['First', 'Second'],
        onUpdateInstruction,
      });

      const textareas = getAllTextareas();
      await userEvent.type(textareas[1], '!');

      expect(onUpdateInstruction).toHaveBeenCalledWith(1, 'Second!');
    });

    it('calls with index 0 for first textarea', async () => {
      const onUpdateInstruction = vi.fn();
      renderSection({
        instructions: ['First'],
        onUpdateInstruction,
      });

      await userEvent.type(getAllTextareas()[0], 'X');

      expect(onUpdateInstruction).toHaveBeenCalledWith(0, 'FirstX');
    });
  });

  // ---- Add ----

  describe('add step', () => {
    it('calls onAddInstruction when Add Step clicked', async () => {
      const onAddInstruction = vi.fn();
      renderSection({ onAddInstruction });

      await userEvent.click(screen.getByRole('button', { name: /add step/i }));

      expect(onAddInstruction).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Remove ----

  describe('remove step', () => {
    it('shows Delete button when instructions.length > 1', () => {
      renderSection({ instructions: ['A', 'B'] });

      const deleteButtons = screen.getAllByRole('button').filter((b) =>
        b.querySelector('svg')?.getAttribute('viewBox') === '0 0 24 24' &&
        b.className.includes('w-8')
      );
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('hides Delete button when instructions.length === 1', () => {
      renderSection({ instructions: ['Only step'] });

      // No delete button in DOM
      const allButtons = screen.getAllByRole('button');
      // The only button should be "Add Step"
      const nonAddButtons = allButtons.filter(
        (b) => !b.textContent?.toLowerCase().includes('add step')
      );
      expect(nonAddButtons).toHaveLength(0);
    });

    it('calls onRemoveInstruction with correct index', async () => {
      const onRemoveInstruction = vi.fn();
      renderSection({
        instructions: ['First', 'Second', 'Third'],
        onRemoveInstruction,
      });

      // Delete buttons appear in order — one per step
      const allButtons = screen.getAllByRole('button');
      const deleteButtons = allButtons.filter((b) =>
        b.className.includes('w-8') && b.className.includes('h-8')
      );

      // Click the second delete button (for second instruction)
      await userEvent.click(deleteButtons[1]);

      expect(onRemoveInstruction).toHaveBeenCalledWith(1);
    });
  });
});