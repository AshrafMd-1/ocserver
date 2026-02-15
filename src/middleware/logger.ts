import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware.
 * Logs incoming requests and their response status/duration.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const { method, url } = req;

  logger.http(`--> ${method} ${url}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const level = statusCode >= 400 ? 'warn' : 'http';
    logger[level](`<-- ${method} ${url} ${statusCode} (${duration}ms)`);
  });

  next();
}
