export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  baseUrl: import.meta.env.VITE_WS_URL || 'http://localhost:5001',
  timeout: import.meta.env.TIMEOUT || 10000,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};