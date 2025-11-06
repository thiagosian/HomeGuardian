const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Get API version
 */
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    api_version: 'v1'
  });
});

module.exports = router;
