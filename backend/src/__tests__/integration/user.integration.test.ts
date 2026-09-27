import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  getUserById,
  getCreatedRecipes,
  getFavorites,
  getUsers,
  searchUsers,
} from '../../controllers/user.controller';
import { UserModel } from '../../models/User.model';
import { RecipeModel } from '../../models/Recipe.model';
import bcrypt from 'bcryptjs';

describe('User Controller Integration Tests', () => {
  let req: any;
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
    res = { json: jsonMock, status: statusMock };
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);
    const shortId = () => Math.random().toString(36).slice(2, 8);

    const user1 = await UserModel.create({
      username: `u1_${shortId()}`,
      email: `user1_${Date.now()}@test.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: [],
    });
    testUserId1 = user1._id.toString();

    const user2 = await UserModel.create({
      username: `u2_${shortId()}`,
      email: `user2_${Date.now()}@test.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: [],
    });
    testUserId2 = user2._id.toString();

    const recipe = await RecipeModel.create({
      title: `Test Recipe ${Date.now()}`,
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      author: testUserId1,
      source: 'user',
    });
    testRecipeId = recipe._id.toString();

    await UserModel.findByIdAndUpdate(testUserId1, {
      $push: { createdRecipes: testRecipeId },
    });

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId1,
      user: { _id: testUserId1 },
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
  });

  // ---------- getUserById ----------

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      req.params = { userId: testUserId1 };

      await getUserById(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data._id).toBe(testUserId1);
      expect(responseData.data.username).toContain('u1_');
      expect(responseData.data.recipeCount).toBe(1);
      expect(responseData.data.followersCount).toBe(0);
      expect(responseData.data.followingCount).toBe(0);
    });

    it('should return isFollowing=true when current user follows target', async () => {
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 },
      });

      req.userId = testUserId1;
      req.params = { userId: testUserId2 };

      await getUserById(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFollowing).toBe(true);
      expect(responseData.data._id).toBe(testUserId2);
    });

    it('should return isFollowing=false when current user does not follow target', async () => {
      req.userId = testUserId1;
      req.params = { userId: testUserId2 };

      await getUserById(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFollowing).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: fakeId };

      await getUserById(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getCreatedRecipes ----------

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

    it('should return empty array for user with no recipes', async () => {
      req.params = { userId: testUserId2 };

      await getCreatedRecipes(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.createdRecipes).toHaveLength(0);
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: fakeId };

      await getCreatedRecipes(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getFavorites ----------

  describe('getFavorites', () => {
    it('should get user favorites', async () => {
      await UserModel.findByIdAndUpdate(testUserId1, {
        $push: { favorites: testRecipeId },
      });

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

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: fakeId };

      await getFavorites(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getUsers ----------

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

    it('should mark isFollowing=true when current user follows a listed user', async () => {
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 },
      });

      req.user = { _id: testUserId1 };
      req.query = {};

      await getUsers(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      const user2 = responseData.data.users.find((u: any) => u._id === testUserId2);
      expect(user2.isFollowing).toBe(true);
    });

    it('should filter users by search', async () => {
      const uniquePrefix = `unique_${Date.now()}`;
      await UserModel.create({
        username: uniquePrefix,
        email: `${uniquePrefix}@test.com`,
        password: 'hashed',
      });

      req.query = { search: uniquePrefix };

      await getUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.users).toHaveLength(1);
      expect(responseData.data.users[0].username).toBe(uniquePrefix);
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

  // ---------- searchUsers ----------

  describe('searchUsers', () => {
    it('should search users by username', async () => {
      const uniquePrefix = `s_${Date.now()}`;
      await UserModel.create({
        username: uniquePrefix,
        email: `${uniquePrefix}@test.com`,
        password: 'hashed',
      });

      req.query = { q: uniquePrefix };

      await searchUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.users).toHaveLength(1);
      expect(responseData.data.users[0].username).toBe(uniquePrefix);
    });

    it('should return 400 when q is missing', async () => {
      req.query = {};

      await searchUsers(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Search query is required');
      expect(error.statusCode).toBe(400);
    });

    it('should return 400 when q is whitespace only', async () => {
      req.query = { q: '   ' };

      await searchUsers(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Search query is required');
      expect(error.statusCode).toBe(400);
    });

    it('should mark isFollowing=true for followed users in search results', async () => {
      const uniquePrefix = `f_${Date.now()}`;
      const followedUser = await UserModel.create({
        username: uniquePrefix,
        email: `${uniquePrefix}@test.com`,
        password: 'hashed',
        followers: [testUserId1],
      });

      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: followedUser._id },
      });

      req.user = { _id: testUserId1 };
      req.query = { q: uniquePrefix };

      await searchUsers(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.users).toHaveLength(1);
      expect(responseData.data.users[0].isFollowing).toBe(true);
    });
  });
});