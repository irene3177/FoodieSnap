import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RecipeDetail from '../../../pages/RecipeDetail/RecipeDetail';
import { recipesApi } from '../../../services/recipesApi';
import { Recipe } from '../../../types';

// Mock services
vi.mock('../../../services/recipesApi');

// Mock components
vi.mock('../../../components/Skeleton/Skeleton', () => ({
  RecipeDetailSkeleton: () => <div data-testid="recipe-detail-skeleton">Loading recipe...</div>,
}));

vi.mock('../../../components/FavoriteButton/FavoriteButton', () => ({
  default: () => <div data-testid="favorite-button">Favorite Button</div>,
}));

vi.mock('../../../components/RatingStars/RatingStars', () => ({
  default: () => <div data-testid="rating-stars">Rating Stars</div>,
}));

vi.mock('../../../components/ShareButtons/ShareButtons', () => ({
  default: () => <div data-testid="share-buttons">Share Buttons</div>,
}));

vi.mock('../../../components/CommentSection/CommentSection', () => ({
  default: () => <div data-testid="comment-section">Comment Section</div>,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RecipeDetail', () => {
  const mockRecipeId = 'recipe123';

  const mockRecipe: Recipe = {
    _id: mockRecipeId,
    title: 'Delicious Pasta',
    description: 'A wonderful pasta dish',
    ingredients: ['Pasta', 'Tomato sauce', 'Cheese'],
    instructions: ['Boil water', 'Cook pasta', 'Add sauce'],
    difficulty: 'medium',
    imageUrl: 'pasta.jpg',
    author: { _id: 'user123', username: 'chef', avatar: 'avatar.jpg' },
    rating: 4.5,
    ratingCount: 10,
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['Italian', 'Pasta'],
    category: 'Main Course',
    area: 'Italian',
    youtubeUrl: 'https://youtube.com/watch?v=123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderComponent = (recipeId = mockRecipeId) => {
    return render(
      <MemoryRouter initialEntries={[`/recipe/${recipeId}`]}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipeDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should show skeleton while loading', () => {
    vi.mocked(recipesApi.getRecipeById).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getByTestId('recipe-detail-skeleton')).toBeDefined();
  });

  it('should render recipe details when loaded', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Delicious Pasta')).toBeDefined();
      expect(screen.getByText('A wonderful pasta dish')).toBeDefined();
      expect(screen.getByText('Ingredients')).toBeDefined();
      expect(screen.getByText('Instructions')).toBeDefined();
    });
    
    // Use getAllByText for elements that appear multiple times
    expect(screen.getAllByText('Pasta').length).toBeGreaterThan(0);
    expect(screen.getByText('Tomato sauce')).toBeDefined();
    expect(screen.getByText('Cheese')).toBeDefined();
    expect(screen.getByText('Boil water')).toBeDefined();
    expect(screen.getByText('Cook pasta')).toBeDefined();
    expect(screen.getByText('Add sauce')).toBeDefined();
  });

  it('should show tags, category and area', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      // Italian appears twice (as tag and as area)
      expect(screen.getAllByText('Italian').length).toBeGreaterThan(0);
      // Category
      expect(screen.getByText('Main Course')).toBeDefined();
      // Tag (Pasta appears as tag and ingredient, so use getAllByText)
      expect(screen.getAllByText('Pasta').length).toBeGreaterThan(0);
    });
  });

  it('should show YouTube link when available', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Video Tutorial')).toBeDefined();
      expect(screen.getByText('Watch on YouTube →')).toBeDefined();
    });
    
    const youtubeLink = screen.getByText('Watch on YouTube →');
    expect(youtubeLink.closest('a')).toHaveAttribute('href', 'https://youtube.com/watch?v=123');
    expect(youtubeLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('should not show YouTube section when youtubeUrl is missing', async () => {
    const recipeWithoutYoutube = { ...mockRecipe, youtubeUrl: undefined };
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: recipeWithoutYoutube,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText('Video Tutorial')).toBeNull();
    });
  });

  it('should show error when recipe not found', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: false,
      error: 'Recipe not found',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Recipe not found')).toBeDefined();
      expect(screen.getByText('Back to Recipes')).toBeDefined();
    });
  });

  it('should navigate back when back button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Delicious Pasta')).toBeDefined();
    });
    
    const backButton = screen.getAllByText('← Back to Recipes')[0];
    await user.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should navigate to recipes page from error state', async () => {
    const user = userEvent.setup();
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: false,
      error: 'Recipe not found',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Recipe not found')).toBeDefined();
    });
    
    const backButton = screen.getByText('Back to Recipes');
    await user.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/recipes');
  });

  it('should render FavoriteButton component', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('favorite-button')).toBeDefined();
    });
  });

  it('should render RatingStars component', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('rating-stars')).toBeDefined();
    });
  });

  it('should render ShareButtons component', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('share-buttons')).toBeDefined();
    });
  });

  it('should render CommentSection component', async () => {
    vi.mocked(recipesApi.getRecipeById).mockResolvedValue({
      success: true,
      data: mockRecipe,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('comment-section')).toBeDefined();
    });
  });
});