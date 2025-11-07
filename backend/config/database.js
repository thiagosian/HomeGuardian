const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const DB_PATH = path.join(process.env.DATA_PATH || '/data', 'homeguardian.db');

let db = null;

const database = {
  async initialize() {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          logger.error('Failed to open database:', err);
          reject(err);
          return;
        }

        logger.info(`Database opened at ${DB_PATH}`);

        // Create tables
        db.serialize(() => {
          // Settings table
          db.run(`
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              encrypted BOOLEAN DEFAULT 0,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              logger.error('Failed to create settings table:', err);
              reject(err);
              return;
            }
          });

          // Backup history table (for quick access without parsing git log)
          db.run(`
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
          `, (err) => {
            if (err) {
              logger.error('Failed to create backup_history table:', err);
              reject(err);
              return;
            }
          });

          // SSH keys table
          db.run(`
            CREATE TABLE IF NOT EXISTS ssh_keys (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              public_key TEXT NOT NULL,
              private_key_encrypted TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              logger.error('Failed to create ssh_keys table:', err);
              reject(err);
              return;
            }
          });

          // Notifications table
          db.run(`
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
          `, (err) => {
            if (err) {
              logger.error('Failed to create notifications table:', err);
              reject(err);
              return;
            }
          });

          // Create indexes for notifications
          db.run('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)');
          db.run('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)');
          db.run('CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity)', (err) => {
            if (err) {
              logger.error('Failed to create notification indexes:', err);
              reject(err);
              return;
            }

            logger.info('Database tables initialized successfully');
            resolve();
          });
        });
      });
    });
  },

  getDb() {
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return db;
  },

  async get(query, params = []) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  async all(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  async run(query, params = []) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  async close() {
    if (db) {
      return new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
};

module.exports = database;
