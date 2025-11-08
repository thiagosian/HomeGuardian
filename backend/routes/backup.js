const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');
const { createBackupSchema } = require('../validation/schemas');

/**
 * Trigger manual backup (create commit)
 */
router.post('/now', authenticate, validate(createBackupSchema), asyncHandler(async (req, res) => {
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
}));

/**
 * Get current git status
 */
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const gitService = req.app.locals.gitService;
  const status = await gitService.getStatus();

  res.json({
    success: true,
    status
  });
}));

/**
 * Pause file watcher
 */
router.post('/watcher/pause', authenticate, asyncHandler(async (req, res) => {
  const fileWatcher = req.app.locals.fileWatcher;
  await fileWatcher.pause();

  res.json({
    success: true,
    message: 'File watcher paused'
  });
}));

/**
 * Resume file watcher
 */
router.post('/watcher/resume', authenticate, asyncHandler(async (req, res) => {
  const fileWatcher = req.app.locals.fileWatcher;
  await fileWatcher.resume();

  res.json({
    success: true,
    message: 'File watcher resumed'
  });
}));

/**
 * Get file watcher status
 */
router.get('/watcher/status', authenticate, asyncHandler(async (req, res) => {
  const fileWatcher = req.app.locals.fileWatcher;
  const status = fileWatcher.getStatus();

  res.json({
    success: true,
    status
  });
}));

module.exports = router;
