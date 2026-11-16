import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getRecipeRating,
  getUserRatings,
  rateRecipe,
  deleteRating,
} from '../../controllers/rating.controller';
import { RatingModel } from '../../models/Rating.model';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Rating Controller Integration Tests', () => {
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId: string;
  let testRecipeId: string;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = { json: jsonMock, status: statusMock };
  };

  beforeEach(async () => {
    await RatingModel.deleteMany({});
    await RecipeModel.deleteMany({});
    await UserModel.deleteMany({ email: /@ratingtest\.com$/ });

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await UserModel.create({
      username: `rt_${Math.random().toString(36).slice(2, 8)}`,
      email: `rt_${Date.now()}@ratingtest.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
    });
    testUserId = user._id.toString();

    const recipe = await RecipeModel.create({
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user',
    });
    testRecipeId = recipe._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId,
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@ratingtest\.com$/ });
    await RecipeModel.deleteMany({});
    await RatingModel.deleteMany({});
  });

  // ---------- rateRecipe ----------

  describe('rateRecipe', () => {
    it('should create a new rating', async () => {
      req.params = { recipeId: testRecipeId };
      req.body = { value: 5 };

      await rateRecipe(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.value).toBe(5);
      expect(responseData.data.stats.totalRatings).toBe(1);
      expect(responseData.data.stats.averageRating).toBe(5);

      const rating = await RatingModel.findOne({
        recipeId: testRecipeId,
        userId: testUserId,
      });
      expect(rating).toBeTruthy();
      expect(rating?.value).toBe(5);
    });

    it('should update existing rating', async () => {
      req.params = { recipeId: testRecipeId };
      req.body = { value: 3 };
      await rateRecipe(req, res as Response, next);

      req.body = { value: 4 };
      await rateRecipe(req, res as Response, next);

      const responseData = jsonMock.mock.calls[1][0];
      expect(responseData.data.value).toBe(4);

      const rating = await RatingModel.findOne({
        recipeId: testRecipeId,
        userId: testUserId,
      });
      expect(rating?.value).toBe(4);
    });

    it('should update recipe with new average on rating', async () => {
      req.params = { recipeId: testRecipeId };
      req.body = { value: 4 };

      await rateRecipe(req, res as Response, next);

      const updatedRecipe = await RecipeModel.findById(testRecipeId);
      expect(updatedRecipe?.rating).toBe(4);
      expect(updatedRecipe?.ratingCount).toBe(1);
    });

    it('should return 404 if recipe not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { recipeId: fakeId };
      req.body = { value: 5 };

      await rateRecipe(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getRecipeRating ----------

  describe('getRecipeRating', () => {
    it('should get rating stats for a recipe', async () => {
      const otherUserId1 = new mongoose.Types.ObjectId();
      const otherUserId2 = new mongoose.Types.ObjectId();

      await RatingModel.create([
        { recipeId: testRecipeId, userId: testUserId, value: 5 },
        { recipeId: testRecipeId, userId: otherUserId1, value: 4 },
        { recipeId: testRecipeId, userId: otherUserId2, value: 5 },
      ]);

      const count = await RatingModel.countDocuments({ recipeId: testRecipeId });
      expect(count).toBe(3);

      await RecipeModel.findByIdAndUpdate(testRecipeId, {
        rating: 4.67,
        ratingCount: 3,
      });

      req.params = { recipeId: testRecipeId };

      await getRecipeRating(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.totalRatings).toBe(3);
      expect(responseData.data.averageRating).toBeCloseTo(4.67, 1);
      expect(responseData.data.distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 2,
      });
    });

    it('should return zero stats when there are no ratings', async () => {
      req.params = { recipeId: testRecipeId };

      await getRecipeRating(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.totalRatings).toBe(0);
      expect(responseData.data.averageRating).toBe(0);
      expect(responseData.data.distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('should return 404 if recipe not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { recipeId: fakeId };

      await getRecipeRating(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getUserRatings ----------

  describe('getUserRatings', () => {
    it('should get all ratings by current user', async () => {
      await RatingModel.create([
        { recipeId: testRecipeId, userId: testUserId, value: 5 },
        { recipeId: new mongoose.Types.ObjectId(), userId: testUserId, value: 4 },
      ]);

      await getUserRatings(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(Object.keys(responseData.data)).toHaveLength(2);
      expect(Object.values(responseData.data)).toContain(5);
      expect(Object.values(responseData.data)).toContain(4);
    });

    it('should return empty object when user has no ratings', async () => {
      await getUserRatings(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({});
    });
  });

  // ---------- deleteRating ----------

  describe('deleteRating', () => {
    it('should delete user rating and recalculate stats', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      await RatingModel.create([
        { recipeId: testRecipeId, userId: testUserId, value: 5 },
        { recipeId: testRecipeId, userId: otherUserId, value: 4 },
      ]);

      req.params = { recipeId: testRecipeId };

      await deleteRating(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.stats.totalRatings).toBe(1);
      expect(responseData.data.stats.averageRating).toBe(4);

      const rating = await RatingModel.findOne({
        recipeId: testRecipeId,
        userId: testUserId,
      });
      expect(rating).toBeNull();
    });

    it('should reset recipe rating when last rating is deleted', async () => {
      await RatingModel.create({
        recipeId: testRecipeId,
        userId: testUserId,
        value: 5,
      });

      await RecipeModel.findByIdAndUpdate(testRecipeId, {
        rating: 5,
        ratingCount: 1,
      });

      req.params = { recipeId: testRecipeId };

      await deleteRating(req, res as Response, next);

      const updatedRecipe = await RecipeModel.findById(testRecipeId);
      expect(updatedRecipe?.rating).toBe(0);
      expect(updatedRecipe?.ratingCount).toBe(0);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.stats.totalRatings).toBe(0);
      expect(responseData.data.stats.averageRating).toBe(0);
    });
  });
});