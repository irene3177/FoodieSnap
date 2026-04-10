import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getUserById,
  getCreatedRecipes,
  getFavorites,
  getUsers
} from '../../controllers/user.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';
import bcrypt from 'bcryptjs';

describe('User Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId1: string;
  let testUserId2: string;
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
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user1 = await UserModel.create({
      username: `user1_${Date.now()}`,
      email: `user1_${Date.now()}@test.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: []
    });
    testUserId1 = user1._id.toString();

    const user2 = await UserModel.create({
      username: `user2_${Date.now()}`,
      email: `user2_${Date.now()}@test.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: []
    });
    testUserId2 = user2._id.toString();

    // Create test recipe for user1
    const recipe = await RecipeModel.create({
      title: `Test Recipe ${Date.now()}`,
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId1,
      source: 'user'
    });
    testRecipeId = recipe._id.toString();

    // Add recipe to user's createdRecipes
    await UserModel.findByIdAndUpdate(testUserId1, {
      $push: { createdRecipes: testRecipeId }
    });

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId1
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
  });

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      req.params = { userId: testUserId1 };

      await getUserById(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data._id).toBe(testUserId1);
      expect(responseData.data.username).toContain('user1');
      expect(responseData.data.recipeCount).toBe(1);
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: fakeId };

      await getUserById(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getCreatedRecipes', () => {
    it('should get user created recipes', async () => {
      req.params = { userId: testUserId1 };

      await getCreatedRecipes(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.createdRecipes).toHaveLength(1);
      expect(responseData.data.createdRecipes[0]._id.toString()).toBe(testRecipeId);
    });
  });

  describe('getFavorites', () => {
    beforeEach(async () => {
      // Add recipe to favorites
      await UserModel.findByIdAndUpdate(testUserId1, {
        $push: { favorites: testRecipeId }
      });
    });

    it('should get user favorites', async () => {
      req.params = { userId: testUserId1 };

      await getFavorites(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.favorites).toHaveLength(1);
      expect(responseData.data.userId.toString()).toBe(testUserId1);
    });

    it('should return empty favorites for user with no favorites', async () => {
      req.params = { userId: testUserId2 };

      await getFavorites(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.favorites).toHaveLength(0);
      expect(responseData.data.userId.toString()).toBe(testUserId2);
    });
  });

  describe('getUsers', () => {
    it('should get paginated users list', async () => {
      req.query = { page: '1', limit: '10' };

      await getUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.users).toHaveLength(2);
      expect(responseData.data.total).toBe(2);
      expect(responseData.data.page).toBe(1);
      expect(responseData.data.pages).toBe(1);
    });

    it('should filter users by search', async () => {
      req.query = { search: 'user1' };

      await getUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.users).toHaveLength(1);
      expect(responseData.data.users[0].username).toContain('user1');
    });

    it('should return 400 for invalid sort field', async () => {
      req.query = { sortBy: 'invalidField' };

      await getUsers(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid sort field');
      expect(error.statusCode).toBe(400);
    });
  });
});