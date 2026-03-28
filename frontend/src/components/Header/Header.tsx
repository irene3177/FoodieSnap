import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';
import UserMenu from '../Auth/UserMenu';
import './Header.css';
import MobileUserMenu from '../Auth/MobileUserMenu';

function Header() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const getActiveClass = ({ isActive}: { isActive: boolean }): string => {
    return isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link';
  };

  const closeMenu = () => setIsMobileMenuOpen(false);
  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo" onClick={closeMenu}>
          🍳 FoodieSnap
        </Link>

        {/* Mobile menu button */}
        <button 
          className="header__menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <span className={`header__menu-icon ${isMobileMenuOpen ? 'header__menu-icon--open' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className={`header__nav ${isMobileMenuOpen ? 'header__nav--open' : ''}`}>
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <NavLink to="/recipes" className={getActiveClass} onClick={closeMenu}>
                Recipes
              </NavLink>
            </li>
            <li className="header__nav-item">
              <NavLink to="/top-rated" className={getActiveClass} onClick={closeMenu}>
                Top Rated ⭐
              </NavLink>
            </li>
            <li className="header__nav-item">
              <NavLink to="/users" className={getActiveClass} onClick={closeMenu}>
                Community
              </NavLink>
            </li>
          </ul>

          {/* Mobile auth buttons */}
          <div className="header__mobile-actions">
            {!isAuthenticated ? (
              <div className="header__mobile-buttons">
                <button
                  className="header__auth-button header__auth-button--login"
                  onClick={() => {
                    closeMenu();
                    setShowLogin(true);
                  }}
                >
                  Login
                </button>
                <button
                  className="header__auth-button header__auth-button--register"
                  onClick={() => {
                    closeMenu();
                    setShowRegister(true);
                  }}
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="header__mobile-user">
                <MobileUserMenu onClose={closeMenu} />
              </div>
            )}
          </div>
        </nav>

        {/* Desktop actions */}
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