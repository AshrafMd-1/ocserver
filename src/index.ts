import { config } from './config';
import { createApp } from './server';
import { logger } from './utils/logger';

/**
 * Server startup with graceful shutdown handling.
 */
async function main(): Promise<void> {
  try {
    const app = await createApp();

    const server = app.listen(config.PORT, () => {
      logger.info(`OpenClaw Proxy Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Log level: ${config.LOG_LEVEL}`);
      logger.info(`Try: http://localhost:${config.PORT}/items`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  }
}

main();
