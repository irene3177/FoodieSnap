import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';
import UserMenu from '../Auth/UserMenu';
import { RiMenu3Fill } from 'react-icons/ri';
import { NavLinks } from '../../constants';
import { PiBowlFoodLight } from 'react-icons/pi';
import AppMenu from '../AppMenu';
import Avatar from '../Avatar';

function Header() {
  const { isAuthenticated, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const closeMenu = () => setIsAppMenuOpen(false);
  const closeUserMenu = () => setIsUserMenuOpen(false);

  return (
    <header className="flex-shrink-0 bg-header shadow-theme z-[1000]">
      <div className="flex justify-between items-center px-8 py-[clamp(0.5rem,2vw,1rem)] 
        max-w-[1400px] mx-auto gap-[clamp(0.5rem,2vw,1.5rem)]">
        {/* Logo */}
        <Link
          to="/"
          className="text-[clamp(1.8rem,3vw,3rem)] select-none text-accent whitespace-nowrap hover:text-accent transition-all duration-700 hover:scale-[1.02]"
          onClick={closeMenu}
        >
          <span className="flex items-center gap-1">
            <PiBowlFoodLight className="inline" />
            <h2 className="tracking-tight">FoodieSnap</h2>
          </span>
        </Link>

        <nav className="hidden md:flex flex-1 min-w-0 md:justify-center md:items-center">
          <ul className="flex gap-[clamp(1rem,2.5vw,2rem)] font-headline w-full  md:w-auto">
            {NavLinks.map(({ path, label }) => (
              <li key={label} className="w-full md:w-auto whitespace-nowrap">
                <NavLink
                  to={path}
                  onClick={closeMenu}>
                  {({ isActive }) => (
                    <span className={`
                      relative block px-3 py-2 text-left md:text-left md:px-0 md:py-2 md:text-[clamp(1rem,1.8vw,2.5rem)]
                      ${isActive ? 'text-accent' : 'text-secondary hover:text-accent transition-colors duration-700'}
                    `}>
                      {label}
                      <span className={`
                        absolute bottom-0 left-0 h-0.5 rounded-full bg-accent 
                        transition-all duration-1000
                        ${isActive ? 'md:w-full opacity-100' : 'w-0 opacity-0'}
                      `} />
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 flex-shrink-0">
          <ThemeToggle />

          {isAuthenticated ? (
            <button
              onClick={() => setIsUserMenuOpen(true)}
              className=""
            >
              <Avatar src={user?.avatar} border />
            </button>
          ) : (
            <>
              <button
                className="btn-secondary transition-all duration-1000"
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>
              <button
                className="btn-primary transition-all duration-1000"
                onClick={() => setShowRegister(true)}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`flex items-center text-secondary justify-center w-10 h-10 p-2 hover:text-accent bg-transparent border-none cursor-pointer relative z-[1001] flex-shrink-0 transition-colors duration-700 md:hidden
          ${(isAppMenuOpen || isUserMenuOpen) ? 'hidden' : ''}
          `}
          onClick={() => isAuthenticated ? setIsUserMenuOpen(!isUserMenuOpen) : setIsAppMenuOpen(!isAppMenuOpen)}
          aria-label="Menu"
        >
          <RiMenu3Fill className="w-8 h-8" />
        </button>
      </div>

      <AppMenu
        isOpen={isAppMenuOpen}
        onClose={closeMenu}
      />

      <UserMenu 
        isOpen={isUserMenuOpen}
        onClose={closeUserMenu}
      />


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