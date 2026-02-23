import { useState, useEffect } from 'react';
import { recipeApi } from '../../services/recipeApi';
import { Recipe } from '../../types/recipe.types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Loader from '../../components/Loader/Loader';
import './Recipes.css';

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Load initial random recipes
  useEffect(() => {
    loadRandomRecipes();
  }, []);

  const loadRandomRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load 4 random recipes for initial display
      const randomRecipes: Recipe[] = [];
      for (let i = 0; i < 4; i++) {
        const recipe = await recipeApi.getRandomRecipe();
        randomRecipes.push(recipe);
      }
      setRecipes(randomRecipes);
    } catch (err) {
      setError('Failed to load recipes. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if(searchTimeout) {
      window.clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced searched
    const timeoutId = window.setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        setError(null);
        try {
          const searchResults = await recipeApi.searchRecipes(query);
          setRecipes(searchResults);
        } catch (err) {
          setError('Failed to search recipes. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
      }
    } else if (query === '') {
      // If search is empty, load random recipes again
      loadRandomRecipes();
    }
  }, 500);  // 500ms debounce

    setSearchTimeout(timeoutId);
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="recipes-page">
      <div className="reipes-page__header">
        <h1 className="recipes-page__title">Discover Recipes</h1>

        {/* Search Bar */}
        <div className="recipes-page__search">
          <input
            type="text"
            placeholder="Search for recipes (e.g., 'chicken', 'pasta')..."
            value={searchQuery}
            onChange={handleSearch}
            className="recipes-page__search-input" 
          />
          {searchQuery && (
            <button
              className="recipes-page__search-clear"
              onClick={() => {
                setSearchQuery('');
                loadRandomRecipes();
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="recipes-page__error">
          <p className="recipes-page__error-message">{error}</p>
          <button
            className="recipes-page__retry-button"
            onClick={loadRandomRecipes}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && <Loader message="Searching for delicious recipes..." />}

      {/* Results */}
      {!loading && !error && (
        <>
          {recipes.length === 0 ? (
            <div className="recipes-page__no-results">
              <p>No recipes found for "{searchQuery}"</p>
              <p className="recipes-page__no-results-hint">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <>
              <p className="recipes-page__results-count">
                Found {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
              </p>
              <div className="recipes-page__grid">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Recipes;