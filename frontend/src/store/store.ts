import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import usersReducer from './usersSlice';
import favoritesReducer from './favoritesSlice';
import commentsReducer from './commentsSlice';
import ratingReducer from './ratingSlice';
import unreadReducer from './unreadSlice';
import toastReducer from './toastSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    favorites: favoritesReducer,
    comments: commentsReducer,
    ratings: ratingReducer,
    unread: unreadReducer,
    toast: toastReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;