const express = require('express');
const path = require('path');
const logger = require('../utils/logger');

// Import routes
const apiRoutes = require('../routes/api');
const backupRoutes = require('../routes/backup');
const historyRoutes = require('../routes/history');
const restoreRoutes = require('../routes/restore');
const settingsRoutes = require('../routes/settings');
const statusRoutes = require('../routes/status');
const notificationRoutes = require('../routes/notifications');
const itemsRoutes = require('../routes/items');
const gitRoutes = require('../routes/git');

/**
 * Register all application routes
 * @param {Express} app - Express application instance
 */
function registerRoutes(app) {
  // API Routes
  app.use('/api', apiRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/restore', restoreRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/status', statusRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/items', itemsRoutes);
  app.use('/api/git', gitRoutes);

  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));

  // Frontend fallback (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  logger.info('Routes registered successfully');
}

module.exports = { registerRoutes };
