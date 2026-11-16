import { Request, Response } from 'express';
import {
  getRecipeRating,
  getUserRatings,
  rateRecipe,
  deleteRating,
} from '../../controllers/rating.controller';
import { RatingModel } from '../../models/Rating.model';
import { RecipeModel } from '../../models/Recipe.model';

jest.mock('../../models/Rating.model');
jest.mock('../../models/Recipe.model');

describe('Rating Controller Unit Tests', () => {
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = { json: jsonMock, status: statusMock };
  };

  const getNextError = (): any => {
    expect(next).toHaveBeenCalled();
    return (next as jest.Mock).mock.calls[0][0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: 'user123',
    };
  });

  // ---------- getRecipeRating ----------

  describe('getRecipeRating', () => {
    const recipeId = 'recipe123';

    it('should return recipe rating stats', async () => {
      req.params = { recipeId };

      const mockRecipe = { _id: recipeId, rating: 4.5, ratingCount: 10 };
      const mockRatings = [{ value: 5 }, { value: 4 }, { value: 5 }];

      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);

      await getRecipeRating(req as Request, res as Response, next);

      expect(RecipeModel.findById).toHaveBeenCalledWith(recipeId);
      expect(RatingModel.find).toHaveBeenCalledWith({ recipeId });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          averageRating: 4.5,
          totalRatings: 10,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 },
        },
      });
    });

    it('should return zero stats when there are no ratings', async () => {
      req.params = { recipeId };

      const mockRecipe = { _id: recipeId, rating: 0, ratingCount: 0 };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.find as jest.Mock).mockResolvedValue([]);

      await getRecipeRating(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          averageRating: 0,
          totalRatings: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
    });

    it('should call next with NotFoundError if recipe not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      await getRecipeRating(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- getUserRatings ----------

  describe('getUserRatings', () => {
    it('should return user ratings as a map', async () => {
      const mockRatings = [
        { recipeId: { toString: () => 'recipe1' }, value: 5 },
        { recipeId: { toString: () => 'recipe2' }, value: 4 },
      ];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);

      await getUserRatings(req, res as Response, next);

      expect(RatingModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { recipe1: 5, recipe2: 4 },
      });
    });

    it('should return empty object if no ratings', async () => {
      (RatingModel.find as jest.Mock).mockResolvedValue([]);

      await getUserRatings(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {},
      });
    });
  });

  // ---------- rateRecipe ----------

  describe('rateRecipe', () => {
    const recipeId = 'recipe123';

    it('should create a new rating successfully', async () => {
      req.params = { recipeId };
      req.body = { value: 5 };

      const mockRecipe = { _id: recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.findOne as jest.Mock).mockResolvedValue(null);
      (RatingModel.create as jest.Mock).mockResolvedValue({});

      const mockRatings = [{ value: 5 }, { value: 4 }];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await rateRecipe(req, res as Response, next);

      expect(RatingModel.create).toHaveBeenCalledWith({
        recipeId,
        userId: 'user123',
        value: 5,
      });
      expect(RecipeModel.findByIdAndUpdate).toHaveBeenCalledWith(recipeId, {
        rating: 4.5,
        ratingCount: 2,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          recipeId,
          value: 5,
          stats: expect.objectContaining({
            averageRating: 4.5,
            totalRatings: 2,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
          }),
        }),
      });
    });

    it('should update an existing rating', async () => {
      req.params = { recipeId };
      req.body = { value: 4 };

      const mockRecipe = { _id: recipeId };
      const mockExistingRating = {
        value: 5,
        save: jest.fn().mockResolvedValue(true),
      };

      (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
      (RatingModel.findOne as jest.Mock).mockResolvedValue(mockExistingRating);

      const mockRatings = [{ value: 4 }, { value: 4 }];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await rateRecipe(req, res as Response, next);

      expect(mockExistingRating.value).toBe(4);
      expect(mockExistingRating.save).toHaveBeenCalled();
      expect(RatingModel.create).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with NotFoundError if recipe not found', async () => {
      req.params = { recipeId };
      req.body = { value: 5 };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      await rateRecipe(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- deleteRating ----------

  describe('deleteRating', () => {
    const recipeId = 'recipe123';

    it('should delete rating and recalculate stats', async () => {
      req.params = { recipeId };

      (RatingModel.findOneAndDelete as jest.Mock).mockResolvedValue({});
      const mockRatings = [{ value: 4 }, { value: 5 }];
      (RatingModel.find as jest.Mock).mockResolvedValue(mockRatings);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await deleteRating(req, res as Response, next);

      expect(RatingModel.findOneAndDelete).toHaveBeenCalledWith({
        recipeId,
        userId: 'user123',
      });
      expect(RecipeModel.findByIdAndUpdate).toHaveBeenCalledWith(recipeId, {
        rating: 4.5,
        ratingCount: 2,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          recipeId,
          stats: expect.objectContaining({
            averageRating: 4.5,
            totalRatings: 2,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
          }),
        }),
      });
    });

    it('should return zero stats when deleting the last rating', async () => {
      req.params = { recipeId };

      (RatingModel.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (RatingModel.find as jest.Mock).mockResolvedValue([]);
      (RecipeModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await deleteRating(req, res as Response, next);

      expect(RecipeModel.findByIdAndUpdate).toHaveBeenCalledWith(recipeId, {
        rating: 0,
        ratingCount: 0,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          recipeId,
          stats: expect.objectContaining({
            averageRating: 0,
            totalRatings: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          }),
        }),
      });
    });
  });
});