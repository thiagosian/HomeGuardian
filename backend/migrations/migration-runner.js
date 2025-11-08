const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Simple database migration runner
 * Migrations are applied in order based on filename (timestamp-based)
 */
class MigrationRunner {
  constructor(db) {
    this.db = db;
    this.migrationsDir = path.join(__dirname);
  }

  /**
   * Initialize migrations table
   */
  async initialize() {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Migrations table initialized');
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations() {
    const rows = await this.db.all('SELECT name FROM migrations ORDER BY name');
    return rows.map(row => row.name);
  }

  /**
   * Get list of pending migrations
   */
  async getPendingMigrations() {
    const allFiles = await fs.readdir(this.migrationsDir);
    const migrationFiles = allFiles
      .filter(file => file.match(/^\d{4}-\d{2}-\d{2}_\d{6}_.*\.js$/))
      .sort();

    const applied = await this.getAppliedMigrations();
    const pending = migrationFiles.filter(file => !applied.includes(file));

    return pending;
  }

  /**
   * Run a single migration
   */
  async runMigration(filename) {
    const migrationPath = path.join(this.migrationsDir, filename);
    const migration = require(migrationPath);

    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${filename} does not export an 'up' function`);
    }

    logger.info(`Running migration: ${filename}`);

    try {
      await migration.up(this.db);
      await this.db.run('INSERT INTO migrations (name) VALUES (?)', [filename]);
      logger.info(`✓ Migration ${filename} applied successfully`);
    } catch (error) {
      logger.error(`✗ Migration ${filename} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runPending() {
    await this.initialize();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return 0;
    }

    logger.info(`Found ${pending.length} pending migration(s)`);

    for (const filename of pending) {
      await this.runMigration(filename);
    }

    logger.info(`✓ Applied ${pending.length} migration(s)`);
    return pending.length;
  }

  /**
   * Rollback the last migration
   * WARNING: Use with caution
   */
  async rollbackLast() {
    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      logger.warn('No migrations to rollback');
      return false;
    }

    const lastMigration = applied[applied.length - 1];
    const migrationPath = path.join(this.migrationsDir, lastMigration);
    const migration = require(migrationPath);

    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${lastMigration} does not export a 'down' function`);
    }

    logger.info(`Rolling back migration: ${lastMigration}`);

    try {
      await migration.down(this.db);
      await this.db.run('DELETE FROM migrations WHERE name = ?', [lastMigration]);
      logger.info(`✓ Migration ${lastMigration} rolled back successfully`);
      return true;
    } catch (error) {
      logger.error(`✗ Rollback of ${lastMigration} failed:`, error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;
