import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { changePassword } from '../../store/authSlice';
import { MdLockReset, MdClose, MdKey, MdVisibilityOff, MdVisibility } from 'react-icons/md';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useScrollLock(isOpen);

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
    setShowConfirmPassword(false);
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-primary rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b bg-primary flex-shrink-0">
              <div className="flex items-center gap-3">
                <MdLockReset className="text-accent text-3xl" />
                <h2 className="text-3xl font-semibold text-secondary m-0 cursor-default">Change Password</h2>
              </div>
              <button
                className="
                  bg-transparent border-none text-muted
                  rounded-lg w-8 h-8
                  flex items-center justify-center
                  hover:bg-border transition-colors
                  duration-700
                  "
                onClick={onClose}
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="block mb-2 font-medium text-md text-muted">Current Password</label>
                  <div className="relative">
                    <MdKey className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-default p-1 text-muted w-7 h-7" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="input px-10"
                    />
                    <button
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 rounded hover:text-accent transition-colors text-secondary"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block mb-2 font-medium text-md text-muted">New Password</label>
                  <div className="relative">
                    <MdKey className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-default p-1 text-muted w-7 h-7" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input px-10"
                    />
                    <button
                      type="button"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 rounded hover:text-accent transition-colors text-secondary"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                  <small className="block text-xs text-muted mt-1.5 cursor-default">Minimum 6 characters</small>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block mb-2 font-medium text-md text-muted">Confirm New Password</label>
                  <div className="relative">
                    <MdKey className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-default p-1 text-muted w-7 h-7" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`input px-10 ${confirmPassword && newPassword !== confirmPassword ? 'border-error focus:border-error' : ''}`}
                    />
                    <button
                      type="button"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 rounded hover:text-accent transition-colors text-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <small className="block text-xs text-error mt-1.5 cursor-default">Passwords do not match</small>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t flex-col sm:flex-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary relative"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="opacity-0">Changing...</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </span>
                      </> 
                    ) : (
                      'Change Password'
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

export default ChangePasswordModal;