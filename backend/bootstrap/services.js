const logger = require('../utils/logger');
const db = require('../config/database');
const encryptionKeyManager = require('../utils/encryption-key-manager');
const GitService = require('../services/git-service');
const FileWatcher = require('../services/file-watcher');
const Scheduler = require('../services/scheduler');

/**
 * Initialize all application services
 * @param {ServiceContainer} container - Service container
 * @returns {Promise<void>}
 */
async function initializeServices(container) {
  try {
    // Initialize encryption key FIRST (before database)
    logger.info('Initializing encryption key...');
    await encryptionKeyManager.initialize();

    // Register encryption key manager in container
    container.register('encryptionKeyManager', encryptionKeyManager, {
      description: 'AES-256 encryption key manager'
    });

    logger.info('Initializing database...');
    await db.initialize();

    // Register database in container
    container.register('db', db, {
      description: 'SQLite database connection'
    });

    logger.info('Initializing Git service...');
    const gitService = new GitService();
    await gitService.initialize();

    // Register gitService in container
    container.register('gitService', gitService, {
      description: 'Git repository management service'
    });

    logger.info('Initializing file watcher...');
    const fileWatcher = new FileWatcher(gitService);

    // Register fileWatcher in container
    container.register('fileWatcher', fileWatcher, {
      description: 'File system watcher for auto-commits',
      required: false
    });

    if (process.env.AUTO_COMMIT_ENABLED === 'true') {
      await fileWatcher.start();
      logger.info('File watcher started');
    } else {
      logger.info('File watcher disabled by configuration');
    }

    logger.info('Initializing scheduler...');
    const scheduler = new Scheduler(gitService, db);

    // Register scheduler in container
    container.register('scheduler', scheduler, {
      description: 'Scheduled backup service',
      required: false
    });

    if (process.env.SCHEDULED_BACKUP_ENABLED === 'true') {
      scheduler.start();
      logger.info('Scheduler started');
    } else {
      logger.info('Scheduler disabled by configuration');
    }

    // Validate all required services are initialized
    container.validateServices();

    logger.info('All services initialized successfully');
    logger.info(`Registered services: ${container.getServiceNames().join(', ')}`);

    return {
      gitService,
      fileWatcher,
      scheduler
    };
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Gracefully shutdown all services
 * @param {Object} services - Services object with gitService, fileWatcher, scheduler
 */
async function shutdownServices(services) {
  logger.info('Shutting down services...');

  if (services.fileWatcher) {
    await services.fileWatcher.stop();
    logger.info('File watcher stopped');
  }

  if (services.scheduler) {
    services.scheduler.stop();
    logger.info('Scheduler stopped');
  }

  logger.info('All services shut down successfully');
}

module.exports = { initializeServices, shutdownServices };
