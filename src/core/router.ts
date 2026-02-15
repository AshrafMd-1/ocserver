import { Router, type Request, type Response, type NextFunction } from 'express';
import { registry } from './registry';
import { AppError, PluginError } from './errors';
import { logger } from '../utils/logger';

/**
 * Creates the dynamic Express router that routes requests
 * to registered plugin path handlers.
 *
 * Routes:
 *   GET /items        - List all registered apps
 *   GET /list/:app    - List paths for a specific app
 *   GET /:app/:path   - Execute a path handler
 */
export function createRouter(): Router {
  const router = Router();

  /**
   * GET /items
   * Returns all registered plugin names and count.
   */
  router.get('/items', (_req: Request, res: Response) => {
    const apps = registry.getAllPlugins();
    res.json({
      apps,
      count: apps.length,
    });
  });

  /**
   * GET /list/:app
   * Returns available paths for a specific app plugin.
   */
  router.get('/list/:app', (req: Request, res: Response, next: NextFunction) => {
    const { app } = req.params;
    const paths = registry.getPluginPaths(app);

    if (!paths) {
      return next(new AppError(`App "${app}" not found`, 404));
    }

    res.json({
      app,
      paths: paths.map((p) => ({
        name: p.name,
        description: p.description,
      })),
      count: paths.length,
    });
  });

  /**
   * Register dynamic routes for each app's path handlers.
   * This allows handlers to define their own Express route patterns (e.g., "issue/:identifier").
   */
  const apps = registry.getAllPlugins();
  for (const appName of apps) {
    const paths = registry.getPluginPaths(appName);
    if (!paths) continue;

    for (const pathHandler of paths) {
      // Build the full Express route: /:app/path-pattern
      const fullRoute = `/${appName}/${pathHandler.name}`;

      logger.debug(`Registering route: GET ${fullRoute}`);

      router.get(
        fullRoute,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            // Initialize plugin on first use
            await registry.getPlugin(appName);

            // Validate query parameters if schema is defined
            if (pathHandler.schema) {
              const validation = pathHandler.schema.safeParse(req.query);
              if (!validation.success) {
                return next(
                  new AppError(
                    `Invalid parameters: ${validation.error.issues.map((i) => i.message).join(', ')}`,
                    400,
                  ),
                );
              }
            }

            logger.debug(`Executing handler: ${appName}/${pathHandler.name}`);
            await pathHandler.handler(req, res, next);
          } catch (err) {
            next(
              err instanceof AppError
                ? err
                : new PluginError(
                    appName,
                    `Handler error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                  ),
            );
          }
        },
      );
    }
  }

  /**
   * Catch-all route for unmatched paths.
   * This handles 404s for unknown apps or paths.
   */
  router.use('/:app/*?', (req: Request, _res: Response, next: NextFunction) => {
    const { app } = req.params;

    // Check if app exists
    const appExists = apps.includes(app);

    if (!appExists) {
      return next(new AppError(`App "${app}" not found`, 404));
    }

    // App exists but path not found
    return next(new AppError(`Path not found in app "${app}"`, 404));
  });

  return router;
}
