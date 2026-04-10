import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getRecipeRating,
  getUserRatings,
  rateRecipe,
  deleteRating
} from '../../controllers/rating.controller';
import { RatingModel } from '../../models/Rating.model';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Rating Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string }>;
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
    res = {
      json: jsonMock,
      status: statusMock
    };
  };

  beforeEach(async () => {
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

    // Create test recipe
    const recipe = await RecipeModel.create({
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId,
      source: 'user'
    });
    testRecipeId = recipe._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
    await RatingModel.deleteMany({});
  });

  describe('rateRecipe', () => {
    it('should create a new rating', async () => {
      req.params = { recipeId: testRecipeId };
      req.body = { value: 5 };

      await rateRecipe(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.value).toBe(5);
      expect(responseData.data.stats.totalRatings).toBe(1);
      expect(responseData.data.stats.averageRating).toBe(5);

      // Verify in database
      const rating = await RatingModel.findOne({ recipeId: testRecipeId, userId: testUserId });
      expect(rating).toBeTruthy();
      expect(rating?.value).toBe(5);
    });

    it('should update existing rating', async () => {
      // First create a rating
      req.params = { recipeId: testRecipeId };
      req.body = { value: 3 };
      await rateRecipe(req as any, res as Response, next);
      
      // Update rating
      req.body = { value: 4 };
      await rateRecipe(req as any, res as Response, next);

      const responseData = jsonMock.mock.calls[1][0];
      expect(responseData.data.value).toBe(4);
      
      // Verify in database
      const rating = await RatingModel.findOne({ recipeId: testRecipeId, userId: testUserId });
      expect(rating?.value).toBe(4);
    });

    it('should return 404 if recipe not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { recipeId: fakeId };
      req.body = { value: 5 };

      await rateRecipe(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getRecipeRating', () => {
    it('should get rating stats for a recipe', async () => {
      // Create ratings directly via API
      const otherUserId1 = new mongoose.Types.ObjectId();
      const otherUserId2 = new mongoose.Types.ObjectId();
      
      // Create ratings directly in database
      await RatingModel.create([
        { recipeId: testRecipeId, userId: testUserId, value: 5 },
        { recipeId: testRecipeId, userId: otherUserId1, value: 4 },
        { recipeId: testRecipeId, userId: otherUserId2, value: 5 }
      ]);
      
      // Verify ratings were created
      const count = await RatingModel.countDocuments({ recipeId: testRecipeId });
      expect(count).toBe(3);
      
      // Update recipe rating stats to match the ratings
      await RecipeModel.findByIdAndUpdate(testRecipeId, {
        rating: 4.67,
        ratingCount: 3
      });

      req.params = { recipeId: testRecipeId };

      await getRecipeRating(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.totalRatings).toBe(3);
      expect(responseData.data.averageRating).toBeCloseTo(4.67, 1);
      expect(responseData.data.distribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 1, 5: 2
      });
    });
  });

  describe('getUserRatings', () => {
    beforeEach(async () => {
      await RatingModel.create([
        { recipeId: testRecipeId, userId: testUserId, value: 5 },
        { recipeId: new mongoose.Types.ObjectId(), userId: testUserId, value: 4 }
      ]);
    });

    it('should get all ratings by current user', async () => {
      await getUserRatings(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(Object.keys(responseData.data)).toHaveLength(2);
      expect(Object.values(responseData.data)).toContain(5);
      expect(Object.values(responseData.data)).toContain(4);
    });
  });

  describe('deleteRating', () => {
    beforeEach(async () => {
      await RatingModel.create([
        { recipeId: testRecipeId, userId: testUserId, value: 5 },
        { recipeId: testRecipeId, userId: new mongoose.Types.ObjectId(), value: 4 }
      ]);
    });

    it('should delete user rating', async () => {
      req.params = { recipeId: testRecipeId };

      await deleteRating(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.stats.totalRatings).toBe(1);
      expect(responseData.data.stats.averageRating).toBe(4);

      // Verify in database
      const rating = await RatingModel.findOne({ recipeId: testRecipeId, userId: testUserId });
      expect(rating).toBeNull();
    });
  });
});