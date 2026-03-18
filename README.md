# 🍽️ FoodieSnap - Recipe Sharing Platform

## 📋 Project Overview
FoodieSnap is a full-stack recipe sharing platform that combines recipes from TheMealDB API with user-generated content. Users can discover, save, rate, and comment on recipes, with full authentication and personalized features.

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router v6** for navigation
- **Redux Toolkit** for state management (favorites, ratings, comments, toast)
- **Context API** for theme and auth
- **Framer Motion** for animations
- **Axios** for API requests
- **CSS Modules** for styling

### Backend
- **Node.js** with **Express**
- **TypeScript**
- **MongoDB** with **Mongoose**
- **JWT** authentication (httpOnly cookies)
- **bcryptjs** for password hashing
- **TheMealDB API** integration

## ✨ Core Features

### 1. Authentication
- JWT-based authentication with httpOnly cookies
- Protected routes and middleware
- Session persistence
- Login/Register/Logout functionality

### 2. Recipe Discovery
- Browse random recipes from TheMealDB
- Search recipes by name
- Infinite scroll with pagination
- Recipe details page with ingredients, instructions, and video links
- Recipes automatically saved to MongoDB when viewed

### 3. User Profiles
- View personal profile with saved/favorite recipes
- View other users' profiles
- Edit profile information (username, avatar, bio)
- Recipe count and activity stats

### 4. Favorites System
- Add/remove recipes to favorites
- View all favorites in a dedicated page
- Drag-and-drop reordering of favorites
- Clear all favorites option
- Syncs with backend (MongoDB)

### 5. Rating System
- Rate recipes (1-5 stars)
- Remove ratings by clicking same star
- View average ratings and total count
- Rating distribution per recipe
- Persistent across sessions

### 6. Comments System
- Add comments to recipes
- Edit/delete own comments
- Like/unlike comments
- Real-time updates (no refresh needed)
- Timestamps with relative formatting

### 7. Toast Notifications
- Global toast system using Redux
- Success/error/info notifications
- Auto-dismiss with animation
- Used for all user actions

### 8. Theme Support
- Light/dark theme toggle
- Persistent theme preference
- CSS variables for theming


## 🔄 Data Flow

### Redux Slices
- **favoritesSlice**: Manages user's favorite recipes with async thunks for API calls
- **ratingSlice**: Handles recipe ratings, stats, and user ratings
- **commentsSlice**: Manages comments with CRUD operations and likes
- **toastSlice**: Global notification system

### API Integration
- **TheMealDB**: External API for recipe data (fetched via backend)
- **Custom Backend API**: All user data stored in MongoDB
  - Authentication endpoints (`/api/auth/*`)
  - User endpoints (`/api/users/*`)
  - Recipe endpoints (`/api/recipes/*`)
  - Favorites endpoints (`/api/favorites/*`)
  - Ratings endpoints (`/api/ratings/*`)
  - Comments endpoints (`/api/comments/*`)

## 🎯 Key Implementation Details

### Authentication Flow
1. User logs in → Server sets httpOnly cookie with JWT
2. Client includes cookie in all subsequent requests
3. AuthContext checks `/api/auth/me` on mount to restore session
4. No localStorage used for tokens (security)

### Recipe Discovery
- Frontend requests random recipes from `/api/recipes/random`
- Backend fetches from TheMealDB, saves to MongoDB
- Recipes are cached in DB for future requests
- Search queries TheMealDB and saves results

### State Management Strategy
- **Redux**: Global state (favorites, ratings, comments, toast)
- **Context**: UI state (theme) and authentication
- **Local state**: Component-specific UI state

### Performance Optimizations
- Memoized selectors with `createSelector`
- Infinite scroll with pagination
- Debounced search (500ms)
- Skeleton loaders
- Lazy loading images

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodiesnap
   ```

2. **Install backend dependencies**
  ```bash
  cd backend
  npm install
  ```

3. **Configure backend environment**
  ```bash
  cp .env.example .env
  ```
  Edit .env with your values

4. **Install frontend dependencies**
  ```bash
  cd ../frontend
  npm install
  ```

5. **Configure frontend environment**
  ```bash
  cp .env.example .env
  ```
  Edit .env with your values

6. **Start the development servers**

  Backend:
  ```bash
  npm run dev
  ```

  Frontend:
  ```bash
  npm run dev
  ```

## 📚 API Documentation

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes/random` | Get random recipes |
| GET | `/api/recipes/search?q=query` | Search recipes |
| GET | `/api/recipes/:id` | Get recipe by ID |
| GET | `/api/recipes/top-rated` | Get top rated recipes |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/users/:id/favorites` | Get user's public favorites |
| GET | `/api/ratings/recipe/:id` | Get recipe ratings |

### Protected Endpoints (require authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/*` | Auth operations |
| GET | `/api/users/:id/saved` | Get user's saved recipes |
| POST/DELETE | `/api/favorites/*` | Manage favorites |
| POST/PUT/DELETE | `/api/ratings/*` | Manage ratings |
| POST/PUT/DELETE | `/api/comments/*` | Manage comments |

## 🧪 Testing
- Frontend: Jest + React Testing Library (planned)
- Backend: Jest + Supertest (planned)

## 🔜 Future Improvements
- Email verification
- Password reset
- Recipe creation by users
- Image upload for user avatars
- Social sharing features
- Recipe collections/playlists
- Follow system between users
- Activity feed
- Push notifications

---
Built with ❤️ using React, Node.js, and MongoDB