const db = require('../config/database');
const logger = require('../utils/logger');
const newCrypto = require('../utils/crypto-manager');
const encryptionKeyManager = require('../utils/encryption-key-manager');

// Temporarily require old crypto-js for migration
let oldCrypto;
try {
  oldCrypto = require('crypto-js');
} catch (error) {
  console.error('crypto-js not found. If already migrated, this script is not needed.');
  process.exit(0);
}

/**
 * Migrates encrypted data from crypto-js to native crypto
 */
async function migrateCrypto() {
  logger.info('Starting cryptography migration from crypto-js to native crypto...');

  const key = encryptionKeyManager.getKey();
  const stats = {
    sshKeys: { total: 0, success: 0, failed: 0, errors: [] },
    settings: { total: 0, success: 0, failed: 0, errors: [] },
    startTime: Date.now(),
    endTime: null,
    duration: null
  };

  try {
    // Migrate SSH Keys
    logger.info('Migrating SSH keys...');
    const sshKeys = await new Promise((resolve, reject) => {
      db.all('SELECT id, private_key_encrypted FROM ssh_keys', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    stats.sshKeys.total = sshKeys.length;
    logger.info(`Found ${sshKeys.length} SSH keys to migrate`);

    for (const sshKey of sshKeys) {
      try {
        // Decrypt with old crypto-js
        const decrypted = oldCrypto.AES.decrypt(
          sshKey.private_key_encrypted,
          key
        ).toString(oldCrypto.enc.Utf8);

        if (!decrypted) {
          throw new Error('Decryption returned empty string');
        }

        // Encrypt with new native crypto
        const reencrypted = newCrypto.encrypt(decrypted, key);

        // Update database
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
        logger.info(`Migrated SSH key ${sshKey.id}`);
      } catch (error) {
        stats.sshKeys.failed++;
        stats.sshKeys.errors.push({ id: sshKey.id, error: error.message });
        logger.error(`Failed to migrate SSH key ${sshKey.id}:`, error);
      }
    }

    // Migrate Settings with encrypted values
    logger.info('Migrating encrypted settings...');
    const settings = await new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM settings WHERE encrypted = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    stats.settings.total = settings.length;
    logger.info(`Found ${settings.length} encrypted settings to migrate`);

    for (const setting of settings) {
      try {
        // Decrypt with old crypto-js
        const decrypted = oldCrypto.AES.decrypt(
          setting.value,
          key
        ).toString(oldCrypto.enc.Utf8);

        if (!decrypted) {
          throw new Error('Decryption returned empty string');
        }

        // Encrypt with new native crypto
        const reencrypted = newCrypto.encrypt(decrypted, key);

        // Update database
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
        logger.info(`Migrated setting ${setting.key}`);
      } catch (error) {
        stats.settings.failed++;
        stats.settings.errors.push({ key: setting.key, error: error.message });
        logger.error(`Failed to migrate setting ${setting.key}:`, error);
      }
    }

    // Verify migration success
    const totalFailed = stats.sshKeys.failed + stats.settings.failed;
    if (totalFailed > 0) {
      throw new Error(
        `Migration partially failed: ${totalFailed} items failed to re-encrypt. ` +
        `Check logs for details.`
      );
    }

    // Set migration flag
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
        ['crypto_migration_completed', new Date().toISOString(), 0],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    logger.info('Migration completed successfully!', {
      sshKeys: `${stats.sshKeys.success}/${stats.sshKeys.total}`,
      settings: `${stats.settings.success}/${stats.settings.total}`,
      duration: `${stats.duration}ms`
    });

    return stats;

  } catch (error) {
    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    logger.error('Migration failed:', error);
    logger.error('Migration statistics:', stats);

    throw error;
  }
}

// Execute if called directly
if (require.main === module) {
  migrateCrypto()
    .then((stats) => {
      console.log('\n✅ Migration completed successfully!');
      console.log(`SSH Keys: ${stats.sshKeys.success}/${stats.sshKeys.total} migrated`);
      console.log(`Settings: ${stats.settings.success}/${stats.settings.total} migrated`);
      console.log(`Duration: ${stats.duration}ms`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = migrateCrypto;
