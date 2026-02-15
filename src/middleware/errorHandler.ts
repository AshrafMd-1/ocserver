import type { Request, Response, NextFunction } from 'express';
import { AppError, PluginError } from '../core/errors';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware.
 * Catches all errors and returns sanitized JSON responses.
 * Sensitive details (stack traces, internal messages) are hidden in production.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Extract app context if available
  const app = err instanceof PluginError ? err.pluginName : req.params?.app;
  const path = req.params?.path;

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${err.message}`, {
      stack: err.stack,
      app,
      path,
    });
  } else {
    logger.warn(`[${statusCode}] ${err.message}`, { app, path });
  }

  // Build sanitized response
  const response: Record<string, unknown> = {
    error: isProduction && statusCode >= 500
      ? 'Internal server error'
      : err.message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (app) response.app = app;
  if (path) response.path = path;

  res.status(statusCode).json(response);
}
