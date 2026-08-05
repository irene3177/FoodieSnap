import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { ProfileSkeleton } from '../../components/Skeleton/ProfileSkeleton';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import CreateRecipeModal from '../../components/CreateRecipeModal/CreateRecipeModal';
import FollowModal from '../../components/FollowModal/FollowModal';
import MessageModal from '../../components/MessageModal/MessageModal';
import EditRecipeModal from '../../components/EditRecipeModal/EditRecipeModal';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { useProfileData } from '../../hooks/useProfileData';
import { useAppDispatch } from '../../store/store';
import { recipesApi } from '../../services/recipesApi';
import { showToast } from '../../store/toastSlice';
import { authApi } from '../../services/authApi';
import { Recipe } from '../../types';
// import Avatar from '../../components/Avatar';
import { MdEdit, MdAdd, MdMessage } from 'react-icons/md';

function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'favorites' | 'myRecipes' | 'about'>('favorites');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loadingUserRecipes, setLoadingUserRecipes] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditRecipeModalOpen, setIsEditRecipeModalOpen] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile,
    favorites,
    loading,
    loadingFavorites,
    error,
    refresh,
    updateFollowStats,
    updateCounters
  } = useProfileData(userId, currentUser?._id);

  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(
    profile?._id || '',
    profile?.isFollowing || false,
    {
      onFollowChange: (newIsFollowing, newFollowersCount) => {
        updateFollowStats(newIsFollowing, newFollowersCount);
      }
    }
  );

  const isOwnProfile = currentUser?._id === profile?._id;

  // Load user's own recipes
  useEffect(() => {
    const loadUserRecipes = async () => {
      if (!profile?._id) return;
      
      setLoadingUserRecipes(true);
      const result = await recipesApi.getUserRecipes(profile._id);
      if (result.success && result.data) {
        setUserRecipes(result.data);
      } else {
        console.error('Error loading user recipes:', result.error);
        dispatch(showToast({
          message: result.error || 'Failed to load recipes',
          type: 'error'
        }));
      }
      setLoadingUserRecipes(false);
    };

    if (profile?._id) {
      loadUserRecipes();
    }
  }, [profile?._id, dispatch]);

  const handleEditSuccess = async () => {
    await refreshUser();
    refresh();
  };

  const handleFollowUpdate = useCallback((newFollowersCount?: number, newFollowingCount?: number) => {
    updateCounters(newFollowersCount, newFollowingCount);
  }, [updateCounters]);

  const handleCreateSuccess = () => {
    // Reload user recipes
    if (profile?._id) {
      const loadUserRecipes = async () => {
        const result = await recipesApi.getUserRecipes(profile._id);
        if (result.success && result.data) {
          setUserRecipes(result.data);
        }
      };
      loadUserRecipes();
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      dispatch(showToast({
        message: 'Please select an image file',
        type: 'error'
      }));
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      dispatch(showToast({
        message: 'Image must be less than 5MB',
        type: 'error'
      }));
      return;
    }

    setIsUploadingAvatar(true);

    const response = await authApi.updateAvatar(file);
    
    if (response.success) {
      dispatch(showToast({
        message: 'Avatar updated successfully!',
        type: 'success'
      }));
      await refreshUser();
      refresh();
    } else {
      dispatch(showToast({
        message: response.error || 'Failed to update avatar',
        type: 'error'
      }));
    }
    setIsUploadingAvatar(false);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsEditRecipeModalOpen(true);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setUserRecipes(prev => prev.filter(r => r._id !== recipeId));
  };

  const handleUpdateRecipeSuccess = () => {
    if (profile?._id) {
      const loadUserRecipes = async () => {
        const result = await recipesApi.getUserRecipes(profile._id);
        if (result.success && result.data) {
          setUserRecipes(result.data);
        }
      };
      loadUserRecipes();
    }
    setIsEditRecipeModalOpen(false);
    setEditingRecipe(null);
  };

  if (!currentUser && !userId) {
    return <div className="profile-error">
      Please log in to view your profile
    </div>;
  }

  if (loading) return <ProfileSkeleton />;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div className="profile-error">User not found</div>;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-bg-secondary to-bg-primary rounded-2xl p-6 md:p-8 mb-8 text-center border  shadow-theme animate-fade-in">
          {/* Avatar */}
          <div
            className={`relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4 ${
              isOwnProfile ? 'cursor-pointer' : 'cursor-default'
            }`}
              onClick={handleAvatarClick}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white text-4xl md:text-5xl font-semibold overflow-hidden border-4 border-bg-secondary shadow-theme transition-all duration-300 relative z-10">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span>{profile.username.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Overlay for edit */}
            {isOwnProfile && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-20 cursor-pointer">
                <MdEdit className="w-8 h-8 text-white" />
              </div>
            )}

            {/* Loading spinner */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center z-30">
                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Username & Bio */}
          <h1 className="text-2xl md:text-3xl font-headline-md text-primary mb-1">{profile.username}</h1>
          {profile.bio && (
            <p className="text-secondary text-base leading-relaxed max-w-xl mx-auto mb-4 px-4">{profile.bio}</p>
          )}
          
          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-12 my-4 py-3 border-y">
            <div className="text-center">
              <span className="block text-xl md:text-2xl font-semibold text-primary">{userRecipes.length}</span>
              <span className="text-xs md:text-sm text-secondary uppercase tracking-wider">Recipes</span>
            </div>
            <div
              className="text-center cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setShowFollowersModal(true)}
            >
              <span className="block text-xl md:text-2xl font-semibold text-primary">{profile.followersCount || 0}</span>
              <span className="text-xs md:text-sm text-secondary uppercase tracking-wider">Followers</span>
            </div>
            <div
              className="text-center cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setShowFollowingModal(true)}
            >
              <span className="block text-xl md:text-2xl font-semibold text-primary">{profile.followingCount || 0}</span>
              <span className="text-xs md:text-sm text-secondary uppercase tracking-wider">Following</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
            {isOwnProfile ? (
              <>
                <button
                  className="btn-primary"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <MdEdit className="inline mr-1" /> Edit Profile
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <MdAdd className="inline mr-1" /> Add Recipe
                </button>
              </>
            ) : (
              <>
                <button
                  className={`${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsMessageModalOpen(true)}
                >
                  <MdMessage className="inline mr-1" /> Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-6 border-b  pb-4">
          {['favorites', 'myRecipes', 'about'].map((tab) => (
            <button
              key={tab}
              className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'text-accent after:absolute after:bottom-[-1rem] after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab === 'favorites' && 'Favorites'}
              {tab === 'myRecipes' && (isOwnProfile ? 'My Recipes' : `${profile.username}'s Recipes`)}
              {tab === 'about' && 'About'}
              {tab !== 'about' && (
                <span className={`inline-block ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab
                    ? 'bg-accent text-white'
                    : 'bg-border text-secondary'
                }`}>{tab === 'favorites' ? favorites.length : tab === 'myRecipes' ? userRecipes.length : ''}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] animate-fade-in">
          {/* Favorites */}
          {activeTab === 'favorites' && (
            <>
              <div className="flex items-center gap-2 text-lg text-primary mb-4">
                Saved Recipes
                <span className="text-sm text-secondary font-normal">Public</span>
              </div>

              {loadingFavorites ? (
                <div className="text-center py-8 text-secondary">Loading favorites...</div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((recipe) => (
                    <RecipeCard key={recipe._id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6 bg-secondary rounded-xl border-2 border-dashed">
                  <p className="text-lg text-secondary mb-4">
                    {isOwnProfile 
                      ? "You haven't added any favorites yet."
                      : `${profile.username} hasn't added any favorites yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link to="/recipes" className="inline-block px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover hover:-translate-y-0.5 transition-all duration-300">
                      Explore Recipes
                    </Link>
                  )}
                </div>
              )} 
            </>
          )}

          {/* My Recipes */}
          {activeTab === 'myRecipes' && (
            <>
              <div className="flex items-center gap-2 text-lg text-primary mb-4">
                {isOwnProfile ? 'My Recipes' : `${profile.username}'s Recipes`}
                <span className="text-sm text-text-secondary font-normal">{isOwnProfile ? 'Your creations' : 'Public recipes'}</span>
              </div>

              {loadingUserRecipes ? (
                <div className="text-center py-8 text-secondary">Loading recipes...</div>
              ) : userRecipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onEdit={isOwnProfile ? handleEditRecipe : undefined}
                      onDelete={isOwnProfile ? handleDeleteRecipe : undefined}
                      isOwner={isOwnProfile}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6 bg-secondary rounded-xl border-2 dashed">
                  <p className="text-lg text-secondary mb-4">
                    {isOwnProfile 
                      ? "You haven't created any recipes yet."
                      : `${profile.username} hasn't created any recipes yet.`}
                  </p>
                  {isOwnProfile && (
                    <button
                      className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover hover:-translate-y-0.5 transition-all duration-300"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Create Your First Recipe
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <div className="bg-secondary rounded-xl p-6 md:p-8 border ">
              <div className="mb-6">
                <h3 className="text-sm text-secondary uppercase tracking-wider mb-2">About</h3>
                <p className="text-primary leading-relaxed whitespace-pre-wrap">
                  {profile.bio || `${profile.username} hasn't added a bio yet.`}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm text-secondary uppercase tracking-wider mb-2">Member Since</h3>
                <p className="text-primary">
                  {profile.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Recently joined'}
                </p>
              </div>

              <div>
                <h3 className="text-sm text-secondary uppercase tracking-wider mb-2">Stats</h3>
                <div className="space-y-2 text-secondary">
                  <p>{userRecipes.length || 0} recipe{userRecipes.length !== 1 ? 's' : ''} shared</p>
                  <p>{favorites.length} favorite {favorites.length === 1 ? 'recipe' : 'recipes'}
                  </p>
                  <p>{profile.followersCount || 0} followers · {profile.followingCount || 0} following
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <ScrollToTop threshold={300} />
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
      <CreateRecipeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        recipientId={profile._id}
        recipientName={profile.username}
        recipientAvatar={profile.avatar}
      />
      <FollowModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={profile._id}
        type="followers"
        initialCount={profile.followersCount || 0}
        onUpdate={handleFollowUpdate}
      />

      <FollowModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={profile._id}
        type="following"
        initialCount={profile.followingCount || 0}
        onUpdate={handleFollowUpdate}
      />

      <EditRecipeModal
        isOpen={isEditRecipeModalOpen}
        onClose={() => {
          setIsEditRecipeModalOpen(false);
          setEditingRecipe(null);
        }}
        recipe={editingRecipe}
        onSuccess={handleUpdateRecipeSuccess}
      />
    </>
  );
}

export default ProfilePage;