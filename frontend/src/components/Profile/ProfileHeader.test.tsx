import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileHeader from './ProfileHeader';
import { useFollow } from '@/hooks';
import { authApi } from '@/services/authApi';

// ---------- Hoisted mocks ----------

const {
  mockDispatch,
  mockShowToast,
  mockUseAuth,
  mockRefreshUserFromAuth,
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
  mockUseAuth: vi.fn(),
  mockRefreshUserFromAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks', () => ({
  useAuth: () => mockUseAuth(),
  useFollow: vi.fn(),
}));

vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();
  return {
    ...actual,
    useAppDispatch: () => mockDispatch,
    showToast: mockShowToast,
  };
});

vi.mock('@/services/authApi');

vi.mock('@/components/ui', () => ({
  Avatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-username={username} />
  ),
}));

// ---------- Test data ----------

const currentUser = {
  _id: 'me',
  username: 'alice',
  email: 'alice@test.com',
  avatar: '',
};

const ownProfile = {
  _id: 'me',
  username: 'alice',
  email: 'alice@test.com',
  avatar: 'alice.jpg',
  bio: 'I love cooking',
  followersCount: 10,
  followingCount: 5,
  isFollowing: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const otherProfile = {
  ...ownProfile,
  _id: 'user-2',
  username: 'bob',
  bio: 'Chef',
  followersCount: 42,
  followingCount: 15,
  isFollowing: false,
};

const mockToggleFollow = vi.fn();

const setupUseFollow = (
  overrides: Partial<{ isFollowing: boolean; isLoading: boolean }> = {}
) => {
  (useFollow as any).mockReturnValue({
    isFollowing: overrides.isFollowing ?? false,
    isLoading: overrides.isLoading ?? false,
    toggleFollow: mockToggleFollow,
    follow: vi.fn(),
    unfollow: vi.fn(),
  });
};

const setupAuth = () => {
  mockUseAuth.mockReturnValue({
    user: currentUser,
    refreshUser: mockRefreshUserFromAuth,
  });
};

// ---------- Render helper ----------

const renderHeader = (
  props: Partial<React.ComponentProps<typeof ProfileHeader>> = {}
) => {
  const defaults = {
    currentUser,
    profile: ownProfile,
    refresh: vi.fn(),
    updateFollowStats: vi.fn(),
    userRecipesCount: 7,
    onShowFollowers: vi.fn(),
    onShowFollowing: vi.fn(),
    onEditProfile: vi.fn(),
    onAddRecipe: vi.fn(),
    onMessage: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(<ProfileHeader {...merged} />);
  return { ...utils, ...merged };
};

const uploadFile = (fileInput: HTMLInputElement, file: File) => {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false,
    configurable: true,
  });
  fireEvent.change(fileInput);
};

