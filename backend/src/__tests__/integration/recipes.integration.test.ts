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
  updateRecipe,
} from '../../controllers/recipes.controller';
import { RecipeModel } from '../../models/Recipe.model';
import { UserModel } from '../../models/User.model';
import { CommentModel } from '../../models/Comment.model';
import * as mealDBService from '../../services/mealDB.service';
import bcrypt from 'bcryptjs';

jest.mock('../../services/mealDB.service');

describe('Recipes Controller Integration Tests', () => {
  let req: any;
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
    res = { json: jsonMock, status: statusMock };
    req = {
      query: {},
      params: {},
      body: {},
      userId: testUserId,
    };
  };

  beforeEach(async () => {
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});
    await UserModel.deleteMany({ email: /@rectest\.com$/ });

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await UserModel.create({
      username: `rec_${Math.random().toString(36).slice(2, 8)}`,
      email: `rec_${Date.now()}@rectest.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      createdRecipes: [],
      favorites: [],
    });
    testUserId = testUser._id.toString();

    jest.clearAllMocks();

    (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue({
      recipes: [{ id: '1', title: 'Mock Recipe' }],
      totalPages: 1,
      currentPage: 1,
      totalRecipes: 1,
    });

    (mealDBService.getRecipeById as jest.Mock).mockResolvedValue({
      id: '52772',
      title: 'Teriyaki Chicken',
      instructions: 'Cook chicken...',
    });

    setupResponseMocks();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@rectest\.com$/ });
    await RecipeModel.deleteMany({});
    await CommentModel.deleteMany({});
  });

  // ---------- getRandomRecipesHandler ----------

  describe('getRandomRecipesHandler', () => {
    it('should return random recipes with default parameters', async () => {
      await getRandomRecipesHandler(req as Request, res as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.recipes).toHaveLength(1);
    });

    it('should use custom count and page from query', async () => {
      req.query = { count: '5', page: '2' };

      (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue({
        recipes: [{ id: '1', title: 'Mock Recipe' }],
        totalPages: 5,
        currentPage: 2,
        totalRecipes: 25,
      });

      await getRandomRecipesHandler(req as Request, res as Response, next);

      expect(mealDBService.getRandomRecipes).toHaveBeenCalledWith(5, 2);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.currentPage).toBe(2);
    });
  });

  // ---------- searchRecipesHandler ----------

  describe('searchRecipesHandler', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        {
          title: 'Creamy Pasta',
          description: 'Italian pasta',
          ingredients: ['pasta', 'cream'],
          instructions: ['cook'],
          author: testUserId,
          source: 'user',
        },
        {
          title: 'Grilled Chicken',
          description: 'Simple chicken',
          ingredients: ['chicken'],
          instructions: ['grill'],
          author: testUserId,
          source: 'user',
        },
        {
          title: 'Pasta Carbonara',
          description: 'Classic',
          ingredients: ['pasta', 'eggs'],
          instructions: ['cook'],
          author: testUserId,
          source: 'user',
        },
      ]);
    });

    it('should return 400 if no search query provided', async () => {
      req.query = {};

      await searchRecipesHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Search query required');
      expect(error.statusCode).toBe(400);
    });

    it('should find recipes by title in MongoDB', async () => {
      req.query = { q: 'pasta' };

      await searchRecipesHandler(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(2);
      const titles = responseData.data.recipes.map((r: any) => r.title);
      expect(titles).toEqual(
        expect.arrayContaining(['Creamy Pasta', 'Pasta Carbonara'])
      );
    });

    it('should use custom page and limit from query', async () => {
      req.query = { q: 'pasta', page: '1', limit: '1' };

      await searchRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(1);
      expect(responseData.data.limit).toBe(1);
      expect(responseData.data.total).toBe(2);
    });

    it('should return empty array when no recipes match', async () => {
      req.query = { q: 'nonexistentxyz' };

      await searchRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(0);
      expect(responseData.data.total).toBe(0);
    });
  });

  // ---------- getRecipeByIdHandler ----------

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
        imageUrl: 'https://test.com/image.jpg',
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
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getTopRatedRecipes ----------

  describe('getTopRatedRecipes', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        {
          title: 'Top Recipe',
          rating: 5,
          ratingCount: 10,
          ingredients: ['a'],
          instructions: ['b'],
          author: testUserId,
          source: 'user',
        },
        {
          title: 'Medium Recipe',
          rating: 3,
          ratingCount: 5,
          ingredients: ['a'],
          instructions: ['b'],
          author: testUserId,
          source: 'user',
        },
        {
          title: 'Low Recipe',
          rating: 1,
          ratingCount: 1,
          ingredients: ['a'],
          instructions: ['b'],
          author: testUserId,
          source: 'user',
        },
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

    it('should exclude recipes without ratings', async () => {
      await RecipeModel.create({
        title: 'Unrated',
        rating: 0,
        ratingCount: 0,
        ingredients: ['a'],
        instructions: ['b'],
        author: testUserId,
        source: 'user',
      });

      await getTopRatedRecipes(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      const titles = responseData.data.map((r: any) => r.title);
      expect(titles).not.toContain('Unrated');
    });
  });

  // ---------- getUserRecipes ----------

  describe('getUserRecipes', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        {
          title: 'User Recipe 1',
          author: testUserId,
          ingredients: ['a'],
          instructions: ['b'],
          source: 'user',
        },
        {
          title: 'User Recipe 2',
          author: testUserId,
          ingredients: ['a'],
          instructions: ['b'],
          source: 'user',
        },
      ]);
    });

    it('should return all recipes for a specific user', async () => {
      req.params = { userId: testUserId };

      await getUserRecipes(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(2);
    });

    it('should return empty array for user with no recipes', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: otherUserId };

      await getUserRecipes(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data).toHaveLength(0);
    });
  });

  // ---------- createRecipe ----------

  describe('createRecipe', () => {
    const recipeData = {
      title: 'New Recipe',
      description: 'Delicious recipe',
      ingredients: ['ingredient 1', 'ingredient 2'],
      instructions: ['step 1', 'step 2'],
      cookingTime: 30,
      difficulty: 'medium',
      imageUrl: 'https://picsum.photos/400/300',
    };

    it('should create a new recipe successfully', async () => {
      req.body = recipeData;

      await createRecipe(req, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);

      const savedRecipe = await RecipeModel.findOne({ title: 'New Recipe' });
      expect(savedRecipe).toBeTruthy();
      expect(savedRecipe?.author.toString()).toBe(testUserId);
    });

    it('should add the new recipe to user createdRecipes', async () => {
      req.body = recipeData;

      await createRecipe(req, res as Response, next);

      const updatedUser = await UserModel.findById(testUserId);
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.createdRecipes).toHaveLength(1);
    });
  });

  // ---------- updateRecipe ----------

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
        source: 'user',
      });
      recipeId = recipe._id.toString();
    });

    it('should update recipe successfully', async () => {
      req.params = { id: recipeId };
      req.body = { title: 'Updated Title', difficulty: 'hard' };

      await updateRecipe(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.title).toBe('Updated Title');
      expect(responseData.data.difficulty).toBe('hard');
    });

    it('should return 404 when updating recipe of another user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const recipe = await RecipeModel.create({
        title: 'Other User Recipe',
        author: otherUserId,
        ingredients: ['a'],
        instructions: ['b'],
        source: 'user',
      });

      req.params = { id: recipe._id.toString() };
      req.body = { title: 'Hacked' };

      await updateRecipe(req, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found or you are not the author');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- deleteRecipe ----------

  describe('deleteRecipe', () => {
    let recipeId: string;

    beforeEach(async () => {
      const recipe = await RecipeModel.create({
        title: 'To Delete',
        difficulty: 'easy',
        ingredients: ['test'],
        instructions: ['test'],
        author: testUserId,
        source: 'user',
      });
      recipeId = recipe._id.toString();

      await UserModel.findByIdAndUpdate(testUserId, {
        $push: { createdRecipes: recipeId },
      });
    });

    it('should delete recipe successfully', async () => {
      req.params = { id: recipeId };

      await deleteRecipe(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Recipe deleted successfully',
      });

      const deleted = await RecipeModel.findById(recipeId);
      expect(deleted).toBeNull();
    });

    it("should remove recipe from user's createdRecipes", async () => {
      req.params = { id: recipeId };

      const beforeUser = await UserModel.findById(testUserId);
      expect(beforeUser).not.toBeNull();
      expect(
        beforeUser?.createdRecipes.map((id: any) => id.toString())
      ).toContain(recipeId);

      await deleteRecipe(req, res as Response, next);

      const user = await UserModel.findById(testUserId);
      expect(user).not.toBeNull();
      expect(
        user?.createdRecipes?.map((id: any) => id.toString())
      ).not.toContain(recipeId);
    });

    it('should delete all comments for the recipe', async () => {
      await CommentModel.create({
        text: 'Nice',
        recipeId,
        userId: testUserId,
        userName: 'test',
      });

      req.params = { id: recipeId };

      await deleteRecipe(req, res as Response, next);

      const comments = await CommentModel.find({ recipeId });
      expect(comments).toHaveLength(0);
    });

    it('should return 404 when deleting recipe of another user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const recipe = await RecipeModel.create({
        title: 'Other User Recipe',
        author: otherUserId,
        ingredients: ['a'],
        instructions: ['b'],
        source: 'user',
      });

      req.params = { id: recipe._id.toString() };

      await deleteRecipe(req, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Recipe not found or you are not the author');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- filterRecipesHandler ----------

  describe('filterRecipesHandler', () => {
    beforeEach(async () => {
      await RecipeModel.create([
        {
          title: 'Easy Pasta',
          difficulty: 'easy',
          cookingTime: 15,
          ingredients: ['pasta', 'sauce'],
          instructions: ['cook'],
          author: testUserId,
          source: 'user',
          rating: 4,
          ratingCount: 10,
          category: 'pasta',
          createdAt: new Date('2024-01-01'),
        },
        {
          title: 'Hard Steak',
          difficulty: 'hard',
          cookingTime: 45,
          ingredients: ['steak', 'salt'],
          instructions: ['grill'],
          author: testUserId,
          source: 'user',
          rating: 5,
          ratingCount: 20,
          category: 'meat',
          createdAt: new Date('2024-01-02'),
        },
        {
          title: 'Medium Chicken',
          difficulty: 'medium',
          cookingTime: 30,
          ingredients: ['chicken', 'spices'],
          instructions: ['cook'],
          author: testUserId,
          source: 'user',
          rating: 3,
          ratingCount: 5,
          category: 'chicken',
          createdAt: new Date('2024-01-03'),
        },
      ]);
    });

    it('should return all recipes without filters', async () => {
      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(3);
      expect(responseData.data.pagination.total).toBe(3);
    });

    it('should filter by difficulty', async () => {
      req.query = { difficulty: 'easy' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(1);
      expect(responseData.data.recipes[0].difficulty).toBe('easy');
    });

    it('should filter by maxCookingTime', async () => {
      req.query = { maxCookingTime: '30' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(2);
      responseData.data.recipes.forEach((r: any) => {
        expect(r.cookingTime).toBeLessThanOrEqual(30);
      });
    });

    it('should filter by minRating', async () => {
      req.query = { minRating: '4' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(2);
      responseData.data.recipes.forEach((r: any) => {
        expect(r.rating).toBeGreaterThanOrEqual(4);
      });
    });

    it('should sort by rating when sort=rating', async () => {
      req.query = { sort: 'rating' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes[0].rating).toBe(5);
    });

    it('should sort by ratingCount when sort=popular', async () => {
      req.query = { sort: 'popular' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes[0].ratingCount).toBe(20);
    });

    it('should apply search with $or conditions', async () => {
      req.query = { search: 'pasta' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes.length).toBeGreaterThanOrEqual(1);
      const titles = responseData.data.recipes.map((r: any) => r.title);
      expect(titles).toContain('Easy Pasta');
    });

    it('should paginate results', async () => {
      req.query = { page: '1', limit: '2' };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(2);
      expect(responseData.data.pagination.page).toBe(1);
      expect(responseData.data.pagination.limit).toBe(2);
      expect(responseData.data.pagination.pages).toBe(2);
    });

    it('should filter by categories array', async () => {
      req.query = { categories: ['pasta', 'meat'] };

      await filterRecipesHandler(req as Request, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.recipes).toHaveLength(2);
      const categories = responseData.data.recipes.map((r: any) => r.category);
      expect(categories).toEqual(expect.arrayContaining(['pasta', 'meat']));
    });
  });
});