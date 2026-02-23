import { useNavigate } from 'react-router-dom';
import './Home.css'

function Home() {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/recipes');
  };

  return (
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
  );
}

export default Home;