# FoodieSnap Backend

Backend server for FoodieSnap application - a social network for food lovers.

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication (HTTP-only cookies)
- Bcrypt for password hashing
- TypeScript


## 📡 API Endpoints (planned)

### 🔐 Authentication (/api/auth)
| Method | Endpoint | Description | Access | Body |
|--------|----------|-------------|--------|------|
| **POST** | `/register` | Register new user | Public | `{ username, email, password }` |
| **POST** | `/login` | Login user | Public | `{ email, password }` |
| **POST** | `/logout` | Logout user | Public | - |
| **GET** | `/me` | Get current user profile | Private | - |
| **PUT** | `/profile` | Update user profile | Private | `{ username?, bio?, avatar? }` |
| **PUT** | `/password` | Change password | Private | `{ currentPassword, newPassword }` |

### 💬 Comments (/api/comments)
| Method | Endpoint | Description | Access | Body |
|--------|----------|-------------|--------|------|
| **GET** | `/recipe/:recipeId` | Get all comments for a recipe | Public | - |
| **POST** | `/` | Create a new comment | Private | `{ text, recipeId, rating? }` |
| **PUT** | `/:id` | Update a comment | Private | `{ text?, rating? }` |
| **DELETE** | `/:id` | Delete a comment | Private | - |
| **POST** | `/:id/like` | Like/unlike a comment | Private | - |

## 📝 Status
Under development 🚧


## 🛡️ Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5001 |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/foodiesnap` |
| `JWT_SECRET` | Secret for JWT tokens | **(required)** |
| `JWT_EXPIRE` | Token expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |