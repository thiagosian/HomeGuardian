const express = require('express');
const logger = require('./utils/logger');
const container = require('./core/service-container');
const { configureMiddleware } = require('./bootstrap/middleware');
const { registerRoutes } = require('./bootstrap/routes');
const { initializeServices, shutdownServices } = require('./bootstrap/services');

const app = express();
const PORT = process.env.PORT || 8099;

let services = null;

/**
 * Start server with all services
 */
async function startServer() {
  try {
    // Initialize all services
    services = await initializeServices(container);

    // Attach container to app.locals for backward compatibility
    app.locals.container = container;

    // Keep legacy access for gradual migration (deprecated)
    app.locals.gitService = services.gitService;
    app.locals.fileWatcher = services.fileWatcher;
    app.locals.scheduler = services.scheduler;

    // Configure middleware
    configureMiddleware(app, container);

    // Register routes
    registerRoutes(app);

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`HomeGuardian server listening on port ${PORT}`);
      logger.info(`Config path: ${process.env.CONFIG_PATH || '/config'}`);
      logger.info(`Data path: ${process.env.DATA_PATH || '/data'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing server');
  if (services) {
    await shutdownServices(services);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing server');
  if (services) {
    await shutdownServices(services);
  }
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
