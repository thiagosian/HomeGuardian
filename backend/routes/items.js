const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const HAParser = require('../services/ha-parser');

const haParser = new HAParser();

/**
 * Get all items or filter by type
 * Query params:
 *  - type: automation|script|scene|blueprint|voice_assistant|dashboard|esphome|package
 *  - includeRaw: true/false (default: false)
 */
router.get('/', async (req, res) => {
  try {
    const { type, includeRaw } = req.query;

    // Create cache key based on options
    const cacheKey = `items_${type || 'all'}_${includeRaw || 'false'}`;
    let items = cache.get(cacheKey);

    if (!items) {
      logger.info(`Fetching items${type ? ` of type ${type}` : ''} (cache miss)`);

      if (type) {
        // Get specific type
        items = await haParser.getItemsByType(type, includeRaw === 'true');
      } else {
        // Get all items
        items = await haParser.parseAllItems({
          includeRaw: includeRaw === 'true',
          sequential: true
        });
      }

      cache.set(cacheKey, items, 300000); // 5 min TTL
    } else {
      logger.debug(`Returning cached items${type ? ` of type ${type}` : ''}`);
    }

    res.json({
      success: true,
      count: items.length,
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
 * Get a specific item by type and ID
 * Path params:
 *  - type: Entity type
 *  - id: Entity ID
 */
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { includeRaw } = req.query;

    logger.info(`Getting item ${type}:${id}`);

    const item = await haParser.getItem(type, id);

    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        type,
        id
      });
    }

    // Optionally remove raw data if not requested
    if (includeRaw !== 'true' && item.raw) {
      delete item.raw;
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    logger.error(`Failed to get item ${req.params.type}:${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to get item',
      message: error.message
    });
  }
});

module.exports = router;
