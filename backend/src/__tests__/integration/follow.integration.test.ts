import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
} from '../../controllers/follow.controller';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

describe('Follow Controller Integration Tests', () => {
  let req: any;
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
    res = { json: jsonMock, status: statusMock };
  };

  const createTestUser = async (prefix: string) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return UserModel.create({
      username: `${prefix}_${Math.random().toString(36).slice(2, 8)}`,
      email: `${prefix}_${Date.now()}@followtest.com`,
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200',
      favorites: [],
      createdRecipes: [],
      followers: [],
      following: [],
    });
  };

  beforeEach(async () => {
    await UserModel.deleteMany({ email: /@followtest\.com$/ });

    const user1 = await createTestUser('f1');
    testUserId1 = user1._id.toString();

    const user2 = await createTestUser('f2');
    testUserId2 = user2._id.toString();

    setupResponseMocks();
    req = {
      body: {},
      params: {},
      query: {},
      userId: testUserId1,
    };
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@followtest\.com$/ });
  });

  // ---------- followUser ----------

  describe('followUser', () => {
    it('should follow a user successfully', async () => {
      req.params = { userId: testUserId2 };

      await followUser(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.isFollowing).toBe(true);
      expect(responseData.data.followersCount).toBe(1);
      expect(responseData.data.followingCount).toBe(1);

      const user1 = await UserModel.findById(testUserId1);
      const user2 = await UserModel.findById(testUserId2);

      expect(user1?.following?.map((id) => id.toString())).toContain(testUserId2);
      expect(user2?.followers?.map((id) => id.toString())).toContain(testUserId1);
    });

    it('should return 400 when trying to follow yourself', async () => {
      req.params = { userId: testUserId1 };

      await followUser(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You cannot follow yourself');
      expect(error.statusCode).toBe(400);
    });

    it('should return 404 when user to follow does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: nonExistentId };

      await followUser(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should return 409 when already following', async () => {
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 },
      });

      req.params = { userId: testUserId2 };

      await followUser(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Already following this user');
      expect(error.statusCode).toBe(409);
    });
  });

  // ---------- unfollowUser ----------

  describe('unfollowUser', () => {
    beforeEach(async () => {
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 },
      });
    });

    it('should unfollow a user successfully', async () => {
      req.params = { userId: testUserId2 };

      await unfollowUser(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.isFollowing).toBe(false);
      expect(responseData.data.followersCount).toBe(0);
      expect(responseData.data.followingCount).toBe(0);

      const user1 = await UserModel.findById(testUserId1);
      const user2 = await UserModel.findById(testUserId2);

      expect(user1?.following?.map((id) => id.toString())).not.toContain(testUserId2);
      expect(user2?.followers?.map((id) => id.toString())).not.toContain(testUserId1);
    });

    it('should return 400 when trying to unfollow yourself', async () => {
      req.params = { userId: testUserId1 };

      await unfollowUser(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You cannot unfollow yourself');
      expect(error.statusCode).toBe(400);
    });

    it('should return 404 when user to unfollow does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: nonExistentId };

      await unfollowUser(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getFollowers ----------

  describe('getFollowers', () => {
    beforeEach(async () => {
      // user2 follows user1
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { following: testUserId1 },
      });
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { followers: testUserId2 },
      });
    });

    it('should get followers list', async () => {
      req.params = { userId: testUserId1 };

      await getFollowers(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].username).toContain('f2_');
    });

    it('should mark isFollowing=true when current user follows a follower', async () => {
      // currentUser = user1, follower = user2
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });

      req.params = { userId: testUserId1 };
      req.userId = testUserId1;

      await getFollowers(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data[0].isFollowing).toBe(true);
    });

    it('should mark isFollowing=false when current user does not follow a follower', async () => {
      req.params = { userId: testUserId1 };
      req.userId = testUserId1;

      await getFollowers(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data[0].isFollowing).toBe(false);
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: nonExistentId };

      await getFollowers(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- getFollowing ----------

  describe('getFollowing', () => {
    beforeEach(async () => {
      // user1 follows user2
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });
      await UserModel.findByIdAndUpdate(testUserId2, {
        $addToSet: { followers: testUserId1 },
      });
    });

    it('should get following list for own profile', async () => {
      req.params = { userId: testUserId1 };
      req.userId = testUserId1;

      await getFollowing(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].username).toContain('f2_');
      expect(responseData.data[0].isFollowing).toBe(true);
    });

    it('should get following list for another user with isFollowing=false', async () => {
      req.params = { userId: testUserId1 };
      req.userId = testUserId2;

      await getFollowing(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].isFollowing).toBe(false);
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      req.params = { userId: nonExistentId };

      await getFollowing(req, res as Response, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  // ---------- checkFollowStatus ----------

  describe('checkFollowStatus', () => {
    it('should return true if following', async () => {
      await UserModel.findByIdAndUpdate(testUserId1, {
        $addToSet: { following: testUserId2 },
      });

      req.params = { userId: testUserId2 };

      await checkFollowStatus(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFollowing).toBe(true);
    });

    it('should return false if not following', async () => {
      req.params = { userId: testUserId2 };

      await checkFollowStatus(req, res as Response, next);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.isFollowing).toBe(false);
    });
  });
});