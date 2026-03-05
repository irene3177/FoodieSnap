import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index.tsx';
import { FavoritesProvider } from './context/FavoritesContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { RatingProvider } from './context/RatingContext.tsx';
import { CommentProvider } from './context/CommentContext.tsx';
import './index.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FavoritesProvider>
        <RatingProvider>
          <CommentProvider>
            <RouterProvider router={router} />
          </CommentProvider>
        </RatingProvider>
      </FavoritesProvider>
    </ThemeProvider>
  </StrictMode>,
)
