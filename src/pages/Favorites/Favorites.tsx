import { useFavorites } from '../../context/FavoritesContext';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { FavoritesSkeleton } from '../../components/Skeleton/Skeleton';
//import Loader from '../../components/Loader/Loader';
import './Favorites.css';

function Favorites() {
  const { state, clearFavorites } = useFavorites();
  const { favorites, loading, error } = state;


  if (loading) {
    return <FavoritesSkeleton />;
  }

  if (error) {
    return (
      <div className="favorites-page__error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button
        className="favorites-page__retry-button"
        onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-page__header">
        <h1 className="favorites-page__title">My Favorite Recipes</h1>
        {favorites.length > 0 && (
          <button
          className="favorites-page__clear-button"
          onClick={clearFavorites}
          aria-label="Clear all favorites"
          >
            Clear All
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-page__empty">
          <div className="favorites-page__empty-icon">❤️</div>
          <h2 className="favorites-page__empty-title">No favorites yet</h2>
          <p className="favorites-page__empty-message">
            Start exploring recipes and click the heart icon to save them here!
          </p>
          <a href="/recipes" className="favorites-page__explore-link">
            Explore Recipes
          </a>
        </div>
      ) : (
        <>
          <p className="favorites-page__count">
            You have {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
          </p>
          <div className="favorites-page__grid">
            {favorites.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Favorites;