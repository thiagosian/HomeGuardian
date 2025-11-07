// Global test setup
const db = require('../config/database');
const logger = require('../utils/logger');

// Suppress logs during tests
logger.transports.forEach(transport => {
  transport.silent = true;
});

// Setup test database
beforeAll(async () => {
  process.env.DATA_PATH = '/tmp/homeguardian-test';
  process.env.CONFIG_PATH = '/tmp/homeguardian-test-config';
  await db.initialize();
});

afterAll(async () => {
  // Cleanup
  if (db.close) {
    await db.close();
  }
});

// Clear database between tests
afterEach(async () => {
  try {
    await db.run('DELETE FROM backup_history');
    await db.run('DELETE FROM settings');
  } catch (error) {
    // Ignore if tables don't exist yet
  }
});
