const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const db = require('./config/database');
const encryptionKeyManager = require('./utils/encryption-key-manager');
const {
  backupLimiter,
  restoreLimiter,
  settingsLimiter,
  readLimiter,
  statusLimiter
} = require('./middleware/rate-limit');

// Import routes
const apiRoutes = require('./routes/api');
const backupRoutes = require('./routes/backup');
const historyRoutes = require('./routes/history');
const restoreRoutes = require('./routes/restore');
const settingsRoutes = require('./routes/settings');
const statusRoutes = require('./routes/status');
const notificationRoutes = require('./routes/notifications');

// Import services
const GitService = require('./services/git-service');
const FileWatcher = require('./services/file-watcher');
const Scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 8099;

// Middleware
app.use(cors());

// Limit request body size to prevent DoS attacks
app.use(bodyParser.json({
  limit: '1mb',
  strict: true // Only accept arrays and objects
}));

app.use(bodyParser.urlencoded({
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

// Apply rate limiters to API endpoints
app.use('/api/backup', backupLimiter);
app.use('/api/restore', restoreLimiter);
app.use('/api/settings', settingsLimiter);
app.use('/api/history', readLimiter);
app.use('/api/status', statusLimiter);
app.use('/api/notifications', readLimiter);

// API Routes
app.use('/api', apiRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/restore', restoreRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Frontend fallback (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize encryption key FIRST (before database)
    logger.info('Initializing encryption key...');
    await encryptionKeyManager.initialize();

    logger.info('Initializing database...');
    await db.initialize();

    logger.info('Initializing Git service...');
    const gitService = new GitService();
    await gitService.initialize();

    // Store gitService instance globally for access in routes
    app.locals.gitService = gitService;

    logger.info('Initializing file watcher...');
    const fileWatcher = new FileWatcher(gitService);
    app.locals.fileWatcher = fileWatcher;

    if (process.env.AUTO_COMMIT_ENABLED === 'true') {
      await fileWatcher.start();
      logger.info('File watcher started');
    } else {
      logger.info('File watcher disabled by configuration');
    }

    logger.info('Initializing scheduler...');
    const scheduler = new Scheduler(gitService);
    app.locals.scheduler = scheduler;

    if (process.env.SCHEDULED_BACKUP_ENABLED === 'true') {
      scheduler.start();
      logger.info('Scheduler started');
    } else {
      logger.info('Scheduler disabled by configuration');
    }

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();

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

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing server');

  if (app.locals.fileWatcher) {
    await app.locals.fileWatcher.stop();
  }

  if (app.locals.scheduler) {
    app.locals.scheduler.stop();
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing server');

  if (app.locals.fileWatcher) {
    await app.locals.fileWatcher.stop();
  }

  if (app.locals.scheduler) {
    app.locals.scheduler.stop();
  }

  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