// ---------- Tests ----------

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    setupUseFollow();
    (authApi.updateAvatar as any).mockResolvedValue({ success: true });
  });

  // ---- Basic display ----

  describe('display', () => {
    it('renders username', () => {
      renderHeader();
      expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
    });

    it('renders bio when present', () => {
      renderHeader();
      expect(screen.getByText('I love cooking')).toBeInTheDocument();
    });

    it('does not render bio when empty', () => {
      renderHeader({ profile: { ...ownProfile, bio: '' } });
      expect(screen.queryByText('I love cooking')).not.toBeInTheDocument();
    });

    it('renders recipes count', () => {
      renderHeader({ userRecipesCount: 7 });
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('renders followers and following counts', () => {
      renderHeader();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('uses 0 as fallback when counts are missing', () => {
      renderHeader({
        profile: {
          ...ownProfile,
          followersCount: undefined as any,
          followingCount: undefined as any,
        },
      });
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---- Stats clicks ----

  describe('stats clicks', () => {
    it('calls onShowFollowers when Followers is clicked', async () => {
      const onShowFollowers = vi.fn();
      renderHeader({ onShowFollowers });
      await userEvent.click(screen.getByText('Followers'));
      expect(onShowFollowers).toHaveBeenCalledTimes(1);
    });

    it('calls onShowFollowing when Following is clicked', async () => {
      const onShowFollowing = vi.fn();
      renderHeader({ onShowFollowing });
      await userEvent.click(screen.getByText('Following'));
      expect(onShowFollowing).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Own profile actions ----

  describe('own profile actions', () => {
    it('shows "Edit Profile" and "Add Recipe"', () => {
      renderHeader();
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument();
    });

    it('calls onEditProfile on Edit Profile click', async () => {
      const onEditProfile = vi.fn();
      renderHeader({ onEditProfile });
      await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      expect(onEditProfile).toHaveBeenCalledTimes(1);
    });

    it('calls onAddRecipe on Add Recipe click', async () => {
      const onAddRecipe = vi.fn();
      renderHeader({ onAddRecipe });
      await userEvent.click(screen.getByRole('button', { name: /add recipe/i }));
      expect(onAddRecipe).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Other profile actions ----

  describe('other profile actions', () => {
    it('shows "Follow" and "Message" for others', () => {
      renderHeader({ profile: otherProfile });
      expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /message/i })).toBeInTheDocument();
    });

    it('shows "Following" when already following', () => {
      setupUseFollow({ isFollowing: true });
      renderHeader({ profile: otherProfile });
      expect(screen.getByRole('button', { name: /^following$/i })).toBeInTheDocument();
    });

    it('calls toggleFollow on Follow click', async () => {
      renderHeader({ profile: otherProfile });
      await userEvent.click(screen.getByRole('button', { name: /^follow$/i }));
      expect(mockToggleFollow).toHaveBeenCalledTimes(1);
    });

    it('calls onMessage on Message click', async () => {
      const onMessage = vi.fn();
      renderHeader({ profile: otherProfile, onMessage });
      await userEvent.click(screen.getByRole('button', { name: /message/i }));
      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('shows "Loading..." and is disabled while follow is loading', () => {
      setupUseFollow({ isLoading: true });
      renderHeader({ profile: otherProfile });
      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toBeDisabled();
    });
  });

  // ---- Avatar upload ----

  describe('avatar upload', () => {
    it('clicking avatar on own profile opens file input', async () => {
      renderHeader();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');
      const avatarContainer = screen.getByTestId('avatar').parentElement as HTMLElement;
      await userEvent.click(avatarContainer);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('rejects non-image files with toast', async () => {
      renderHeader();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const badFile = new File(['data'], 'doc.txt', { type: 'text/plain' });

      uploadFile(fileInput, badFile);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Please select an image file',
          type: 'error',
        });
      });
      expect(authApi.updateAvatar).not.toHaveBeenCalled();
    });

    it('rejects images larger than 5MB with toast', async () => {
      renderHeader();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const bigData = new Uint8Array(5 * 1024 * 1024 + 1);
      const bigFile = new File([bigData], 'big.png', { type: 'image/png' });

      uploadFile(fileInput, bigFile);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Image must be less than 5MB',
          type: 'error',
        });
      });
      expect(authApi.updateAvatar).not.toHaveBeenCalled();
    });

    it('uploads valid image and refreshes user + profile', async () => {
      const refresh = vi.fn();
      renderHeader({ refresh });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const goodFile = new File(['fake'], 'pic.png', { type: 'image/png' });

      uploadFile(fileInput, goodFile);

      await waitFor(() => {
        expect(authApi.updateAvatar).toHaveBeenCalledWith(goodFile);
        expect(mockRefreshUserFromAuth).toHaveBeenCalled();
        expect(refresh).toHaveBeenCalled();
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Avatar updated successfully!',
        type: 'success',
      });
    });

    it('shows error toast when upload fails', async () => {
      (authApi.updateAvatar as any).mockResolvedValue({
        success: false,
        error: 'Server error',
      });

      const refresh = vi.fn();
      renderHeader({ refresh });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const goodFile = new File(['fake'], 'pic.png', { type: 'image/png' });

      uploadFile(fileInput, goodFile);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Server error',
          type: 'error',
        });
      });

      expect(refresh).not.toHaveBeenCalled();
    });
  });
});