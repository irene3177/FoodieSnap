import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoginModal from '../../components/Auth/LoginModal';
import './Home.css'

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
      <div className="home-page">
        <section className="hero">
          <div className="hero__content">
            <h1 className="hero__title">Welcome to FoodieSnap!</h1>
            <p className="hero__subtitle">
              Discover delicious recipes from around the world!
            </p>
            <button 
              className="hero__cta"
              onClick={handleExploreClick}
            >
              Explore Recipes
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