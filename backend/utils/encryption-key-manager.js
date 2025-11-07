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
   * Rotate encryption key (for future use)
   * @returns {Promise<Object>} The old and new encryption keys
   */
  async rotateKey() {
    const oldKey = this.key;
    const newKey = await this.generateKey();

    // TODO: Re-encrypt all encrypted data in database
    logger.warn('Key rotation: Re-encryption of existing data required');

    this.key = newKey;
    return { oldKey, newKey };
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
