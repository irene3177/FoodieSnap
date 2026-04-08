import express, { Application } from 'express';
import http from 'http';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import commentsRoutes from './routes/comments.routes';
import authRoutes from './routes/auth.routes';
import recipesRoutes from './routes/recipes.routes';
import favoritesRoutes from './routes/favorites.routes';
import ratingRoutes from './routes/rating.routes';
import usersRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import followRoutes from './routes/follow.routes';
import errorHandler from './middleware/errorHandler';
import notFoundHandler from './middleware/notFound';
import { requestLogger, errorLogger } from './middleware/logger';
import { initializeSocketIO } from './services/socket.service';

const app: Application = express();


// Middleware
app.use(cors({
  // origin: '*',
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  // Safari needs this
  preflightContinue: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'FoodieSnap API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/follow', followRoutes);

// 404 handler
app.use(notFoundHandler);

app.use(errorLogger);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server, config.frontendUrl);

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    server.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
      console.log(`📡 WebSocket server is ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();