import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Loader from '../../components/Loader/Loader';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import { useProfileData } from '../../hooks/useProfileData';
import './ProfilePage.css';

function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'favorites' | 'saved' | 'about'>('favorites');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    profile,
    favorites,
    loading,
    loadingFavorites,
    error,
    refresh
  } = useProfileData(userId, currentUser?._id);

  const handleEditSuccess = async () => {
    await refreshUser();
    refresh();
  };

  if (!currentUser && !userId) {
    return <div className="profile-error">
      Please log in to view your profile
    </div>;
  }

  if (loading) return <Loader message="Loading profile..." />;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div className="profile-error">User not found</div>;

  const isOwnProfile = currentUser?._id === profile._id;

  return (
    <>
      <div className="profile-page">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} />
            ) : (
              <span>{profile.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h1 className="profile-username">{profile.username}</h1>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{profile.recipeCount || 0}</span>
              <span className="profile-stat-label">Recipes</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{profile.followersCount || 0}</span>
              <span className="profile-stat-label">Followers</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{profile.followingCount || 0}</span>
              <span className="profile-stat-label">Following</span>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <button
                className="profile-edit-button"
                onClick={() => setIsEditModalOpen(true)}
              >Edit Profile</button>
            ) : (
              <>
                <button className="profile-follow-button">Follow</button>
                <button className="profile-message-button">Message</button>
              </>
            )}
          </div>
        </div>

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
            className={`profile-tab ${activeTab === 'saved' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('saved')}
            disabled={!isOwnProfile}
            style={!isOwnProfile ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            Saved
            <span className="profile-tab-count">{profile.savedRecipes?.length || 0}</span>
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

          {activeTab === 'saved' && (
            <>
              <div className="profile-content-title">
                Saved Recipes
                <span>Private</span>
              </div>

              {!isOwnProfile ? (
                <div className="profile-no-recipes">
                  <p>Saved recipes are private. Only you can see your saved recipes.</p>
                </div>
              ) : (
                <div className="profile-no-recipes">
                  <p>Your saved recipes will appear here.</p>
                  <Link to="/recipes" className="profile-explore-link">
                    Discover Recipes
                  </Link>
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
                  <span>📚</span>
                  <span>{profile.recipeCount || 0} recipes {profile.recipeCount === 1 ? 'shared' : 'shared'}</span>
                </div>
                <div className="profile-about-item">
                  <span>❤️</span>
                  <span>{favorites.length} favorite {favorites.length === 1 ? 'recipe' : 'recipes'}</span>
                </div>
                <div className="profile-about-item">
                  <span>👥</span>
                  <span>{profile.followersCount || 0} followers · {profile.followingCount || 0} following</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}

export default ProfilePage;