import { Request, Response } from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  clearAllFavorites,
  reorderFavorites,
} from '../../controllers/favorites.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';

jest.mock('../../models/User.model');
jest.mock('../../models/Recipe.model');

describe('Favorites Controller Unit Tests', () => {
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

  // ---------- getFavorites ----------

  describe('getFavorites', () => {
    it('should return user favorites', async () => {
      const mockFavorites = [{ _id: 'recipe1', title: 'Recipe 1' }];
      const mockUser = { _id: 'user123', favorites: mockFavorites };

      (UserModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      await getFavorites(req, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('user123');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockFavorites,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with NotFoundError if user not found', async () => {
      (UserModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- addToFavorites ----------

  describe('addToFavorites', () => {
    const recipeId = 'recipe123';

    it('should add recipe to favorites successfully', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });

      const mockUser = { _id: 'user123', favorites: [{ _id: recipeId }] };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      await addToFavorites(req, res as Response, next);

      expect(RecipeModel.findById).toHaveBeenCalledWith(recipeId);
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $addToSet: { favorites: recipeId } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipeId,
          isFavorite: true,
          favoritesCount: 1,
        },
      });
    });

    it('should call next with NotFoundError if recipe not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      await addToFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found');
      expect(err.statusCode).toBe(404);
      expect(UserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should call next with NotFoundError if user not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await addToFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- removeFromFavorites ----------

  describe('removeFromFavorites', () => {
    const recipeId = 'recipe123';

    it('should remove recipe from favorites successfully', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });

      const mockUser = { _id: 'user123', favorites: [] };
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      await removeFromFavorites(req, res as Response, next);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $pull: { favorites: recipeId } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipeId,
          isFavorite: false,
          favoritesCount: 0,
        },
      });
    });

    it('should call next with NotFoundError if recipe not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      await removeFromFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found');
      expect(err.statusCode).toBe(404);
    });

    it('should call next with NotFoundError if user not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await removeFromFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- checkFavorite ----------

  describe('checkFavorite', () => {
    const recipeId = 'recipe123';

    it('should return isFavorite=true when recipe is in favorites', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });

      const mockUser = {
        _id: 'user123',
        favorites: [{ toString: () => recipeId }],
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await checkFavorite(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipeId,
          isFavorite: true,
          favoritesCount: 1,
        },
      });
    });

    it('should return isFavorite=false when recipe is not in favorites', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });

      const mockUser = {
        _id: 'user123',
        favorites: [{ toString: () => 'some-other-recipe' }],
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await checkFavorite(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipeId,
          isFavorite: false,
          favoritesCount: 1,
        },
      });
    });

    it('should call next with NotFoundError if recipe not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      await checkFavorite(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Recipe not found');
      expect(err.statusCode).toBe(404);
    });

    it('should call next with NotFoundError if user not found', async () => {
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await checkFavorite(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- clearAllFavorites ----------

  describe('clearAllFavorites', () => {
    it('should clear all favorites successfully', async () => {
      const mockUser = { _id: 'user123', favorites: [] };
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      await clearAllFavorites(req, res as Response, next);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { favorites: [] } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'All favorites cleared successfully',
          favoritesCount: 0,
        },
      });
    });

    it('should call next with NotFoundError if user not found', async () => {
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await clearAllFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- reorderFavorites ----------

  describe('reorderFavorites', () => {
    it('should reorder favorites successfully', async () => {
      const reorderedIds = ['recipe3', 'recipe1', 'recipe2'];
      req.body = { reorderedIds };

      const mockUser = { _id: 'user123', favorites: reorderedIds };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      await reorderFavorites(req, res as Response, next);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { favorites: reorderedIds } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Favorites reordered successfully',
          favorites: reorderedIds,
        },
      });
    });

    it('should call next with NotFoundError if user not found', async () => {
      req.body = { reorderedIds: ['recipe1'] };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await reorderFavorites(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });
});