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

## 🔧 Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account or local MongoDB
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

4. **Run development server**

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

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** with bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** (100 requests/15min, 5 attempts for auth)
- **Helmet.js** for security headers
- **CORS** with whitelisted origins
- **XSS Protection**
- **SQL Injection Prevention** (via Mongoose)
- **File Upload Validation** (type, size)

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
MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1'
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

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational purposes.
