const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class EncryptionKeyManager {
  constructor() {
    this.keyPath = path.join(
      process.env.DATA_PATH || '/data',
      '.encryption_key'
    );
    this.key = null;
  }

  /**
   * Initialize encryption key (generate or load)
   * @returns {Promise<string>} The encryption key
   */
  async initialize() {
    try {
      // Try to load existing key
      const exists = await this.keyExists();

      if (exists) {
        this.key = await this.loadKey();
        logger.info('Encryption key loaded from storage');
      } else {
        this.key = await this.generateKey();
        logger.info('New encryption key generated and stored');
      }

      this.validateKey(this.key);
      return this.key;
    } catch (error) {
      logger.error('Failed to initialize encryption key:', error);
      throw new Error('Encryption key initialization failed');
    }
  }

  /**
   * Generate a new secure random key
   * @returns {Promise<string>} 64-character hex string
   */
  async generateKey() {
    // Generate 32 random bytes = 256 bits = 64 hex chars
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('hex');

    await this.saveKey(key);
    return key;
  }

  /**
   * Save key to disk with secure permissions
   * @param {string} key - The encryption key
   */
  async saveKey(key) {
    // Ensure directory exists
    const dir = path.dirname(this.keyPath);
    await fs.mkdir(dir, { recursive: true });

    // Write key to file
    await fs.writeFile(this.keyPath, key, {
      encoding: 'utf8',
      mode: 0o600 // Owner read/write only
    });

    logger.info(`Encryption key saved to ${this.keyPath}`);
  }

  /**
   * Load key from disk
   * @returns {Promise<string>} The encryption key
   */
  async loadKey() {
    const key = await fs.readFile(this.keyPath, 'utf8');
    return key.trim();
  }

  /**
   * Check if key file exists
   * @returns {Promise<boolean>}
   */
  async keyExists() {
    try {
      await fs.access(this.keyPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate key format
   * @param {string} key - The encryption key
   * @throws {Error} If key is invalid
   */
  validateKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Encryption key must be a string');
    }

    if (key.length !== 64) {
      throw new Error('Encryption key must be 64 characters (32 bytes hex)');
    }

    if (!/^[0-9a-f]{64}$/i.test(key)) {
      throw new Error('Encryption key must be hexadecimal');
    }

    // Check for known weak keys
    const FORBIDDEN_KEYS = [
      'homeguardian-default-key-change-me',
      '0'.repeat(64),
      'f'.repeat(64)
    ];

    if (FORBIDDEN_KEYS.some(forbidden => key.toLowerCase().includes(forbidden.toLowerCase()))) {
      throw new Error('Encryption key is weak or default');
    }
  }

  /**
   * Get the current encryption key
   * @returns {string} The encryption key
   */
  getKey() {
    if (!this.key) {
      throw new Error('Encryption key not initialized');
    }
    return this.key;
  }

  /**
   * Encrypt data using current key
   * @param {string} plaintext - Data to encrypt
   * @returns {string} Encrypted data
   */
  encrypt(plaintext) {
    const cryptoManager = require('./crypto-manager');
    return cryptoManager.encrypt(plaintext, this.getKey());
  }

  /**
   * Decrypt data using current key
   * @param {string} ciphertext - Data to decrypt
   * @returns {string} Decrypted data
   */
  decrypt(ciphertext) {
    const cryptoManager = require('./crypto-manager');
    return cryptoManager.decrypt(ciphertext, this.getKey());
  }

  /**
   * Rotate encryption key and re-encrypt all data
   * @returns {Promise<Object>} Migration statistics
   */
  async rotateKey() {
    const db = require('../config/database');
    const cryptoManager = require('./crypto-manager');

    if (this.rotationInProgress) {
      throw new Error('Key rotation already in progress');
    }

    this.rotationInProgress = true;
    const oldKey = this.key;
    const newKey = crypto.randomBytes(32).toString('hex');

    const stats = {
      sshKeys: { total: 0, success: 0, failed: 0 },
      settings: { total: 0, success: 0, failed: 0 },
      startTime: Date.now(),
      endTime: null,
      duration: null
    };

    try {
      logger.info('Starting key rotation...');

      // 1. Re-encrypt SSH Keys
      const sshKeys = await new Promise((resolve, reject) => {
        db.all('SELECT id, private_key_encrypted FROM ssh_keys', (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      stats.sshKeys.total = sshKeys.length;

      for (const sshKey of sshKeys) {
        try {
          const decrypted = cryptoManager.decrypt(sshKey.private_key_encrypted, oldKey);
          const reencrypted = cryptoManager.encrypt(decrypted, newKey);

          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE ssh_keys SET private_key_encrypted = ? WHERE id = ?',
              [reencrypted, sshKey.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          stats.sshKeys.success++;
        } catch (error) {
          stats.sshKeys.failed++;
          logger.error(`Failed to re-encrypt SSH key ${sshKey.id}:`, error);
        }
      }

      // 2. Re-encrypt Settings
      const settings = await new Promise((resolve, reject) => {
        db.all('SELECT key, value FROM settings WHERE encrypted = 1', (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      stats.settings.total = settings.length;

      for (const setting of settings) {
        try {
          const decrypted = cryptoManager.decrypt(setting.value, oldKey);
          const reencrypted = cryptoManager.encrypt(decrypted, newKey);

          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE settings SET value = ? WHERE key = ?',
              [reencrypted, setting.key],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          stats.settings.success++;
        } catch (error) {
          stats.settings.failed++;
          logger.error(`Failed to re-encrypt setting ${setting.key}:`, error);
        }
      }

      // 3. Verify success
      const totalFailed = stats.sshKeys.failed + stats.settings.failed;
      if (totalFailed > 0) {
        throw new Error(`Key rotation partially failed: ${totalFailed} items failed`);
      }

      // 4. Backup old key
      const backupPath = `${this.keyPath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, oldKey, { mode: 0o600 });
      logger.info(`Old key backed up to ${backupPath}`);

      // 5. Save new key
      await this.saveKey(newKey);
      this.key = newKey;

      // 6. Record rotation in history
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO settings (key, value, encrypted) VALUES (?, ?, ?)`,
          [
            `key_rotation_${Date.now()}`,
            JSON.stringify({
              timestamp: Date.now(),
              itemsReencrypted: stats.sshKeys.success + stats.settings.success,
              oldKeyHash: cryptoManager.hash(oldKey).substring(0, 16),
              newKeyHash: cryptoManager.hash(newKey).substring(0, 16)
            }),
            0
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      stats.endTime = Date.now();
      stats.duration = stats.endTime - stats.startTime;

      logger.info('Key rotation completed successfully', stats);
      return stats;

    } catch (error) {
      logger.error('Key rotation failed:', error);
      // Revert to old key
      this.key = oldKey;
      throw error;
    } finally {
      this.rotationInProgress = false;
    }
  }

  /**
   * Check if data directory is writable
   * @returns {Promise<boolean>}
   */
  async checkPermissions() {
    try {
      const testFile = path.join(path.dirname(this.keyPath), '.permission_test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      throw new Error(`/data directory is not writable: ${error.message}`);
    }
  }
}

module.exports = new EncryptionKeyManager();
