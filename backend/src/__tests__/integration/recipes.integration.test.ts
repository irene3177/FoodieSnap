import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { 
  filterRecipesHandler,
  createRecipe,
  deleteRecipe,
  getRecipeByIdHandler,
  getRandomRecipesHandler,
  searchRecipesHandler,
  getTopRatedRecipes,
  getUserRecipes,
  updateRecipe
} from '../../controllers/recipes.controller';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import { CommentModel } from '../../models/Comment.model';
import * as mealDBService from '../../services/mealDB.service';
import bcrypt from 'bcryptjs';

// Mock external service
jest.mock('../../services/mealDB.service');

describe('Recipes Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId: string;
  let testUser: any;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = {
      json: jsonMock,
      status: statusMock
    };
    req = {
      query: {},
      params: {},
      body: {},
      userId: testUserId
    };
  };

  beforeAll(async () => {
    // Create test user once for all tests
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await UserModel.create({
      username: 'testuser',
      email: 'test@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      createdRecipes: [],
      favorites: []
    });
    testUserId = testUser._id.toString();
  });

  afterAll(async () => {
    // Clean up all data after tests
    await UserModel.deleteMany({});
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});
  });

  beforeEach(async () => {
    // Clear recipes and comments, but KEEP the test user
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});
    
    // Reset user's createdRecipes and favorites
    await UserModel.findByIdAndUpdate(testUserId, {
      $set: { createdRecipes: [], favorites: [] }
    });
    
    jest.clearAllMocks();
    
    // Setup default mocks for mealDB service
    (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue({
      recipes: [{ id: '1', title: 'Mock Recipe' }],
      totalPages: 1,
      currentPage: 1,
      totalRecipes: 1
    });
    
    (mealDBService.searchRecipes as jest.Mock).mockResolvedValue({
      recipes: [],
      total: 0,
      page: 1,
      pages: 1
    });
    
    (mealDBService.getRecipeById as jest.Mock).mockResolvedValue({
      id: '52772',
      title: 'Teriyaki Chicken',
      instructions: 'Cook chicken...'
    });
    
    setupResponseMocks();
  });

  describe('getRandomRecipesHandler', () => {
    it('should return random recipes with default parameters', async () => {
      await getRandomRecipesHandler(req as Request, res as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledTimes(1);
    });

    it('should use custom count and page from query', async () => {
      req.query = { count: '5', page: '2' };
      const mockResult = {
        recipes: [{ id: '1', title: 'Mock Recipe' }],
        totalPages: 5,
        currentPage: 2,
        totalRecipes: 25
      };
      (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue(mockResult);
      await getRandomRecipesHandler(req as Request, res as Response, next);
      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.currentPage).toBe(2);
    });
  });

  describe('searchRecipesHandler', () => {
    it('should return 400 if no search query provided', async () => {
      req.query = {};
      await searchRecipesHandler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Search query required');
      expect(error.statusCode).toBe(400);
    });

    it('should search recipes from TheMealDB API', async () => {
      req.query = { q: 'pasta' };
      const mockResult = {
        recipes: [{ id: '1', title: 'Pasta Recipe' }],
        total: 1,
        page: 1,
        pages: 1
      };
      (mealDBService.searchRecipes as jest.Mock).mockResolvedValue(mockResult);
      await searchRecipesHandler(req as Request, res as Response, next);
      expect(jsonMock).toHaveBeenCalledTimes(1);
    });

    it('should use custom page and limit from query', async () => {
      req.query = { q: 'pasta', page: '2', limit: '5' };
      const mockResult = { recipes: [], total: 0, page: 2, pages: 1 };
      (mealDBService.searchRecipes as jest.Mock).mockResolvedValue(mockResult);
      await searchRecipesHandler(req as Request, res as Response, next);
      expect(mealDBService.searchRecipes).toHaveBeenCalledWith('pasta', 2, 5);
    });
  });

  describe('getRecipeByIdHandler', () => {
    let savedRecipeId: string;

    beforeEach(async () => {
      const recipe = await RecipeModel.create({
        title: 'Test Recipe',
        description: 'Test description',
        ingredients: ['ingredient 1', 'ingredient 2'],
        instructions: ['step 1', 'step 2'],
        cookingTime: 30,
        difficulty: 'medium',
        author: testUserId,
        source: 'user',
        imageUrl: 'https://test.com/image.jpg'
      });
      savedRecipeId = recipe._id.toString();
    });

    it('should return recipe from MongoDB by valid ObjectId', async () => {
      req.params = { id: savedRecipeId };
      await getRecipeByIdHandler(req as Request, res as Response, next);
      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe('Test Recipe');
    });

    it('should return recipe from TheMealDB by external ID', async () => {
      req.params = { id: '52772' };
      await getRecipeByIdHandler(req as Request, res as Response, next);
      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.id).toBe('52772');
    });

    it('should return 404 for non-existent recipe', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      await getRecipeByIdHandler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getTopRatedRecipes', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        { title: 'Top Recipe', rating: 5, ratingCount: 10, ingredients: ['a'], instructions: ['b'], author: testUserId, source: 'user' },
        { title: 'Medium Recipe', rating: 3, ratingCount: 5, ingredients: ['a'], instructions: ['b'], author: testUserId, source: 'user' },
        { title: 'Low Recipe', rating: 1, ratingCount: 1, ingredients: ['a'], instructions: ['b'], author: testUserId, source: 'user' }
      ]);
    });

    it('should return top rated recipes sorted by rating', async () => {
      await getTopRatedRecipes(req as Request, res as Response, next);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data[0].rating).toBe(5);
      expect(responseData.data[1].rating).toBe(3);
      expect(responseData.data[2].rating).toBe(1);
    });

    it('should respect limit parameter', async () => {
      req.query = { limit: '2' };
      await getTopRatedRecipes(req as Request, res as Response, next);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(2);
    });
  });

  describe('getUserRecipes', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        { title: 'User Recipe 1', author: testUserId, ingredients: ['a'], instructions: ['b'], source: 'user' },
        { title: 'User Recipe 2', author: testUserId, ingredients: ['a'], instructions: ['b'], source: 'user' }
      ]);
    });

    it('should return all recipes for a specific user', async () => {
      req.params = { userId: testUserId };
      await getUserRecipes(req as Request, res as Response, next);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(2);
    });
  });

  describe('createRecipe', () => {
    const recipeData = {
      title: 'New Recipe',
      description: 'Delicious recipe',
      ingredients: ['ingredient 1', 'ingredient 2'],
      instructions: ['step 1', 'step 2'],
      cookingTime: 30,
      difficulty: 'medium',
      imageUrl: 'https://picsum.photos/400/300'
    };

    it('should create a new recipe successfully', async () => {
      req.body = recipeData;
      await createRecipe(req as any, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(201);
      
      const savedRecipe = await RecipeModel.findOne({ title: 'New Recipe' });
      expect(savedRecipe).toBeTruthy();
    });
  });

  describe('updateRecipe', () => {
    let recipeId: string;

    beforeEach(async () => {
      const recipe = await RecipeModel.create({
        title: 'Original Title',
        difficulty: 'easy',
        cookingTime: 15,
        ingredients: ['test'],
        instructions: ['test'],
        author: testUserId,
        source: 'user'
      });
      recipeId = recipe._id.toString();
    });

    it('should update recipe successfully', async () => {
      req.params = { id: recipeId };
      req.body = { title: 'Updated Title', difficulty: 'hard' };
      await updateRecipe(req as any, res as Response, next);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.title).toBe('Updated Title');
    });
  });

  describe('deleteRecipe', () => {
    let recipeId: string;

    beforeEach(async () => {
      const recipe = await RecipeModel.create({
        title: 'To Delete',
        difficulty: 'easy',
        ingredients: ['test'],
        instructions: ['test'],
        author: testUserId,
        source: 'user'
      });
      recipeId = recipe._id.toString();
      
      await UserModel.findByIdAndUpdate(testUserId, {
        $push: { createdRecipes: recipeId }
      });
    });

    it('should delete recipe successfully', async () => {
      req.params = { id: recipeId };
      await deleteRecipe(req as any, res as Response, next);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Recipe deleted successfully'
      });
    });

    // it('should remove recipe from user\'s createdRecipes', async () => {
    //   req.params = { id: recipeId };
      
    //   // Check before
    //   let beforeUser = await UserModel.findById(testUserId);
    //   expect(beforeUser?.createdRecipes.map(id => id.toString())).toContain(recipeId);
      
    //   // Act
    //   await deleteRecipe(req as any, res as Response, next);
      
    //   // Assert
    //   const user = await UserModel.findById(testUserId);
    //   expect(user?.createdRecipes?.map(id => id.toString())).not.toContain(recipeId);
    // });
  });

  describe('filterRecipesHandler', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        { title: 'Easy Pasta', difficulty: 'easy', cookingTime: 15, ingredients: ['pasta', 'sauce'], instructions: ['cook'], author: testUserId, source: 'user', rating: 4, ratingCount: 10, category: 'pasta', createdAt: new Date('2024-01-01') },
        { title: 'Hard Steak', difficulty: 'hard', cookingTime: 45, ingredients: ['steak', 'salt'], instructions: ['grill'], author: testUserId, source: 'user', rating: 5, ratingCount: 20, category: 'meat', createdAt: new Date('2024-01-02') },
        { title: 'Medium Chicken', difficulty: 'medium', cookingTime: 30, ingredients: ['chicken', 'spices'], instructions: ['cook'], author: testUserId, source: 'user', rating: 3, ratingCount: 5, category: 'chicken', createdAt: new Date('2024-01-03') }
      ]);
    });

    it('should return all recipes without filters', async () => {
      await filterRecipesHandler(req as Request, res as Response, next);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(3);
    });

    it('should filter by difficulty', async () => {
      req.query = { difficulty: 'easy' };
      await filterRecipesHandler(req as Request, res as Response, next);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(1);
      expect(responseData.data.recipes[0].difficulty).toBe('easy');
    });
  });
});