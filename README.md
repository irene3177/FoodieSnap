# 🍽️ FoodieSnap - Social Recipe Sharing Platform

## 🌐 Live Demo

**Frontend:** [https://foodiesnap-jie9.onrender.com](https://foodiesnap-jie9.onrender.com)

**Backend API:** [https://foodiesnap-jie9.onrender.com/api/health](https://foodiesnap-jie9.onrender.com/api/health)

> **⚠️ Important Note:** This application runs on a **free hosting plan** (Render.com). The server goes to sleep after 15 minutes of inactivity. When you first visit the site, it may take **20-30 seconds to wake up**. Please be patient. After the initial load, the app will run normally. 🚀

## 📋 About The Project

FoodieSnap is a full-stack web application where food enthusiasts can discover, share, and save recipes. Users can create profiles, upload recipes with images, rate and comment on dishes, follow other cooks, and manage favorites - all in one place with real-time chat functionality.

### ✨ Key Features

- **🔐 Authentication** - JWT-based auth with httpOnly cookies, session persistence
- **📝 Recipe Management** - Create, edit, delete recipes with images and instructions
- **💬 Real-time Chat** - Direct messaging with typing indicators and read receipts
- **⭐ Rating System** - Rate recipes 1-5 stars with distribution statistics
- **❤️ Favorites System** - Save and organize favorite recipes with drag-and-drop
- **👥 Social Features** - Follow users, write comments, view followers/following
- **🔍 Advanced Search** - Filter recipes by difficulty, time, cuisine, rating
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **🌓 Dark/Light Theme** - User preference persists across sessions

### 🐢 Performance Note

Due to the free hosting tier limitations:

- **First request after inactivity:** 20-30 seconds (cold start)
- **Subsequent requests:** 1-3 seconds (warm server)
- **TheMealDB API calls:** May take 2-5 seconds (external free API)

## 🏗️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router v6** for navigation
- **Redux Toolkit** for state management (favorites, ratings, comments, toast, unread)
- **Framer Motion** for smooth animations
- **Axios** with interceptors for API requests
- **Socket.IO Client** for real-time chat
- **CSS Modules** for component-scoped styling

### Backend

- **Node.js** with **Express**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication (httpOnly cookies)
- **Socket.IO** for WebSocket real-time features
- **bcryptjs** for password hashing
- **Winston** for logging
- **Helmet.js** for security headers
- **express-rate-limit** for DDoS protection
- **compression** for response optimization

### Cloud Services

- **Cloudinary** - Image storage and optimization (avatars)
- **TheMealDB API** - External recipe data source

### Deployment

- **Frontend & Backend:** Render.com (free tier)
- **Database:** MongoDB Atlas (free tier)
- **Image Storage:** Cloudinary (free tier)

> **✅ Persistent Storage:** User avatars are stored on **Cloudinary**, a cloud-based image management service. This ensures that uploaded avatars persist across server restarts and redeploys, unlike local file storage.

## ✨ Core Features

### 1. Authentication System

- JWT-based authentication with httpOnly cookies (XSS safe)
- Protected routes with middleware
- Session persistence across page reloads
- Login/Register with validation
- Profile management (username, avatar, bio)
- Avatar upload to Cloudinary
- Password change functionality
- Account deletion with cascade

### 2. Recipe Management

- Create recipes with title, description, ingredients, instructions
- Edit and delete own recipes
- View recipe details with ingredients and instructions
- Video tutorial links (YouTube)
- Difficulty levels (Easy, Medium, Hard)
- Cooking time specification
- Recipe images support

### 3. Real-time Chat

- Direct messaging between users
- Real-time message delivery via WebSocket
- Typing indicators
- Status indicators
- Read receipts
- Conversation list with last message preview
- Unread message count badges
- Delete conversation and clear chat history

### 4. Favorites System

- Add/remove recipes to favorites
- Drag-and-drop reordering
- Persistent order across sessions
- Clear all favorites option
- Visual feedback with sparkle animation

### 5. Rating System

- Rate recipes 1-5 stars
- Remove ratings by clicking same star
- View average ratings and total count
- Rating distribution per recipe
- User-specific rating display

### 6. Comments System

- Add comments to recipes
- Edit/delete own comments
- Like/unlike comments
- Real-time updates
- Timestamps with relative formatting

### 7. User Social Features

- Follow/unfollow users
- View followers and following lists
- View other users' profiles
- Recipe count and activity stats
- User search by username

### 8. Recipe Discovery

- Browse random recipes with infinite scroll
- Search recipes by name with debounce
- Advanced filtering (difficulty, cooking time, cuisine, rating)
- Top rated recipes page
- Recipe details with ingredients and instructions

### 9. UI/UX Features

- Dark/Light theme toggle with persistence
- Toast notifications (success, error, info)
- Loading skeletons for better UX
- Smooth animations with Framer Motion
- Responsive design for all devices
- Scroll to top button

## 🔄 Data Flow

### Authentication Flow

1. User submits login form
2. Backend validates credentials
3. JWT token generated and set as httpOnly cookie
4. Frontend makes authenticated requests with cookie
5. AuthContext checks `/api/auth/me` on mount to restore session

### Avatar Upload Flow (Cloudinary)

1. User selects image file (max 5MB, allowed formats: JPG, PNG, GIF, WEBP)
2. Frontend sends FormData with file to `/api/auth/avatar`
3. Multer middleware processes file upload
4. CloudinaryStorage automatically uploads to Cloudinary
5. Image is automatically resized to 200x200 pixels
6. Cloudinary returns secure HTTPS URL
7. Backend saves URL to user profile in MongoDB
8. Old avatar is automatically deleted from Cloudinary (if exists)
9. Frontend updates UI with new avatar

### Real-time Chat Flow

1. User joins conversation room via Socket.IO
2. Messages sent via WebSocket for instant delivery
3. Optimistic UI updates for better UX
4. Messages persisted to MongoDB
5. Read receipts sent when user views chat
6. Typing indicators broadcast to conversation participants

### Favorites Flow

1. User clicks favorite button
2. Optimistic UI update (instant visual feedback)
3. API request sent to backend
4. On success, state updated; on failure, UI reverted
5. Drag-and-drop reordering triggers API update

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/irene3177/FoodieSnap.git
cd FoodieSnap
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

Edit `.env` with your values:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/foodiesnap
MONGODB_TEST_URI=mongodb://localhost:27017/foodie_snap_test
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1'
RATE_LIMIT_MAX_REQUESTS=10000
NODE_ENV=development

# Cloudinary Configuration (required for avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. **Install frontend dependencies**

```bash
cd ../frontend
npm install
```

5. **Configure frontend environment**

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
VITE_API_URL='http://localhost:5001/api'
VITE_WS_URL='http://localhost:5001'
VITE_API_TIMEOUT=50000
```

6. **Start the development servers**

Backend (from `/backend`):

```bash
npm run dev
```

Frontend (from `/frontend`):

```bash
npm run dev
```

7. **Open the app in your browser**

Open `http://localhost:5173` in your browser to see the app.

## 📚 API Documentation

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **POST** | `/register` | Create new account | Public |
| **POST** | `/login` | Login user | Public |
| **POST** | `/logout` | Logout user | Public |
| **GET** | `/me` | Get current user | Private |
| **PUT** | `/profile` | Update profile | Private |
| **POST** | `/avatar` | Upload avatar | Private |
| **PUT** | `/password` | Change password | Private |
| **DELETE** | `/delete` | Delete account | Private |

### Recipes (`/api/recipes`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/random` | Get random recipes | Public |
| **GET** | `/search` | Search recipes by name | Public |
| **GET** | `/filter` | Filter recipes (difficulty, time, etc.) | Public |
| **GET** | `/top-rated` | Get top rated recipes | Public |
| **GET** | `/user/:userId` | Get user's recipes | Public |
| **GET** | `/:id` | Get recipe by ID | Public |
| **POST** | `/` | Create recipe | Private |
| **PUT** | `/:id` | Update recipe | Private |
| **DELETE** | `/:id` | Delete recipe | Private |

### Comments (`/api/comments`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/recipe/:recipeId` | Get recipe comments | Public |
| **POST** | `/` | Create comment | Private |
| **PUT** | `/:id` | Update comment | Private |
| **POST** | `/:id/like` | Like/unlike comment | Private |
| **DELETE** | `/:id` | Delete comment | Private |

### Favorites (`/api/favorites`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/` | Get all favorites | Private |
| **GET** | `/:recipeId/check` | Check if favorited | Private |
| **POST** | `/:recipeId` | Add to favorites | Private |
| **PUT** | `/reorder` | Reorder favorites | Private |
| **DELETE** | `/:recipeId` | Remove from favorites | Private |
| **DELETE** | `/` | Clear all favorites | Private |

### Ratings (`/api/ratings`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/recipe/:recipeId` | Get recipe rating stats | Public |
| **GET** | `/user` | Get user's ratings | Private |
| **POST** | `/recipe/:recipeId` | Rate recipe | Private |
| **PUT** | `/recipe/:recipeId` | Update rating | Private |
| **DELETE** | `/recipe/:recipeId` | Delete rating | Private |

### Users (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/` | Get users list (paginated) | Public |
| **GET** | `/:userId` | Get user profile | Public |
| **GET** | `/:userId/favorites` | Get user's favorites | Public |
| **GET** | `/:userId/recipes` | Get user's recipes | Public |

### Follow (`/api/follow`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/:userId/followers` | Get user's followers | Private |
| **GET** | `/:userId/following` | Get users followed | Private |
| **POST** | `/:userId` | Follow user | Private |
| **DELETE** | `/:userId` | Unfollow user | Private |
| **GET** | `/check/:userId` | Check follow status | Private |

### Messages (`/api/messages`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/conversations` | Get all conversations | Private |
| **GET** | `/conversation/:otherUserId` | Get or create conversation | Private |
| **GET** | `/conversation-by-id/:conversationId` | Get conversation with messages | Private |
| **POST** | `/conversation/:conversationId/message` | Send message | Private |
| **PUT** | `/conversation/:conversationId/read` | Mark messages as read | Private |
| **DELETE** | `/conversation/:conversationId/messages` | Clear chat history | Private |
| **DELETE** | `/conversation/:conversationId` | Delete conversation | Private |

## 🔌 WebSocket Events (Socket.IO)

### Client → Server

| Event | Payload | Description |
|----------|-------------|---------|
| `join-chat` | `{ conversationId }` | Join chat room |
| `leave-chat` | `{ conversationId }` | Leave chat room |
| `message` | `{ conversationId, text, senderId }` | Send message |
| `typing` | `{ conversationId, userId, isTyping }` | Typing indicator |
| `mark-read` | `{ conversationId, userId }` | Mark messages as read |
| `check-online-status` | `{ userId }` | Check user online status |

### Server → Client

| Event | Payload | Description |
|----------|-------------|---------|
| `message` | `{ message }` | New message received |
| `typing` | `{ userId, isTyping }` | User typing status |
| `messages-read` | `{ userId, conversationId }` | Messages marked as read |
| `user-online` | `{ userId, online }` | User online status |
| `online-status-response` | `{ userId, online }` | Response to status check |

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test        # Run all tests
npm run test:ui     # Vitest UI
npm run coverage    # Test coverage

# Backend tests
cd backend
npm test            # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

## 🔒 Security Features

- **HTTP-only cookies** for JWT storage (XSS protection)
- **Password hashing** with bcrypt (10 rounds)
- **Input validation** with express-validator
- **Rate limiting** (100 requests/15min, 5 for auth)
- **Helmet.js** for security headers
- **CORS** with whitelisted origins
- **XSS prevention** via sanitization
- **SQL injection protection** (Mongoose)
- **File upload validation** (type: images only, size: max 5MB)
- **Cloudinary secure URLs** (HTTPS only)

## 📈 Performance Optimizations

### Frontend

- Code splitting with lazy loading
- Image lazy loading
- Debounced search (500ms)
- Infinite scroll pagination
- Memoized selectors (createSelector)
- CSS Modules for scoped styles

### Backend

- Response compression (gzip)
- Database indexing for queries
- Connection pooling
- Rate limiting for DDoS protection
- Winston logging with rotation
- Graceful shutdown handling

## ☁️ Cloudinary Integration

User avatars are stored on Cloudinary, providing:

- **Persistent Storage** - Images survive server restarts and redeploys
- **CDN Delivery** - Fast global image delivery
- **Free Tier** - 25GB storage and 25GB monthly bandwidth
- **Secure URLs** - HTTPS-only access
- **Automatic Cleanup** - Old avatars are deleted when replaced

### Avatar Upload Limits

- **Max file size:** 5MB
- **Allowed formats:** JPEG, PNG, GIF, WEBP
- **Storage:** Cloudinary cloud storage

## 🔜 Future Improvements

- Email verification on registration
- Password reset functionality
- Recipe image upload (vs URL only)
- Recipe collections/playlists
- AI-powered recipe recommendations
- Grocery list generation
- Meal planning calendar
- Social login (Google, GitHub)
- Push notifications
- Recipe video uploads
- Activity feed
- Mobile app with React Native

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## 🙏 Acknowledgments

- **[TheMealDB](https://www.themealdb.com/)** - for recipe data API
- **[Cloudinary](https://cloudinary.com/)** - for image storageand optimization
- **[React Documentation](https://react.dev/)**
- **[Redux Toolkit Guide](https://redux-toolkit.js.org/)**
- **[Socket.IO Docs](https://socket.io/docs/v4/)**
- **[Framer Motion API](https://www.framer.com/motion/)**

## 📧 Contact

Project Link: https://github.com/irene3177/FoodieSnap

Live Demo: https://foodiesnap-api.onrender.com

---
Built with ❤️ using React, Node.js, and MongoDB
