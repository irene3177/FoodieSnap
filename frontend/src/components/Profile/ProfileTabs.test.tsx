import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfileTabs from './ProfileTabs';
import type { Recipe, UserProfile } from '@/types';

// ---------- Mocks ----------

vi.mock('react-masonry-css', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="masonry">{children}</div>
  ),
}));

vi.mock('@/components/RecipeCard/RecipeCard', () => ({
  default: ({ recipe, onEdit, onDelete, isOwner }: any) => (
    <div
      data-testid="recipe-card"
      data-id={recipe._id}
      data-owner={String(!!isOwner)}
      data-has-edit={String(!!onEdit)}
      data-has-delete={String(!!onDelete)}
    >
      {recipe.title}
    </div>
  ),
}));

// Mock EmptyState via the barrel file that ProfileTabs actually imports from
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...actual,
    EmptyState: ({ title, action, secondaryAction }: any) => (
      <div data-testid="empty-state">
        <span>{title}</span>
        {action && <span data-testid="empty-action">{action.label}</span>}
        {secondaryAction && (
          <button data-testid="empty-secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </button>
        )}
      </div>
    ),
  };
});

// ---------- Test data ----------

const makeRecipe = (id: string, title: string): Recipe => ({
  _id: id,
  title,
  description: '',
  ingredients: [],
  instructions: [],
  imageUrl: '',
  difficulty: 'easy',
  rating: 0,
  ratingCount: 0,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

const mockProfile: UserProfile = {
  _id: 'u1',
  username: 'alice',
  email: 'alice@test.com',
  avatar: '',
  bio: '',
  followersCount: 0,
  followingCount: 0,
  isFollowing: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
} as UserProfile;

// ---------- Render helper ----------

const renderTabs = (
  props: Partial<React.ComponentProps<typeof ProfileTabs>> = {}
) => {
  const defaults = {
    profile: mockProfile,
    favorites: [] as Recipe[],
    userRecipes: [] as Recipe[],
    isOwnProfile: true,
    loadingFavorites: false,
    loadingUserRecipes: false,
    onAddRecipe: vi.fn(),
    onEditRecipe: vi.fn(),
    onDeleteRecipe: vi.fn(),
  };
  const merged = { ...defaults, ...props };

  const utils = render(
    <MemoryRouter>
      <ProfileTabs {...merged} />
    </MemoryRouter>
  );
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('ProfileTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Initial state ----

  describe('initial state', () => {
    it('starts on favorites tab', () => {
      renderTabs();

      expect(
        screen.getByRole('button', { name: /saved \(0\)/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/^saved recipes$/i)).toBeInTheDocument();
    });
  });

  // ---- Tabs switching ----

  describe('tabs switching', () => {
    it('switches to myRecipes tab on click', async () => {
      renderTabs();

      await userEvent.click(screen.getByRole('button', { name: /recipes \(0\)/i }));

      expect(screen.queryByText(/saved recipes/i)).not.toBeInTheDocument();
      expect(screen.getByText('No Recipes Yet')).toBeInTheDocument();
    });

    it('switches back to favorites', async () => {
      renderTabs();

      await userEvent.click(screen.getByRole('button', { name: /recipes \(0\)/i }));
      await userEvent.click(screen.getByRole('button', { name: /saved \(0\)/i }));

      expect(screen.getByText(/^saved recipes$/i)).toBeInTheDocument();
    });
  });

  // ---- Tab labels ----

  describe('tab labels', () => {
    it('shows "My Recipes" for own profile', () => {
      renderTabs({ isOwnProfile: true, userRecipes: [makeRecipe('r1', 'Pizza')] });

      expect(
        screen.getByRole('button', { name: /my recipes \(1\)/i })
      ).toBeInTheDocument();
    });

    it('shows "Recipes" for others', () => {
      renderTabs({
        isOwnProfile: false,
        userRecipes: [makeRecipe('r1', 'Pizza')],
      });

      expect(
        screen.getByRole('button', { name: /recipes \(1\)/i })
      ).toBeInTheDocument();
    });

    it('shows correct counts in tabs', () => {
      renderTabs({
        favorites: [makeRecipe('f1', 'Pasta'), makeRecipe('f2', 'Soup')],
        userRecipes: [makeRecipe('r1', 'Pizza')],
      });

      expect(
        screen.getByRole('button', { name: /saved \(2\)/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /my recipes \(1\)/i })
      ).toBeInTheDocument();
    });
  });

  // ---- Loading ----

  describe('loading states', () => {
    it('shows favorites loading message', () => {
      renderTabs({ loadingFavorites: true });

      expect(screen.getByText(/loading favorites/i)).toBeInTheDocument();
    });

    it('shows recipes loading message', async () => {
      renderTabs({ loadingUserRecipes: true });

      await userEvent.click(screen.getByRole('button', { name: /my recipes/i }));

      expect(screen.getByText(/loading recipes/i)).toBeInTheDocument();
    });
  });

  // ---- Rendering recipes ----

  describe('rendering recipes', () => {
    it('renders favorites in masonry', () => {
      renderTabs({
        favorites: [makeRecipe('f1', 'Pasta')],
      });

      expect(screen.getByTestId('masonry')).toBeInTheDocument();
      expect(screen.getByText('Pasta')).toBeInTheDocument();
    });

    it('renders user recipes in masonry', async () => {
      renderTabs({
        userRecipes: [makeRecipe('r1', 'Pizza')],
      });

      await userEvent.click(screen.getByRole('button', { name: /my recipes/i }));

      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    it('passes onEdit/onDelete only for own profile (recipes tab)', async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderTabs({
        isOwnProfile: true,
        userRecipes: [makeRecipe('r1', 'Pizza')],
        onEditRecipe: onEdit,
        onDeleteRecipe: onDelete,
      });

      await userEvent.click(screen.getByRole('button', { name: /my recipes/i }));

      const card = screen.getByTestId('recipe-card');
      expect(card).toHaveAttribute('data-has-edit', 'true');
      expect(card).toHaveAttribute('data-has-delete', 'true');
      expect(card).toHaveAttribute('data-owner', 'true');
    });

    it('does not pass onEdit/onDelete for other profiles', async () => {
      renderTabs({
        isOwnProfile: false,
        userRecipes: [makeRecipe('r1', 'Pizza')],
        onEditRecipe: vi.fn(),
        onDeleteRecipe: vi.fn(),
      });

      await userEvent.click(screen.getByRole('button', { name: /recipes/i }));

      const card = screen.getByTestId('recipe-card');
      expect(card).toHaveAttribute('data-has-edit', 'false');
      expect(card).toHaveAttribute('data-has-delete', 'false');
      expect(card).toHaveAttribute('data-owner', 'false');
    });
  });

  // ---- Empty states ----

  describe('empty favorites', () => {
    it('shows "Explore Recipes" action for own profile', () => {
      renderTabs({ isOwnProfile: true, favorites: [] });

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-action')).toHaveTextContent(/explore recipes/i);
    });

    it('does not show action for other profiles', () => {
      renderTabs({ isOwnProfile: false, favorites: [] });

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-action')).not.toBeInTheDocument();
    });
  });

  describe('empty user recipes', () => {
    it('shows "Create Your First Recipe" secondary action for own profile', async () => {
      const onAddRecipe = vi.fn();
      renderTabs({ isOwnProfile: true, userRecipes: [], onAddRecipe });

      await userEvent.click(screen.getByRole('button', { name: /my recipes/i }));

      const button = screen.getByTestId('empty-secondary');
      expect(button).toHaveTextContent(/create your first recipe/i);

      await userEvent.click(button);
      expect(onAddRecipe).toHaveBeenCalledTimes(1);
    });

    it('does not show action for other profiles', async () => {
      renderTabs({ isOwnProfile: false, userRecipes: [] });

      await userEvent.click(screen.getByRole('button', { name: /recipes/i }));

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-secondary')).not.toBeInTheDocument();
    });
  });
});