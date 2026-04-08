import { Request, Response } from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  clearAllFavorites,
  reorderFavorites
} from '../../controllers/favorites.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';
import NotFoundError from '../../errors/notFoundError';

// Mock dependencies
jest.mock('../../models/User.model');
jest.mock('../../models/Recipe.model');
jest.mock('../../utils/validation');
jest.mock('../../errors/notFoundError');

describe('Favorites Controller Unit Tests', () => {
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

  describe('getFavorites', () => {
    it('should return user favorites', async () => {
      // Arrange
      const mockFavorites = [{ _id: 'recipe1', title: 'Recipe 1' }];
      const mockUser = {
        _id: 'user123',
        favorites: mockFavorites
      };
      (UserModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await getFavorites(req as any, res as Response, next);

      // Assert
      expect(UserModel.findById).toHaveBeenCalledWith('user123');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockFavorites
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return NotFoundError if user not found', async () => {
      // Arrange
      (UserModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await getFavorites(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('User not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('addToFavorites', () => {
    const recipeId = 'recipe123';

    it('should add recipe to favorites successfully', async () => {
      // Arrange
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });
      
      const mockUser = {
        _id: 'user123',
        favorites: [{ _id: recipeId }],
        favoritesCount: 1
      };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await addToFavorites(req as any, res as Response, next);

      // Assert
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
          favoritesCount: 1
        }
      });
    });

    it('should return NotFoundError if recipe not found', async () => {
      // Arrange
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await addToFavorites(req as any, res as Response, next);

      // Assert
      expect(NotFoundError).toHaveBeenCalledWith('Recipe not found');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('removeFromFavorites', () => {
    const recipeId = 'recipe123';

    it('should remove recipe from favorites successfully', async () => {
      // Arrange
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });
      
      const mockUser = {
        _id: 'user123',
        favorites: [],
        favoritesCount: 0
      };
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await removeFromFavorites(req as any, res as Response, next);

      // Assert
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
          favoritesCount: 0
        }
      });
    });
  });

  describe('checkFavorite', () => {
    const recipeId = 'recipe123';

    it('should return true if recipe is favorite', async () => {
      // Arrange
      req.params = { recipeId };
      (RecipeModel.findById as jest.Mock).mockResolvedValue({ _id: recipeId });
      
      const mockUser = {
        _id: 'user123',
        favorites: [{ _id: recipeId }],
        favoritesCount: 1
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock the some method
      mockUser.favorites.some = jest.fn().mockReturnValue(true);

      // Act
      await checkFavorite(req as any, res as Response, next);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          recipeId,
          isFavorite: true,
          favoritesCount: 1
        }
      });
    });
  });

  describe('clearAllFavorites', () => {
    it('should clear all favorites successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        favorites: []
      };
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await clearAllFavorites(req as any, res as Response, next);

      // Assert
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { favorites: [] } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'All favorites cleared successfully',
          favoritesCount: 0
        }
      });
    });
  });

  describe('reorderFavorites', () => {
    it('should reorder favorites successfully', async () => {
      // Arrange
      const reorderedIds = ['recipe3', 'recipe1', 'recipe2'];
      req.body = { reorderedIds };
      
      const mockUser = {
        _id: 'user123',
        favorites: reorderedIds
      };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await reorderFavorites(req as any, res as Response, next);

      // Assert
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { favorites: reorderedIds } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Favorites reordered successfully',
          favorites: reorderedIds
        }
      });
    });
  });
});