import winston from 'winston';
import expressWinston from 'express-winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// const consoleFormat = winston.format.combine(
//   winston.format.colorize(),
//   winston.format.timestamp({
//     format: 'YYYY-MM-DD HH:mm:ss'
//   }),
//   winston.format.printf(({ timestamp, level, message, ...meta }) => {
//     return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
//   })
// );

export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'request.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // new winston.transports.Console({
    //   format: consoleFormat,
    //   level: 'info'
    // })
  ],
  format: logFormat,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}} - {{res.statusCode}} - {{res.responseTime}}ms",
  expressFormat: false,
  colorize: true,
  ignoreRoute: (req) => {
    return req.url === 'api/health' || req.url === '/favicon.ico';
  }
});

export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // new winston.transports.Console({
    //   format: consoleFormat,
    //   level: 'error'
    // })
  ],
  format: logFormat,
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'app.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // new winston.transports.Console({
    //   format: consoleFormat,
    //   level: 'debug'
    // })
  ]
});



// import { logger } from '../middleware/logger';

// // in any controller
// export const someController = async (req, res, next) => {
//   try {
//     logger.info('Processing request', { userId: req.userId, endpoint: req.url });
//     // ... code
//   } catch (error) {
//     logger.error('Error in someController', { error: error.message, stack: error.stack });
//     next(error);
//   }
// };