import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer from './favoritesSlice';
import toastReducer from './toastSlice';
import ratingReducer from './ratingSlice';
import commentsReducer from './commentsSlice';

export const store = configureStore({
  reducer: {
    favorites: favoritesReducer,
    toast: toastReducer,
    ratings: ratingReducer,
    comments: commentsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;