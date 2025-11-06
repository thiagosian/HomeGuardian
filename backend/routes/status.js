const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Get overall system status
 */
router.get('/', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const fileWatcher = req.app.locals.fileWatcher;
    const scheduler = req.app.locals.scheduler;

    // Get git status
    const gitStatus = await gitService.getStatus();

    // Get file watcher status
    const watcherStatus = fileWatcher.getStatus();

    // Get scheduler status
    const schedulerStatus = scheduler.getStatus();

    // Get last commit
    const history = await gitService.getHistory(1, 0);
    const lastCommit = history[0] || null;

    // Get remote sync status
    const lastPushResult = await db.get(
      'SELECT push_status, commit_date FROM backup_history WHERE push_status = "synced" ORDER BY commit_date DESC LIMIT 1'
    );

    // Get pending pushes
    const pendingPushes = await db.get(
      'SELECT COUNT(*) as count FROM backup_history WHERE push_status = "pending"'
    );

    // Get remote URL
    const remoteUrlResult = await db.get(
      'SELECT value FROM settings WHERE key = "remote_url"'
    );

    res.json({
      success: true,
      status: {
        git: gitStatus,
        watcher: watcherStatus,
        scheduler: schedulerStatus,
        lastCommit,
        remote: {
          configured: !!remoteUrlResult,
          url: remoteUrlResult?.value || null,
          lastPush: lastPushResult?.commit_date || null,
          pendingPushes: pendingPushes?.count || 0
        }
      },
      timestamp: new Date().toISOString()
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
 * Get statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;

    // Get total commits
    const totalCommits = await gitService.getHistory(999999, 0);

    // Get commits by type
    const autoCommits = await db.get(
      'SELECT COUNT(*) as count FROM backup_history WHERE is_auto = 1'
    );

    const scheduledCommits = await db.get(
      'SELECT COUNT(*) as count FROM backup_history WHERE is_scheduled = 1'
    );

    const manualCommits = await db.get(
      'SELECT COUNT(*) as count FROM backup_history WHERE is_auto = 0 AND is_scheduled = 0'
    );

    // Get successful pushes
    const successfulPushes = await db.get(
      'SELECT COUNT(*) as count FROM backup_history WHERE push_status = "synced"'
    );

    res.json({
      success: true,
      stats: {
        totalCommits: totalCommits.length,
        autoCommits: autoCommits?.count || 0,
        scheduledCommits: scheduledCommits?.count || 0,
        manualCommits: manualCommits?.count || 0,
        successfulPushes: successfulPushes?.count || 0
      }
    });
  } catch (error) {
    logger.error('Failed to get stats:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

module.exports = router;
