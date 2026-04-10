import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { followApi } from '../../services/followApi';
import { UserListItem } from '../../types';
import Loader from '../Loader/Loader';
import './FollowModal.css';

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  initialCount: number;
  onUpdate?: (newFollowersCount?: number, newFollowingCount?: number) => void;
}

function FollowModal({ isOpen, onClose, userId, type, onUpdate }: FollowModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Wrap loadUsers in useCallback to avoid dependency issues
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (type === 'followers') {
        response = await followApi.getFollowers(userId);
      } else {
        response = await followApi.getFollowing(userId);
      }
      
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    if (isOpen && userId) {
      loadUsers();
    }
  }, [isOpen, userId, loadUsers]);

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;
    
    setUpdating(targetUserId);
    try {
      const response = isCurrentlyFollowing
        ? await followApi.unfollow(targetUserId)
        : await followApi.follow(targetUserId);
      
      if (response.success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user._id === targetUserId 
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        ));
        if (type === 'following') {
          onUpdate?.(undefined,response.data?.followingCount);
        } else {
          onUpdate?.(response.data?.followersCount, undefined);
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const title = type === 'followers' ? 'Followers' : 'Following';
  const emptyMessage = type === 'followers' ? 'No followers yet' : 'Not following anyone yet';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="follow-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="follow-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="follow-modal-header">
              <h3>{title}</h3>
              <button className="follow-modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="follow-modal-body">
              {loading ? (
                <div className="follow-modal-loading">
                  <Loader />
                </div>
              ) : users.length === 0 ? (
                <div className="follow-modal-empty">
                  <p>{emptyMessage}</p>
                </div>
              ) : (
                <div className="follow-modal-list">
                  {users.map(user => (
                    <div key={user._id} className="follow-modal-item">
                      <Link 
                        to={`/user/${user._id}`} 
                        onClick={onClose} 
                        className="follow-modal-user"
                      >
                        <div className="follow-modal-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <span>{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="follow-modal-info">
                          <span className="follow-modal-username">{user.username}</span>
                          {user.bio && (
                            <span className="follow-modal-bio">{user.bio.substring(0, 50)}</span>
                          )}
                        </div>
                      </Link>
                      {currentUser && currentUser._id !== user._id && (
                        <button
                          className={`follow-modal-button ${user.isFollowing ? 'following' : ''}`}
                          onClick={() => handleFollowToggle(user._id, user.isFollowing || false)}
                          disabled={updating === user._id}
                        >
                          {updating === user._id ? (
                            <span className="follow-modal-spinner"></span>
                          ) : user.isFollowing ? (
                            'Following'
                          ) : (
                            'Follow'
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FollowModal;