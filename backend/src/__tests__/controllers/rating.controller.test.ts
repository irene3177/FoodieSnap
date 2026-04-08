import { Request, Response } from 'express';
import {
  getRecipeRating,
  getUserRatings,
  rateRecipe,
  deleteRating
} from '../../controllers/rating.controller';
import { RatingModel } from '../../models/Rating.model';
import { RecipeModel } from '../../models/Recipe.model';
import NotFoundError from '../../errors/notFoundError';

// Mock dependencies
jest.mock('../../models/Rating.model');
jest.mock('../../models/Recipe.model');
jest.mock('../../errors/notFoundError');

describe('Rating Controller Unit Tests', () => {
  let req: Partial<Request & { userId?: string }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = {
      json: jsonMock,
      status: statusMock
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: 'user123'
    };
  });

  describe('getRecipeRating', () => {
    const recipeId = 'recipe123';

    it('should return recipe rating stats', async () => {
      // Arrange
      req.params = { recipeId };
      const mockRecipe = { _id: recipeId, rating: 4.5, ratingCount: 10 };
      const mockRatings = [
        { value: 5 }, { value: 4 }, { value: 5 }
      ];
      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);

      // Act
      await getRecipeRating(req as Request, res as Response, next);

      // Assert
      expect(RecipeModel.findById).toHaveBeenCalledWith(recipeId);
      expect(RatingModel.find).toHaveBeenCalledWith({ recipeId });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          averageRating: 4.5,
          totalRatings: 10,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 }
        }
      });
    });

    it('should return NotFoundError if recipe not found', async () => {
      // Arrange
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await getRecipeRating(req as Request, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('Recipe not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getUserRatings', () => {
    it('should return user ratings', async () => {
      // Arrange
      const mockRatings = [
        { recipeId: 'recipe1', value: 5 },
        { recipeId: 'recipe2', value: 4 }
      ];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);

      // Act
      await getUserRatings(req as any, res as Response, next);

      // Assert
      expect(RatingModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipe1: 5,
          recipe2: 4
        }
      });
    });

    it('should return empty object if no ratings', async () => {
      // Arrange
      (RatingModel.find as jest.Mock).mockResolvedValue([]);

      // Act
      await getUserRatings(req as any, res as Response, next);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });
  });

  describe('rateRecipe', () => {
    const recipeId = 'recipe123';
    const ratingValue = 5;

    it('should create a new rating successfully', async () => {
      // Arrange
      req.params = { recipeId };
      req.body = { value: ratingValue };
      const mockRecipe = { _id: recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.findOne as jest.Mock).mockResolvedValue(null);
      (RatingModel.create as jest.Mock).mockResolvedValue({});
      
      const mockRatings = [{ value: 5 }, { value: 4 }];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      await rateRecipe(req as any, res as Response, next);

      // Assert
      expect(RatingModel.create).toHaveBeenCalledWith({
        recipeId,
        userId: 'user123',
        value: ratingValue
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          recipeId,
          value: ratingValue,
          stats: expect.objectContaining({
            averageRating: expect.any(Number),
            totalRatings: expect.any(Number),
            distribution: expect.any(Object)
          })
        })
      });
    });

    it('should update existing rating', async () => {
      // Arrange
      req.params = { recipeId };
      req.body = { value: 4 };
      const mockRecipe = { _id: recipeId };
      const mockExistingRating = { value: 5, save: jest.fn().mockResolvedValue(true) };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.findOne as jest.Mock).mockResolvedValue(mockExistingRating);
      
      const mockRatings = [{ value: 4 }, { value: 4 }];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      await rateRecipe(req as any, res as Response, next);

      // Assert
      expect(mockExistingRating.value).toBe(4);
      expect(mockExistingRating.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should return NotFoundError if recipe not found', async () => {
      // Arrange
      req.params = { recipeId };
      req.body = { value: ratingValue };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await rateRecipe(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('Recipe not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('deleteRating', () => {
    const recipeId = 'recipe123';

    it('should delete rating successfully', async () => {
      // Arrange
      req.params = { recipeId };
      (RatingModel.findOneAndDelete as jest.Mock).mockResolvedValue({});
      
      const mockRatings = [{ value: 4 }, { value: 5 }];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      await deleteRating(req as any, res as Response, next);

      // Assert
      expect(RatingModel.findOneAndDelete).toHaveBeenCalledWith({
        recipeId,
        userId: 'user123'
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          recipeId,
          stats: expect.any(Object)
        })
      });
    });
  });
});