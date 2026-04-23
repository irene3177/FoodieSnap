import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/store';
import { selectTotalUnread } from '../../store/unreadSlice';
import { showToast } from '../../store/toastSlice';
import { deleteAccount } from '../../store/authSlice';
import ChangePasswordModal from '../ChangePasswordModal/ChangePasswordModal';
import './UserMenu.css';

function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalUnread = useSelector(selectTotalUnread);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    setIsOpen(false);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    setIsOpen(false);
    
    try {
      await dispatch(deleteAccount()).unwrap();
      dispatch(showToast({ 
        message: 'Account deleted successfully', 
        type: 'success' 
      }));
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      // Error is already handled by the thunk
      console.error('Delete account error:', error);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteConfirm(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get user initial from username
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  if (!user) return null;

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        <button
          className="user-menu__button"
          onClick={handleToggle}
          aria-label="User Menu"
          disabled={isLoading}
        >
          <div className="user-menu__avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <span className="user-menu__name">{user.username}</span>
          {totalUnread > 0 && (
            <span className="user-menu__indicator" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="user-menu__dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="user-menu__header">
                <div className="user-menu__header-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>

                <div className="user-menu__header-info">
                  <span className="user-menu__header-name">{user.username}</span>
                  <span className="user-menu__header-email">{user.email}</span>
                  {user.bio && (
                    <span className="user-menu__header-bio">{user.bio.substring(0, 50)}...</span>
                  )}
                </div>
              </div>

              <div className="user-menu__items">
                <Link to={`/me`} className="user-menu__item" onClick={closeMenu}>
                  My Profile
                </Link>
                <Link to="/chats" className="user-menu__item" onClick={closeMenu}>
                  Messages
                  {totalUnread > 0 && (
                    <span className="user-menu__badge user-menu__badge--chat">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>
                <Link to="/favorites" className="user-menu__item" onClick={closeMenu}>
                  Favorites
                  {user.favorites && user.favorites.length > 0 && (
                    <span className="user-menu__badge">{user.favorites.length}</span>
                  )}
                </Link>

                <div className="user-menu__separator"></div>

                {/* Change Password */}
                <button 
                  className="user-menu__item user-menu__item--password" 
                  onClick={handleChangePassword}
                >
                  Change Password
                </button>
                
                {/* Delete Account */}
                <button 
                  className="user-menu__item user-menu__item--delete" 
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setIsOpen(false);
                  }}
                >
                  Delete Account
                </button>

                <button 
                  className="user-menu__item user-menu__item--logout" 
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="user-menu__delete-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDeleteModal}
          >
            <motion.div
              className="user-menu__delete-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="user-menu__delete-modal-header">
                <h3>Delete Account</h3>
                <button 
                  className="user-menu__delete-modal-close"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ✕
                </button>
              </div>
              <div className="user-menu__delete-modal-body">
                <p>⚠️ Are you sure you want to delete your account?</p>
                <p>This action <strong>cannot be undone</strong> and will:</p>
                <ul>
                  <li>Delete all your recipes</li>
                  <li>Delete all your comments</li>
                  <li>Remove you from favorites lists</li>
                  <li>Permanently delete your profile</li>
                </ul>
              </div>
              <div className="user-menu__delete-modal-actions">
                <button
                  className="user-menu__delete-modal-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="user-menu__delete-modal-confirm"
                  onClick={handleDeleteAccount}
                >
                  Yes, Delete My Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </>
  );
}

export default UserMenu;