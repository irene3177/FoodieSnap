import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../store/store';
import { showToast } from '../store/toastSlice';
import { followApi } from '../services/followApi';
import { UserListItem } from '../types';

interface UseFollowOptions {
  onFollowChange?: (isFollowing: boolean, followersCount?: number) => void;
}

export const useFollow = (targetUserId: string, initialIsFollowing: boolean = false, options?: UseFollowOptions) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollow = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await followApi.follow(targetUserId);
      if (response.success) {
        setIsFollowing(true);
        options?.onFollowChange?.(true, response.data?.followersCount);
        dispatch(showToast({
          message: 'Successfully followed!',
          type: 'success'
        }));
      } else if (response.error === 'Already following this user') {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow error:', error);
      dispatch(showToast({
        message: 'Failed to follow user',
        type: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, isLoading, options, dispatch]);

  const handleUnfollow = useCallback(async () => {
    if (isLoading || !targetUserId) return;
    
    setIsLoading(true);
    try {
      const response = await followApi.unfollow(targetUserId);
      if (response.success) {
        setIsFollowing(false);
        options?.onFollowChange?.(false, response.data?.followersCount);
        dispatch(showToast({
          message: 'Unfollowed successfully',
          type: 'success'
        }));
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      dispatch(showToast({
        message: 'Failed to unfollow user',
        type: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, isLoading, options, dispatch]);

  const toggleFollow = useCallback(() => {
    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  }, [isFollowing, handleFollow, handleUnfollow]);

  return {
    isFollowing,
    isLoading,
    follow: handleFollow,
    unfollow: handleUnfollow,
    toggleFollow
  };
};

// Hook for getting followers/following lists
export const useFollowersList = (userId: string) => {
  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadFollowers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await followApi.getFollowers(userId);
      if (response.success && response.data) {
        setFollowers(response.data);
        setTotal(response.data.length);
      }
    } catch (error) {
      console.error('Load followers error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadFollowers();
    }
  }, [userId, loadFollowers]);

  return { followers, isLoading, total, refetch: loadFollowers };
};

export const useFollowingList = (userId: string) => {
  const [following, setFollowing] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadFollowing = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await followApi.getFollowing(userId);
      if (response.success && response.data) {
        setFollowing(response.data);
        setTotal(response.data.length);
      }
    } catch (error) {
      console.error('Load following error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadFollowing();
    }
  }, [userId, loadFollowing]);

  return { following, isLoading, total, refetch: loadFollowing };
};