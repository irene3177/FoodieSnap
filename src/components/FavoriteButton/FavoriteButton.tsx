import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from "../../context/FavoritesContext";
import { Recipe } from "../../types/api.types";
import './FavoriteButton.css';

interface FavoriteButtonProps {
  recipe: Recipe;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

function FavoriteButton({ recipe, size = 'medium', showText= false }: FavoriteButtonProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(recipe.id);

  const [showSparkles, setShowSparkles] = useState(false);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();  // Prevent card clicking when clicking button
    e.preventDefault();

    if (isFav) {
      removeFavorite(recipe.id);
    } else {
      addFavorite(recipe);
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 600);
    }
  };

  const sizeClass = `favorite-button--${size}`;

  const heartVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.3 }
    },
    hover: { scale: 1.1 },
    tap: { scale: 0.9 }
  };

  const sparkleVariants = {
    initial: { opacity: 0, scale: 0},
    animate: {
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.button
      className={`favorite-button ${sizeClass} ${isFav ? 'favorite-button--active' : ''}`}
      onClick={handleToggleFavorite}
      whileHover="hover"
      whileTap="tap"
      initial="initial"
      animate="animate"
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.svg
        className="favorite-button__icon"
        viewBox="0 0 24 24"
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        variants={heartVariants}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </motion.svg>

    <AnimatePresence>
      {showSparkles && (
        <>
          <motion.span
            className="favorite-button__sparkle"
            variants={sparkleVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            style={{ top: '20%', left: '20%' }}
          >
            ✨
          </motion.span>
          <motion.span
            className="favorite-button__sparkle"
            variants={sparkleVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            style={{ top: '60%', left: '20%' }}
          >
            ✨
          </motion.span>
        </>
      )}
    </AnimatePresence>

      {showText && (
        <motion.span 
          className="favorite-button__text"
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

export default FavoriteButton;