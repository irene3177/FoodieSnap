import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FollowModal from './FollowModal';
import { useAuth } from '@/hooks/useAuth';
import { followApi } from '@/services/followApi';
import type { UserListItem } from '@/types';

// ---------- Mocks ----------

vi.mock('@/hooks/useAuth');
vi.mock('@/services/followApi');

vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
  Loader: () => <div data-testid="loader" />,
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

const currentUser = {
  _id: 'me',
  username: 'alice',
  email: 'alice@test.com',
  avatar: '',
};

const makeUser = (id: string, username: string, isFollowing = false): UserListItem => ({
  _id: id,
  username,
  avatar: '',
  bio: 'Short bio',
  recipeCount: 0,
  isFollowing,
});

// ---------- Render helper ----------

const renderModal = (
  props: Partial<React.ComponentProps<typeof FollowModal>> = {},
  options: { currentUser?: typeof currentUser | null } = {}
) => {
  (useAuth as any).mockReturnValue({
    user: options.currentUser === undefined ? currentUser : options.currentUser,
  });

  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    userId: 'target-user',
    type: 'followers' as const,
    initialCount: 0,
    onUpdate: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(
    <MemoryRouter>
      <FollowModal {...merged} />
    </MemoryRouter>
  );

  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('FollowModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (followApi.getFollowers as any).mockResolvedValue({
      success: true,
      data: [],
    });
    (followApi.getFollowing as any).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(
        screen.queryByRole('heading', { name: /followers/i })
      ).not.toBeInTheDocument();
    });

    it('renders the modal when isOpen=true', () => {
      renderModal();

      expect(
        screen.getByRole('heading', { name: /followers/i })
      ).toBeInTheDocument();
    });

    it('shows "Following" title when type=following', () => {
      renderModal({ type: 'following' });

      expect(
        screen.getByRole('heading', { name: /following/i })
      ).toBeInTheDocument();
    });
  });

  // ---- Loading ----

  describe('loading', () => {
    it('shows loader while loading', () => {
      (followApi.getFollowers as any).mockImplementation(
        () => new Promise(() => {})
      );

      renderModal();

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('calls followApi.getFollowers for type=followers', async () => {
      const users = [makeUser('u2', 'bob')];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal({ userId: 'target-user', type: 'followers' });

      await waitFor(() => {
        expect(followApi.getFollowers).toHaveBeenCalledWith('target-user');
      });
    });

    it('calls followApi.getFollowing for type=following', async () => {
      const users = [makeUser('u2', 'bob')];
      (followApi.getFollowing as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal({ type: 'following' });

      await waitFor(() => {
        expect(followApi.getFollowing).toHaveBeenCalledWith('target-user');
      });
    });

    it('does not fetch when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(followApi.getFollowers).not.toHaveBeenCalled();
      expect(followApi.getFollowing).not.toHaveBeenCalled();
    });
  });

  // ---- Users list ----

  describe('users list', () => {
    it('renders list of users', async () => {
      const users = [
        makeUser('u2', 'bob'),
        makeUser('u3', 'carol'),
      ];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('bob')).toBeInTheDocument();
        expect(screen.getByText('carol')).toBeInTheDocument();
      });
    });

    it('shows "No followers yet" when list is empty for followers', async () => {
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: [],
      });

      renderModal({ type: 'followers' });

      await waitFor(() => {
        expect(screen.getByText('No followers yet')).toBeInTheDocument();
      });
    });

    it('shows "Not following anyone yet" for following type', async () => {
      (followApi.getFollowing as any).mockResolvedValue({
        success: true,
        data: [],
      });

      renderModal({ type: 'following' });

      await waitFor(() => {
        expect(screen.getByText('Not following anyone yet')).toBeInTheDocument();
      });
    });

    it('shows bio truncated to 50 chars', async () => {
      const longBio = 'A'.repeat(100);
      const users = [makeUser('u2', 'bob')];
      users[0].bio = longBio;
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal();

      await waitFor(() => {
        const bioElement = screen.getByText(/^A+$/);
        expect(bioElement.textContent?.length).toBe(50);
      });
    });
  });

  // ---- Follow button visibility ----

  describe('follow button visibility', () => {
    it('hides follow button for current user', async () => {
      const users = [makeUser('me', 'alice')];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^following$/i })).not.toBeInTheDocument();
    });

    it('hides all follow buttons when currentUser is null', async () => {
      const users = [makeUser('u2', 'bob')];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal({}, { currentUser: null });

      await waitFor(() => {
        expect(screen.getByText('bob')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument();
    });

    it('shows "Follow" for users not followed', async () => {
      const users = [makeUser('u2', 'bob', false)];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
      });
    });

    it('shows "Following" for users already followed', async () => {
      const users = [makeUser('u2', 'bob', true)];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^following$/i })).toBeInTheDocument();
      });
    });
  });

  // ---- Follow toggle ----

  describe('follow toggle', () => {
    it('follows a user when clicking Follow', async () => {
      const users = [makeUser('u2', 'bob', false)];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });
      (followApi.follow as any).mockResolvedValue({
        success: true,
        data: { followersCount: 5 },
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^follow$/i }));

      await waitFor(() => {
        expect(followApi.follow).toHaveBeenCalledWith('u2');
      });

      // After optimistic update, button becomes "Following"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^following$/i })).toBeInTheDocument();
      });
    });

    it('unfollows a user when clicking Following', async () => {
      const users = [makeUser('u2', 'bob', true)];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });
      (followApi.unfollow as any).mockResolvedValue({
        success: true,
        data: { followingCount: 3 },
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^following$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^following$/i }));

      await waitFor(() => {
        expect(followApi.unfollow).toHaveBeenCalledWith('u2');
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
      });
    });
  });

  // ---- onUpdate callback ----

  describe('onUpdate callback', () => {
    it('calls onUpdate with followersCount after follow in followers type', async () => {
      const users = [makeUser('u2', 'bob', false)];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });
      (followApi.follow as any).mockResolvedValue({
        success: true,
        data: { followersCount: 42 },
      });

      const onUpdate = vi.fn();
      renderModal({ onUpdate, type: 'followers' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^follow$/i }));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(42, undefined);
      });
    });

    it('calls onUpdate with followingCount after unfollow in following type', async () => {
      const users = [makeUser('u2', 'bob', true)];
      (followApi.getFollowing as any).mockResolvedValue({
        success: true,
        data: users,
      });
      (followApi.unfollow as any).mockResolvedValue({
        success: true,
        data: { followingCount: 7 },
      });

      const onUpdate = vi.fn();
      renderModal({ onUpdate, type: 'following' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^following$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^following$/i }));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(undefined, 7);
      });
    });
  });

  // ---- Close ----

  describe('close interactions', () => {
    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const allButtons = screen.getAllByRole('button');
      const xButton = allButtons.find((b) => b.className.includes('w-8 h-8'));
      expect(xButton).toBeDefined();

      await userEvent.click(xButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on overlay click', () => {
      const onClose = vi.fn();
      const { container } = renderModal({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the modal', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(
        screen.getByRole('heading', { name: /followers/i })
      );

      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes when clicking on a user link', async () => {
      const users = [makeUser('u2', 'bob')];
      (followApi.getFollowers as any).mockResolvedValue({
        success: true,
        data: users,
      });

      const onClose = vi.fn();
      renderModal({ onClose });

      await waitFor(() => {
        expect(screen.getByText('bob')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('bob'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});