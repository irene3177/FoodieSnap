// pages/RecipeDetail/RecipeDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import { RecipeDetailSkeleton } from '../../components/Skeleton/Skeleton';
import RatingStars from '../../components/RatingStars/RatingStars';
import ShareButtons from '../../components/ShareButtons/ShareButtons';
import CommentSection from '../../components/CommentSection/CommentSection';
import {
  MdArrowBack,
  MdPlayArrow,
  MdAccessTime,
} from 'react-icons/md';
import Avatar from '../../components/Avatar';
import BookmarkButton from '../../components/FavoriteButton/BookmarkButton';
import { GoDotFill } from 'react-icons/go';

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'reviews'>('ingredients');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeById(id);
      if (cancelled) return;

      if (result.success && result.data) {
        setRecipe(result.data);
      } else {
        setError(result.error || 'Recipe not found');
      }
      setLoading(false);
    };

    fetchRecipe();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <RecipeDetailSkeleton />;

  if (error || !recipe) {
    return (
      <div className="text-center py-16 px-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-headline-md text-primary mb-4">
          {error || 'Recipe not found'}
        </h2>
        <button
          onClick={() => navigate('/recipes')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <MdArrowBack /> Back to Recipes
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'ingredients' as const, label: 'Ingredients' },
    ...(recipe.instructions?.length ? [{ key: 'instructions' as const, label: 'Instructions' }] : []),
    { key: 'reviews' as const, label: 'Reviews' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8">
      <main>
        <div className="flex gap-2 justify-between my-2">
          {/* Back button */}
          <button
            title="Go back"
            className="bg-transparent border-none text-accent text-base cursor-pointer p-2 rounded-xl transition-all duration-200 hover:bg-border hover:-translate-x-0.5"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <MdArrowBack className="text-3xl" />
          </button>
          {/* Breadcrumbs */}
          <nav className="flex items-end gap-2 text-xs md:text-sm md:mr-8 text-muted mt-4 mb-4 overflow-hidden">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors shrink-0">
              Home
            </button>
            <span className="opacity-50">/</span>
            <button onClick={() => navigate('/recipes')} className="hover:text-primary transition-colors duration-300 shrink-0">
              Recipes
            </button>
            <span className="opacity-50">/</span>
            <button className="text-secondary cursor-default">{recipe.title}</button>
          </nav>
        </div>

        {/* Hero Card */}
        {!loading && !error && recipe && (
          <section className="relative w-full rounded-2xl overflow-hidden glass-card border mb-8 group">
            <div className="flex flex-col md:flex-row"
              tabIndex={0}
              aria-label={`View details for ${recipe.title}`}
            >
              {/* Image */}
              <div className="md:w-3/5 relative overflow-hidden aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 lg:bg-gradient-to-r lg:from-black/60 lg:via-transparent lg:to-transparent" />
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                
              </div>

              {/* Content */}
              <div className=" md:w-2/5 p-8 flex flex-col justify-center gap-4 z-20">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-3xl text-secondary group-hover:text-accent transition-colors duration-500">
                    {recipe.title}
                  </h2>
                  {recipe.category && (
                    <span className="px-3 mt-2 py-1 rounded-full bg-tertiary text-tertiary-container font-label-sm text-label-sm border border-tertiary-container">
                      {recipe.category}
                    </span>
                  )}
                </div>


                {/* Rating & Share */}
                <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-y">
                  <RatingStars recipeId={recipe._id} size="large" showCount />
                  <ShareButtons
                    title={recipe.title}
                    url={`/recipe/${recipe._id}`}
                    description={recipe.description}
                    image={recipe.imageUrl}
                  />
                </div>
                
                <p className="text-sm md:text-base text-secondary line-clamp-3">
                  {recipe.description}
                </p>

                {/* Time and difficulty */}
                <div className="flex justify-between text-xs text-muted mt-2 pt-4 border-t">
                  {recipe.cookingTime && (
                    <div className="flex items-center gap-1">
                      <MdAccessTime /> <span>{recipe.cookingTime} min</span>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{recipe.difficulty}</span>
                    </div>
                  )}
                  <span>{recipe.ingredients?.length || 0} ingredients</span>
                </div>

                {/* Author? and Bookmark */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex gap-2">
                    {recipe.author && (
                      <>
                        <Avatar src={recipe.author?.avatar} username={recipe.author?.username} border />
                        <h3 className="text-secondary text-xl font-semibold">{recipe.author?.username}</h3>
                      </>
                    )}
                  </div>
                  <BookmarkButton recipe={recipe} size="medium" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content Card */}
        <div className="flex mx-auto justify-center cursor-default">
          {/* Tags */}
          {(recipe.tags?.length || recipe.area) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.area && <div className="px-3 py-1 rounded-full text-sm font-medium bg-accent-secondary-bg border">{recipe.area}</div>}
              {recipe.tags?.map((tag) => <div className="px-3 py-1 rounded-full text-sm font-medium bg-accent-secondary-bg border" key={tag}>{tag}</div>)}
            </div>
          )}
        </div>
        <div className="flex-1 flex-col col-span-2">
          {/* Tabs */}
          <div className="flex md:flex-row md:items-end justify-start md:gap-4 mb-6 border-b pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2 text-label-md uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'text-accent after:absolute after:bottom-[-1rem] after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="pb-8">
            {activeTab === 'ingredients' && (
              <section className="animate-fade-in">
                <ul className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                  {recipe.ingredients.map((ingredient, index) => {
                    return (
                      <li key={index} className="text-muted">
                        <GoDotFill className="inline mr-2" />{ingredient}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {activeTab === 'instructions' && recipe.instructions && (
              <section className="animate-fade-in px-4">
                <ol className="space-y-4">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      
                      <p className="text-muted leading-relaxed"><GoDotFill className="inline mr-2" />{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {activeTab === 'reviews' && (
              <section className="animate-fade-in">
                <CommentSection recipeId={recipe._id} recipeTitle={recipe.title} />
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 flex gap-4 px-8 py-4 bg-surface-container/90 backdrop-blur-xl border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          className="btn-secondary"
        >
          <BookmarkButton recipe={recipe} size="small" showText />
        </button>

        {recipe.youtubeUrl ? (
          <button className="btn-primary">
            <a
              href={recipe.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="flex gap-2 text-button text-sm items-center justify-center">
                <MdPlayArrow className="text-2xl"/> Watch Video 
              </span>
            </a>
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="No video tutorial available for this recipe"
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm bg-surface-variant text-muted border border-border cursor-not-allowed opacity-60"
          >
            <MdPlayArrow /> No Video
          </button>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail; 