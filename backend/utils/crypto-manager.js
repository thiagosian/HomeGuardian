const crypto = require('crypto');
const logger = require('./logger');

/**
 * Modern cryptography manager using Node.js native crypto module
 * Implements AES-256-GCM for authenticated encryption
 */
class CryptoManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
    this.tagLength = 16; // 128 bits
  }

  /**
   * Encrypts data using AES-256-GCM
   * @param {string} plaintext - Text to encrypt
   * @param {string} key - Hex-encoded 256-bit key
   * @returns {string} Base64-encoded encrypted data (IV + authTag + ciphertext)
   */
  encrypt(plaintext, key) {
    if (!plaintext) {
      throw new Error('Plaintext is required');
    }
    if (!key || key.length !== 64) {
      throw new Error('Invalid key length. Expected 64 hex characters (256 bits)');
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const keyBuffer = Buffer.from(key, 'hex');
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const authTag = cipher.getAuthTag();

      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts data encrypted with encrypt()
   * @param {string} encryptedData - Base64-encoded encrypted data
   * @param {string} key - Hex-encoded 256-bit key
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData, key) {
    if (!encryptedData) {
      throw new Error('Encrypted data is required');
    }
    if (!key || key.length !== 64) {
      throw new Error('Invalid key length. Expected 64 hex characters (256 bits)');
    }

    try {
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);

      const keyBuffer = Buffer.from(key, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generates a cryptographically secure random key
   * @returns {string} Hex-encoded 256-bit key
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Derives a key from a password using PBKDF2
   * @param {string} password - Password to derive key from
   * @param {string} salt - Hex-encoded salt (or generates new one)
   * @returns {Object} { key: string, salt: string }
   */
  deriveKey(password, salt = null) {
    const saltBuffer = salt
      ? Buffer.from(salt, 'hex')
      : crypto.randomBytes(16);

    const key = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000, // iterations
      this.keyLength,
      'sha256'
    );

    return {
      key: key.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Creates a SHA-256 hash of data
   * @param {string} data - Data to hash
   * @returns {string} Hex-encoded hash
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verifies if plaintext matches a hash
   * @param {string} plaintext - Original text
   * @param {string} hash - Hash to compare against
   * @returns {boolean} True if matches
   */
  verifyHash(plaintext, hash) {
    const computedHash = this.hash(plaintext);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  /**
   * Generates a cryptographically secure random token
   * @param {number} length - Length in bytes (default 32)
   * @returns {string} Hex-encoded token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new CryptoManager();
