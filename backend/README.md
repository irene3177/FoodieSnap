# FoodieSnap Backend API

RESTful API for FoodieSnap - a social recipe sharing platform. Built with Node.js, Express, TypeScript, MongoDB, and Socket.IO.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT + HTTP-only cookies
- **Validation**: express-validator
- **Security**: Helmet.js, CORS, Rate Limiting
- **Performance**: Compression
- **Logging**: Winston
- **File Upload**: Multer
- **Image Storage**: Cloudinary (cloud-based)

## 🔧 Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account or local MongoDB
- Cloudinary account (free tier)
- npm or yarn

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/irene3177/FoodieSnap.git
cd FoodieSnap/backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Create .env file**

```bash
cp .env.example .env
```

4. **Configure environment variables**

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/foodiesnap
MONGODB_TEST_URI=mongodb://localhost:27017/foodie_snap_test
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MEALDB_API_URL=https://www.themealdb.com/api/json/v1/1
RATE_LIMIT_MAX_REQUESTS=10000
NODE_ENV=development

# Cloudinary Configuration (required for avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

5. **Run development server**

```bash
npm run dev
```

## 📡 API Endpoints

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

## ☁️ Cloudinary Integration

### Avatar Upload Flow

1. **Frontend sends image file** to /api/auth/avatar
2. **Multer middleware** processes the upload using CloudinaryStorage
3. **Cloudinary automatically:**
  - Uploads image to cloud storage
  - Optimizes for web delivery
  - Returns secure HTTPS URL
4. **Backend saves URL** to user profile in MongoDB
5. **Old avatar is deleted** from Cloudinary (if exists)
6. **Frontend receives new avatar URL** and updates UI

### File Validation

- **Max file size:** 5MB
- **Allowed formats:** JPEG, PNG, GIF, WEBP

### Benefits of Cloudinary

- ✅ **Persistent storage** - Avatars survive server restarts
- ✅ **CDN delivery** - Fast global image loading
- ✅ **Automatic optimization** - Images optimized for web
- ✅ **Free tier** - 25GB storage + 25GB monthly bandwidth
- ✅ **Secure** - HTTPS-only URLs

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** with bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** (10000 requests/15min, 5 attempts for auth)
- **Helmet.js** for security headers
- **CORS** with whitelisted origins
- **XSS Protection**
- **SQL Injection Prevention** (via Mongoose)
- **File Upload Validation** (type: images only, size: max 5MB)
- **Cloudinary Secure URLs** (HTTPS enforced)

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
# Run all tests
npm test

# Run specific test suite
npm test -- auth.test.ts

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📈 Logging

Winston logger with different levels:

- **Error**: System failures, exceptions
- **Warn**: Deprecated features, rate limit hits
- **Info**: API requests, user actions
- **Debug**: Development only

Logs stored in `/logs` directory with rotation.

## Environment Variables for Production

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=production_mongodb_uri
JWT_SECRET=strong_secret_key
FRONTEND_URL=https://your-frontend.com
RATE_LIMIT_MAX_REQUESTS=100
MEALDB_API_URL=https://www.themealdb.com/api/json/v1/1

# Cloudinary (required)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

```text
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "FoodieSnap API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## 📝 Error Handling

Standard error response format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 📦 Deployment on Render.com

### Important Notes for Render Deployment

1. **Cloudinary is REQUIRED** - Local file storage is not used
2. **Set environment variables** in Render dashboard:
- All variables from `.env` file
- Cloudinary credentials
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`

### Free Tier Limitations

- Server sleeps after 15 minutes of inactivity
- Cold start takes 20-30 seconds
- Cloudinary free tier: 25GB storage, 25GB monthly bandwidth

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational purposes.

---
Built with ❤️ using Node.js, Express, MongoDB, Socket.IO, and Cloudinary
