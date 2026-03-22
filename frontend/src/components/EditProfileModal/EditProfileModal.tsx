import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { authApi } from '../../services/authApi';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const dispatch = useAppDispatch();
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatar(url);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      dispatch(showToast({
        message: 'Username is required',
        type: 'error'
      }));
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.updateProfile({
        username: username.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined
      });

      if (response.success) {
        dispatch(showToast({
          message: 'Profile updated successfully!',
          type: 'success'
        }));
        await refreshUser();
        onSuccess();
        onClose();
      } else {
        dispatch(showToast({
          message: response.error || 'Failed to update profile',
          type: 'error'
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      dispatch(showToast({
        message: 'Failed to update profile',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="edit-profile-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="edit-profile-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-profile-modal__header">
              <h2>Edit Profile</h2>
              <button className="edit-profile-modal__close" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* ← Scrollable content area */}
            <div className="edit-profile-modal__content">
              <form onSubmit={handleSubmit} className="edit-profile-modal__form">
                {/* Avatar Preview */}
                <div className="edit-profile-modal__avatar-section">
                  <div className="edit-profile-modal__avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" />
                    ) : (
                      <span>{username.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </div>

                {/* Avatar URL Input */}
                <div className="edit-profile-modal__field">
                  <label htmlFor="avatar">Avatar URL</label>
                  <input
                    type="url"
                    id="avatar"
                    value={avatar}
                    onChange={handleAvatarChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <small>Enter a valid image URL (optional)</small>
                </div>

                {/* Username Input */}
                <div className="edit-profile-modal__field">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  <small>3-20 characters</small>
                </div>

                {/* Bio Input */}
                <div className="edit-profile-modal__field">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={200}
                  />
                  <small className="bio-counter">{bio.length}/200 characters</small>
                </div>

                {/* Form Actions */}
                <div className="edit-profile-modal__actions">
                  <button
                    type="button"
                    className="edit-profile-modal__cancel"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`edit-profile-modal__submit ${loading ? 'edit-profile-modal__submit--loading' : ''}`}
                    disabled={loading || !username.trim()}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EditProfileModal;