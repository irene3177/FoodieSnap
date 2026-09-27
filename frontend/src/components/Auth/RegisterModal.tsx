import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useScrollLock } from '../../hooks/useScrollLock';
import TextareaAutosize from 'react-textarea-autosize';
import { IoMdArrowRoundForward } from 'react-icons/io';
import { MdClose, MdMailOutline, MdKey, MdVisibilityOff, MdVisibility, MdOutlinePersonOutline } from 'react-icons/md';

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

  useScrollLock(isOpen);

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
              <h3 className="text-xl font-semibold text-secondary italic m-0 cursor-default">Join our Community</h3>
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
              {(error || localError) && (
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
                  <label htmlFor="username" className="block mb-2 font-medium text-md text-muted">Username</label>
                  <div className="relative">
                    <MdOutlinePersonOutline className="absolute top-1/2 -translate-y-1/2 bg-transparent ml-1.5 border-none cursor-default p-1 text-muted w-7 h-7" />
                    <input
                      type="text"
                      id="username"
                      className="input pl-9"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="johndoe"
                      disabled={isLoading}
                    />
                  </div>
                </div>

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

                <div className="space-y-2">
                  <label htmlFor="bio" className="block mb-2 font-medium text-md text-muted">Bio (optional)</label>
                  <TextareaAutosize
                    id="bio"
                    className="input
                      resize-none min-h-[60px]
                      disabled:opacity-60 overflow-hidden scrollbar-hide"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    maxLength={200}
                    disabled={isLoading}
                  />
                  <small className="flex justify-end pr-1 text-xs text-muted mt-1.5 cursor-default">{bio.length}/200 characters</small>
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
                    'Creating account...'
                  ) : (
                    <>
                      Sign up <IoMdArrowRoundForward className="text-xl font-semibold group-hover:translate-x-[2px] transition-all duration-500" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center pt-4 border-t">
                <p className="text-sm text-secondary mb-2 cursor-default">Already have an account?</p>
                <button
                  className="bg-transparent border-none text-accent text-sm font-medium cursor-pointer hover:text-accent-hover hover:underline transition-colors"                  onClick={() => {
                    onSwitchToLogin();
                    setLocalError('');
                  }}
                  disabled={isLoading}
                >
                  Login here
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RegisterModal;