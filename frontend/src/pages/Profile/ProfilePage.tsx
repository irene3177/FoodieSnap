import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { authApi } from '../../services/authApi';
import { usersApi } from '../../services/usersApi';
import Loader from '../../components/Loader/Loader';
import './ProfilePage.css';

function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId && !currentUser) return;
      
      setLoading(true);
      setError(null);

      try {
        let response;
        if (userId) {
          response = await usersApi.getUserById(userId);
        } else {
          response = await authApi.getMe();
        }
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError(response.error || 'User not found');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser]);

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
    <div className="profile-page">
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

        {isOwnProfile && (
          <button className="profile-edit-button">Edit Profile</button>
        )}
      </div>

      <div className="profile-content">
        <h2>Favorite Recipes</h2>
        {profile.favorites && profile.favorites.length > 0 ? (
          <div className="profile-recipes-grid">
            {/* Здесь будет компонент RecipeCard для каждого рецепта */}
            <p>Recipes will be displayed here</p>
          </div>
        ) : (
          <p className="profile-no-recipes">No favorite recipes yet</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;