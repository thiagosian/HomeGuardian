const express = require('express');
const router = express.Router();
const crypto = require('crypto-js');
const { NodeSSH } = require('node-ssh');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const db = require('../config/database');
const encryptionKeyManager = require('../utils/encryption-key-manager');

/**
 * Encrypt a value using the secure encryption key
 * @param {string} value - Value to encrypt
 * @returns {string} Encrypted value
 */
function encrypt(value) {
  const key = encryptionKeyManager.getKey();
  return crypto.AES.encrypt(value, key).toString();
}

/**
 * Decrypt a value using the secure encryption key
 * @param {string} encryptedValue - Encrypted value
 * @returns {string} Decrypted value
 */
function decrypt(encryptedValue) {
  const key = encryptionKeyManager.getKey();
  return crypto.AES.decrypt(encryptedValue, key).toString(crypto.enc.Utf8);
}

/**
 * Get all settings
 */
router.get('/', async (req, res) => {
  try {
    const settings = await db.all('SELECT key, value, encrypted FROM settings');

    const settingsObj = {};

    settings.forEach(setting => {
      let value = setting.value;

      // Decrypt if encrypted
      if (setting.encrypted) {
        try {
          value = decrypt(value);
        } catch (error) {
          logger.error(`Failed to decrypt setting ${setting.key}:`, error);
          value = null;
        }
      }

      settingsObj[setting.key] = value;
    });

    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    logger.error('Failed to get settings:', error);
    res.status(500).json({
      error: 'Failed to get settings',
      message: error.message
    });
  }
});

/**
 * Update a setting
 */
router.post('/', async (req, res) => {
  try {
    const { key, value, encrypted } = req.body;

    if (!key) {
      return res.status(400).json({
        error: 'Missing required parameter: key'
      });
    }

    let finalValue = value;

    // Encrypt if requested
    if (encrypted) {
      finalValue = encrypt(value);
    }

    await db.run(
      'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
      [key, finalValue, encrypted ? 1 : 0]
    );

    logger.info(`Setting updated: ${key}`);

    res.json({
      success: true,
      message: 'Setting updated',
      key
    });
  } catch (error) {
    logger.error('Failed to update setting:', error);
    res.status(500).json({
      error: 'Failed to update setting',
      message: error.message
    });
  }
});

/**
 * Generate SSH key pair
 */
router.post('/ssh/generate', async (req, res) => {
  try {
    const dataPath = process.env.DATA_PATH || '/data';
    const sshDir = path.join(dataPath, 'ssh');

    // Ensure SSH directory exists
    await fs.mkdir(sshDir, { recursive: true });

    const privateKeyPath = path.join(sshDir, 'id_rsa');
    const publicKeyPath = path.join(sshDir, 'id_rsa.pub');

    // Generate SSH key using ssh-keygen
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await execAsync(
      `ssh-keygen -t rsa -b 4096 -f ${privateKeyPath} -N "" -C "homeguardian@homeassistant"`
    );

    // Read keys
    const publicKey = await fs.readFile(publicKeyPath, 'utf8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');

    // Encrypt private key and store in database
    const encryptedPrivateKey = encrypt(privateKey);

    await db.run(
      'INSERT INTO ssh_keys (public_key, private_key_encrypted) VALUES (?, ?)',
      [publicKey, encryptedPrivateKey]
    );

    logger.info('SSH key pair generated');

    res.json({
      success: true,
      publicKey,
      message: 'SSH key generated successfully'
    });
  } catch (error) {
    logger.error('Failed to generate SSH key:', error);
    res.status(500).json({
      error: 'Failed to generate SSH key',
      message: error.message
    });
  }
});

/**
 * Get public SSH key
 */
router.get('/ssh/public-key', async (req, res) => {
  try {
    const result = await db.get(
      'SELECT public_key FROM ssh_keys ORDER BY id DESC LIMIT 1'
    );

    if (result) {
      res.json({
        success: true,
        publicKey: result.public_key
      });
    } else {
      res.json({
        success: false,
        message: 'No SSH key found. Generate one first.'
      });
    }
  } catch (error) {
    logger.error('Failed to get SSH key:', error);
    res.status(500).json({
      error: 'Failed to get SSH key',
      message: error.message
    });
  }
});

/**
 * Configure remote repository
 */
router.post('/remote', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { remoteUrl, authType, token } = req.body;

    if (!remoteUrl) {
      return res.status(400).json({
        error: 'Missing required parameter: remoteUrl'
      });
    }

    // Store remote URL
    await db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['remote_url', remoteUrl]
    );

    // Store auth type
    await db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['auth_type', authType || 'ssh']
    );

    // Store token if provided (encrypted)
    if (token) {
      const encryptedToken = encrypt(token);
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
        ['remote_token', encryptedToken, 1]
      );
    }

    // Configure git remote
    await gitService.configureRemote(remoteUrl);

    logger.info('Remote repository configured');

    res.json({
      success: true,
      message: 'Remote repository configured',
      remoteUrl
    });
  } catch (error) {
    logger.error('Failed to configure remote:', error);
    res.status(500).json({
      error: 'Failed to configure remote',
      message: error.message
    });
  }
});

/**
 * Test remote connection
 */
router.post('/remote/test', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;

    const success = await gitService.testRemoteConnection();

    res.json({
      success,
      message: success ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    logger.error('Remote connection test failed:', error);
    res.status(500).json({
      error: 'Connection test failed',
      message: error.message
    });
  }
});

/**
 * Push to remote
 */
router.post('/remote/push', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;

    await gitService.push();

    res.json({
      success: true,
      message: 'Pushed to remote successfully'
    });
  } catch (error) {
    logger.error('Push failed:', error);
    res.status(500).json({
      error: 'Push failed',
      message: error.message
    });
  }
});

module.exports = router;
