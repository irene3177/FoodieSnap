import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Rating, RatingState, RatingAction, RatingContextType } from '../types/rating.types';

const initialState: RatingState = {
  ratings: {},
  userRatings: {}
};

const ratingReducer = (state: RatingState, action: RatingAction): RatingState => {
  switch (action.type) {
    case 'SET_RATING': {
      const { recipeId, rating } = action.payload;
      const existingRating = state.ratings[recipeId];

      // Calculate new average rating
      const currentTotal = existingRating?.totalRatings || 0;
      const currentSum = (existingRating?.averageRating || 0) * currentTotal;

      // If user already rated, remove their old rating from calculation
      const oldUserRating = state.userRatings[recipeId];
      const adjustedSum = oldUserRating
        ? currentSum - oldUserRating + rating
        : currentSum + rating;
      const adjustedTotal = oldUserRating ? currentTotal : currentTotal + 1;

      const newAverage = adjustedTotal > 0 ? adjustedSum / adjustedTotal : 0;

      const newRating: Rating = {
        recipeId,
        userRating: rating,
        averageRating: Number(newAverage.toFixed(1)),
        totalRatings: adjustedTotal,
        timestamp: Date.now()
      };

      return {
        ...state,
        ratings: {
          ...state.ratings,
          [recipeId]: newRating
        },
        userRatings: {
          ...state.userRatings,
          [recipeId]: rating
        }
      };
    }

    case 'LOAD_RATINGS': 
      return {
        ...state,
        ratings: action.payload
      };

    case 'CLEAR_RATINGS':
      return initialState;

    default: 
      return state;
  }
};

const RatingContext = createContext<RatingContextType | undefined>(undefined);

interface RatingProviderProps {
  children: ReactNode;
}

export const RatingProvider: React.FC<RatingProviderProps> = ({ children}) => {
  const [state, dispatch] = useReducer(ratingReducer, initialState);

  // Load ratings from localStorage
  useEffect(() => {
    const loadRatings = () => {
      try {
        const savedRatings = localStorage.getItem('recipe-ratings');
        if (savedRatings) {
          const parsed = JSON.parse(savedRatings);

          // Also load user ratings from separate storage
          const savedUserRatings = localStorage.getItem('user-ratings');
          const userRatings = savedUserRatings ? JSON.parse(savedUserRatings) : {};

          // Reconstruct state
          Object.keys(parsed).forEach(key => {
            const recipeId = parseInt(key);
            dispatch({
              type: 'SET_RATING',
              payload: {
                recipeId,
                rating: userRatings[recipeId] || parsed[recipeId].userRating
              }
            });
          });
        }
      } catch (error) {
        console.error('Failed to load ratings:', error);
      }
    };

    loadRatings();
  }, []);

  // Save ratings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('recipe-ratings', JSON.stringify(state.ratings));
      localStorage.setItem('user-ratings', JSON.stringify(state.userRatings));
    } catch (error) {
      console.error('Failed to save ratings:', error);
    }
  }, [state.ratings, state.userRatings]);

  const rateRecipe = (recipeId: number, rating: number) => {
    dispatch({
      type: 'SET_RATING',
      payload: { recipeId, rating }
    });
  };

  const getRecipeRating = (recipeId: number) => {
    const rating = state.ratings[recipeId];
    const userRating = state.userRatings[recipeId] || 0;

    return {
      average: rating?.averageRating || 0,
      total: rating?.totalRatings || 0,
      userRating
    };
  };

  const clearRatings = () => {
    dispatch({ type: 'CLEAR_RATINGS' });
    localStorage.removeItem('recipe-ratings');
    localStorage.removeItem('user-ratings');
  };

  const value: RatingContextType = {
    ratings: state.ratings,
    userRatings: state.userRatings,
    rateRecipe,
    getRecipeRating,
    clearRatings
  };

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
};

export const useRatings = (): RatingContextType => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRatings must be used within a RatingProvider');
  }
  return context;
};