import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import EmptyState from '../../components/EmptyState';
import { MdAccessTime, MdExplore, MdOutlineStarBorder, MdStar, MdWorkspacePremium } from 'react-icons/md';
import BookmarkButton from '../../components/FavoriteButton/BookmarkButton';
import Avatar from '../../components/Avatar';

function TopRated() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopRated = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getTopRatedRecipes(10);
      if (result.success && result.data) {
        setRecipes(result.data);
      } else {
        setError(result.error || 'Failed to load top rated recipes');
      }
      setLoading(false);
    };
    loadTopRated();
  }, []);

  
  const topRecipe = recipes.length > 0 ? recipes[0] : null;
  const restRecipes = recipes.length > 1 ? recipes.slice(1) : [];
  
  const handleCardClick = () => {
    navigate(`/recipe/${topRecipe?._id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 md:py-12">
      {/* Empty */}
      {!loading && !error && recipes.length === 0 && (
        <div className="flex items-center justify-center text-center py-12 px-8">
          <EmptyState
            icon={<MdOutlineStarBorder />}
            title="No Ratings Yet"
            description="Be the first to rate recipes and help others find the best dishes!"
            action={{
              label: "Explore Recipes",
              to: "/recipes",
              icon: <MdExplore className="text-xl" />
            }}
          />
        </div>
      )}
      {/* Header */}
      <div className="text-center mb-10 cursor-default">
        <h1 className="font-display-lg text-display-lg text-secondary tracking-tight">
          Top 10 Rated Recipes
        </h1>
        <p className="text-muted font-body-lg text-body-lg mt-2">
          The best recipes, as rated by our community
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-8 px-4 bg-error rounded-xl text-error my-6">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Hero Card */}
      {!loading && !error && topRecipe && (
        <section className="relative w-full rounded-2xl overflow-hidden glass-card border recipe-card-hover mb-8 group cursor-pointer">
          <div className="flex flex-col md:flex-row"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${topRecipe.title}`}
          >
            {/* Image */}
            <div className="md:w-3/5 relative overflow-hidden aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 lg:bg-gradient-to-r lg:from-black/60 lg:via-transparent lg:to-transparent" />
              <img
                src={topRecipe.imageUrl}
                alt={topRecipe.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Badge "Top Rated" */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-accent shadow-theme">
                <MdWorkspacePremium className="text-accent text-xl" />
                <span className="font-label-md text-label-md text-accent">Top Rated</span>
              </div>
            </div>

            {/* Content */}
            <div className=" md:w-2/5 p-8 flex flex-col justify-center gap-4 z-20">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-4xl md:text-5xl font-headline-md text-muted select-none">
                  #1
                </h2>
                {topRecipe.category && (
                  <span className="px-3 py-1 rounded-full bg-tertiary text-tertiary font-label-sm text-label-sm border border-tertiary-container">
                    {topRecipe.category}
                  </span>
                )}
              </div>

              <h2 className="text-3xl text-primary group-hover:text-accent transition-colors duration-500">
                {topRecipe.title}
              </h2>
              
              <p className="text-sm md:text-base text-secondary line-clamp-3">
                {topRecipe.description}
              </p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-accent">
                    <MdStar className="text-star-filled text-xl" />
                    <span className="font-semibold text-primary">
                      {topRecipe.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-muted text-xs">
                      ({topRecipe.ratingCount || 0} ratings)
                    </span>
                  </div>
                </div>
              </div>

              {/* Time and difficulty */}
              <div className="flex justify-between text-xs text-muted mt-2 pt-4 border-t">
                {topRecipe.cookingTime && (
                  <div className="flex items-center gap-1">
                    <MdAccessTime /> <span>{topRecipe.cookingTime} min</span>
                  </div>
                )}
                {topRecipe.difficulty && (
                  <div className="flex items-center gap-1">
                    <span className="capitalize">{topRecipe.difficulty}</span>
                  </div>
                )}
                <span>{topRecipe.ingredients?.length || 0} ingredients</span>
              </div>

              {/* Author? and Bookmark */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex gap-2">
                  {topRecipe.author && (
                    <>
                      <Avatar src={topRecipe.author?.avatar} username={topRecipe.author?.username} border />
                      <h3 className="text-secondary text-xl font-semibold">{topRecipe.author?.username}</h3>
                    </>
                  )}
                </div>
                <BookmarkButton recipe={topRecipe} size="medium" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      {!loading && !error && restRecipes.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {restRecipes.map((recipe, index) => (
            <div
              className="break-inside-avoid flex justify-center"
              key={`${recipe._id}-${index}`}
            >
              <div className="w-full max-w-[450px] lg:max-w-none">
                <RecipeCard
                  recipe={recipe}
                  aspectRatio={
                    index % 3 === 0 ? 'portrait' : 
                    index % 3 === 1 ? 'square' : 
                    'landscape'
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <ScrollToTop threshold={300} behavior="smooth" />
    </div>
  );
}

export default TopRated;