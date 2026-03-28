import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { selectTotalUnread } from '../../store/unreadSlice';
import './UserMenu.css';

function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalUnread = useSelector(selectTotalUnread);
  console.log('💬 UserMenu: totalUnread from Redux =', totalUnread);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
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
                <span>👤</span> My Profile
              </Link>
              <Link to="/chats" className="user-menu__item" onClick={closeMenu}>
                <span>💬</span> Messages
                {totalUnread > 0 && (
                  <span className="user-menu__badge user-menu__badge--chat">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>
              <Link to="/favorites" className="user-menu__item" onClick={closeMenu}>
                <span>❤️</span> Favorites
                {user.favorites && user.favorites.length > 0 && (
                  <span className="user-menu__badge">{user.favorites.length}</span>
                )}
              </Link>
              <button 
                className="user-menu__item user-menu__item--logout" 
                onClick={handleLogout}
                disabled={isLoading}
              >
                <span>🚪</span> {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;