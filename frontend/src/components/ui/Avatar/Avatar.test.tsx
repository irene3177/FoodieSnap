import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Avatar from './Avatar';

// ---------- Render helper ----------

const renderAvatar = (
  props: Partial<React.ComponentProps<typeof Avatar>> = {}
) => {
  const merged = { ...props };
  const utils = render(
    <MemoryRouter>
      <Avatar {...merged} />
    </MemoryRouter>
  );
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('Avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Content: initials ----

  describe('initials fallback', () => {
    it('renders first letter of username uppercase', () => {
      renderAvatar({ username: 'alice' });

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('uppercases the initial', () => {
      renderAvatar({ username: 'bob' });

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('falls back to "U" when username is missing', () => {
      renderAvatar();

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('uses only the first character for multi-char username', () => {
      renderAvatar({ username: 'charlie' });

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    });
  });

  // ---- Content: image ----

  describe('image content', () => {
    it('renders img when src is provided', () => {
      renderAvatar({ src: 'https://example.com/alice.jpg', username: 'alice' });

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
    });

    it('img alt uses username', () => {
      renderAvatar({ src: 'x.jpg', username: 'alice' });

      expect(screen.getByAltText('alice')).toBeInTheDocument();
    });

    it('img alt falls back to "User" without username', () => {
      renderAvatar({ src: 'x.jpg' });

      expect(screen.getByAltText('User')).toBeInTheDocument();
    });

    it('does not show initials when src is provided', () => {
      renderAvatar({ src: 'x.jpg', username: 'alice' });

      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });
  });

  // ---- Root element ----

  describe('root element', () => {
    it('renders <Link> when `to` is provided', () => {
      renderAvatar({ to: '/user/alice', username: 'alice' });

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/user/alice');
    });

    it('renders <button> when `onClick` is provided (no `to`)', () => {
      renderAvatar({ onClick: vi.fn(), username: 'alice' });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders <div> when neither `to` nor `onClick`', () => {
      const { container } = renderAvatar({ username: 'alice' });

      // No link, no button
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      // The root is a div
      const root = container.querySelector('.rounded-full');
      expect(root?.tagName).toBe('DIV');
    });

    it('Link with onClick still triggers onClick', async () => {
      const onClick = vi.fn();
      renderAvatar({ to: '/user/alice', onClick, username: 'alice' });

      await userEvent.click(screen.getByRole('link'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('button triggers onClick', async () => {
      const onClick = vi.fn();
      renderAvatar({ onClick, username: 'alice' });

      await userEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Sizes ----

  describe('sizes', () => {
    it('uses "md" by default', () => {
      const { container } = renderAvatar({ username: 'a' });

      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('w-10');
      expect(root?.className).toContain('h-10');
    });

    it('xs → w-6 h-6', () => {
      const { container } = renderAvatar({ size: 'xs' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('w-6');
    });

    it('sm → w-8 h-8', () => {
      const { container } = renderAvatar({ size: 'sm' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('w-8');
    });

    it('lg → w-12 h-12', () => {
      const { container } = renderAvatar({ size: 'lg' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('w-12');
    });

    it('xl → w-16 h-16', () => {
      const { container } = renderAvatar({ size: 'xl' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('w-16');
    });

    it('2xl → w-24 h-24', () => {
      const { container } = renderAvatar({ size: '2xl' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('w-24');
    });

    it('profile uses clamp classes', () => {
      const { container } = renderAvatar({ size: 'profile' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('clamp(6rem,15vw,8rem)');
    });
  });

  // ---- Border ----

  describe('border', () => {
    it('does not add border classes by default', () => {
      const { container } = renderAvatar({ username: 'a' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).not.toContain('border-2');
    });

    it('adds border-2 + default border-accent when border=true', () => {
      const { container } = renderAvatar({ border: true });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('border-2');
      expect(root?.className).toContain('border-accent');
    });

    it('uses custom borderColor', () => {
      const { container } = renderAvatar({
        border: true,
        borderColor: 'border-red-500',
      });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('border-red-500');
      expect(root?.className).not.toContain('border-accent');
    });
  });

  // ---- Interactive ----

  describe('interactive', () => {
    it('adds hover/active classes when interactive=true (default)', () => {
      const { container } = renderAvatar({ username: 'a' });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('hover:shadow-accent');
      expect(root?.className).toContain('hover:scale-[1.02]');
    });

    it('does not add hover classes when interactive=false', () => {
      const { container } = renderAvatar({ interactive: false });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).not.toContain('hover:shadow-accent');
      expect(root?.className).not.toContain('hover:scale-[1.02]');
    });
  });

  // ---- Custom className ----

  describe('className', () => {
    it('applies custom className to root', () => {
      const { container } = renderAvatar({
        username: 'a',
        className: 'my-custom-class',
      });
      const root = container.querySelector('.rounded-full');
      expect(root?.className).toContain('my-custom-class');
    });
  });
});