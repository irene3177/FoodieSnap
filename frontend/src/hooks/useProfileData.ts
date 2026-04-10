import { useState, useEffect, useCallback } from 'react';
import { UserProfile, Recipe } from '../types';
import { usersApi } from '../services/usersApi';
import { authApi } from '../services/authApi';

interface UseProfileDataReturn {
  profile: UserProfile | null;
  favorites: Recipe[];
  loading: boolean;
  loadingFavorites: boolean;
  error: string | null;
  refresh: () => void;
  updateFollowStats: (isFollowing: boolean, followersCount?: number) => void;
  updateCounters: (newFollowersCount?: number, newFollowingCount?: number) => void;
}

export const useProfileData = (
  userId?: string,
  currentUserId?: string
): UseProfileDataReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProfile = useCallback(async () => {
    const targetUserId = userId || currentUserId;

    if (!targetUserId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Load profile
      const response = userId 
        ? await usersApi.getUserById(userId)
        : await authApi.getMe();
      
      if (response.success && response.data) {
        setProfile(response.data);
        
        // Load favorites
        setLoadingFavorites(true);
        try {
          const favResponse = await usersApi.getFavorites(response.data._id);
          if (favResponse.success && favResponse.data) {
            setFavorites(favResponse.data.favorites as Recipe[]);
          }
        } catch (err) {
          console.error('Error loading favorites:', err);
        } finally {
          setLoadingFavorites(false);
        }
        
      } else {
        setError(response.error || 'User not found');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  const updateFollowStats = useCallback((isFollowing: boolean, followersCount?: number) => {
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        isFollowing: isFollowing,
        followersCount: followersCount !== undefined ? followersCount : prev.followersCount
      };
    });
  }, []);

  const updateCounters = useCallback((newFollowersCount?: number, newFollowingCount?: number) => {
  setProfile(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      followersCount: newFollowersCount !== undefined ? newFollowersCount : prev.followersCount,
      followingCount: newFollowingCount !== undefined ? newFollowingCount : prev.followingCount
    };
  });
}, []);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, refreshKey]);

  return {
    profile,
    favorites,
    loading,
    loadingFavorites,
    error,
    refresh,
    updateFollowStats,
    updateCounters
  };
};