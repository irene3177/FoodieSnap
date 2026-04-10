import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { changePassword } from '../../store/authSlice';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const dispatch = useAppDispatch();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const validateForm = () => {
    if (!currentPassword) {
      dispatch(showToast({ message: 'Current password is required', type: 'error' }));
      return false;
    }
    
    if (!newPassword) {
      dispatch(showToast({ message: 'New password is required', type: 'error' }));
      return false;
    }
    
    if (newPassword.length < 6) {
      dispatch(showToast({ message: 'Password must be at least 6 characters', type: 'error' }));
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      dispatch(showToast({ message: 'Passwords do not match', type: 'error' }));
      return false;
    }
    
    if (currentPassword === newPassword) {
      dispatch(showToast({ message: 'New password must be different from current password', type: 'error' }));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await dispatch(changePassword({
        currentPassword,
        newPassword
      })).unwrap();
      
      if (result.success) {
        dispatch(showToast({ message: 'Password changed successfully!', type: 'success' }));
        resetForm();
        onClose();
      }
    } catch (error) {
      // Error is already handled by the thunk
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="change-password-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="change-password-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="change-password-modal__header">
              <h2>Change Password</h2>
              <button className="change-password-modal__close" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="change-password-modal__content">
              <form onSubmit={handleSubmit} className="change-password-modal__form">
                {/* Current Password */}
                <div className="change-password-modal__field">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="change-password-modal__field">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <small>Minimum 6 characters</small>
                </div>

                {/* Confirm Password */}
                <div className="change-password-modal__field">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <small className="error-message">Passwords do not match</small>
                  )}
                </div>

                {/* Form Actions */}
                <div className="change-password-modal__actions">
                  <button
                    type="button"
                    className="change-password-modal__cancel"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`change-password-modal__submit ${loading ? 'change-password-modal__submit--loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
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

export default ChangePasswordModal;