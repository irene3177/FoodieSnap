import cors from 'cors';
import { config } from '../config';

const allowedOrigins = [
  config.frontendUrl,
  'https://foodiesnap.onrender.com',
  'https://foodiesnap.com',
  'http://localhost',
  'http://localhost:5173',
  'https://foodiesnap-jie9.onrender.com'
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
  preflightContinue: false
};

export const corsMiddleware = cors(corsOptions);