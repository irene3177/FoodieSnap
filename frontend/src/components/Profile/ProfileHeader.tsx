import { useRef, useState } from 'react';
import { useFollow } from '../../hooks/useFollow';
import { showToast } from '../../store/toastSlice';
import { refreshUser } from '../../store/authSlice';
import { authApi } from '../../services/authApi';
import { User, UserProfile } from '../../types';
import { MdAdd, MdEdit, MdOutlineMail, MdOutlinePhotoCamera } from 'react-icons/md';
import { useAppDispatch } from '../../store/store';
import Avatar from '../Avatar';


interface ProfileHeaderProps {
  currentUser: User | null;
  profile: UserProfile | null;
  refresh: () => void;
  updateFollowStats: (isFollowing: boolean, followersCount?: number) => void;
  userRecipesCount?: number;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
  onEditProfile: () => void;
  onAddRecipe: () => void;
  onMessage: () => void;
};

function ProfileHeader({ 
  currentUser,
  profile,
  refresh,
  updateFollowStats,
  userRecipesCount,
  onShowFollowers,
  onShowFollowing,
  onEditProfile,
  onAddRecipe,
  onMessage
}: ProfileHeaderProps) {

  const dispatch = useAppDispatch();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      {/* Profile Header */}
      <div className=" w-full glass-card rounded-2xl p-8 mb-8 text-center border shadow-theme animate-fade-in">
        {/* Avatar */}
        <div
          className={`relative w-[clamp(6rem,15vw,8rem)] h-[clamp(6rem,15vw,8rem)] mx-auto mb-4 ${
            isOwnProfile ? 'cursor-pointer' : 'cursor-default'
          }`}
            onClick={handleAvatarClick}
        >
          <Avatar src={profile?.avatar} username={profile?.username} size="profile" border />

          {/* Overlay for edit */}
          {isOwnProfile && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-20 cursor-pointer">
              <MdOutlinePhotoCamera className="w-8 h-8 text-white" />
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
        <h1 className="text-2xl md:text-3xl font-headline-md text-secondary mb-2">{profile?.username}</h1>
        {profile?.bio && (
          <p className="text-muted text-base leading-relaxed max-w-xl mx-auto mb-4 px-4">{profile.bio}</p>
        )}
        
        {/* Stats */}
        <div className="flex justify-center gap-4 md:gap-8 my-4 py-3 border-y">
          <div className="text-center cursor-default">
            <span className="block font-headline text-3xl font-semibold text-accent-secondary">{userRecipesCount}</span>
            <span className="text-xs text-secondary uppercase tracking-tight">Recipes</span>
          </div>
          <div
            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onShowFollowers}
          >
            <span className="block font-headline text-3xl font-semibold text-accent-secondary">{profile?.followersCount || 0}</span>
            <span className="text-xs text-secondary uppercase tracking-tight">Followers</span>
          </div>
          <div
            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onShowFollowing}
          >
            <span className="block font-headline text-3xl font-semibold text-accent-secondary">{profile?.followingCount || 0}</span>
            <span className="text-xs text-secondary uppercase tracking-tight">Following</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row lg:flex-col justify-center gap-3 mt-4">
          {isOwnProfile ? (
            <>
              <button
                className="btn-primary"
                onClick={onEditProfile}
              >
                <MdEdit className="inline" /> Edit Profile
              </button>
              <button
                className="btn-secondary"
                onClick={onAddRecipe}
              >
                <MdAdd className="inline" /> Add Recipe
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
                onClick={onMessage}
              >
                <MdOutlineMail className="inline mr-1" /> Message
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
    </>
  );

}

export default ProfileHeader;
