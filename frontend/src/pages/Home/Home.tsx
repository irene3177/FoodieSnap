import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoginModal from '../../components/Auth/LoginModal';
import { MdExplore } from 'react-icons/md';

function Home() {
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const hasCheckedRedirect = useRef(false);

  useEffect(() => {
    if (hasCheckedRedirect.current) return;
    // Check if we were redirected from a protected route
    const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin && !isAuthenticated) {
      setShowLoginModal(true);
    }
    hasCheckedRedirect.current = true;
  }, [isAuthenticated]);

  const handleCloseModal = () => {
    setShowLoginModal(false);
    sessionStorage.removeItem('redirectAfterLogin');
  };

  const handleExploreClick = () => {
    navigate('/recipes');
  };

  return (
    <>
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center w-full terracotta-gradient text-white">
        <section>
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline-md mb-4 leading-tight">Welcome to FoodieSnap!</h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 opacity-90 leading-relaxed">
              Discover delicious recipes from around the world!
            </p>
            <button 
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 text-base sm:text-lg font-medium bg-white text-accent border-none rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-bg-secondary hover:text-accent-hover hover:shadow-theme-lg focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              onClick={handleExploreClick}
            >
              <MdExplore /> Explore Recipes
            </button>
          </div>
        </section>
      </div>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={handleCloseModal}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          // Handle register modal
        }}
      />
    </>
  );
}

export default Home;