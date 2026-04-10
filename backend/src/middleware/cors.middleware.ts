import cors from 'cors';
import { config } from '../config';

export const corsOptions = {
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
  preflightContinue: false
};

export const corsMiddleware = cors(corsOptions);