import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register, isLoading, error, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const validateForm = () => {
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }

    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!validateForm()) {
      return;
    }

    try {
      await register({ username, email, password, bio: bio || undefined });
      await refreshUser(); // Refresh user data after registration
      setUsername('');
      setEmail('');
      setPassword('');
      setBio('');
      onClose();
    } catch (err) {
      // Error is handled by context
      console.error(err);
    }
  };

  const handleClose = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setBio('');
    setLocalError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="auth-modal__content"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-modal__close" onClick={handleClose}>×</button>

            <h2 className="auth-modal__title">Join FoodieSnap! 🍳</h2>

            {(error || localError) && (
              <motion.div
                className="auth-modal__error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error || localError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form__group">
                <label htmlFor="username" className="auth-form__label">Username</label>
                <input
                  type="text"
                  id="username"
                  className="auth-form__input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="johndoe"
                  disabled={isLoading}
                />
              </div>

              <div className="auth-form__group">
                <label htmlFor="email" className="auth-form__label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="auth-form__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>

              <div className="auth-form__group">
                <div className="auth-form__password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="auth-form__input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="auth-form__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="auth-form__group">
                <label htmlFor="bio" className="auth-form__label">Bio (optional)</label>
                <textarea
                  id="bio"
                  className="auth-form__input auth-form__textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="auth-form__submit"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <div className="auth-modal__footer">
              <p>Already have an account?</p>
              <button
                className="auth-modal__switch"
                onClick={() => {
                  onSwitchToLogin();
                  setLocalError('');
                }}
                disabled={isLoading}
              >
                Login here
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RegisterModal;