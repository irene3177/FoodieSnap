import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './MobileUserMenu.css';

interface MobileUserMenuProps {
  onClose?: () => void;
}

function MobileUserMenu({ onClose }: MobileUserMenuProps) {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
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
        </div>
      </div>

      <div className="mobile-user-menu__items">
        <Link to="/me" className="mobile-user-menu__item" onClick={handleLinkClick}>
          👤 My Profile
        </Link>
        <Link to="/favorites" className="mobile-user-menu__item" onClick={handleLinkClick}>
          ❤️ Favorites
        </Link>
        <Link to="/chats" className="mobile-user-menu__item" onClick={handleLinkClick}>
          💬 Chats
        </Link>
        <button 
          className="mobile-user-menu__item mobile-user-menu__item--logout" 
          onClick={handleLogout}
          disabled={isLoading}
        >
          🚪 {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

export default MobileUserMenu;