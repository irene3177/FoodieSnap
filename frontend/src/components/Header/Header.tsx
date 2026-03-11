import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';
import UserMenu from '../Auth/UserMenu';
import './Header.css';

function Header() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);


  const getActiveClass = ({ isActive}: { isActive: boolean }): string => {
    return isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link';
  };
  return (
    <header className="header">
      <Link to="/" className="header__logo">🍳 FoodieSnap</Link>
      <nav className="header__nav">
        <ul className="header__nav-list">
          <li className="header__nav-item">
            <NavLink to="/" className={getActiveClass} end>
              Home 
            </NavLink>
          </li>
          <li className="header__nav-item">
            <NavLink to="/recipes" className={getActiveClass}>
              Recipes
            </NavLink>
          </li>
                    <li className="header__nav-item">
            <NavLink to="/top-rated" className={getActiveClass}>
              Top Rated ⭐
            </NavLink>
          </li>
          <li className="header__nav-item">
            <NavLink to="/favorites" className={getActiveClass}>
              Favorites
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="header__actions">
        <ThemeToggle />

        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <>
            <button
              className="header__auth-button header__auth-button--login"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            <button
              className="header__auth-button header__auth-button--register"
              onClick={() => setShowRegister(true)}
            >
              Sign Up
            </button>
          </>
        )}
      </div>

      {/* Auth Modals */}
      <LoginModal 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal 
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </header>
  );
}

export default Header;