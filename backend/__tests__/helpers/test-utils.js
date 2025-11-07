const db = require('../../config/database');

/**
 * Create a test commit in database
 */
async function createTestCommit(overrides = {}) {
  const defaults = {
    commit_hash: 'abc123' + Math.random().toString(36).substring(7),
    commit_message: 'Test commit',
    commit_date: new Date().toISOString(),
    is_auto: 1,
    is_scheduled: 0,
    push_status: 'pending'
  };

  const data = { ...defaults, ...overrides };

  await db.run(
    `INSERT INTO backup_history
     (commit_hash, commit_message, commit_date, is_auto, is_scheduled, push_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.commit_hash, data.commit_message, data.commit_date,
     data.is_auto, data.is_scheduled, data.push_status]
  );

  return data;
}

/**
 * Create test setting
 */
async function createTestSetting(key, value, encrypted = false) {
  await db.run(
    'INSERT INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
    [key, value, encrypted ? 1 : 0]
  );
}

/**
 * Get all settings
 */
async function getAllSettings() {
  return await db.all('SELECT * FROM settings');
}

/**
 * Get all commits
 */
async function getAllCommits() {
  return await db.all('SELECT * FROM backup_history');
}

module.exports = {
  createTestCommit,
  createTestSetting,
  getAllSettings,
  getAllCommits
};
