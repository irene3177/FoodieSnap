import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopRated from '../../../pages/TopRated/TopRated';
import { recipesApi } from '../../../services/recipesApi';
import { Recipe } from '../../../types';

// Mock services
vi.mock('../../../services/recipesApi');

// Mock components
vi.mock('../../../components/RecipeCard/RecipeCard', () => ({
  default: ({ recipe }: { recipe: Recipe }) => (
    <div data-testid={`recipe-card-${recipe._id}`}>
      <h3>{recipe.title}</h3>
    </div>
  ),
}));

vi.mock('../../../components/Skeleton/Skeleton', () => ({
  RecipeCardSkeleton: () => <div data-testid="recipe-card-skeleton">Skeleton</div>,
}));

vi.mock('../../../components/ScrollToTop/ScrollToTop', () => ({
  ScrollToTop: () => null,
}));

describe('TopRated', () => {
  const mockRecipes: Recipe[] = [
    {
      _id: '1',
      title: 'Recipe 1',
      description: 'Description 1',
      ingredients: ['ing1'],
      instructions: ['step1'],
      difficulty: 'medium',
      imageUrl: 'img1.jpg',
      author: { _id: 'user1', username: 'user1', avatar: 'avatar.jpg' },
      rating: 4.8,
      ratingCount: 10,
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      title: 'Recipe 2',
      description: 'Description 2',
      ingredients: ['ing2'],
      instructions: ['step2'],
      difficulty: 'easy',
      imageUrl: 'img2.jpg',
      author: { _id: 'user2', username: 'user2', avatar: 'avatar.jpg' },
      rating: 4.5,
      ratingCount: 5,
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <TopRated />
      </MemoryRouter>
    );
  };

  it('should show loading skeletons initially', () => {
    vi.mocked(recipesApi.getTopRatedRecipes).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getAllByTestId('recipe-card-skeleton').length).toBeGreaterThan(0);
  });

  it('should load and display top rated recipes', async () => {
    vi.mocked(recipesApi.getTopRatedRecipes).mockResolvedValue({
      success: true,
      data: mockRecipes,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Recipe 1')).toBeDefined();
      expect(screen.getByText('Recipe 2')).toBeDefined();
    });
  });

  it('should show error message on API failure', async () => {
    vi.mocked(recipesApi.getTopRatedRecipes).mockResolvedValue({
      success: false,
      error: 'Failed to load top rated recipes',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load top rated recipes')).toBeDefined();
    });
  });

  it('should show empty state when no recipes', async () => {
    vi.mocked(recipesApi.getTopRatedRecipes).mockResolvedValue({
      success: true,
      data: [],
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No recipes have been rated yet.')).toBeDefined();
      expect(screen.getByText('Be the first to rate some recipes!')).toBeDefined();
      expect(screen.getByText('Explore Recipes')).toBeDefined();
    });
  });

  it('should render title', () => {
    renderComponent();
    
    expect(screen.getByText('Top Rated Recipes ⭐')).toBeDefined();
  });

  it('should call getTopRatedRecipes with limit 10', async () => {
    vi.mocked(recipesApi.getTopRatedRecipes).mockResolvedValue({
      success: true,
      data: mockRecipes,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(recipesApi.getTopRatedRecipes).toHaveBeenCalledWith(10);
    });
  });
});