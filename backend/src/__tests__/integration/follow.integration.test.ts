import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus
} from '../../controllers/follow.controller';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Follow Controller Integration Tests', () => {
  let req: Partial<Request & { userId?: string }>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let testUserId1: string;
  let testUserId2: string;

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
    await UserModel.deleteMany({});
  });
  
  afterAll(async () => {
    await UserModel.deleteMany({});
  });
  
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user1 = await UserModel.create({
      username: 'user1',
      email: 'user1@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: []
    });
    testUserId1 = user1._id.toString();
  
    const user2 = await UserModel.create({
      username: 'user2',
      email: 'user2@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: []
    });
    testUserId2 = user2._id.toString();
    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId1
    };
  });

  describe('followUser', () => {
    it('should follow a user successfully', async () => {
      req.params = { userId: testUserId2 };

      await followUser(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.isFollowing).toBe(true);
      expect(responseData.data.followersCount).toBe(1);

      // Verify in database
      const user1 = await UserModel.findById(testUserId1);
      const user2 = await UserModel.findById(testUserId2);
      
      expect(user1?.following?.map(id => id.toString())).toContain(testUserId2);
      expect(user2?.followers?.map(id => id.toString())).toContain(testUserId1);
    });

    it('should return 400 when trying to follow yourself', async () => {
      req.params = { userId: testUserId1 };

      await followUser(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You cannot follow yourself');
      expect(error.statusCode).toBe(400);
    });

    it('should return 404 when user to follow does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: nonExistentId };

      await followUser(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 409 when already following', async () => {
      // Create fresh test users for this test only
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const freshUser1 = await UserModel.create({
        username: `fresh1_${Date.now()}`,
        email: `fresh1_${Date.now()}@test.com`,
        password: hashedPassword,
        avatar: 'https://picsum.photos/200/200',
        favorites: [],
        createdRecipes: [],
        followers: [],
        following: []
      });
      const freshUserId1 = freshUser1._id.toString();
      
      const freshUser2 = await UserModel.create({
        username: `fresh2_${Date.now()}`,
        email: `fresh2_${Date.now()}@test.com`,
        password: hashedPassword,
        avatar: 'https://picsum.photos/200/200',
        favorites: [],
        createdRecipes: [],
        followers: [],
        following: []
      });
      const freshUserId2 = freshUser2._id.toString();

      // Set up follow relationship
      await UserModel.findByIdAndUpdate(freshUserId1, {
        $addToSet: { following: freshUserId2 }
      });
      await UserModel.findByIdAndUpdate(freshUserId2, {
        $addToSet: { followers: freshUserId1 }
      });

      // Try to follow again via API
      const freshReq = {
        ...req,
        userId: freshUserId1,
        params: { userId: freshUserId2 }
      };
      
      await followUser(freshReq as any, res as Response, next);

      // Should return conflict error
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Already following this user');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('unfollowUser', () => {
    beforeEach(async () => {
      // First follow
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 }
      }, { returnDocument: 'after' });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 }
      }, { returnDocument: 'after' });

      // Verify relationship was established
      const user1 = await UserModel.findById(testUserId1);
      const user2 = await UserModel.findById(testUserId2);

      expect(user1?.following?.map(id => id.toString())).toContain(testUserId2);
      expect(user2?.followers?.map(id => id.toString())).toContain(testUserId1);
    });

    it('should unfollow a user successfully', async () => {
      req.params = { userId: testUserId2 };

      await unfollowUser(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.isFollowing).toBe(false);

      // Verify in database
      const user1 = await UserModel.findById(testUserId1);
      const user2 = await UserModel.findById(testUserId2);
      
      expect(user1?.following?.map(id => id.toString())).not.toContain(testUserId2);
      expect(user2?.followers?.map(id => id.toString())).not.toContain(testUserId1);
    });

    it('should return 400 when trying to unfollow yourself', async () => {
      req.params = { userId: testUserId1 };

      await unfollowUser(req as any, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You cannot unfollow yourself');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('getFollowers', () => {
    beforeEach(async () => {
      // User2 follows User1
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { following: testUserId1 }
      });
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { followers: testUserId2 }
      });
    });

    it('should get followers list', async () => {
      req.params = { userId: testUserId1 };

      await getFollowers(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].username).toBe('user2');
    });
  });

  describe('getFollowing', () => {
    beforeEach(async () => {
      // User1 follows User2
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 }
      });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 }
      });
    });

    it('should get following list for own profile', async () => {
      req.params = { userId: testUserId1 };
      req.userId = testUserId1;

      await getFollowing(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].username).toBe('user2');
      expect(responseData.data[0].isFollowing).toBe(true);
    });

    it('should get following list for another user', async () => {
      req.params = { userId: testUserId1 };
      req.userId = testUserId2; // Different user

      await getFollowing(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].isFollowing).toBe(false);
    });
  });

  describe('checkFollowStatus', () => {
    beforeEach(async () => {
      // User1 follows User2
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 }
      });
    });

    it('should return true if following', async () => {
      req.params = { userId: testUserId2 };

      await checkFollowStatus(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFollowing).toBe(true);
    });

    it('should return false if not following', async () => {
      req.params = { userId: testUserId1 }; // User1 is checking themselves

      await checkFollowStatus(req as any, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFollowing).toBe(false);
    });
  });
});