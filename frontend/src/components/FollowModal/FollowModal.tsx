import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
// import { useScrollLock } from '../../hooks/useScrollLock';
import { followApi } from '../../services/followApi';
import { UserListItem } from '../../types';
import Loader from '../Loader/Loader';
import { MdClose, MdOutlinePeopleAlt } from 'react-icons/md';

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

  // useScrollLock(isOpen);

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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-primary rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-primary flex-shrink-0">
              <div className="flex items-center gap-3">
                <MdOutlinePeopleAlt className="text-accent text-3xl" />
                <h2 className="text-3xl font-semibold text-secondary m-0 cursor-default">{title}</h2>
              </div>
              <button className="
                bg-transparent border-none text-muted
                rounded-lg w-8 h-8
                flex items-center justify-center
                hover:bg-border transition-colors
                duration-700
                "
                onClick={onClose}>
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-secondary">
                  <p>{emptyMessage}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {users.map(user => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 rounded-xl
                      hover:bg-secondary transition-colors duration-200"
                    >
                      <Link 
                        to={`/user/${user._id}`} 
                        onClick={onClose} 
                        className="flex items-center gap-3 flex-1 min-w-0 no-underline"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-semibold text-white">{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-semibold text-primary text-sm mb-0.5">{user.username}</span>
                          {user.bio && (
                            <span className="block text-xs text-secondary truncate">{user.bio.substring(0, 50)}</span>
                          )}
                        </div>
                      </Link>
                      {currentUser && currentUser._id !== user._id && (
                        <button
                          className={`
                            px-5 py-3 rounded-full text-xs font-medium
                            transition-all duration-700
                            border cursor-pointer
                            flex-shrink-0
                            disabled:opacity-60 disabled:cursor-not-allowed
                            ${user.isFollowing 
                              ? 'bg-secondary text-primary hover:bg-border' 
                              : 'bg-accent text-button hover:bg-accent-hover hover:bg-accent-secondary'
                            }
                          `}
                          onClick={() => handleFollowToggle(user._id, user.isFollowing || false)}
                          disabled={updating === user._id}
                        >
                          {updating === user._id ? (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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