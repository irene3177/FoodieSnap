import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Recipes from '../pages/Recipes/Recipes';
import Favorites from '../pages/Favorites/Favorites';
import RecipeDetail from '../pages/RecipeDetail/RecipeDetail';
import TopRated from '../pages/TopRated/TopRated';
import ProfilePage from '../pages/Profile/ProfilePage';
import Users from '../pages/Users/Users';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, 
        element: <Home />
      },
      {
        path: 'recipes',
        element: <Recipes />
      },
      {
        path: 'recipe/:id',
        element: <RecipeDetail />
      },
      {
        path: 'favorites',
        element: <Favorites />
      },
      {
        path: 'top-rated',
        element: <TopRated />
      },
      {
      path: 'me',
      element: <ProfilePage />
      },
      {
        path: 'user/:userId',
        element: <ProfilePage />
      },
      {
        path: 'users',
        element: <Users />
      }
    ]
  }
]);