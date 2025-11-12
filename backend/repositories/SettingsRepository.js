const logger = require('../utils/logger');

/**
 * Settings Repository
 * Implements Repository Pattern for settings data access
 * Provides abstraction layer between business logic and data persistence
 *
 * @example
 * const settingsRepo = new SettingsRepository(db);
 * await settingsRepo.upsert('remote_url', 'https://github.com/user/repo.git');
 * const setting = await settingsRepo.findByKey('remote_url');
 */
class SettingsRepository {
  constructor(db) {
    if (!db) {
      throw new Error('Database instance is required');
    }
    this.db = db;
  }

  /**
   * Find setting by key
   * @param {string} key - Setting key
   * @returns {Promise<Object|null>} Setting object or null if not found
   */
  async findByKey(key) {
    try {
      const result = await this.db.get(
        'SELECT key, value, encrypted, updated_at FROM settings WHERE key = ?',
        [key]
      );
      return result || null;
    } catch (error) {
      logger.error(`Failed to find setting by key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Find all settings
   * @returns {Promise<Array>} Array of setting objects
   */
  async findAll() {
    try {
      return await this.db.all(
        'SELECT key, value, encrypted, updated_at FROM settings ORDER BY key'
      );
    } catch (error) {
      logger.error('Failed to find all settings:', error);
      throw error;
    }
  }

  /**
   * Find all encrypted settings
   * @returns {Promise<Array>} Array of encrypted setting objects
   */
  async findEncrypted() {
    try {
      return await this.db.all(
        'SELECT key, value FROM settings WHERE encrypted = 1'
      );
    } catch (error) {
      logger.error('Failed to find encrypted settings:', error);
      throw error;
    }
  }

  /**
   * Insert or update a setting
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @param {boolean} encrypted - Whether value is encrypted (default: false)
   * @returns {Promise<Object>} Result with lastID and changes
   */
  async upsert(key, value, encrypted = false) {
    try {
      const result = await this.db.run(
        'INSERT OR REPLACE INTO settings (key, value, encrypted, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [key, value, encrypted ? 1 : 0]
      );
      logger.debug(`Setting upserted: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Failed to upsert setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update setting value
   * @param {string} key - Setting key
   * @param {string} value - New value
   * @returns {Promise<Object>} Result with changes count
   */
  async update(key, value) {
    try {
      const result = await this.db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [value, key]
      );

      if (result.changes === 0) {
        throw new Error(`Setting ${key} not found`);
      }

      logger.debug(`Setting updated: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Failed to update setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete setting by key
   * @param {string} key - Setting key
   * @returns {Promise<Object>} Result with changes count
   */
  async delete(key) {
    try {
      const result = await this.db.run(
        'DELETE FROM settings WHERE key = ?',
        [key]
      );
      logger.debug(`Setting deleted: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Failed to delete setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if setting exists
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} True if exists
   */
  async exists(key) {
    try {
      const result = await this.db.get(
        'SELECT 1 FROM settings WHERE key = ? LIMIT 1',
        [key]
      );
      return !!result;
    } catch (error) {
      logger.error(`Failed to check if setting ${key} exists:`, error);
      throw error;
    }
  }

  /**
   * Bulk upsert settings
   * @param {Array<Object>} settings - Array of {key, value, encrypted} objects
   * @returns {Promise<number>} Number of settings upserted
   */
  async bulkUpsert(settings) {
    try {
      let count = 0;
      for (const setting of settings) {
        await this.upsert(setting.key, setting.value, setting.encrypted);
        count++;
      }
      logger.info(`Bulk upserted ${count} settings`);
      return count;
    } catch (error) {
      logger.error('Failed to bulk upsert settings:', error);
      throw error;
    }
  }
}

module.exports = SettingsRepository;
