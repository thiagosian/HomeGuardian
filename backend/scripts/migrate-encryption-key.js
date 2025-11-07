const encryptionKeyManager = require('../utils/encryption-key-manager');
const db = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto-js');

const OLD_KEY = process.env.OLD_ENCRYPTION_KEY || 'homeguardian-default-key-change-me';

async function migrateEncryptionKey() {
  try {
    logger.info('Starting encryption key migration...');

    // Initialize new key
    await encryptionKeyManager.initialize();
    const newKey = encryptionKeyManager.getKey();

    // Get all encrypted settings
    const encryptedSettings = await db.all(
      'SELECT key, value FROM settings WHERE encrypted = 1'
    );

    logger.info(`Found ${encryptedSettings.length} encrypted settings to migrate`);

    for (const setting of encryptedSettings) {
      try {
        // Decrypt with old key
        const decrypted = crypto.AES.decrypt(setting.value, OLD_KEY).toString(crypto.enc.Utf8);

        // Re-encrypt with new key
        const reencrypted = crypto.AES.encrypt(decrypted, newKey).toString();

        // Update database
        await db.run(
          'UPDATE settings SET value = ? WHERE key = ?',
          [reencrypted, setting.key]
        );

        logger.info(`Migrated setting: ${setting.key}`);
      } catch (error) {
        logger.error(`Failed to migrate setting ${setting.key}:`, error);
      }
    }

    // Migrate SSH keys
    const sshKeys = await db.all('SELECT id, private_key_encrypted FROM ssh_keys');

    logger.info(`Found ${sshKeys.length} SSH keys to migrate`);

    for (const key of sshKeys) {
      try {
        const decrypted = crypto.AES.decrypt(key.private_key_encrypted, OLD_KEY).toString(crypto.enc.Utf8);
        const reencrypted = crypto.AES.encrypt(decrypted, newKey).toString();

        await db.run(
          'UPDATE ssh_keys SET private_key_encrypted = ? WHERE id = ?',
          [reencrypted, key.id]
        );

        logger.info(`Migrated SSH key ID: ${key.id}`);
      } catch (error) {
        logger.error(`Failed to migrate SSH key ${key.id}:`, error);
      }
    }

    logger.info('Encryption key migration completed successfully');
  } catch (error) {
    logger.error('Encryption key migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  db.initialize()
    .then(() => migrateEncryptionKey())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateEncryptionKey };
