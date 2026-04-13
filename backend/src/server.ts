import express, { Express } from 'express';
import http from 'http';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { config } from './config';
import { corsMiddleware } from './middleware/cors.middleware';
import { configureSecurity } from './middleware/security.middleware';
import { requestLogger, errorLogger } from './middleware/logger';
import { initializeSocketIO } from './services/socket.service';
import errorHandler from './middleware/errorHandler';
import notFoundHandler from './middleware/notFound';

import authRoutes from './routes/auth.routes';
import commentsRoutes from './routes/comments.routes';
import recipesRoutes from './routes/recipes.routes';
import favoritesRoutes from './routes/favorites.routes';
import ratingRoutes from './routes/rating.routes';
import usersRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import followRoutes from './routes/follow.routes';

const app: Express = express();

// ============ Security ============
configureSecurity(app);

// ============ CORS ============
app.use(corsMiddleware);

// ============ Compression ============
app.use(compression());

// ============ Standart middleware ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============ Logging ============
app.use(requestLogger);

// ============ Static files ============
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============ Health check ============
app.get('/api/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'FoodieSnap API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============ API Routes ============
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/follow', followRoutes);

// ============ SERVEFRONTEND STATIC FILES ============
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// ============ SPA FALLBACK - все остальные запросы отдаем index.html ============
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============ Error Handling ============
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

// ============ Server Initialization ============
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server, config.frontendUrl);

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    server.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
      console.log(`📡 WebSocket server is ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ============ Graceful Shutdown ============
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

startServer();