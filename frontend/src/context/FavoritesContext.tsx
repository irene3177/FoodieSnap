import React, { 
  createContext, 
  useReducer, 
  useContext, 
  ReactNode, 
  useEffect, 
  useState
} from "react";
import { Recipe } from '../types/api.types';
import {
  FavoritesState,
  FavoritesAction,
  FavoritesContextType
} from '../types/favorites.types';
import Toast, { ToastType } from '../components/Toast/Toast';

// Initial state
const initialState: FavoritesState = {
  favorites: [],
  loading: false,
  error: null
};

// Reducer function
const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'ADD_FAVORITE':
      if (state.favorites.some(recipe => recipe.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
        error: null
      };

      case 'REMOVE_FAVORITE':
        return {
          ...state,
          favorites: state.favorites.filter(recipe => recipe.id !== action.payload),
          error: null
        };

      case 'SET_FAVORITES':
        return {
          ...state,
          favorites: action.payload,
          loading: false,
          error: null
        };

        case 'SET_LOADING':
          return {
            ...state,
            loading: action.payload
          };

        case 'SET_ERROR':
          return {
            ...state,
            error: action.payload,
            loading: false
          };

        case 'CLEAR_FAVORITES':
          return {
            ...state,
            favorites: [],
            error: null
          };

        case 'REORDER_FAVORITES':
          return {
            ...state,
            favorites: action.payload,
            error: null
          };

        default:
          return state;
  }
};

// Create context
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Provider component
interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          const favorites = JSON.parse(savedFavorites);
          dispatch({ type: 'SET_FAVORITES', payload: favorites });
        }
      } catch (error) {
        console.error('Failed to load favorites from storage:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to load favorites from storage'
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadFavorites();
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('favorites', JSON.stringify(state.favorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, [state.favorites]);

  // Add recipe to favorites
  const addFavorite = (recipe: Recipe) => {
    dispatch({ type: 'ADD_FAVORITE', payload: recipe });
    setToast({
      message: `${recipe.title} added to favorites!`,
      type: 'success'
    });
  };

  // Remove recipe from favorites
  const removeFavorite = (recipeId: number) => {
    const recipe = state.favorites. find(r => r.id === recipeId);
    dispatch({ type: 'REMOVE_FAVORITE', payload: recipeId });
    if (recipe) {
      setToast({
        message: `${recipe.title} removed from favorites`,
        type: 'info'
      });
    }
  };

  // Check if recipe is in favorites
  const isFavorite = (recipeId: number) => {
    return state.favorites.some(recipe => recipe.id === recipeId);
  };

  // Clear all favorites
  const clearFavorites = () => {
    dispatch({ type: 'CLEAR_FAVORITES' });
    setToast({
      message: 'All favorites cleared',
      type: 'info'
    });
  };

  const reorderFavorites = (reorderedFavorites: Recipe[]) => {
    dispatch({ type: 'REORDER_FAVORITES', payload: reorderedFavorites });
    setToast({
      message: 'Favorites reordered',
      type: 'info'
    });
  };

  const value: FavoritesContextType = {
    state,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
    reorderFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </FavoritesContext.Provider>
  );
};

// Custom hook for using favorites context
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};