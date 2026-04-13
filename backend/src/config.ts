import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  mongoTestUri: string;
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
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    expires: Date;
    path: string;
    domain?: string;
  };
  rateLimitMaxRequests: string;
}

const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ ${envVar} is not defined in environment variables`);
  }
}

const isProduction = process.env.NODE_ENV === 'production';

const getExpiresDate = () => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 дней
  return expires;
};

export const config: Config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI!,
  mongoTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/foodie_snap_test',
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mealdbApiUrl: process.env.MEALDB_API_URL || 'https://www.themealdb.com/api/json/v1/1',
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '100',

  get isProduction() {
    return this.nodeEnv === 'production';
  },

  get isDevelopment() {
    return this.nodeEnv === 'development';
  },

  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
    expires: getExpiresDate(),
    path: '/',
    domain: isProduction 
    ? (process.env.COOKIE_DOMAIN || '.foodiesnap.com')
    : undefined,
  }
};