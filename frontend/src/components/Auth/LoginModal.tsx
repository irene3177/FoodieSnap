import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useScrollLock } from '../../hooks/useScrollLock';
import { IoMdArrowRoundForward } from 'react-icons/io';
import { MdClose, MdMailOutline, MdKey, MdVisibilityOff, MdVisibility } from 'react-icons/md';

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

  useScrollLock(isOpen);

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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-secondary rounded-xl w-[90%] max-w-md flex flex-col shadow-xl border max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col text-center items-center px-6 pt-5 pb-2 flex-shrink-0 relative">
              <h1 className="text-4xl text-accent font-bold my-2 cursor-default">FoodieSnap</h1>
              <h3 className="text-xl font-semibold text-secondary italic m-0 cursor-default">Welcome Back!</h3>
              <button
                className="
                  absolute right-5
                  bg-transparent border-none text-muted
                  rounded-lg w-8 h-8
                  flex items-center justify-center
                  hover:bg-border transition-colors
                  duration-700
                  "
                onClick={handleClose}
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {displayError && (
                <motion.div
                  className="auth-modal__error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error || localError}
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block mb-2 font-medium text-md text-muted">Email</label>
                  <div className="relative">
                    <MdMailOutline className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-default p-1 text-muted w-7 h-7" />
                    <input 
                      type="email"
                      id="email"
                      className="input pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block mb-2 font-medium text-md text-muted">Password</label>
                  <div className="relative">
                    <MdKey className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-default p-1 text-muted w-7 h-7" />

                    <input 
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="input px-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      title={showPassword ? 'Hide password' : 'Show password'}
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 rounded hover:text-accent transition-colors text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Form Action */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 px-4 py-3.5
                    btn-shimmer font-semibold rounded-xl text-button terracotta-gradient
                    transition-all duration-500 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Logging in...'
                  ) : (
                    <>
                      Login <IoMdArrowRoundForward className="text-xl font-semibold group-hover:translate-x-[2px] transition-all duration-500" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center pt-4 border-t">
                <p className="text-sm text-secondary mb-2 cursor-default">Don't have an account?</p>
                <button
                  className="bg-transparent border-none text-accent text-sm font-medium cursor-pointer hover:text-accent-hover hover:underline transition-colors"
                  onClick={handleSwitch}
                  disabled={isLoading}
                >
                  Sign up here
                </button>
              </div>

            </div>


          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;