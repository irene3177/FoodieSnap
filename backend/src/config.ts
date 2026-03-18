import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpire: string;
  frontendUrl: string;
  mealdbApiUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    samesite: 'strict' | 'lax' | 'none';
    maxAge: number;
    path: string;
  };
}

const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ ${envVar} is not defined in environment variables`);
  }
}

export const config: Config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mealdbApiUrl: process.env.MEALDB_API_URL || 'https://www.themealdb.com/api/json/v1/1',
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  
  get isProduction() {
    return this.nodeEnv === 'production';
  },

  get isDevelopment() {
    return this.nodeEnv === 'development';
  },

  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    samesite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  }
};