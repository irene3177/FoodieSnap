import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Loader from '../../components/Loader/Loader';
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
import './ProfilePage.css';

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
        // refresh();
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

  if (loading) return <Loader message="Loading profile..." />;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div className="profile-error">User not found</div>;

  return (
    <>
      <div className="profile-page">
        {/* Profile Header */}
        <div className="profile-header">
          <div
            className={`profile-avatar-wrapper ${isOwnProfile
              ? 'profile-avatar-wrapper--editable'
              : ''}`}
              onClick={handleAvatarClick}
          >
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} />
              ) : (
                <span>{profile.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {isOwnProfile && (
              <div className="profile-avatar-overlay">
                <svg
                  className="profile-avatar-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 4v16m-8-8h16" stroke="currentColor" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
                </svg>
              </div>
            )}
            {isUploadingAvatar && (
              <div className="profile-avatar-loading">
                <div className="profile-avatar-spinner"></div>
              </div>
            )}
          </div>
          <h1 className="profile-username">{profile.username}</h1>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{userRecipes.length}</span>
              <span className="profile-stat-label">Recipes</span>
            </div>
            <div
              className="profile-stat"
              onClick={() => setShowFollowersModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className="profile-stat-value">{profile.followersCount || 0}</span>
              <span className="profile-stat-label">Followers</span>
            </div>
            <div
              className="profile-stat"
              onClick={() => setShowFollowingModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className="profile-stat-value">{profile.followingCount || 0}</span>
              <span className="profile-stat-label">Following</span>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button
                  className="profile-edit-button"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit Profile
                </button>
                <button
                  className="profile-create-button"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + Add Recipe
                </button>
              </>
            ) : (
              <>
                <button
                  className={`profile-follow-button ${isFollowing ? 'following' : ''}`}
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                </button>
                <button
                  className="profile-message-button"
                  onClick={() => setIsMessageModalOpen(true)}
                >
                  💬 Message
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
          style={{ display: 'none' }}
          onChange={handleAvatarUpload}
        />

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'favorites' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
            <span className="profile-tab-count">{favorites.length}</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'myRecipes' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('myRecipes')}
          >
            {isOwnProfile ? 'My Recipes' : `${profile.username}'s Recipes`}
            <span className="profile-tab-count">{userRecipes.length}</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'about' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {activeTab === 'favorites' && (
            <>
              <div className="profile-content-title">
                Favorite Recipes
                <span>Public</span>
              </div>

              {loadingFavorites ? (
                <div className="profile-loading">Loading favorites...</div>
              ) : favorites.length > 0 ? (
                <div className="profile-recipes-grid">
                  {favorites.map((recipe) => (
                    <RecipeCard key={recipe._id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="profile-no-recipes">
                  <p>
                    {isOwnProfile 
                      ? "You haven't added any favorites yet."
                      : `${profile.username} hasn't added any favorites yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link to="/recipes" className="profile-explore-link">
                      Explore Recipes
                    </Link>
                  )}
                </div>
              )} 
            </>
          )}

          {activeTab === 'myRecipes' && (
            <>
              <div className="profile-content-title">
                {isOwnProfile ? 'My Recipes' : `${profile.username}'s Recipes`}
                <span>{isOwnProfile ? 'Your creations' : 'Public recipes'}</span>
              </div>

              {loadingUserRecipes ? (
                <div className="profile-loading">Loading recipes...</div>
              ) : userRecipes.length > 0 ? (
                <div className="profile-recipes-grid">
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
                <div className="profile-no-recipes">
                  <p>
                    {isOwnProfile 
                      ? "You haven't created any recipes yet."
                      : `${profile.username} hasn't created any recipes yet.`}
                  </p>
                  {isOwnProfile && (
                    <button
                      className="profile-create-button"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Create Your First Recipe
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="profile-about">
              <div className="profile-about-section">
                <h3 className="profile-about-title">About</h3>
                <p className="profile-about-text">
                  {profile.bio || `${profile.username} hasn't added a bio yet.`}
                </p>
              </div>

              <div className="profile-about-section">
                <h3 className="profile-about-title">Member Since</h3>
                <p className="profile-about-text">
                  {profile.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Recently joined'}
                </p>
              </div>

              <div className="profile-about-section">
                <h3 className="profile-about-title">Stats</h3>
                <div className="profile-about-item">
                  <span>{userRecipes.length || 0} recipe{userRecipes.length !== 1 ? 's' : ''} shared</span>
                </div>
                <div className="profile-about-item">
                  <span>{favorites.length} favorite {favorites.length === 1 ? 'recipe' : 'recipes'}</span>
                </div>
                <div className="profile-about-item">
                  <span>{profile.followersCount || 0} followers · {profile.followingCount || 0} following</span>
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