const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');
const HAParser = require('../services/ha-parser');

const haParser = new HAParser();

/**
 * Restore a file to a specific commit
 */
router.post('/file', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { filePath, commitHash } = req.body;

    if (!filePath || !commitHash) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['filePath', 'commitHash']
      });
    }

    await gitService.restoreFile(filePath, commitHash);

    res.json({
      success: true,
      message: `File restored: ${filePath}`,
      filePath,
      commitHash
    });
  } catch (error) {
    logger.error('Failed to restore file:', error);
    res.status(500).json({
      error: 'Failed to restore file',
      message: error.message
    });
  }
});

/**
 * Restore a specific item (automation, script, scene)
 */
router.post('/item', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { type, id, commitHash } = req.body;

    if (!type || !id || !commitHash) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['type', 'id', 'commitHash']
      });
    }

    // Get item from commit
    const item = await haParser.getItem(type, id);

    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        type,
        id
      });
    }

    // Get content from commit
    const content = await gitService.getFileContent(item.file, commitHash);

    // Create safety backup first
    await gitService.createCommit('Safety backup before item restoration', false, false);

    // Restore item
    await haParser.restoreItem(type, id, content);

    res.json({
      success: true,
      message: `Item restored: ${type}:${id}`,
      type,
      id,
      commitHash
    });
  } catch (error) {
    logger.error('Failed to restore item:', error);
    res.status(500).json({
      error: 'Failed to restore item',
      message: error.message
    });
  }
});

/**
 * Reload Home Assistant configuration
 */
router.post('/reload/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    const supervisorToken = process.env.SUPERVISOR_TOKEN;
    const haApiUrl = process.env.HOMEASSISTANT_API || 'http://supervisor/core/api';

    if (!supervisorToken) {
      return res.status(500).json({
        error: 'Supervisor token not available'
      });
    }

    // Map domain to HA service
    const serviceMap = {
      'automation': 'automation.reload',
      'script': 'script.reload',
      'scene': 'scene.reload',
      'group': 'group.reload',
      'core': 'homeassistant.reload_core_config'
    };

    const service = serviceMap[domain];

    if (!service) {
      return res.status(400).json({
        error: 'Invalid domain',
        validDomains: Object.keys(serviceMap)
      });
    }

    // Call HA API to reload
    const [serviceDomain, serviceName] = service.split('.');

    const response = await axios.post(
      `${haApiUrl}/services/${serviceDomain}/${serviceName}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${supervisorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`Reloaded HA domain: ${domain}`);

    res.json({
      success: true,
      message: `Reloaded ${domain}`,
      domain,
      service
    });
  } catch (error) {
    logger.error('Failed to reload HA configuration:', error);
    res.status(500).json({
      error: 'Failed to reload configuration',
      message: error.message
    });
  }
});

module.exports = router;
