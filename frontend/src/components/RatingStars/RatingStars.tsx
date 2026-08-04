import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { rateRecipe, fetchRecipeRating, fetchUserRatings, deleteRating } from '../../store/ratingSlice';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';
import { MdStar } from 'react-icons/md';
import { showToast } from '../../store/toastSlice';

interface RatingStarsProps {
  recipeId: string;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  interactive?: boolean;
}

const sizeConfig = {
  small: {
    star: 'w-4 h-4',
    text: 'text-sm',
    gap: 'gap-0.5',
  },
  medium: {
    star: 'w-5 h-5',
    text: 'text-sm',
    gap: 'gap-0.5',
  },
  large: {
    star: 'w-6 h-6',
    text: 'text-base',
    gap: 'gap-1',
  },
};

function RatingStars({
  recipeId,
  size = 'medium',
  showCount = true,
  interactive = true
}: RatingStarsProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const stats = useAppSelector(state => state.ratings.stats[recipeId]);
  const userRating = useAppSelector(state => state.ratings.userRatings[recipeId]);
  const loading = useAppSelector(state => state.ratings.loading);

  const average = stats?.averageRating || 0;
  const total = stats?.totalRatings || 0;
  const displayRating = hoverRating || userRating || average;
  const sizeClasses = sizeConfig[size];
  
  useEffect(() => {
    dispatch(fetchRecipeRating(recipeId));
    if (user) {
      dispatch(fetchUserRatings());
    }
  }, [dispatch, recipeId, user]);

  const handleRatingClick = async (rating: number) => {
    if (!interactive || !user) {
      dispatch(showToast({
        message: 'Please log in to rate recipes',
        type: 'error'
      }));
      return;
    }

    if (loading) return;

    try {
      // If clicked the same star, delete the rating
      if (userRating === rating) {
        await dispatch(deleteRating(recipeId)).unwrap();
        dispatch(showToast({
          message: 'Rating removed',
          type: 'info'
        }));
      } else {
        // or rate the recipe
        await dispatch(rateRecipe({ recipeId, value: rating })).unwrap();
        dispatch(showToast({
          message: 'Rating saved',
          type: 'success'
        }));
      }
    } catch (error) {
      console.error('Failed to rate recipe:', error);
      dispatch(showToast({
        message: 'Failed to save rating',
        type: 'error'
      }));
    }
  };

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
      className={clsx(
        "relative inline-flex items-center gap-2",
        { "opacity-70 pointer-events-none" : loading }
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
        setHoverRating(0);
      }}
    >
      <div className={`flex ${sizeClasses.gap}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isUser = star <= userRating;
          return (
            <motion.button
              key={star}
              className={`
                  bg-transparent border-none p-0 m-0
                  inline-flex items-center justify-center
                  cursor-pointer outline-none shadow-none
                  transition-colors duration-200
                  hover:scale-110 hover:drop-shadow-[0_0_6px_currentColor]
                  disabled:cursor-default disabled:opacity-80 disabled:pointer-events-none
                  focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:rounded
                  ${isFilled ? 'text-star-filled' : 'text-star-empty'}
                  ${isUser ? 'text-star-user drop-shadow-[0_0_2px_rgba(255,152,0,0.5)]' : ''}
                  ${sizeClasses.star}
                `}
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              variants={starVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={star <= userRating ? "rated" : "initial"}
              disabled={!interactive || loading}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <MdStar className="w-full h-full" />
            </motion.button>
          );
        }
      )}
      </div>

      {showCount && total > 0 && (
        <span className={`flex items-baseline gap-1 text-secondary ${sizeClasses.text}`}>
          <span className="font-semibold text-primary">{average.toFixed(1)}</span>
          <span className="text-xs text-muted">({total} {total === 1 ? 'rating' : 'ratings'})</span>
        </span>
      )}

      <AnimatePresence>
        {showTooltip && interactive && (
          <motion.div
            className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              px-3 py-2
              bg-secondary text-primary
              text-xs rounded
              whitespace-nowrap
              shadow-theme border z-[1000]
              after:content-[''] after:absolute after:top-full after:left-1/2
              after:-translate-x-1/2
              after:border-4 after:border-t-bg-secondary
              after:border-x-transparent after:border-b-transparent
              max-w-[200px] text-center sm:max-w-none sm:whitespace-nowrap
            "
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {!user ? (
              <>Please log in to rate recipes</>
            ) : userRating ? (
              <>Your rating: {userRating} <MdStar className="inline" /> | Average: {average.toFixed(1)}</>
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