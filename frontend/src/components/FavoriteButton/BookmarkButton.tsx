import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector }from '../../store/store';
import { addToFavorites, removeFromFavorites, fetchFavorites } from '../../store/favoritesSlice';
import { Recipe } from '../../types';
import { showToast } from '../../store/toastSlice';
import { useAuth } from '../../hooks/useAuth';
// import { GoHeart, GoHeartFill } from 'react-icons/go';
import { MdBookmarkBorder, MdBookmark } from 'react-icons/md';

interface BookmarkButtonProps {
  recipe: Recipe;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  small: {
    button: 'p-1 text-sm',
    icon: 'w-[18px] h-[18px]',
    sparkle: 'text-xs',
  },
  medium: {
    button: 'text-base',
    icon: 'w-6 h-6',
    sparkle: 'text-sm',
  },
  large: {
    button: 'p-3 text-lg',
    icon: 'w-8 h-8',
    sparkle: 'text-base',
  },
};

function BookmarkButton({
  recipe,
  size = 'medium',
  showText= false,
  className='',
}: BookmarkButtonProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items: favorites, loading } = useAppSelector(state => state.favorites);

  const isFav = favorites.some(r => r._id === recipe._id);
  const sizeClasses = sizeConfig[size];
  
  useEffect(() => {
    if (user) {
      dispatch(fetchFavorites());
    }
  }, [user, dispatch]);


  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();  // Prevent card clicking when clicking button
    e.preventDefault();

    if (!user) {
      // Show modal login or toast
      dispatch(showToast({ 
        message: 'Please log in to add favorites', 
        type: 'info' 
      }));
      return; 
    }

    if (isFav) {
      await dispatch(removeFromFavorites(recipe._id));
      dispatch(showToast({
        message: `${recipe.title} removed from favorites`,
        type: 'info'
      }));
    } else {
      await dispatch(addToFavorites(recipe));
      dispatch(showToast({
        message: `${recipe.title} added to favorites`,
        type: 'success'
      }));
    }
  };

  const heartVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.9 }
  };

  return (
    <motion.button
      className={`
        relative inline-flex items-center justify-center
        bg-transparent border-none cursor-pointer rounded-full
        text-secondary
        transition-all duration-500
        ${sizeClasses.button}
        ${className}
      `}
      onClick={handleToggleFavorite}
      disabled={loading}
      whileHover="hover"
      whileTap="tap"
      initial="initial"
      animate="animate"
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFav ? (
        <motion.div
          variants={heartVariants}
          className="relative z-[2] text-accent hover:text-accent-hover"
        >
          <MdBookmark className={sizeClasses.icon} />
        </motion.div>
      ) : (
        <motion.div
          variants={heartVariants}
          className="relative z-[2] text-accent-secondary hover:text-accent-hover"
        >
          <MdBookmarkBorder className={sizeClasses.icon} />
        </motion.div>
      )}

      {showText && (
        <motion.span 
          className="ml-2 text-sm text-primary"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isFav ? 'Saved to Favorites' : 'Add to Favorites'}
        </motion.span>
      )}
    </motion.button>
  );
}

export default BookmarkButton;