import { Request, Response } from 'express';
import { getRandomRecipesHandler } from '../../controllers/recipes.controller';
import * as mealDBService from '../../services/mealDB.service';
import * as validation from '../../utils/validation';

// Мокаем зависимости
jest.mock('../../services/mealDB.service');
jest.mock('../../utils/validation');

describe('getRandomRecipesHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      json: jsonMock,
      status: statusMock,
    };
    req = {
      query: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return random recipes with default values', async () => {
    // Arrange
    const mockResult = {
      recipes: [{ id: '1', title: 'Pasta' }],
      totalPages: 10,
      currentPage: 1,
      totalRecipes: 100,
    };
    
    (validation.validateNumber as jest.Mock)
      .mockReturnValueOnce(8)   // count
      .mockReturnValueOnce(1);  // page
    
    (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue(mockResult);

    // Act
    await getRandomRecipesHandler(req as Request, res as Response, jest.fn());

    // Assert
    expect(mealDBService.getRandomRecipes).toHaveBeenCalledWith(8, 1);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        recipes: mockResult.recipes,
        totalPages: mockResult.totalPages,
        currentPage: mockResult.currentPage,
        totalRecipes: mockResult.totalRecipes,
      },
    });
  });

  it('should use custom count and page from query', async () => {
    // Arrange
    req.query = { count: '5', page: '2' };
    const mockResult = { recipes: [], totalPages: 5, currentPage: 2, totalRecipes: 50 };
    
    (validation.validateNumber as jest.Mock)
      .mockReturnValueOnce(5)   // count
      .mockReturnValueOnce(2);  // page
    
    (mealDBService.getRandomRecipes as jest.Mock).mockResolvedValue(mockResult);

    // Act
    await getRandomRecipesHandler(req as Request, res as Response, jest.fn());

    // Assert
    expect(mealDBService.getRandomRecipes).toHaveBeenCalledWith(5, 2);
  });
});