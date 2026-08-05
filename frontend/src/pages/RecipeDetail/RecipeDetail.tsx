
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import { RecipeDetailSkeleton } from '../../components/Skeleton/Skeleton';
import FavoriteButton from '../../components/FavoriteButton/FavoriteButton';
import RatingStars from '../../components/RatingStars/RatingStars';
import ShareButtons from '../../components/ShareButtons/ShareButtons';
import CommentSection from '../../components/CommentSection/CommentSection';
import { MdArrowBack, MdPlayArrow } from 'react-icons/md';


// check for this recipe ingredients. http://localhost:5173/recipe/69c1afb9ed71853ffe40665a

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeById(id);

      if (result.success && result.data) {
        setRecipe(result.data);
      } else {
        setError(result.error || 'Recipe not found');
      }
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  if(loading) {
    return <RecipeDetailSkeleton />;
  }

  if (error || !recipe) {
    return (
      <div className="text-center py-16 px-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-headline-md text-primary mb-4">{error || 'Recipe not found'}</h2>
        <button onClick={() => navigate('/recipes')} className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors">
          <MdArrowBack /> Back to Recipes
        </button>
      </div>
    );
  }

  

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-accent hover:text-accent-hover hover:bg-tag-bg hover:-translate-x-1 transition-all duration-300 px-3 py-2 rounded-lg mb-6"
      >
        <MdArrowBack /> Back to Recipes
      </button>

      {/* Main content */}
      <div className="bg-card rounded-xl p-6 md:p-8 shadow-theme border">
        {/* Grid: Image + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative rounded-lg overflow-hidden shadow-theme bg-transparent max-h-[400px]">
            {/* Image */}
            <img 
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-card rounded-full shadow-theme z-10 px-2 py-1">
              <FavoriteButton recipe={recipe} size="large" showText />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-headline-md text-primary">{recipe.title}</h1>
            {/* Rating */}
            <div className="flex items-center justify-between flex-wrap gap-4 py-3 border-y">
              <RatingStars recipeId={recipe._id} size="large" showCount />
            </div>
            
            {/* Share buttons */}
            <ShareButtons 
              title={recipe.title}
              url={`/recipe/${recipe._id}`}
              description={recipe.description}
              image={recipe.imageUrl}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {recipe.tags?.map((tag) =>(
                <span key={tag} className="bg-tag text-tag px-3 py-1 rounded-full text-sm font-medium">{tag}</span>
              ))}

              {recipe.category && (
                <span className="bg-tag text-tag px-3 py-1 rounded-full text-sm font-medium">{recipe.category}</span>
              )}
              {recipe.area && (
                <span className="bg-tag text-tag px-3 py-1 rounded-full text-sm font-medium">{recipe.area}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-lg text-secondary leading-relaxed">{recipe.description}</p>
            
            {/* YouTube */}
            {recipe.youtubeUrl && (
              <div>
                <h3 className="text-xl font-headline-sm text-primary mb-2">Video Tutorial</h3>
                <a
                  href={recipe.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent hover:text-accent-hover hover:translate-x-1 transition-all duration-300 font-medium"
                >
                  <MdPlayArrow /> Watch on YouTube
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Ingredients + Instructions */}
        <div className="mt-6 pt-2">
          {/* Ingredients */}
          <div>
            <h2 className="text-2xl font-headline-sm text-primary border-b-2 pb-2 pt-4">Ingredients</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 list-none p-0">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2 text-secondary text-base py-1">
                  <span className="text-accent text-xl leading-none">•</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div className="mt-6">
              <h2 className="text-2xl font-headline-sm text-primary border-b-2 pb-2 pt-4">Instructions</h2>
              <div className="mt-4 space-y-4">
                {recipe.instructions.map((step, index) => (
                  <p key={index} className="relative pl-6 text-secondary leading-relaxed text-base border-l-3 border-transparent hover:border-accent hover:pl-6 hover:scale-[1.01] transition-all duration-300">
                    {step}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <CommentSection recipeId={recipe._id} recipeTitle={recipe.title} />
      </div>    
    </div>
  );
}

export default RecipeDetail;