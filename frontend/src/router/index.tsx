import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Recipes from '../pages/Recipes/Recipes';
import Search from '../pages/Search/Search';
import Favorites from '../pages/Favorites/Favorites';
import RecipeDetail from '../pages/RecipeDetail/RecipeDetail';
import TopRated from '../pages/TopRated/TopRated';
import ProfilePage from '../pages/Profile/ProfilePage';
import Users from '../pages/Users/Users';
import Chats from '../pages/Chats/Chats';
import ChatDetail from '../pages/ChatDetail/ChatDetail';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import NotFound from '../pages/NotFound/NotFound';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Public routes
      {
        index: true, 
        element: <Home />
      },
      {
        path: 'recipes',
        element: <Recipes />
      },
      {
        path: 'search',
        element: <Search />
      },
      {
        path: 'recipe/:id',
        element: <RecipeDetail />
      },
      {
        path: 'top-rated',
        element: <TopRated />
      },
      {
        path: 'users',
        element: <Users />
      },

      // Protected routes (require authentication)
      {
        element: <ProtectedRoute />,
        children: [
          {
          path: 'me',
          element: <ProfilePage />
          },
          {
            path: 'user/:userId',
            element: <ProfilePage />
          },
          {
            path: 'favorites',
            element: <Favorites />
          },
          {
            path: 'chats',
            element: <Chats />
          },
          {
            path: 'chat/:conversationId',
            element: <ChatDetail />
          }
        ]
      },

      // 404 - Catch all unmatched routes (must be last)
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);