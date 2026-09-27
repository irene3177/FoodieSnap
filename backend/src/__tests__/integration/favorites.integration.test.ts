import mongoose from 'mongoose';
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
import bcrypt from 'bcryptjs';

describe('Favorites Controller Integration Tests', () => {
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId: string;
  let testRecipeId1: string;
  let testRecipeId2: string;
  let testRecipeId3: string;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = { json: jsonMock, status: statusMock };
  };

  const createTestUser = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return UserModel.create({
      username: `fav_${Math.random().toString(36).slice(2, 8)}`,
      email: `fav_${Date.now()}@favtest.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
    });
  };

  beforeEach(async () => {
    await UserModel.deleteMany({ email: /@favtest\.com$/ });
    await RecipeModel.deleteMany({});

    const user = await createTestUser();
    testUserId = user._id.toString();

    const recipe1 = await RecipeModel.create({
      title: 'Recipe 1',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user',
    });
    testRecipeId1 = recipe1._id.toString();

    const recipe2 = await RecipeModel.create({
      title: 'Recipe 2',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user',
    });
    testRecipeId2 = recipe2._id.toString();

    const recipe3 = await RecipeModel.create({
      title: 'Recipe 3',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user',
    });
    testRecipeId3 = recipe3._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId,
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@favtest\.com$/ });
    await RecipeModel.deleteMany({});
  });

  // ---------- addToFavorites ----------

  describe('addToFavorites', () => {
    it('should add recipe to favorites', async () => {
      req.params = { recipeId: testRecipeId1 };

      await addToFavorites(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.isFavorite).toBe(true);
      expect(responseData.data.favoritesCount).toBe(1);

      const user = await UserModel.findById(testUserId);
      const favoriteIds = user?.favorites?.map((id) => id.toString()) ?? [];
      expect(favoriteIds).toContain(testRecipeId1);
    });

    it('should not add duplicate recipe to favorites', async () => {
      req.params = { recipeId: testRecipeId1 };
      await addToFavorites(req, res as Response, next);

      let user = await UserModel.findById(testUserId);
      let favorites = user?.favorites?.map((id) => id.toString()) ?? [];
      expect(favorites).toHaveLength(1);

      await addToFavorites(req, res as Response, next);

      user = await UserModel.findById(testUserId);
      favorites = user?.favorites?.map((id) => id.toString()) ?? [];
      expect(favorites).toHaveLength(1);
      expect(favorites).toContain(testRecipeId1);
    });

    it('should return 404 if recipe not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { recipeId: nonExistentId };

      await addToFavorites(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getFavorites ----------

  describe('getFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2] },
      });
    });

    it('should get all favorites', async () => {
      await getFavorites(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
    });

    it('should return empty array if no favorites', async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [] },
      });

      await getFavorites(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(0);
    });
  });

  // ---------- checkFavorite ----------

  describe('checkFavorite', () => {
    it('should return true if recipe is in favorites', async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1] },
      });
      req.params = { recipeId: testRecipeId1 };

      await checkFavorite(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFavorite).toBe(true);
    });

    it('should return false if recipe is not in favorites', async () => {
      req.params = { recipeId: testRecipeId1 };

      await checkFavorite(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFavorite).toBe(false);
    });

    it('should return 404 if recipe not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { recipeId: nonExistentId };

      await checkFavorite(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 404 if user not found', async () => {
      req.params = { recipeId: testRecipeId1 };
      req.userId = new mongoose.Types.ObjectId().toString();

      await checkFavorite(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- removeFromFavorites ----------

  describe('removeFromFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2] },
      });
    });

    it('should remove recipe from favorites', async () => {
      req.params = { recipeId: testRecipeId1 };

      await removeFromFavorites(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFavorite).toBe(false);
      expect(responseData.data.favoritesCount).toBe(1);

      const user = await UserModel.findById(testUserId);
      const favoriteIds = user?.favorites?.map((id) => id.toString()) ?? [];
      expect(favoriteIds).not.toContain(testRecipeId1);
      expect(favoriteIds).toContain(testRecipeId2);
    });

    it('should return 404 if recipe not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { recipeId: nonExistentId };

      await removeFromFavorites(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- clearAllFavorites ----------

  describe('clearAllFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2, testRecipeId3] },
      });
    });

    it('should clear all favorites', async () => {
      await clearAllFavorites(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.message).toBe('All favorites cleared successfully');
      expect(responseData.data.favoritesCount).toBe(0);

      const user = await UserModel.findById(testUserId);
      expect(user?.favorites).toHaveLength(0);
    });
  });

  // ---------- reorderFavorites ----------

  describe('reorderFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2, testRecipeId3] },
      });
    });

    it('should reorder favorites', async () => {
      const reorderedIds = [testRecipeId3, testRecipeId1, testRecipeId2];
      req.body = { reorderedIds };

      await reorderFavorites(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.message).toBe('Favorites reordered successfully');

      const user = await UserModel.findById(testUserId);
      const favoriteIds = user?.favorites?.map((id) => id.toString()) ?? [];
      expect(favoriteIds).toEqual(reorderedIds);
    });

    it('should return 404 if user not found', async () => {
      req.userId = new mongoose.Types.ObjectId().toString();
      req.body = { reorderedIds: [testRecipeId1] };

      await reorderFavorites(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });
});