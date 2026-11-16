import { Request, Response } from 'express';
import {
  getUserById,
  getCreatedRecipes,
  getFavorites,
  getUsers,
  searchUsers,
} from '../../controllers/user.controller';
import { UserModel } from '../../models/User.model';
import { validateNumber } from '../../utils/validation';

jest.mock('../../models/User.model');
jest.mock('../../utils/validation');

describe('User Controller Unit Tests', () => {
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const setupResponseMocks = () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    res = { json: jsonMock, status: statusMock };
  };

  // Хелпер: достать Error из вызова next()
  const getNextError = (): any => {
    expect(next).toHaveBeenCalled();
    return (next as jest.Mock).mock.calls[0][0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'currentUser123' },
    };
  });

  // ---------- getUserById ----------

  describe('getUserById', () => {
    it('should return user with counters and isFollowing=false for guest', async () => {
      req.user = undefined;
      req.params = { userId: 'targetUser456' };

      const mockUser = {
        _id: 'targetUser456',
        username: 'target',
        followers: ['a', 'b'],
        following: ['c'],
        createdRecipes: ['r1', 'r2', 'r3'],
        toJSON: () => ({ _id: 'targetUser456', username: 'target' }),
      };

      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getUserById(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'targetUser456',
          username: 'target',
          isFollowing: false,
          followersCount: 2,
          followingCount: 1,
          recipeCount: 3,
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with NotFoundError if user not found', async () => {
      req.params = { userId: 'missing' };

      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUserById(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  // ---------- getCreatedRecipes ----------

  describe('getCreatedRecipes', () => {
    it('should return user recipes', async () => {
      req.params = { userId: 'user456' };

      const mockUser = { createdRecipes: [{ _id: 'r1' }, { _id: 'r2' }] };

      const mockPopulate = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulate });
      (UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await getCreatedRecipes(req as Request, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('user456');
      expect(mockSelect).toHaveBeenCalledWith('createdRecipes');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { createdRecipes: mockUser.createdRecipes },
      });
    });

    it('should call next with NotFoundError if user missing', async () => {
      req.params = { userId: 'missing' };

      const mockPopulate = jest.fn().mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulate });
      (UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await getCreatedRecipes(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- getFavorites ----------

  describe('getFavorites', () => {
    it('should return user favorites', async () => {
      req.params = { userId: 'user456' };

      const mockUser = {
        _id: 'user456',
        username: 'testuser',
        favorites: [{ _id: 'recipe1', title: 'Recipe 1' }],
      };

      const mockPopulate = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulate });
      (UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await getFavorites(req as Request, res as Response, next);

      expect(UserModel.findById).toHaveBeenCalledWith('user456');
      expect(mockSelect).toHaveBeenCalledWith('favorites username');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 'user456',
          username: 'testuser',
          favorites: mockUser.favorites,
        },
      });
    });

    it('should call next with NotFoundError if user missing', async () => {
      req.params = { userId: 'missing' };

      const mockPopulate = jest.fn().mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulate });
      (UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await getFavorites(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  // ---------- getUsers ----------

  describe('getUsers', () => {
    const setupFindChain = (users: any[]) => {
      const mockLimit = jest.fn().mockResolvedValue(users);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      (UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect });
    };

    it('should return paginated users', async () => {
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      const mockUsers = [
        {
          _id: { toString: () => 'user1' },
          username: 'user1',
          avatar: 'avatar1.jpg',
          bio: 'bio1',
          createdRecipes: [],
          followers: [],
        },
        {
          _id: { toString: () => 'user2' },
          username: 'user2',
          avatar: 'avatar2.jpg',
          bio: 'bio2',
          createdRecipes: [],
          followers: [],
        },
      ];

      setupFindChain(mockUsers);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(2);

      await getUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          users: expect.arrayContaining([
            expect.objectContaining({ username: 'user1', isFollowing: false }),
            expect.objectContaining({ username: 'user2', isFollowing: false }),
          ]),
          total: 2,
          page: 1,
          pages: 1,
        },
      });
    });

    it('should mark isFollowing=true when current user is in followers', async () => {
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      const mockUsers = [
        {
          _id: { toString: () => 'user1' },
          username: 'user1',
          avatar: '',
          bio: '',
          createdRecipes: [],
          followers: [{ toString: () => 'currentUser123' }],
        },
      ];

      setupFindChain(mockUsers);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await getUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({ isFollowing: true }),
            ]),
          }),
        })
      );
    });

    it('should select followers field for isFollowing calculation', async () => {
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      const mockSelect = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      (UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect });
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await getUsers(req as Request, res as Response, next);

      expect(mockSelect).toHaveBeenCalledWith(
        'username avatar bio createdRecipes followers'
      );
    });

    it('should call next with BadRequestError for invalid sort field', async () => {
      req.query = { sortBy: 'invalidField' };
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      await getUsers(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Invalid sort field');
      expect(err.statusCode).toBe(400);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should apply search query with case-insensitive regex', async () => {
      req.query = { search: 'test' };
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(10);

      setupFindChain([]);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await getUsers(req as Request, res as Response, next);

      expect(UserModel.find).toHaveBeenCalledWith({
        username: { $regex: 'test', $options: 'i' },
      });
    });
  });

  // ---------- searchUsers ----------

  describe('searchUsers', () => {
    const setupFindChain = (users: any[]) => {
      const mockLimit = jest.fn().mockResolvedValue(users);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      (UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect });
    };

    it('should call next with BadRequestError when q is missing', async () => {
      req.query = {};

      await searchUsers(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Search query is required');
      expect(err.statusCode).toBe(400);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should call next with BadRequestError when q is only whitespace', async () => {
      req.query = { q: '   ' };

      await searchUsers(req as Request, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Search query is required');
      expect(err.statusCode).toBe(400);
    });

    it('should search users by username (case-insensitive)', async () => {
      req.query = { q: 'alice' };
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(20);

      setupFindChain([]);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await searchUsers(req as Request, res as Response, next);

      expect(UserModel.find).toHaveBeenCalledWith({
        username: { $regex: 'alice', $options: 'i' },
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          users: [],
          total: 0,
          page: 1,
          pages: 0,
        },
      });
    });

    it('should mark isFollowing=true for results', async () => {
      req.query = { q: 'bob' };
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(20);

      const mockUsers = [
        {
          _id: { toString: () => 'user-bob' },
          username: 'bob',
          avatar: '',
          bio: '',
          createdRecipes: [],
          followers: [{ toString: () => 'currentUser123' }],
        },
      ];

      setupFindChain(mockUsers);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await searchUsers(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({ isFollowing: true }),
            ]),
          }),
        })
      );
    });

    it('should trim q before searching', async () => {
      req.query = { q: '  alice  ' };
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(20);

      setupFindChain([]);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await searchUsers(req as Request, res as Response, next);

      expect(UserModel.find).toHaveBeenCalledWith({
        username: { $regex: 'alice', $options: 'i' },
      });
    });

    it('should select followers field', async () => {
      req.query = { q: 'bob' };
      (validateNumber as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(20);

      const mockSelect = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      (UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect });
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await searchUsers(req as Request, res as Response, next);

      expect(mockSelect).toHaveBeenCalledWith(
        'username avatar bio followers createdRecipes'
      );
    });
  });
});