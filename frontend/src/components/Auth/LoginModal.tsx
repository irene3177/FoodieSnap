import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { login, isLoading, error, refreshUser, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setHasAttemptedSubmit(true);

    const result = await login({ email, password });
    if (result.success) {
      await refreshUser(); // Refresh user after login
      handleClose();
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setLocalError('');
    clearError();
    setHasAttemptedSubmit(false);
    onClose();
  };

  const handleSwitch = () => {
    setEmail('');
    setPassword('');
    setLocalError('');
    clearError();
    setHasAttemptedSubmit(false);
    onSwitchToRegister();
  };

  const displayError = (hasAttemptedSubmit && error) || localError;

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

            <h2 className="auth-modal__title">Welcome Back! 👋</h2>

            {displayError && (
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
                <label htmlFor="password" className="auth-form__label">Password</label>
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

              <button
                type="submit"
                className="auth-form__submit"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="auth-modal__footer">
              <p>Don't have an account?</p>
              <button
                className="auth-modal__switch"
                onClick={handleSwitch}
                disabled={isLoading}
              >
                Sign up here
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;