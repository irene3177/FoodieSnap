import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrollToBottomButton } from './ScrollToBottomButton';

describe('ScrollToBottomButton', () => {
  it('renders a button with accessible name', () => {
    render(<ScrollToBottomButton onClick={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /scroll to bottom/i })
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<ScrollToBottomButton onClick={onClick} />);

    await userEvent.click(
      screen.getByRole('button', { name: /scroll to bottom/i })
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the arrow icon', () => {
    const { container } = render(<ScrollToBottomButton onClick={vi.fn()} />);

    // Icon is rendered by react-icons; check that an SVG is present
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('is keyboard-accessible via Enter', async () => {
    const onClick = vi.fn();
    render(<ScrollToBottomButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});