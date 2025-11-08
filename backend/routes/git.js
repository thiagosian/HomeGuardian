const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { validate } = require('../middleware/validate');
const { gitHistoryQuerySchema, gitCommitHashSchema } = require('../validation/schemas');

/**
 * Get Git status
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
    logger.error('Failed to get Git status:', error);
    res.status(500).json({
      error: 'Failed to get Git status',
      message: error.message
    });
  }
});

/**
 * Get commit history
 * Query params:
 *  - file: Filter by file path
 *  - limit: Max number of commits (default: 50)
 *  - offset: Skip first N commits (default: 0)
 */
router.get('/history', validate(gitHistoryQuerySchema, 'query'), async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { file, limit, offset } = req.query;

    const parsedLimit = parseInt(limit) || 50;
    const parsedOffset = parseInt(offset) || 0;

    let history;
    if (file) {
      // Get history for specific file
      history = await gitService.getFileHistory(file, parsedLimit);
    } else {
      // Get general history
      history = await gitService.getHistory(parsedLimit, parsedOffset);
    }

    res.json({
      success: true,
      history,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error) {
    logger.error('Failed to get Git history:', error);
    res.status(500).json({
      error: 'Failed to get Git history',
      message: error.message
    });
  }
});

/**
 * Get diff for a specific commit
 * Path params:
 *  - commitHash: Commit hash
 */
router.get('/diff/:commitHash', validate(gitCommitHashSchema, 'params'), async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { commitHash } = req.params;

    const diff = await gitService.getCommitDiff(commitHash);

    res.json({
      success: true,
      commitHash,
      diff
    });
  } catch (error) {
    logger.error(`Failed to get diff for commit ${req.params.commitHash}:`, error);
    res.status(500).json({
      error: 'Failed to get commit diff',
      message: error.message
    });
  }
});

module.exports = router;
