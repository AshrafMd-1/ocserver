import express from 'express';
import * as path from 'path';
import { createRouter } from './core/router';
import { registry } from './core/registry';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

/**
 * Create and configure the Express application.
 * Sets up middleware chain, auto-discovers plugins, and mounts the dynamic router.
 */
export async function createApp(): Promise<express.Application> {
  const app = express();

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Auto-discover and register plugins
  const appsDir = path.join(__dirname, 'apps');
  await registry.discoverPlugins(appsDir);
  logger.info(`Plugin discovery complete. Found: ${registry.getAllPlugins().join(', ') || 'none'}`);

  // Mount dynamic plugin router
  app.use('/', createRouter());

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
