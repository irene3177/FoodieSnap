import { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Recipe, UserProfile } from '../../types';
import RecipeCard from '../RecipeCard/RecipeCard';
import EmptyState from '../EmptyState';
import { LuNotebookPen } from 'react-icons/lu';
import { MdOutlineBookmarks, MdOutlineExplore } from 'react-icons/md';

interface ProfileTabsProps {
  profile: UserProfile | null;
  favorites: Recipe[];
  userRecipes: Recipe[];
  isOwnProfile: boolean;
  loadingFavorites: boolean;
  loadingUserRecipes: boolean;
  onAddRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
};

function ProfileTabs({
  profile,
  favorites,
  userRecipes,
  isOwnProfile,
  loadingFavorites,
  loadingUserRecipes,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe,

}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'myRecipes'>('favorites');

  return (
    <>
      <div className="flex-1 flex-col col-span-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b pb-4">
          <div className="flex">
            <h2 className="font-display-lg text-display-lg text-accent-secondary">Culinary Journal</h2>
          </div>
          <div>
            {['favorites', 'myRecipes'].map((tab) => (
              <button
                key={tab}
                className={`relative px-4 py-2 text-label-md uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab
                    ? 'text-accent after:absolute after:bottom-[-1rem] after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                    : 'text-secondary hover:text-primary'
                }`}
                onClick={() => setActiveTab(tab as typeof activeTab)}
              >
                {tab === 'favorites' && (
                  <span>Saved ({favorites.length})</span>
                )}
                {tab === 'myRecipes' && (
                  <span>{isOwnProfile ? 'My Recipes' : 'Recipes'} ({userRecipes.length})</span>)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] animate-fade-in">
          {/* Favorites */}
          {activeTab === 'favorites' && (
            <>
              <div className="flex items-center gap-2 text-lg text-primary mb-4">
                Saved Recipes
                <span className="text-xs text-muted uppercase">Public</span>
              </div>

              {loadingFavorites ? (
                <div className="text-center py-8 text-secondary">Loading favorites...</div>
              ) : favorites.length > 0 ? (
                <Masonry
                  breakpointCols={{
                    default: 2,
                    1024: 2,
                    768: 2,
                    640: 1
                  }}
                  className="flex w-auto -ml-6"
                  columnClassName="pl-6 bg-clip-padding"
                >
                  {favorites.map((recipe, index) => (
                    <div
                      key={`${recipe._id}-${index}`}
                      // ref={index === favorites.length - 1 ? lastElementRef : null}
                      className="mb-6 w-full max-w-[450px] justify-self-center"
                    >
                      <RecipeCard
                        recipe={recipe}
                        aspectRatio={
                          index % 3 === 0 ? 'portrait' : 
                          index % 3 === 1 ? 'square' : 
                          'landscape'
                        }
                      />
                    </div>
                  ))}
                </Masonry>
              ) : (
                <div className="flex items-center justify-center text-center py-12 px-8">
                  {isOwnProfile 
                    ? (
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
                    )
                    : (
                      <EmptyState
                        icon={<MdOutlineBookmarks />}
                        title="No Saved Recipes Yet"
                        description={`${profile?.username} hasn't saved any recipes yet.`}
                      />
                    )}
                </div>
              )} 
            </>
          )}

          {/* My Recipes */}
          {activeTab === 'myRecipes' && (
            <>
              <div className="flex items-center gap-2 text-lg text-primary mb-4">
                {isOwnProfile ? '' : `${profile?.username}'s Recipes`}
                <span className="flex items-center gap-2 text-lg text-primary">{isOwnProfile ? 'Your creations' : ''}</span>
                <span className="text-xs text-muted uppercase">Public</span>
              </div>

              {loadingUserRecipes ? (
                <div className="text-center py-8 text-secondary">Loading recipes...</div>
              ) : userRecipes.length > 0 ? (
                <Masonry
                  breakpointCols={{
                    default: 2,
                    1024: 2,
                    768: 2,
                    640: 1
                  }}
                  className="flex w-auto -ml-6"
                  columnClassName="pl-6 bg-clip-padding"
                >
                  {userRecipes.map((recipe, index) => (
                    <div
                      key={`${recipe._id}-${index}`}
                      // ref={index === favorites.length - 1 ? lastElementRef : null}
                      className="mb-6 w-full max-w-[450px] justify-self-center"
                    >
                      <RecipeCard
                        recipe={recipe}
                        onEdit={isOwnProfile ? onEditRecipe : undefined}
                        onDelete={isOwnProfile ? onDeleteRecipe : undefined}
                        isOwner={isOwnProfile}
                        aspectRatio={
                          index % 3 === 0 ? 'portrait' : 
                          index % 3 === 1 ? 'square' : 
                          'landscape'
                        }
                      />
                    </div>
                  ))}
                </Masonry>
              ) : (
                <div className="flex items-center justify-center text-center py-12 px-8">
                  {isOwnProfile 
                    ? (
                      <EmptyState
                        icon={<LuNotebookPen />}
                        title="No Recipes Yet"
                        description="You haven't created any recipes yet."
                        secondaryAction={{
                          label: "Create Your First Recipe",
                          onClick: onAddRecipe
                        }}
                      />
                    )
                    : (
                      <EmptyState
                        icon={<LuNotebookPen />}
                        title="No Recipes Yet"
                        description={`${profile?.username} hasn't created any recipes yet.`}
                      />
                    )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ProfileTabs;