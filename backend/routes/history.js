const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const HAParser = require('../services/ha-parser');
const { validate } = require('../middleware/validate');
const { historyQuerySchema, filePathQuerySchema } = require('../validation/schemas');

const haParser = new HAParser();

/**
 * Get commit history
 */
router.get('/', validate(historyQuerySchema, 'query'), async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    // req.query is already validated and type-coerced
    const { limit, offset } = req.query;

    const history = await gitService.getHistory(limit, offset);

    res.json({
      success: true,
      history,
      pagination: {
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Failed to get history:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
});

/**
 * Get details of a specific commit
 */
router.get('/:commitHash', async (req, res) => {
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
    logger.error('Failed to get commit details:', error);
    res.status(500).json({
      error: 'Failed to get commit details',
      message: error.message
    });
  }
});

/**
 * Get diff for a specific file in a commit
 */
router.get('/:commitHash/file', validate(filePathQuerySchema, 'query'), async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { commitHash } = req.params;
    // req.query is already validated
    const { filePath } = req.query;

    const diff = await gitService.getFileDiff(filePath, commitHash);

    res.json({
      success: true,
      commitHash,
      filePath,
      diff
    });
  } catch (error) {
    logger.error('Failed to get file diff:', error);
    res.status(500).json({
      error: 'Failed to get file diff',
      message: error.message
    });
  }
});

/**
 * Get content of a file at a specific commit
 */
router.get('/:commitHash/content', validate(filePathQuerySchema, 'query'), async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { commitHash } = req.params;
    // req.query is already validated
    const { filePath } = req.query;

    const content = await gitService.getFileContent(filePath, commitHash);

    res.json({
      success: true,
      commitHash,
      filePath,
      content
    });
  } catch (error) {
    logger.error('Failed to get file content:', error);
    res.status(500).json({
      error: 'Failed to get file content',
      message: error.message
    });
  }
});

/**
 * Get all HA items (automations, scripts, scenes)
 */
router.get('/items/all', async (req, res) => {
  try {
    const cacheKey = 'ha_items_all';
    let items = cache.get(cacheKey);

    if (!items) {
      logger.info('Parsing all HA items (cache miss)');
      items = await haParser.parseAllItems();
      cache.set(cacheKey, items, 300000); // 5 min TTL
    } else {
      logger.debug('Returning cached HA items');
    }

    res.json({
      success: true,
      items
    });
  } catch (error) {
    logger.error('Failed to get items:', error);
    res.status(500).json({
      error: 'Failed to get items',
      message: error.message
    });
  }
});

/**
 * Get changed items for a commit
 */
router.get('/:commitHash/items', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { commitHash } = req.params;

    // Get commit diff to find changed files
    const diff = await gitService.getCommitDiff(commitHash);

    // Parse diff to extract file names (basic implementation)
    const fileMatches = diff.match(/diff --git a\/(.+?) b\//g) || [];
    const changedFiles = fileMatches.map(match => {
      const parts = match.split(' ');
      return parts[2].replace('a/', '');
    });

    // Get changed items
    const changedItems = await haParser.getChangedItems(changedFiles);

    res.json({
      success: true,
      commitHash,
      changedFiles,
      changedItems
    });
  } catch (error) {
    logger.error('Failed to get changed items:', error);
    res.status(500).json({
      error: 'Failed to get changed items',
      message: error.message
    });
  }
});

module.exports = router;
