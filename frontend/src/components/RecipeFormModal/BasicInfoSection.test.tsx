import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoSection } from './BasicInfoSection';

// ---------- Render helper ----------

const renderSection = (
  props: Partial<React.ComponentProps<typeof BasicInfoSection>> = {}
) => {
  const defaults = {
    title: '',
    description: '',
    onTitleChange: vi.fn(),
    onDescriptionChange: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<BasicInfoSection {...merged} />);
  return { ...utils, ...merged };
};

const getTitleInput = () =>
  screen.getByPlaceholderText(/enter recipe title/i) as HTMLInputElement;

const getDescriptionInput = () =>
  screen.getByPlaceholderText(/brief description/i) as HTMLTextAreaElement;

// ---------- Tests ----------

describe('BasicInfoSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders section heading', () => {
      renderSection();

      expect(
        screen.getByRole('heading', { name: /basic information/i })
      ).toBeInTheDocument();
    });

    it('renders title input with current value', () => {
      renderSection({ title: 'Pasta Carbonara' });

      expect(getTitleInput().value).toBe('Pasta Carbonara');
    });

    it('renders description textarea with current value', () => {
      renderSection({ description: 'A classic Italian dish' });

      expect(getDescriptionInput().value).toBe('A classic Italian dish');
    });

    it('shows placeholders', () => {
      renderSection();

      expect(getTitleInput()).toHaveAttribute(
        'placeholder',
        'Enter recipe title'
      );
      expect(getDescriptionInput()).toHaveAttribute(
        'placeholder',
        'Brief description of your recipe'
      );
    });

    it('title input is required', () => {
      renderSection();

      expect(getTitleInput()).toBeRequired();
    });
  });

  // ---- Callbacks ----

  describe('callbacks', () => {
    it('calls onTitleChange with new value', async () => {
      const onTitleChange = vi.fn();
      renderSection({ onTitleChange });

      await userEvent.type(getTitleInput(), 'P');

      expect(onTitleChange).toHaveBeenCalledWith('P');
    });

    it('calls onDescriptionChange with new value', async () => {
      const onDescriptionChange = vi.fn();
      renderSection({ onDescriptionChange });

      await userEvent.type(getDescriptionInput(), 'H');

      expect(onDescriptionChange).toHaveBeenCalledWith('H');
    });
  });
});