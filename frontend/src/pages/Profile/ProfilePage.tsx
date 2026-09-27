import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
import { Recipe } from '../../types';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileAbout from '../../components/Profile/ProfileAbout';
import ProfileTabs from '../../components/Profile/ProfileTabs';

function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loadingUserRecipes, setLoadingUserRecipes] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditRecipeModalOpen, setIsEditRecipeModalOpen] = useState(false);

  const {
    profile,
    favorites,
    loading,
    loadingFavorites,
    error,
    refresh,
    updateFollowStats,
    updateCounters,
    isOwnProfile,
  } = useProfileData(userId, currentUser?._id);


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

  useEffect(() => {
    if (location.state?.openCreateRecipe) {
      setIsCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto px-8 py-6">
        <div className="flex flex-col items-center">
          {/* Profile Header */}
          <ProfileHeader
            currentUser={currentUser}
            profile={profile}
            refresh={refresh}
            updateFollowStats={updateFollowStats}
            userRecipesCount={userRecipes.length}
            onShowFollowers={() => setShowFollowersModal(true)}
            onShowFollowing={() => setShowFollowingModal(true)}
            onEditProfile={() => setIsEditModalOpen(true)}
            onAddRecipe={() => setIsCreateModalOpen(true)}
            onMessage={() => setIsMessageModalOpen(true)}
          />
          {/* About Section */}
          <ProfileAbout
            profile={profile}
            userRecipesCount={userRecipes.length}
            favoritesCount={favorites.length}
          />

        </div>

        {/* Tabs */}
        <ProfileTabs
          profile={profile}
          favorites={favorites}
          userRecipes={userRecipes}
          isOwnProfile={isOwnProfile}
          loadingFavorites={loadingFavorites}
          loadingUserRecipes={loadingUserRecipes}
          onAddRecipe={() => setIsCreateModalOpen(true)}
          onEditRecipe={handleEditRecipe}
          onDeleteRecipe={handleDeleteRecipe}
        />
        
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
        recipient={profile}
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