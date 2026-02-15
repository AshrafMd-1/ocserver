import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/** Custom log format: [timestamp] LEVEL: message */
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  const msg = stack || message;
  return `[${ts}] ${level}: ${msg}`;
});

/**
 * Application-wide Winston logger instance.
 * Configured via LOG_LEVEL environment variable.
 */
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
  // Suppress logs during tests unless explicitly enabled
  silent: config.NODE_ENV === 'test',
});
