import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { deleteAccount } from '../../store/authSlice';
import { useAuth } from '../../hooks/useAuth';
import ChangePasswordModal from '../ChangePasswordModal/ChangePasswordModal';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './MobileUserMenu.css';

interface MobileUserMenuProps {
  onClose?: () => void;
}

function MobileUserMenu({ onClose }: MobileUserMenuProps) {
  const { user, logout, isLoading } = useAuth();
  const dispatch = useAppDispatch();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    onClose?.();
    
    try {
      await dispatch(deleteAccount()).unwrap();
      dispatch(showToast({ 
        message: 'Account deleted successfully', 
        type: 'success' 
      }));
      window.location.href = '/';
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <div className="mobile-user-menu">
        <div className="mobile-user-menu__header">
          <div className="mobile-user-menu__avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div className="mobile-user-menu__info">
            <span className="mobile-user-menu__name">{user?.username}</span>
            <span className="mobile-user-menu__email">{user?.email}</span>
            {user?.bio && (
              <span className="mobile-user-menu__bio">{user.bio.substring(0, 50)}...</span>
            )}
          </div>
        </div>

        <div className="mobile-user-menu__items">
          <Link to="/me" className="mobile-user-menu__item" onClick={handleLinkClick}>
            My Profile
          </Link>
          <Link to="/chats" className="mobile-user-menu__item" onClick={handleLinkClick}>
            Chats
          </Link>
          <Link to="/favorites" className="mobile-user-menu__item" onClick={handleLinkClick}>
            Favorites
          </Link>
          <div className="mobile-user-menu__separator"></div>

          <div className="mobile-user-menu__theme-toggle">
            <span className="mobile-user-menu__theme-label">Dark / Light Mode</span>
            <ThemeToggle />
          </div>

          <div className="mobile-user-menu__separator"></div>

          <button 
            className="mobile-user-menu__item mobile-user-menu__item--password" 
            onClick={handleChangePassword}
          >
            Change Password
          </button>

          <button 
            className="mobile-user-menu__item mobile-user-menu__item--delete" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
          <button 
            className="mobile-user-menu__item mobile-user-menu__item--logout" 
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="mobile-user-menu__delete-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="mobile-user-menu__delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-user-menu__delete-modal-header">
                <h3>Delete Account</h3>
                <button 
                  className="mobile-user-menu__delete-modal-close"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ✕
                </button>
              </div>
              <div className="mobile-user-menu__delete-modal-body">
                <p>⚠️ Are you sure you want to delete your account?</p>
                <p>This action <strong>cannot be undone</strong> and will:</p>
                <ul>
                  <li>Delete all your recipes</li>
                  <li>Delete all your comments</li>
                  <li>Remove you from favorites lists</li>
                  <li>Permanently delete your profile</li>
                </ul>
              </div>
              <div className="mobile-user-menu__delete-modal-actions">
                <button
                  className="mobile-user-menu__delete-modal-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="mobile-user-menu__delete-modal-confirm"
                  onClick={handleDeleteAccount}
                >
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={showChangePassword} 
          onClose={() => setShowChangePassword(false)} 
        />
    </>
  );
}

export default MobileUserMenu;