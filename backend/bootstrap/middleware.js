const express = require('express');
const cors = require('cors');
const compression = require('compression');
const logger = require('../utils/logger');
const { serviceInjector } = require('../middleware/service-injector');
const {
  backupLimiter,
  restoreLimiter,
  settingsLimiter,
  readLimiter,
  statusLimiter,
  gitHistoryLimiter,
  itemsLimiter,
  entityHistoryLimiter,
  batchLimiter
} = require('../middleware/rate-limit');

/**
 * Configure all application middlewares
 * @param {Express} app - Express application instance
 * @param {ServiceContainer} container - Service container
 */
function configureMiddleware(app, container) {
  // CORS
  app.use(cors());

  // Compression middleware with streaming
  // Configurable compression level for different RPi models
  const compressionLevel = parseInt(process.env.COMPRESSION_LEVEL || '6');
  app.use(compression({
    threshold: 1024, // Only compress responses > 1KB
    level: compressionLevel,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Limit request body size to prevent DoS attacks
  app.use(express.json({
    limit: '1mb',
    strict: true // Only accept arrays and objects
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '1mb'
  }));

  // Limit URL length
  app.use((req, res, next) => {
    if (req.url.length > 2000) {
      return res.status(414).json({
        error: 'URL too long',
        maxLength: 2000
      });
    }
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Inject service container into requests
  app.use(serviceInjector(container));

  // Apply rate limiters to API endpoints
  app.use('/api/backup', backupLimiter);
  app.use('/api/restore', restoreLimiter);
  app.use('/api/settings', settingsLimiter);
  app.use('/api/history', readLimiter);
  app.use('/api/history/entity', entityHistoryLimiter);
  app.use('/api/history/batch', batchLimiter);
  app.use('/api/status', statusLimiter);
  app.use('/api/notifications', readLimiter);
  app.use('/api/items', itemsLimiter);
  app.use('/api/git', gitHistoryLimiter);

  // HTTP cache headers for GET requests
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.path.startsWith('/api/')) {
      if (!req.path.includes('/health')) {
        res.set('Cache-Control', 'private, max-age=300');
      }
    }
    next();
  });

  logger.info('Middlewares configured successfully');
}

module.exports = { configureMiddleware };
