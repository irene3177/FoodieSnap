
import { useEffect, useState } from 'react';
import { NavLinks } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useScrollLock } from '../hooks/useScrollLock';
import { MdClose, MdLogin, MdPersonAddAlt1, MdOutlineDarkMode } from 'react-icons/md';
import MobileUserMenu from './Auth/MobileUserMenu';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import LoginModal from './Auth/LoginModal';
import RegisterModal from './Auth/RegisterModal';

interface AppMenuProps {
  isOpen: boolean;
  onClose: () => void;
}


function AppMenu({ isOpen, onClose }: AppMenuProps) {
  const { user, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  console.log('isOpen', isOpen);
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setShowLogin(false);
      setShowRegister(false);
    }
  }, [isOpen]);

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-full max-w-[428px] z-50
          bg-primary rounded-l-2xl
          border-l border
          shadow-2xl
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <button className="absolute right-0 mr-8 mt-6 btn-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <MdClose className="w-6 h-6" />
        </button>

        <>
          {/* Header */}
          <header className="flex justify-between items-center px-8 h-20 border-b flex-shrink-0">
            <div className="flex items-center gap-2 text-3xl text-accent cursor-default">
              <h1 className="text-3xl">
                FoodieSnap
              </h1>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pt-4 pb-6 scrollbar-thin">
            <div className="px-8 space-y-8">
              <>
                <nav className="flex flex-col space-y-4 justify-center">
                  {NavLinks.map(({ path, label, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) => `
                        flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-300
                        // text-[clamp(1.5rem,3.5vw,2rem)]
                        font-headline-sm text-headline-sm
                        ${isActive ? 'text-accent border-l-2 border-accent bg-accent-secondary-bg' : 'text-secondary hover:text-accent hover:bg-border'}
                        transition-colors w-full pb-3
                      `}
                      onClick={handleLinkClick}
                    >
                      <Icon />
                      <h4>{label}</h4>
                    </NavLink>
                  ))}
                </nav>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between py-4 border-t">
                  <div className="font-label-md text-label-md flex items-center gap-2 text-secondary uppercase tracking-wider cursor-default">
                    <MdOutlineDarkMode />
                    Theme
                  </div>
                  <ThemeToggle />
                </div>

                {/* Bottom Actions */}
                <div className="flex-shrink-0">
                  <div className="flex flex-col space-y-3">
                    <button
                      className="w-full h-14 rounded-lg gap-2 bg-transparent border-[1.5px] border-secondary text-secondary font-label-md text-label-md flex justify-center items-center btn-shimmer transition-all hover:-translate-y-[1px]
                      hover:bg-border active:scale-[0.98]
                      hover:shadow-secondary-btn duration-700"
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          setShowLogin(true); 
                        }, 300);
                      }}
                    >
                      <MdLogin />
                      Login
                    </button>
                    <button
                      className="w-full h-14 rounded-lg terracotta-gradient btn-shimmer text-button font-label-md text-label-md flex justify-center items-center transition-all duration-700 hover:-translate-y-[1px] active:scale-[0.98] hover:shadow-primary-btn"
                      onClick={() => {
                        onClose();
                        setTimeout(() => { 
                          setShowRegister(true);
                        }, 300);
                      }}
                    >
                      <MdPersonAddAlt1 />
                      Sign Up
                    </button>
                  </div>
                </div>
              </>
            </div>
          </div>
        </>
      </div>

      {/* Modals */}
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
    </>
  );
}

export default AppMenu;