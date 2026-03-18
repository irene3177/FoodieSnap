import express, { Application } from 'express';
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
import { errorHandler, notFound } from './middleware/error.middleware';

const app: Application = express();

// Middleware
app.use(cors({
  // origin: '*',
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();