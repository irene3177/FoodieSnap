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
import bcrypt from 'bcryptjs';

describe('Favorites Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string }>;
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
    res = {
      json: jsonMock,
      status: statusMock
    };
  };

  beforeAll(async () => {
    // Clean up
    // await UserModel.deleteMany({});
    // await RecipeModel.deleteMany({});
    
  });
  
  afterAll(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
  });
  
  beforeEach(async () => {
    // Clean up recipes and favorites
    await RecipeModel.deleteMany({ author: testUserId });
    await UserModel.findByIdAndUpdate(testUserId, { $set: { favorites: [] } });

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await UserModel.create({
      username: 'testuser',
      email: 'test@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: []
    });
    testUserId = user._id.toString();
    
    // Create fresh recipes
    const recipe1 = await RecipeModel.create({
      title: 'Recipe 1',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user'
    });
    testRecipeId1 = recipe1._id.toString();

    const recipe2 = await RecipeModel.create({
      title: 'Recipe 2',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user'
    });
    testRecipeId2 = recipe2._id.toString();

    const recipe3 = await RecipeModel.create({
      title: 'Recipe 3',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user'
    });
    testRecipeId3 = recipe3._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId
    };
  });

  describe('addToFavorites', () => {
    it('should add recipe to favorites', async () => {
      req.params = { recipeId: testRecipeId1 };
      await addToFavorites(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.isFavorite).toBe(true);
      expect(responseData.data.favoritesCount).toBe(1);

      const user = await UserModel.findById(testUserId);
      const favoriteIds = user?.favorites?.map(id => id.toString()) ?? [];
      expect(favoriteIds).toContain(testRecipeId1);
    });

    it('should not add duplicate recipe to favorites', async () => {
      // Add first time
      req.params = { recipeId: testRecipeId1 };
      await addToFavorites(req as any, res as Response, next);
      
      // Verify first addition
      let user = await UserModel.findById(testUserId);
      let favorites = user?.favorites?.map(id => id.toString()) ?? [];
      expect(favorites).toHaveLength(1);

      // Add second time
      await addToFavorites(req as any, res as Response, next);

      // Verify still only one
      user = await UserModel.findById(testUserId);
      favorites = user?.favorites?.map(id => id.toString()) ?? [];
      expect(favorites).toHaveLength(1);
      expect(favorites).toContain(testRecipeId1);
    });
  });

  describe('getFavorites', () => {
    beforeEach(async () => {
      // Add favorites directly via database
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2] }
      });
      
      // Verify
      await UserModel.findById(testUserId);
    });

    it('should get all favorites', async () => {
      await getFavorites(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
    });

    it('should return empty array if no favorites', async () => {
      await UserModel.findByIdAndUpdate(testUserId, { $set: { favorites: [] } });
      await getFavorites(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(0);
    });
  });

  describe('checkFavorite', () => {
    it('should return true if recipe is in favorites', async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1] }
      });
      req.params = { recipeId: testRecipeId1 };

      await checkFavorite(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFavorite).toBe(true);
    });

    it('should return false if recipe is not in favorites', async () => {
      req.params = { recipeId: testRecipeId1 };

      await checkFavorite(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFavorite).toBe(false);
    });
  });

  describe('removeFromFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2] }
      });
    });

    it('should remove recipe from favorites', async () => {
      req.params = { recipeId: testRecipeId1 };

      await removeFromFavorites(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFavorite).toBe(false);
      expect(responseData.data.favoritesCount).toBe(1);
    });
  });

  describe('clearAllFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2, testRecipeId3] }
      });
    });

    it('should clear all favorites', async () => {
      await clearAllFavorites(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.message).toBe('All favorites cleared successfully');
      expect(responseData.data.favoritesCount).toBe(0);

      const user = await UserModel.findById(testUserId);
      expect(user?.favorites).toHaveLength(0);
    });
  });

  describe('reorderFavorites', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: { favorites: [testRecipeId1, testRecipeId2, testRecipeId3] }
      });
    });

    it('should reorder favorites', async () => {
      const reorderedIds = [testRecipeId3, testRecipeId1, testRecipeId2];
      req.body = { reorderedIds };

      await reorderFavorites(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.message).toBe('Favorites reordered successfully');
      
      const user = await UserModel.findById(testUserId);
      const favoriteIds = user?.favorites?.map(id => id.toString()) ?? [];
      expect(favoriteIds).toEqual(reorderedIds);
    });
  });
});