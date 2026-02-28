import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { useFavorites } from '../../context/FavoritesContext';
//import RecipeCard from '../../components/RecipeCard/RecipeCard';
import SortableRecipeCard from '../../components/SortableRecipeCard/SortableRecipeCard';
import { FavoritesSkeleton } from '../../components/Skeleton/Skeleton';
import './Favorites.css';

function Favorites() {
  const { state, clearFavorites, reorderFavorites } = useFavorites();
  const { favorites, loading, error } = state;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,     // Minimum drag distance before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((item) => item.id === active.id);
      const newIndex = favorites.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(favorites, oldIndex, newIndex);
      reorderFavorites(reorderedItems);
    }
  };

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
        <div>
          <h1 className="favorites-page__title">My Favorite Recipes</h1>
          {favorites.length > 0 && (
            <p className="favorites-page__subtitle">
              Drag the card to reorder your favorites
            </p>
          )}
        </div>
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
          <div className="favorites-page__stats">
            <span className="favorites-page__count">
              {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
            </span>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={favorites.map(r => r.id)}
              strategy={rectSortingStrategy}
            >
              <div className="favorites-page__grid">
                {favorites.map((recipe) => (
                  <SortableRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="favorites-page__tips">
            <h3 className="favorites-page__tips-title">💡 Pro Tips</h3>
            <ul className="favorites-page__tips-list">
              <li>Drag the card to reorder your favorites</li>
              <li>The order you set here will be saved automatically</li>
              <li>Use keyboard (Tab + Space) to reorder without mouse</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Favorites;