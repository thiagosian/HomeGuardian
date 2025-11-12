const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const logger = require('../utils/logger');
const MigrationRunner = require('../migrations/migration-runner');

const DB_PATH = path.join(process.env.DATA_PATH || '/data', 'homeguardian.db');

let db = null;

/**
 * Helper to promisify db.run
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Result with lastID and changes
 */
function runAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Helper to promisify db.get
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|undefined>} Single row or undefined
 */
function getAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Helper to promisify db.all
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of rows
 */
function allAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

const database = {
  /**
   * Initialize database connection and schema
   * Fully migrated to async/await - no callback hell!
   */
  async initialize() {
    // Open database connection
    db = await new Promise((resolve, reject) => {
      const dbInstance = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          logger.error('Failed to open database:', err);
          reject(err);
        } else {
          logger.info(`Database opened at ${DB_PATH}`);
          resolve(dbInstance);
        }
      });
    });

    // Configure PRAGMAs for optimal performance
    await this.configurePragmas();

    // Create schema
    await this.createSchema();

    // Create indexes
    await this.createIndexes();

    // Run migrations
    await this.runMigrations();

    logger.info('Database initialization completed successfully');
  },

  /**
   * Configure SQLite PRAGMAs
   * @private
   */
  async configurePragmas() {
    // Enable WAL mode for better concurrency and performance on RPi
    await runAsync('PRAGMA journal_mode=WAL');
    await runAsync('PRAGMA synchronous=NORMAL');
    await runAsync('PRAGMA busy_timeout=5000');
    logger.debug('Database PRAGMAs configured');
  },

  /**
   * Create database schema (tables)
   * @private
   */
  async createSchema() {
    const tables = [
      {
        name: 'settings',
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            encrypted BOOLEAN DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'backup_history',
        sql: `
          CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            commit_hash TEXT NOT NULL,
            commit_message TEXT,
            commit_date DATETIME NOT NULL,
            files_changed TEXT,
            is_auto BOOLEAN DEFAULT 1,
            is_scheduled BOOLEAN DEFAULT 0,
            push_status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'ssh_keys',
        sql: `
          CREATE TABLE IF NOT EXISTS ssh_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            public_key TEXT NOT NULL,
            private_key_encrypted TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'notifications',
        sql: `
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            severity TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            details TEXT,
            read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
          )
        `
      }
    ];

    for (const table of tables) {
      try {
        await runAsync(table.sql);
        logger.debug(`Table '${table.name}' created/verified`);
      } catch (error) {
        logger.error(`Failed to create table '${table.name}':`, error);
        throw error;
      }
    }

    logger.info('Database schema created successfully');
  },

  /**
   * Create database indexes
   * @private
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity)',
      'CREATE INDEX IF NOT EXISTS idx_backup_history_push_status ON backup_history(push_status)',
      'CREATE INDEX IF NOT EXISTS idx_backup_history_is_auto ON backup_history(is_auto)',
      'CREATE INDEX IF NOT EXISTS idx_backup_history_commit_date ON backup_history(commit_date DESC)'
    ];

    for (const indexSql of indexes) {
      try {
        await runAsync(indexSql);
      } catch (error) {
        logger.error('Failed to create index:', error);
        throw error;
      }
    }

    logger.info('Database indexes created successfully');
  },

  /**
   * Run pending database migrations
   */
  async runMigrations() {
    const migrationRunner = new MigrationRunner(this);
    await migrationRunner.runPending();
  },

  /**
   * Get raw database instance
   * @returns {sqlite3.Database} Database instance
   */
  getDb() {
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return db;
  },

  /**
   * Execute SELECT query returning single row
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|undefined>} Single row or undefined
   */
  async get(query, params = []) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return getAsync(query, params);
  },

  /**
   * Execute SELECT query returning all rows
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Array of rows
   */
  async all(query, params = []) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return allAsync(query, params);
  },

  /**
   * Execute INSERT, UPDATE, or DELETE query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Result with lastID and changes
   */
  async run(query, params = []) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return runAsync(query, params);
  },

  /**
   * Archive old backups beyond retention period
   * @param {number} retentionDays - Number of days to retain
   * @returns {Promise<Object>} Result with changes count
   */
  async archiveOldBackups(retentionDays = 365) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const result = await this.run(
        'DELETE FROM backup_history WHERE commit_date < ?',
        [cutoffDate.toISOString()]
      );

      if (result.changes > 0) {
        logger.info(`Archived ${result.changes} old backups older than ${retentionDays} days`);

        // Compact database after deletion
        await this.run('VACUUM');
        logger.info('Database vacuum completed');
      }

      return result;
    } catch (error) {
      logger.error('Failed to archive old backups:', error);
      throw error;
    }
  },

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (db) {
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      });
      db = null;
    }
  }
};

module.exports = database;
