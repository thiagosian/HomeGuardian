const express = require('express');
const router = express.Router();
const { NodeSSH } = require('node-ssh');
const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const db = require('../config/database');
const encryptionKeyManager = require('../utils/encryption-key-manager');
const { validate } = require('../middleware/validate');
const {
  createSettingSchema,
  remoteConfigSchema,
  sshKeyGenerateSchema
} = require('../validation/schemas');

const execFileAsync = promisify(execFile);

/**
 * Encrypt a value using the secure encryption key
 * @param {string} value - Value to encrypt
 * @returns {string} Encrypted value
 */
function encrypt(value) {
  return encryptionKeyManager.encrypt(value);
}

/**
 * Decrypt a value using the secure encryption key
 * @param {string} encryptedValue - Encrypted value
 * @returns {string} Decrypted value
 */
function decrypt(encryptedValue) {
  return encryptionKeyManager.decrypt(encryptedValue);
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
router.post('/', validate(createSettingSchema), async (req, res) => {
  try {
    // req.body is already validated
    const { key, value, encrypted } = req.body;

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
router.post('/ssh/generate', validate(sshKeyGenerateSchema), async (req, res) => {
  const { keyType, keySize } = req.body;
  try {
    // Validate DATA_PATH
    const dataPath = process.env.DATA_PATH || '/data';
    if (!path.isAbsolute(dataPath)) {
      throw new Error('Invalid DATA_PATH configuration');
    }

    const sshDir = path.join(dataPath, 'ssh');

    // Ensure SSH directory exists with proper permissions
    await fs.mkdir(sshDir, { recursive: true, mode: 0o700 });

    const privateKeyPath = path.join(sshDir, 'id_rsa');
    const publicKeyPath = path.join(sshDir, 'id_rsa.pub');

    // Generate SSH key using execFile (safe from command injection)
    await execFileAsync('ssh-keygen', [
      '-t', 'rsa',
      '-b', '4096',
      '-f', privateKeyPath,
      '-N', '',
      '-C', 'homeguardian@homeassistant'
    ], {
      timeout: 30000, // 30 seconds
      maxBuffer: 1024 * 1024 // 1MB
    });

    // Read keys
    const publicKey = await fs.readFile(publicKeyPath, 'utf8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');

    // Encrypt private key and store in database
    const encryptedPrivateKey = encrypt(privateKey);

    await db.run(
      'INSERT INTO ssh_keys (public_key, private_key_encrypted, created_at) VALUES (?, ?, ?)',
      [publicKey, encryptedPrivateKey, Date.now()]
    );

    // Remove key files from disk (keep only in encrypted database)
    await fs.unlink(privateKeyPath);
    await fs.unlink(publicKeyPath);

    logger.info('SSH key pair generated and stored securely');

    res.json({
      success: true,
      publicKey,
      message: 'SSH key generated successfully'
    });
  } catch (error) {
    logger.error('Failed to generate SSH key:', error);

    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to generate SSH key'
      : error.message;

    res.status(500).json({
      error: 'Failed to generate SSH key',
      message
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
router.post('/remote', validate(remoteConfigSchema), async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    // req.body is already validated
    const { remoteUrl, authType, token } = req.body;

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

/**
 * Git repository maintenance (garbage collection)
 * Optimizes git repository size and performance
 */
router.post('/maintenance/git-gc', async (req, res) => {
  try {
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);

    logger.info('Running git garbage collection...');
    const startTime = Date.now();

    // Run git gc with aggressive optimization
    // This can take several minutes on large repositories
    await execFileAsync('git', ['gc', '--aggressive', '--prune=now'], {
      cwd: process.env.CONFIG_PATH || '/config',
      timeout: 600000 // 10 minutes timeout
    });

    const duration = Date.now() - startTime;
    logger.info(`Git garbage collection completed in ${duration}ms`);

    res.json({
      success: true,
      message: 'Git repository optimized successfully',
      durationMs: duration
    });
  } catch (error) {
    logger.error('Git garbage collection failed:', error);
    res.status(500).json({
      error: 'Git garbage collection failed',
      message: error.message
    });
  }
});

/**
 * Database maintenance (cleanup old backups and vacuum)
 */
router.post('/maintenance/database', async (req, res) => {
  try {
    const db = require('../config/database');
    const retentionDays = parseInt(req.body.retentionDays || process.env.BACKUP_RETENTION_DAYS || '365');

    logger.info(`Running database maintenance (retention: ${retentionDays} days)...`);
    const startTime = Date.now();

    const result = await db.archiveOldBackups(retentionDays);
    const duration = Date.now() - startTime;

    logger.info(`Database maintenance completed in ${duration}ms`);

    res.json({
      success: true,
      message: 'Database maintenance completed successfully',
      deletedRecords: result.changes || 0,
      retentionDays,
      durationMs: duration
    });
  } catch (error) {
    logger.error('Database maintenance failed:', error);
    res.status(500).json({
      error: 'Database maintenance failed',
      message: error.message
    });
  }
});

/**
 * Full system maintenance (git + database)
 * Recommended to run monthly or when storage is low
 */
router.post('/maintenance/full', async (req, res) => {
  try {
    const results = {
      git: null,
      database: null
    };

    // Run git gc
    try {
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const execFileAsync = promisify(execFile);

      logger.info('Running git garbage collection...');
      await execFileAsync('git', ['gc', '--aggressive', '--prune=now'], {
        cwd: process.env.CONFIG_PATH || '/config',
        timeout: 600000
      });
      results.git = { success: true };
    } catch (error) {
      results.git = { success: false, error: error.message };
    }

    // Run database maintenance
    try {
      const db = require('../config/database');
      const retentionDays = parseInt(req.body.retentionDays || process.env.BACKUP_RETENTION_DAYS || '365');
      const result = await db.archiveOldBackups(retentionDays);
      results.database = { success: true, deletedRecords: result.changes || 0 };
    } catch (error) {
      results.database = { success: false, error: error.message };
    }

    const allSuccess = results.git.success && results.database.success;

    res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      message: allSuccess ? 'Full maintenance completed successfully' : 'Maintenance completed with some errors',
      results
    });
  } catch (error) {
    logger.error('Full maintenance failed:', error);
    res.status(500).json({
      error: 'Full maintenance failed',
      message: error.message
    });
  }
});

module.exports = router;
