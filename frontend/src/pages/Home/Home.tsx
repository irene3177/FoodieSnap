// pages/Home/Home.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '../../services/recipesApi';
import LoginModal from '../../components/Auth/LoginModal';
import {
  MdExplore,
  MdSearch,
  MdStar,
  MdGroups,
  MdAdd,
  MdArrowForward
} from 'react-icons/md';
import { IoIosChatboxes } from 'react-icons/io';

function Home() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const hasCheckedRedirect = useRef(false);

  const { data: topRated } = useQuery({
    queryKey: ['home-top-rated'],
    queryFn: async () => {
      const res = await recipesApi.getTopRatedRecipes(1);
      return res.success ? res.data?.[0] ?? null : null;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (hasCheckedRedirect.current) return;
    const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin && !isAuthenticated) setShowLoginModal(true);
    hasCheckedRedirect.current = true;
  }, [isAuthenticated]);

  useEffect(() => {
    if (location.state?.openSignUp) {
      setShowLoginModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCloseModal = () => {
    setShowLoginModal(false);
    sessionStorage.removeItem('redirectAfterLogin');
  };

  const handleCreateRecipe = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    navigate('/me', { state: { openCreateRecipe: true } });
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-8 py-12 md:py-20">
        {/* === HERO === */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center mb-20 md:mb-28 cursor-default">
          {/* Left */}
          <div className="my-12 md:col-span-7 lg:ml-8">
            <h1 className="font-headline-md text-5xl lg:text-6xl text-secondary leading-tight mb-6">
              Where every snap tells a{' '}
              <span className="text-accent italic">flavorful story</span>
            </h1>
            <p className="text-lg text-secondary max-w-xl mb-8">
              Discover recipes from around the world, save your favorites, and share
              your own culinary creations with a community of food lovers.
            </p>

            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => navigate('/recipes')}
                className="btn-primary"
              >
                <span className="flex gap-2 justify-center items-center text-lg">
                  <MdExplore className="text-xl" />
                  Explore Recipes
                </span>
              </button>

              {isAuthenticated &&
                <button
                  onClick={handleCreateRecipe}
                  className="btn-secondary"
                >
                  <span className="flex gap-2 justify-center items-center text-lg">
                    <MdAdd className="text-xl" />
                    Create Recipe
                  </span>
                </button>
                }
            </div>
          </div>

          {/* Right — top-rated preview */}
          <div className="md:col-span-5 relative px-8 group">
            {topRated ? (
              <>
                <Link
                  to={`/recipe/${topRated._id}`}
                  className="block aspect-[4/5] rounded-xl overflow-hidden shadow-secondary-btn rotate-2 group-hover:rotate-0 transition-transform duration-700 border recipe-card-hover"
                >
                  <img
                    src={topRated.imageUrl}
                    alt={topRated.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </Link>

                {/* Badge */}
                <div className="absolute glass-card -bottom-4 -left-4 bg-surface p-3 pr-4 rounded-xl shadow-secondary-btn border flex items-center gap-3 max-w-[85%] ml-8">
                  <div className="w-10 h-10 shadow-secondary-btn rounded-lg border-l flex items-center justify-center shrink-0">
                    <MdStar className="text-accent text-2xl" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-accent truncate">
                      Top Rated
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {topRated.title}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card aspect-[4/5] rounded-xl border animate-pulse" />
            )}
          </div>
        </section>

        {/* === FEATURES BENTO === */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Explore */}
            <Link
              to="/recipes"
              className="group p-6 md:p-8 rounded-xl border flex flex-col justify-between min-h-[200px] hover:border-accent hover:-translate-y-0.5 transition-all duration-700 md:col-span-2 lg:col-span-2 bg-tertiary"
            >
              <div>
                <div className="flex gap-2 mb-4">
                  <MdExplore className="text-3xl" />
                  <h3 className="font-headline-sm text-xl md:text-2xl mb-2">
                    Explore
                  </h3>
                </div>
                <p className="text-sm md:text-base text-secondary leading-relaxed">
                  Get inspired by a fresh mix of random recipes from our collection and TheMealDB. Perfect when you don't know what to cook yet.
                </p>
              </div>
            </Link>

            {/* Search */}
            <Link
              to="/search"
              className="group p-8 rounded-xl border flex flex-col justify-between min-h-[200px] hover:border-accent hover:-translate-y-0.5 transition-all duration-700 md:col-span-2 lg:col-span-1"
            >
              <div>
                <div className="flex gap-2 mb-4">
                  <MdSearch className="text-3xl" />
                  <h3 className="font-headline-sm text-xl md:text-2xl mb-2">
                    Search
                  </h3>
                </div>
                <p className="text-sm md:text-base text-secondary leading-relaxed">
                  Looking for something specific? Filter by ingredients, category, difficulty, or cooking time.
                </p>
              </div>
            </Link>

            {/* Chats */}
            <Link
              to="/chats"
              className="group p-6 md:p-8 rounded-xl border flex flex-col justify-between min-h-[200px] hover:border-accent hover:-translate-y-0.5 transition-all duration-700 md:col-span-4 lg:col-span-1 bg-border"
            >
              <div>
                <div className="flex gap-2 mb-4">
                  <IoIosChatboxes className="text-3xl" />
                  <h3 className="font-headline-sm text-xl md:text-2xl mb-2">
                    Chats
                  </h3>
                </div>
                <p className="text-sm md:text-base text-secondary leading-relaxed">
                  Message other food lovers directly — swap tips, ask about a recipe, or just talk about what you're cooking tonight.
                </p>
              </div>
            </Link>

            {/* Top Rated */}
            <Link
              to="/top-rated"
              className="group p-6 md:p-8 rounded-xl border flex flex-col justify-between min-h-[200px] hover:border-accent hover:-translate-y-0.5 transition-all duration-700 md:col-span-2 lg:col-span-1"
            >
              <div>
                <div className="flex gap-2 mb-4">
                  <MdStar className="text-3xl" />
                  <h3 className="font-headline-sm text-xl md:text-2xl mb-2">
                    Top Rated
                  </h3>
                </div>
                <p className="text-sm md:text-base text-secondary leading-relaxed">
                  Browse the highest-rated recipes from our community.
                </p>
              </div>
            </Link>

            {/* Community */}
            <Link
              to="/users"
              className="group p-6 md:p-8 rounded-xl border flex flex-col justify-between min-h-[200px] hover:border-accent hover:-translate-y-0.5 transition-all duration-700 md:col-span-2 lg:col-span-3 bg-accent-secondary-bg"
            >
              <div>
                <div className="flex gap-2 mb-4">
                  <MdGroups className="text-3xl" />
                  <h3 className="font-headline-sm text-xl md:text-2xl mb-2">
                    Community
                  </h3>
                </div>
                <p className="text-sm md:text-base text-secondary leading-relaxed">
                  Every recipe can be rated, commented, and saved. Share your own dishes and get feedback from other food lovers.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* === FINAL CTA === */}
        <section className="text-center py-12 px-8 lg:px-16 rounded-2xl glass-card border cursor-default">
          <h2 className="font-headline-sm text-2xl md:text-3xl mb-3">
            Ready to cook something new?
          </h2>
          <p className="text-secondary mb-6 max-w-xl mx-auto">
            Jump straight into our recipe collection — no account required.
          </p>
          <button
            onClick={() => navigate('/recipes')}
            className="btn-primary"
          >
            <span className="flex gap-2">
              Start exploring
              <MdArrowForward className="text-xl" />
            </span>
          </button>
        </section>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseModal}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
        }}
      />
    </>
  );
}

export default Home;