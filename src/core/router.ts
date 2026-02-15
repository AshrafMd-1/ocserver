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
   * GET /:app/:path
   * Executes the handler for the given app and path.
   */
  router.get(
    '/:app/:path',
    async (req: Request, res: Response, next: NextFunction) => {
      const { app, path: pathName } = req.params;

      try {
        const plugin = await registry.getPlugin(app);

        if (!plugin) {
          return next(new AppError(`App "${app}" not found`, 404));
        }

        const pathHandler = plugin.paths.find((p) => p.name === pathName);

        if (!pathHandler) {
          return next(
            new PluginError(
              app,
              `Path "${pathName}" not found in app "${app}"`,
              404,
            ),
          );
        }

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

        logger.debug(`Executing handler: ${app}/${pathName}`);
        await pathHandler.handler(req, res, next);
      } catch (err) {
        next(
          err instanceof AppError
            ? err
            : new PluginError(
                app,
                `Handler error: ${err instanceof Error ? err.message : 'Unknown error'}`,
              ),
        );
      }
    },
  );

  return router;
}
