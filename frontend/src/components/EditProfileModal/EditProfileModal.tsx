import { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { authApi } from '../../services/authApi';
import { MdClose } from 'react-icons/md';
import { RiEdit2Fill } from 'react-icons/ri';
import Avatar from '../Avatar';

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
  const [loading, setLoading] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState('');

  useScrollLock(isOpen);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

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
        bio: bio.trim() || undefined
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-primary rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b bg-primary flex-shrink-0">
              <div className="flex items-center gap-3">
                <RiEdit2Fill className="text-accent text-3xl" />
                <h2 className="text-3xl font-semibold text-secondary m-0 cursor-default">Edit Profile</h2>
              </div>
              <button className="
                bg-transparent border-none text-muted
                rounded-lg w-8 h-8
                flex items-center justify-center
                hover:bg-border transition-colors
                duration-700
                "
                onClick={onClose}>
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Preview */}
                <div className="flex justify-center mb-4">
                  <Avatar src={avatarPreview} username={username} size="2xl" border />
                </div>

                {/* Username Input */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block mb-2 font-medium text-md text-muted">Username *</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={20}
                    className="input"
                  />
                  <small className="flex justify-end pr-1 text-xs text-muted mt-1.5 cursor-default">3-20 characters</small>
                </div>

                {/* Bio Input */}
                <div className="space-y-2">
                  <label htmlFor="bio" className="block mb-2 font-medium text-md text-muted">Bio</label>
                  <TextareaAutosize
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={200}
                    className="input
                      resize-none min-h-[60px]
                      disabled:opacity-60 overflow-hidden scrollbar-hide"
                  />
                  <small className="flex justify-end pr-1 text-xs text-muted mt-1.5 cursor-default">{bio.length}/200 characters</small>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t flex-col sm:flex-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !username.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="opacity-0">Saving...</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
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