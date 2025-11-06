const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * Trigger manual backup (create commit)
 */
router.post('/now', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { message } = req.body;

    const customMessage = message || `Manual backup: ${new Date().toISOString()}`;

    const result = await gitService.createCommit(customMessage, false, false);

    if (result) {
      // Auto-push if enabled
      if (process.env.AUTO_PUSH_ENABLED === 'true') {
        try {
          await gitService.push();
          logger.info('Manual backup pushed to remote');
        } catch (error) {
          logger.error('Failed to push manual backup:', error);
        }
      }

      res.json({
        success: true,
        commit: result
      });
    } else {
      res.json({
        success: true,
        message: 'No changes to commit'
      });
    }
  } catch (error) {
    logger.error('Manual backup failed:', error);
    res.status(500).json({
      error: 'Backup failed',
      message: error.message
    });
  }
});

/**
 * Get current git status
 */
router.get('/status', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const status = await gitService.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Failed to get status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * Pause file watcher
 */
router.post('/watcher/pause', async (req, res) => {
  try {
    const fileWatcher = req.app.locals.fileWatcher;
    await fileWatcher.pause();

    res.json({
      success: true,
      message: 'File watcher paused'
    });
  } catch (error) {
    logger.error('Failed to pause watcher:', error);
    res.status(500).json({
      error: 'Failed to pause watcher',
      message: error.message
    });
  }
});

/**
 * Resume file watcher
 */
router.post('/watcher/resume', async (req, res) => {
  try {
    const fileWatcher = req.app.locals.fileWatcher;
    await fileWatcher.resume();

    res.json({
      success: true,
      message: 'File watcher resumed'
    });
  } catch (error) {
    logger.error('Failed to resume watcher:', error);
    res.status(500).json({
      error: 'Failed to resume watcher',
      message: error.message
    });
  }
});

/**
 * Get file watcher status
 */
router.get('/watcher/status', (req, res) => {
  try {
    const fileWatcher = req.app.locals.fileWatcher;
    const status = fileWatcher.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Failed to get watcher status:', error);
    res.status(500).json({
      error: 'Failed to get watcher status',
      message: error.message
    });
  }
});

module.exports = router;
