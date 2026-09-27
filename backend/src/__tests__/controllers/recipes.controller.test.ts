import { Request, Response } from 'express';
import {
  getRandomRecipesHandler,
  searchRecipesHandler,
  getRecipeByIdHandler,
  getTopRatedRecipes,
  getUserRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getCategories,
  getTags,
  getAreas,
  filterRecipesHandler,
} from '../../controllers/recipes.controller';
import * as mealDBService from '../../services/mealDB.service';
import * as validation from '../../utils/validation';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import { CommentModel } from '../../models/Comment.model';

jest.mock('../../services/mealDB.service');
jest.mock('../../utils/validation');
jest.mock('../../models/Recipe.model');
jest.mock('../../models/User.model');
jest.mock('../../models/Comment.model');

describe('Recipes Controller Unit Tests', () => {
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

  // ---------- getRandomRecipesHandler ----------

  describe('getRandomRecipesHandler', () => {
    it('should return random recipes with default values', async () => {
      const mockResult = {
        recipes: [{ id: '1', title: 'Pasta' }],
        totalPages: 10,
        currentPage: 1,
        totalRecipes: 100,
      };

      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(1);
      (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue(mockResult);

      await getRandomRecipesHandler(req as Request, res as Response, next);

      expect(mealDBService.getRandomRecipes).toHaveBeenCalledWith(8, 1);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipes: mockResult.recipes,
          totalPages: mockResult.totalPages,
          currentPage: mockResult.currentPage,
          totalRecipes: mockResult.totalRecipes,
        },
      });
    });

    it('should use custom count and page from query', async () => {
      req.query = { count: '5', page: '2' };
      const mockResult = { recipes: [], totalPages: 5, currentPage: 2, totalRecipes: 50 };

      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(2);
      (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue(mockResult);

      await getRandomRecipesHandler(req as Request, res as Response, next);

      expect(mealDBService.getRandomRecipes).toHaveBeenCalledWith(5, 2);
    });
  });

  // ---------- searchRecipesHandler ----------

  describe('searchRecipesHandler', () => {
    const setupFindChain = (recipes: any[]) => {
      const mockLean = jest.fn().mockResolvedValue(recipes);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      (RecipeModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate });
    };

    it('should call next with BadRequestError when q is missing', async () => {
      req.query = {};

      await searchRecipesHandler(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Search query required');
      expect(err.statusCode).toBe(400);
    });

    it('should search by title/description/category/area with regex', async () => {
      req.query = { q: 'pasta' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await searchRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: { $regex: 'pasta', $options: 'i' } },
            { description: { $regex: 'pasta', $options: 'i' } },
          ]),
        })
      );
    });

    it('should search by tags when multiple words', async () => {
      req.query = { q: 'pasta italian' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await searchRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: {
            $in: [expect.any(RegExp), expect.any(RegExp)],
          },
        })
      );
    });

    it('should return recipes with pagination', async () => {
      req.query = { q: 'test' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      const mockRecipes = [{ _id: 'r1', title: 'Test Recipe' }];
      setupFindChain(mockRecipes);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await searchRecipesHandler(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 1,
          page: 1,
          pages: 1,
          limit: 10,
        },
      });
    });
  });

  // ---------- getRecipeByIdHandler ----------

  describe('getRecipeByIdHandler', () => {
    it('should return recipe from MongoDB when valid ObjectId', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockRecipe = { _id: '507f1f77bcf86cd799439011', title: 'Mongo Recipe' };
      const mockLean = jest.fn().mockResolvedValue(mockRecipe);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      (RecipeModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await getRecipeByIdHandler(req as Request, res as Response, next);

      expect(RecipeModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockRecipe });
    });

    it('should return recipe from MealDB when invalid ObjectId', async () => {
      req.params = { id: '52772' };

      const mockRecipe = { _id: '52772', title: 'MealDB Recipe' };
      (mealDBService.getRecipeById as jest.Mock).mockResolvedValue(mockRecipe);

      await getRecipeByIdHandler(req as Request, res as Response, next);

      expect(mealDBService.getRecipeById).toHaveBeenCalledWith('52772');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockRecipe });
    });

    it('should call next with NotFoundError when recipe is null', async () => {
      req.params = { id: '52772' };
      (mealDBService.getRecipeById as jest.Mock).mockResolvedValue(null);

      await getRecipeByIdHandler(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- getTopRatedRecipes ----------

  describe('getTopRatedRecipes', () => {
    it('should return top rated recipes sorted by rating', async () => {
      (validation.validateNumber as jest.Mock).mockReturnValueOnce(10);

      const mockRecipes = [{ _id: 'r1', rating: 5 }];
      const mockLean = jest.fn().mockResolvedValue(mockRecipes);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockLimit = jest.fn().mockReturnValue({ populate: mockPopulate });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      (RecipeModel.find as jest.Mock).mockReturnValue({ sort: mockSort });

      await getTopRatedRecipes(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith({ rating: { $gt: 0 } });
      expect(mockSort).toHaveBeenCalledWith({ rating: -1, ratingCount: -1 });
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockRecipes });
    });
  });

  // ---------- getUserRecipes ----------

  describe('getUserRecipes', () => {
    it('should return recipes by user', async () => {
      req.params = { userId: 'user456' };

      const mockRecipes = [{ _id: 'r1', title: 'User Recipe' }];
      const mockLean = jest.fn().mockResolvedValue(mockRecipes);
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      (RecipeModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await getUserRecipes(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith({ author: 'user456' });
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockRecipes });
    });
  });

  // ---------- createRecipe ----------

  describe('createRecipe', () => {
    it('should create recipe and add to user createdRecipes', async () => {
      req.body = { title: 'New Recipe', description: 'Desc' };
      req.userId = 'user123';

      const mockSavedRecipe = {
        _id: 'recipe123',
        title: 'New Recipe',
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined),
      };
      (RecipeModel as any).mockImplementation(() => mockSavedRecipe);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await createRecipe(req as any, res as Response, next);

      expect(mockSavedRecipe.save).toHaveBeenCalled();
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $push: { createdRecipes: 'recipe123' } }
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockSavedRecipe,
      });
    });
  });

  // ---------- updateRecipe ----------

  describe('updateRecipe', () => {
    it('should update recipe owned by user', async () => {
      req.params = { id: 'recipe123' };
      req.userId = 'user123';
      req.body = { title: 'Updated' };

      const mockRecipe = { _id: 'recipe123', title: 'Updated' };
      const mockPopulate = jest.fn().mockResolvedValue(mockRecipe);
      (RecipeModel.findOneAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await updateRecipe(req as any, res as Response, next);

      expect(RecipeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'recipe123', author: 'user123' },
        { title: 'Updated' },
        { returnDocument: 'after', runValidators: true }
      );
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockRecipe });
    });

    it('should call next with NotFoundError when recipe not found', async () => {
      req.params = { id: 'recipe123' };
      req.userId = 'user123';

      const mockPopulate = jest.fn().mockResolvedValue(null);
      (RecipeModel.findOneAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await updateRecipe(req as any, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found or you are not the author');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- deleteRecipe ----------

  describe('deleteRecipe', () => {
    it('should delete recipe and clean up references', async () => {
      req.params = { id: 'recipe123' };
      req.userId = 'user123';

      const mockRecipe = { _id: 'recipe123' };
      (RecipeModel.findOneAndDelete as jest.Mock).mockResolvedValue(mockRecipe);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (UserModel.updateMany as jest.Mock).mockResolvedValue({});
      (CommentModel.deleteMany as jest.Mock).mockResolvedValue({});

      await deleteRecipe(req as any, res as Response, next);

      expect(RecipeModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'recipe123',
        author: 'user123',
      });
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $pull: { createdRecipes: 'recipe123' } }
      );
      expect(CommentModel.deleteMany).toHaveBeenCalledWith({ recipeId: 'recipe123' });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Recipe deleted successfully',
      });
    });

    it('should call next with NotFoundError when recipe not found', async () => {
      req.params = { id: 'recipe123' };
      req.userId = 'user123';
      (RecipeModel.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteRecipe(req as any, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found or you are not the author');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- getCategories ----------

  describe('getCategories', () => {
    it('should return sorted non-empty categories', async () => {
      (RecipeModel.distinct as jest.Mock).mockResolvedValue(['Dessert', 'Main', '', '  ', 'Soup']);

      await getCategories(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: ['Dessert', 'Main', 'Soup'],
      });
    });
  });

  // ---------- getTags ----------

  describe('getTags', () => {
    it('should return sorted non-empty tags', async () => {
      (RecipeModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: null, tags: ['vegan', '', '  ', 'quick'] },
      ]);

      await getTags(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: ['quick', 'vegan'],
      });
    });

    it('should return empty array when no tags', async () => {
      (RecipeModel.aggregate as jest.Mock).mockResolvedValue([]);

      await getTags(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  // ---------- getAreas ----------

  describe('getAreas', () => {
    it('should return sorted non-empty areas', async () => {
      (RecipeModel.distinct as jest.Mock).mockResolvedValue(['Italian', '', 'Mexican', '  ']);

      await getAreas(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: ['Italian', 'Mexican'],
      });
    });
  });

  // ---------- filterRecipesHandler ----------

  describe('filterRecipesHandler', () => {
    const setupFindChain = (recipes: any[]) => {
      const mockLean = jest.fn().mockResolvedValue(recipes);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      (RecipeModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate });
    };

    it('should return filtered recipes with pagination', async () => {
      req.query = { difficulty: 'easy' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(12);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await filterRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith({ difficulty: 'easy' });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipes: [],
          pagination: { total: 0, page: 1, limit: 12, pages: 0 },
        },
      });
    });

    it('should apply search with $or conditions', async () => {
      req.query = { search: 'pasta' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(12);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await filterRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: { $regex: 'pasta', $options: 'i' } },
          ]),
        })
      );
    });

    it('should apply exactMatch to title', async () => {
      req.query = { search: 'Pasta', exactMatch: 'true' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(12);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await filterRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith({
        title: { $regex: '^Pasta$', $options: 'i' },
      });
    });

    it('should apply category filter', async () => {
      req.query = { categories: ['Italian', 'Mexican'] };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(12);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await filterRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith({
        category: { $in: ['Italian', 'Mexican'] },
      });
    });

    it('should apply cooking time and rating filters', async () => {
      req.query = { maxCookingTime: '60', minRating: '4' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(12);

      setupFindChain([]);
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await filterRecipesHandler(req as Request, res as Response, next);

      expect(RecipeModel.find).toHaveBeenCalledWith({
        cookingTime: { $lte: 60 },
        rating: { $gte: 4 },
      });
    });

    it('should sort by popular when sort=popular', async () => {
      req.query = { sort: 'popular' };
      (validation.validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(12);

      const mockSort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      (RecipeModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({ sort: mockSort }),
      });
      (RecipeModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await filterRecipesHandler(req as Request, res as Response, next);

      expect(mockSort).toHaveBeenCalledWith({ ratingCount: -1 });
    });
  });
});