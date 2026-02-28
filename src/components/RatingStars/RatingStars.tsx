import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRatings } from '../../context/RatingContext';
import './RatingStars.css';

interface RatingStarsProps {
  recipeId: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  interactive?: boolean;
}

function RatingStars({
  recipeId,
  size = 'medium',
  showCount = true,
  interactive = true
}: RatingStarsProps) {
  const { getRecipeRating, rateRecipe } = useRatings();
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const { average, total, userRating } = getRecipeRating(recipeId);
  const displayRating = hoverRating || userRating || average;

  const handleRatingClick = (rating: number) => {
    if (interactive) {
      rateRecipe(recipeId, rating);
    }
  };

  const sizeClass = `rating-stars--${size}`;

  // Animation variants
  const starVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2, transition: { duration: 0.2 } },
    tap: { scale: 0.9 },
    rated: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.3 }
    }
  };

  return (
    <div
      className={`rating-stars ${sizeClass}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
        setHoverRating(0);
      }}
    >
      <div className="rating-stars__container">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            className={`rating-stars__star ${
              star <= displayRating ? 'rating-stars__star--filled' : ''
            } ${star <= userRating ? 'rating-stars__star--user' : ''}`}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            variants={starVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            animate={star <= userRating ? "rated" : "initial"}
            disabled={!interactive}
            aria-label={`Rate ${star} out of 5 stars`}
          >
              <svg 
                width={size === 'small' ? '16' : size === 'large' ? '24' : '20'}
                height={size === 'small' ? '16' : size === 'large' ? '24' : '20'}
                viewBox="0 0 32 32"
                fill={star <= displayRating ? 'gold' : 'none'}
                stroke={star <= displayRating ? 'gold' : '#ccc'}
                strokeWidth="1.5"
              >
                <polygon 
                  points="16,2 20.34,10.66 30,12.06 23,18.81 24.66,28.34 16,23.75 7.34,28.34 9,18.81 2,12.06 11.66,10.66"
                  fill="currentColor"
                  stroke="currentColor"
                />
              </svg>
          </motion.button>
        ))}
      </div>

      {showCount && total > 0 && (
        <span className="rating-stars__info">
          <span className="rating-stars__average">{average.toFixed(1)}</span>
          <span className="rating-stars__total">({total} {total === 1 ? 'rating' : 'ratings'})</span>
        </span>
      )}

      <AnimatePresence>
        {showTooltip && interactive && (
          <motion.div
            className="rating-stars__tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {userRating ? (
              <>Your rating: {userRating} ⭐ | Average: {average.toFixed(1)}</>
            ) : (
              <>Click to rate this resipe</>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RatingStars;