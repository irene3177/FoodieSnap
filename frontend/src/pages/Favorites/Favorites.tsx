import { useEffect  } from 'react';
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
import { useAppDispatch, useAppSelector, showToast } from '@/store';
import { fetchFavorites, clearAllFavorites, reorderFavorites } from '@/store/favoritesSlice';
import { useAuth } from '@/hooks/useAuth';
import SortableRecipeCard from '@/components/SortableRecipeCard/SortableRecipeCard';
import { FavoritesGridSkeleton } from '@/components/ui/Skeleton/FavoritesGridSkeleton';
import { ErrorState, EmptyState } from '@/components/ui';
import { MdOutlineBookmarks, MdOutlineExplore } from 'react-icons/md';

function Favorites() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items: favorites, loading, error } = useAppSelector(state => state.favorites);

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

  useEffect (() => {
    if (user) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, user]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((item) => item._id === active.id);
      const newIndex = favorites.findIndex((item) => item._id === over.id);

      const reorderedItems = arrayMove(favorites, oldIndex, newIndex);
      dispatch(reorderFavorites(reorderedItems));

      dispatch(showToast({
        message: 'Saved reordered!',
        type: 'info'
      }));
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all saved recipes?')) {
      await dispatch(clearAllFavorites());

      dispatch(showToast({
        message: 'All saved cleared!',
        type: 'info'
      }));
    }
  };

  if (!user) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-16 text-center bg-secondary rounded-xl border shadow-theme my-8">
        <h2 className="text-2xl font-headline-sm text-primary mb-2">Please log in</h2>
        <p className="text-secondary mb-8 leading-relaxed">
          You need to be logged in to view your saved recipes
        </p>
        <a href="/login" className="inline-block px-8 py-3 rounded bg-accent text-white font-medium hover:bg-accent-hover transition-colors">
          Go to Login
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => dispatch(fetchFavorites())}
      />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8 md:py-10 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 cursor-default">
        <div>
          <h1 className="font-display-lg text-display-lg text-secondary tracking-tight">My Saved Recipes</h1>
          {favorites.length > 0 && (
            <p className="text-muted font-body-lg text-body-lg mt-2 md:mb-4">
              Drag the card to reorder your saved recipes
            </p>
          )}
        </div>
        {favorites.length > 0 && (
          <button
          className="btn-secondary bg-red-400 md:mt-3"
          onClick={handleClearAll}
          aria-label="Clear all favorites"
          >
            Clear All
          </button>
        )}
      </div>

      {loading && favorites.length === 0 ? (
        <FavoritesGridSkeleton />
      ) : favorites.length === 0 ? (
        <div className="flex justify-center mt-6">
          <EmptyState
            icon={<MdOutlineBookmarks />}
            title="No Saved Recipes Yet"
            description="You haven't saved any recipes yet."
            action={{
              label: "Explore Recipes",
              to: "/recipes",
              icon: <MdOutlineExplore />
            }}
          />
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <span className="text-center text-sm text-muted">
              {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
            </span>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={favorites.map(r => r._id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 md:gap-8">
                {favorites.map((recipe) => (
                  <SortableRecipeCard
                    key={recipe._id}
                    recipe={recipe}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Tips */}
          <div className="bg-secondary rounded-lg p-6 mt-8 border">
            <h3 className="text-primary text-base font-medium m-0 mb-2">Tips</h3>
            <ul className="m-0 pl-6 text-secondary text-sm list-disc space-y-1">
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