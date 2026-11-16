import { Request, Response } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
} from '../../controllers/follow.controller';
import { UserModel } from '../../models/User.model';

jest.mock('../../models/User.model');

describe('Follow Controller Unit Tests', () => {
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
      userId: 'user123',
    };
  });

  // ---------- followUser ----------

  describe('followUser', () => {
    const targetUserId = 'user456';

    it('should call next with BadRequestError when following yourself', async () => {
      req.params = { userId: 'user123' };

      await followUser(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('You cannot follow yourself');
      expect(err.statusCode).toBe(400);
      expect(UserModel.findById).not.toHaveBeenCalled();
    });

    it('should call next with NotFoundError if user to follow does not exist', async () => {
      req.params = { userId: targetUserId };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await followUser(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });

    it('should call next with ConflictError if already following', async () => {
      req.params = { userId: targetUserId };

      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce({ _id: targetUserId })
        .mockResolvedValueOnce({ following: [targetUserId] });

      await followUser(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('Already following this user');
      expect(err.statusCode).toBe(409);
    });

    it('should follow a user successfully', async () => {
      req.params = { userId: targetUserId };

      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce({ _id: targetUserId })          // target exists
        .mockResolvedValueOnce({ following: [] });             // current user

      (UserModel.findByIdAndUpdate as jest.Mock)
        .mockResolvedValueOnce({ following: [targetUserId] })   // updated current
        .mockResolvedValueOnce({ followers: ['user123'] });     // updated target

      await followUser(req, res as Response, next);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $addToSet: { following: targetUserId } },
        { returnDocument: 'after' }
      );
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        targetUserId,
        { $addToSet: { followers: 'user123' } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: targetUserId,
          isFollowing: true,
          followersCount: 1,
          followingCount: 1,
        },
      });
    });
  });

  // ---------- unfollowUser ----------

  describe('unfollowUser', () => {
    const targetUserId = 'user456';

    it('should call next with BadRequestError when unfollowing yourself', async () => {
      req.params = { userId: 'user123' };

      await unfollowUser(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('You cannot unfollow yourself');
      expect(err.statusCode).toBe(400);
    });

    it('should call next with NotFoundError if user does not exist', async () => {
      req.params = { userId: targetUserId };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await unfollowUser(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });

    it('should unfollow a user successfully', async () => {
      req.params = { userId: targetUserId };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce({ _id: targetUserId });

      (UserModel.findByIdAndUpdate as jest.Mock)
        .mockResolvedValueOnce({ following: [] })
        .mockResolvedValueOnce({ followers: [] });

      await unfollowUser(req, res as Response, next);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $pull: { following: targetUserId } },
        { returnDocument: 'after' }
      );
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        targetUserId,
        { $pull: { followers: 'user123' } },
        { returnDocument: 'after' }
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: targetUserId,
          isFollowing: false,
          followersCount: 0,
          followingCount: 0,
        },
      });
    });
  });

  // ---------- getFollowers ----------

  describe('getFollowers', () => {
    const userId = 'user456';

    it('should call next with NotFoundError if user does not exist', async () => {
      req.params = { userId };

      const mockPopulate = jest.fn().mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await getFollowers(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });

    it('should return followers with isFollowing flag', async () => {
      req.params = { userId };

      const mockUser = {
        followers: [
          { _id: { toString: () => 'user123' }, username: 'me', avatar: 'a.jpg', bio: 'b' },
          { _id: { toString: () => 'user999' }, username: 'other', avatar: '', bio: '' },
        ],
      };

      const mockPopulate = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock)
        .mockReturnValueOnce({ populate: mockPopulate })
        .mockResolvedValueOnce({
          // current user follows user123 but not user999
          following: [{ toString: () => 'user123' }],
        });

      await getFollowers(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ username: 'me', isFollowing: true }),
          expect.objectContaining({ username: 'other', isFollowing: false }),
        ],
      });
    });
  });

  // ---------- getFollowing ----------

  describe('getFollowing', () => {
    const userId = 'user456';

    it('should call next with NotFoundError if user does not exist', async () => {
      req.params = { userId };

      const mockPopulate = jest.fn().mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await getFollowing(req, res as Response, next);

      const err = getNextError();
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });

    it('should mark all as isFollowing=true when viewing own profile', async () => {
      req.params = { userId: 'user123' }; 
      req.userId = 'user123';

      const mockUser = {
        following: [
          { _id: { toString: () => 'user999' }, username: 'someone', avatar: '', bio: '' },
        ],
      };
      const mockPopulate = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock).mockReturnValueOnce({ populate: mockPopulate });

      await getFollowing(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ username: 'someone', isFollowing: true }),
        ],
      });
      expect(UserModel.findById).toHaveBeenCalledTimes(1);
    });

    it('should compute isFollowing from current user when viewing others', async () => {
      req.params = { userId: 'user456' };
      req.userId = 'user123';

      const mockUser = {
        following: [
          { _id: { toString: () => 'userA' }, username: 'A', avatar: '', bio: '' },
          { _id: { toString: () => 'userB' }, username: 'B', avatar: '', bio: '' },
        ],
      };
      const mockPopulate = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock)
        .mockReturnValueOnce({ populate: mockPopulate })
        .mockResolvedValueOnce({
          following: [{ toString: () => 'userA' }],
        });

      await getFollowing(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ username: 'A', isFollowing: true }),
          expect.objectContaining({ username: 'B', isFollowing: false }),
        ],
      });
    });
  });

  // ---------- checkFollowStatus ----------

  describe('checkFollowStatus', () => {
    const targetUserId = 'user456';

    it('should return true if following', async () => {
      req.params = { userId: targetUserId };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce({
        following: [targetUserId],
      });

      await checkFollowStatus(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { isFollowing: true },
      });
    });

    it('should return false if not following', async () => {
      req.params = { userId: targetUserId };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce({ following: [] });

      await checkFollowStatus(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { isFollowing: false },
      });
    });

    it('should return false if current user not found', async () => {
      req.params = { userId: targetUserId };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await checkFollowStatus(req, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { isFollowing: false },
      });
    });
  });
});