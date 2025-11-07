# Implementation Plan: Secure Encryption Key Management

## Metadata

| Field | Value |
|-------|-------|
| **Plan ID** | SEC-001 |
| **Status** | 🔴 CRITICAL |
| **Priority** | P0 (Immediate) |
| **Effort** | 2 hours |
| **Owner** | TBD |
| **Created** | 2025-11-07 |
| **Target Version** | v1.0.1 |

## Summary

Replace hardcoded default encryption key with secure key generation and validation to prevent critical security vulnerability where all user credentials could be decrypted using the known default key.

## Current State

**Problem:**
```javascript
// backend/routes/settings.js:11
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'homeguardian-default-key-change-me';
```

**Vulnerability:**
- Default key is in public source code
- Users may not set `ENCRYPTION_KEY` environment variable
- SSH keys and PAT tokens encrypted with known key
- Attacker with database access can decrypt all credentials

**Risk Level:** 🔴 CRITICAL (CVSS: 8.1 - High)

## Motivation

### Security Impact
- **Confidentiality:** Private SSH keys and tokens exposed
- **Integrity:** Attacker could modify credentials undetected
- **Compliance:** Violates security best practices

### Business Impact
- Users' GitHub/GitLab repositories at risk
- Loss of trust in product
- Potential data breach liability

## Technical Design

### Solution Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    First Startup                         │
├─────────────────────────────────────────────────────────┤
│ 1. Check if /data/.encryption_key exists               │
│ 2. If NO: Generate secure random key (32 bytes)        │
│ 3. Store in /data/.encryption_key (chmod 600)          │
│ 4. Load key into memory                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 Subsequent Startups                      │
├─────────────────────────────────────────────────────────┤
│ 1. Load key from /data/.encryption_key                  │
│ 2. Validate key format (64 hex chars)                   │
│ 3. Use for encryption/decryption                        │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Key Generation Module

**File:** `backend/utils/encryption-key-manager.js`

```javascript
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
   * @returns {Promise<string>} The new encryption key
   */
  async rotateKey() {
    const oldKey = this.key;
    const newKey = await this.generateKey();

    // TODO: Re-encrypt all encrypted data in database
    logger.warn('Key rotation: Re-encryption of existing data required');

    this.key = newKey;
    return { oldKey, newKey };
  }
}

module.exports = new EncryptionKeyManager();
```

#### 2. Update Server Initialization

**File:** `backend/server.js`

```javascript
const encryptionKeyManager = require('./utils/encryption-key-manager');

async function initializeServices() {
  try {
    // Initialize encryption key FIRST
    logger.info('Initializing encryption key...');
    await encryptionKeyManager.initialize();

    logger.info('Initializing database...');
    await db.initialize();

    // ... rest of initialization
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}
```

#### 3. Update Settings Route

**File:** `backend/routes/settings.js`

```javascript
const encryptionKeyManager = require('../utils/encryption-key-manager');

// Remove old hardcoded key
// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'homeguardian-default-key-change-me';

function encrypt(value) {
  const key = encryptionKeyManager.getKey();
  return crypto.AES.encrypt(value, key).toString();
}

function decrypt(encryptedValue) {
  const key = encryptionKeyManager.getKey();
  return crypto.AES.decrypt(encryptedValue, key).toString(crypto.enc.Utf8);
}

router.get('/', async (req, res) => {
  try {
    const settings = await db.all('SELECT key, value, encrypted FROM settings');

    const settingsObj = {};

    settings.forEach(setting => {
      let value = setting.value;

      if (setting.encrypted) {
        try {
          value = decrypt(value);
        } catch (error) {
          logger.error(`Failed to decrypt setting ${setting.key}:`, error);
          value = null;
        }
      }

      settingsObj[setting.key] = value;
    });

    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    logger.error('Failed to get settings:', error);
    res.status(500).json({
      error: 'Failed to get settings',
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, value, encrypted } = req.body;

    if (!key) {
      return res.status(400).json({
        error: 'Missing required parameter: key'
      });
    }

    let finalValue = value;

    if (encrypted) {
      finalValue = encrypt(value);
    }

    await db.run(
      'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
      [key, finalValue, encrypted ? 1 : 0]
    );

    logger.info(`Setting updated: ${key}`);

    res.json({
      success: true,
      message: 'Setting updated',
      key
    });
  } catch (error) {
    logger.error('Failed to update setting:', error);
    res.status(500).json({
      error: 'Failed to update setting',
      message: error.message
    });
  }
});

// Update SSH key generation
router.post('/ssh/generate', async (req, res) => {
  try {
    const dataPath = process.env.DATA_PATH || '/data';
    const sshDir = path.join(dataPath, 'ssh');

    await fs.mkdir(sshDir, { recursive: true });

    const privateKeyPath = path.join(sshDir, 'id_rsa');
    const publicKeyPath = path.join(sshDir, 'id_rsa.pub');

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await execAsync(
      `ssh-keygen -t rsa -b 4096 -f ${privateKeyPath} -N "" -C "homeguardian@homeassistant"`
    );

    const publicKey = await fs.readFile(publicKeyPath, 'utf8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');

    // Use new encryption function
    const encryptedPrivateKey = encrypt(privateKey);

    await db.run(
      'INSERT INTO ssh_keys (public_key, private_key_encrypted) VALUES (?, ?)',
      [publicKey, encryptedPrivateKey]
    );

    logger.info('SSH key pair generated');

    res.json({
      success: true,
      publicKey,
      message: 'SSH key generated successfully'
    });
  } catch (error) {
    logger.error('Failed to generate SSH key:', error);
    res.status(500).json({
      error: 'Failed to generate SSH key',
      message: error.message
    });
  }
});

// Update remote configuration
router.post('/remote', async (req, res) => {
  try {
    const gitService = req.app.locals.gitService;
    const { remoteUrl, authType, token } = req.body;

    if (!remoteUrl) {
      return res.status(400).json({
        error: 'Missing required parameter: remoteUrl'
      });
    }

    await db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['remote_url', remoteUrl]
    );

    await db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['auth_type', authType || 'ssh']
    );

    if (token) {
      const encryptedToken = encrypt(token);
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
        ['remote_token', encryptedToken, 1]
      );
    }

    await gitService.configureRemote(remoteUrl);

    logger.info('Remote repository configured');

    res.json({
      success: true,
      message: 'Remote repository configured',
      remoteUrl
    });
  } catch (error) {
    logger.error('Failed to configure remote:', error);
    res.status(500).json({
      error: 'Failed to configure remote',
      message: error.message
    });
  }
});
```

#### 4. Migration Script for Existing Installations

**File:** `backend/scripts/migrate-encryption-key.js`

```javascript
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
```

## Implementation Plan

### Phase 1: Core Implementation (1 hour)

- [ ] **Task 1.1:** Create `backend/utils/encryption-key-manager.js`
  - Generate secure random keys
  - Store in `/data/.encryption_key` with 600 permissions
  - Load and validate keys
  - **Assignee:** TBD
  - **Time:** 30 minutes

- [ ] **Task 1.2:** Update `backend/server.js`
  - Initialize encryption key manager before database
  - Add error handling for key failures
  - **Assignee:** TBD
  - **Time:** 10 minutes

- [ ] **Task 1.3:** Update `backend/routes/settings.js`
  - Replace hardcoded key with key manager
  - Update all encrypt/decrypt calls
  - **Assignee:** TBD
  - **Time:** 20 minutes

### Phase 2: Migration & Testing (1 hour)

- [ ] **Task 2.1:** Create migration script
  - Decrypt with old key, re-encrypt with new
  - Handle existing installations
  - **Assignee:** TBD
  - **Time:** 30 minutes

- [ ] **Task 2.2:** Add unit tests
  - Test key generation
  - Test validation
  - Test encryption/decryption
  - **Assignee:** TBD
  - **Time:** 20 minutes

- [ ] **Task 2.3:** Integration testing
  - Fresh install test
  - Migration test
  - Key persistence test
  - **Assignee:** TBD
  - **Time:** 10 minutes

### Phase 3: Documentation (15 minutes)

- [ ] **Task 3.1:** Update README.md
  - Document automatic key generation
  - Add security notes
  - **Assignee:** TBD
  - **Time:** 5 minutes

- [ ] **Task 3.2:** Create SECURITY.md
  - Document encryption approach
  - Add security best practices
  - **Assignee:** TBD
  - **Time:** 10 minutes

## Testing Strategy

### Unit Tests

**File:** `backend/__tests__/encryption-key-manager.test.js`

```javascript
const EncryptionKeyManager = require('../utils/encryption-key-manager');
const fs = require('fs').promises;
const path = require('path');

describe('EncryptionKeyManager', () => {
  const testKeyPath = path.join(__dirname, '.test_encryption_key');
  let manager;

  beforeEach(() => {
    manager = new EncryptionKeyManager();
    manager.keyPath = testKeyPath;
  });

  afterEach(async () => {
    try {
      await fs.unlink(testKeyPath);
    } catch {}
  });

  describe('generateKey', () => {
    test('should generate 64-character hex key', async () => {
      const key = await manager.generateKey();

      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/i);
    });

    test('should generate unique keys', async () => {
      const key1 = await manager.generateKey();
      await fs.unlink(testKeyPath);
      const key2 = await manager.generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('validateKey', () => {
    test('should accept valid keys', () => {
      const validKey = 'a'.repeat(64);
      expect(() => manager.validateKey(validKey)).not.toThrow();
    });

    test('should reject short keys', () => {
      const shortKey = 'a'.repeat(32);
      expect(() => manager.validateKey(shortKey)).toThrow('must be 64 characters');
    });

    test('should reject non-hex keys', () => {
      const invalidKey = 'z'.repeat(64);
      expect(() => manager.validateKey(invalidKey)).toThrow('must be hexadecimal');
    });

    test('should reject weak keys', () => {
      const weakKey = '0'.repeat(64);
      expect(() => manager.validateKey(weakKey)).toThrow('weak or default');
    });
  });

  describe('initialize', () => {
    test('should generate key on first run', async () => {
      await manager.initialize();

      const exists = await manager.keyExists();
      expect(exists).toBe(true);
      expect(manager.key).toHaveLength(64);
    });

    test('should load existing key on subsequent runs', async () => {
      const firstKey = await manager.initialize();

      const newManager = new EncryptionKeyManager();
      newManager.keyPath = testKeyPath;
      const secondKey = await newManager.initialize();

      expect(secondKey).toBe(firstKey);
    });
  });

  describe('saveKey and loadKey', () => {
    test('should save and load key correctly', async () => {
      const testKey = 'a'.repeat(64);
      await manager.saveKey(testKey);

      const loadedKey = await manager.loadKey();
      expect(loadedKey).toBe(testKey);
    });

    test('should set correct file permissions', async () => {
      await manager.generateKey();

      const stats = await fs.stat(testKeyPath);
      const mode = stats.mode & parseInt('777', 8);

      expect(mode).toBe(parseInt('600', 8));
    });
  });
});
```

### Integration Tests

**File:** `backend/__tests__/integration/encryption.test.js`

```javascript
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');

describe('Encryption Integration Tests', () => {
  beforeAll(async () => {
    await db.initialize();
  });

  describe('SSH Key Generation', () => {
    test('should encrypt SSH keys with secure key', async () => {
      const response = await request(app)
        .post('/api/settings/ssh/generate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.publicKey).toBeTruthy();

      // Verify key is encrypted in database
      const result = await db.get(
        'SELECT private_key_encrypted FROM ssh_keys ORDER BY id DESC LIMIT 1'
      );

      expect(result.private_key_encrypted).toBeTruthy();
      expect(result.private_key_encrypted).not.toContain('-----BEGIN');
    });
  });

  describe('Settings Encryption', () => {
    test('should encrypt sensitive settings', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({
          key: 'test_token',
          value: 'secret_value_123',
          encrypted: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify encryption in database
      const result = await db.get(
        'SELECT value FROM settings WHERE key = ?',
        ['test_token']
      );

      expect(result.value).not.toBe('secret_value_123');
    });

    test('should decrypt settings on retrieval', async () => {
      // First, create encrypted setting
      await request(app)
        .post('/api/settings')
        .send({
          key: 'test_decrypt',
          value: 'decrypted_value',
          encrypted: true
        });

      // Retrieve and verify decryption
      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body.settings.test_decrypt).toBe('decrypted_value');
    });
  });
});
```

### Manual Testing Checklist

- [ ] Fresh install generates new key automatically
- [ ] Key file has 600 permissions
- [ ] Server fails to start if key validation fails
- [ ] SSH keys are encrypted and can be decrypted
- [ ] Settings with encrypted flag are encrypted/decrypted correctly
- [ ] Migration script works on existing installations
- [ ] Key persists across server restarts

## Rollout Plan

### Pre-Release

1. **Code Review**
   - Security review by maintainer
   - Peer review of encryption logic
   - Review migration script thoroughly

2. **Testing**
   - Run all unit tests
   - Run integration tests
   - Test on dev environment
   - Test migration on copy of production database

### Release Process

1. **Version v1.0.1-beta**
   - Release beta version to limited users
   - Monitor for issues
   - Collect feedback

2. **Documentation**
   - Update CHANGELOG.md
   - Create migration guide
   - Update security documentation

3. **Version v1.0.1 Release**
   - Merge to main branch
   - Tag release
   - Update Docker images
   - Publish release notes

### Migration Process for Users

**Automatic Migration (Recommended):**
```bash
# On first startup with v1.0.1, automatic migration runs
# Logs will show: "Encryption key migration completed successfully"
```

**Manual Migration (If Needed):**
```bash
# If using custom OLD_ENCRYPTION_KEY
docker exec -it homeguardian sh
cd /app/backend
OLD_ENCRYPTION_KEY="your_old_key" node scripts/migrate-encryption-key.js
```

### Rollback Plan

If critical issues are discovered:

1. **Stop the add-on**
2. **Revert to v1.0.0**
3. **Old encryption key still works** (backward compatible)
4. **Fix issues and re-release**

## Success Metrics

### Security Metrics
- ✅ 0 installations using default encryption key
- ✅ 100% of new installations generate unique keys
- ✅ All encrypted data uses strong encryption

### Quality Metrics
- ✅ 100% test coverage for encryption module
- ✅ 0 critical security issues in code review
- ✅ Migration success rate > 99%

### User Metrics
- ✅ 0 support tickets related to encryption failures
- ✅ Smooth migration for existing users
- ✅ No performance degradation

## Risks & Mitigations

### Risk 1: Key File Lost or Corrupted

**Impact:** HIGH - All encrypted data becomes inaccessible

**Mitigation:**
- Document backup procedures
- Add key export feature for admin
- Consider key backup to Home Assistant secrets
- Add key recovery mechanism

**Recovery Plan:**
```javascript
// Add to encryption-key-manager.js
async exportKeyForBackup() {
  // Only available via API with admin auth
  return {
    key: this.key,
    createdAt: await this.getKeyCreationDate(),
    warning: 'Store this securely! Anyone with this key can decrypt your data.'
  };
}
```

### Risk 2: Migration Fails for Existing Users

**Impact:** MEDIUM - User cannot access encrypted data

**Mitigation:**
- Thorough testing of migration script
- Backup database before migration
- Provide manual migration option
- Keep old key as fallback during transition period

**Fallback Plan:**
```javascript
// In settings.js, try new key first, fall back to old if needed
function decrypt(encryptedValue) {
  try {
    const key = encryptionKeyManager.getKey();
    return crypto.AES.decrypt(encryptedValue, key).toString(crypto.enc.Utf8);
  } catch (error) {
    // Try old key as fallback
    logger.warn('Decryption with new key failed, trying old key');
    return crypto.AES.decrypt(encryptedValue, OLD_KEY).toString(crypto.enc.Utf8);
  }
}
```

### Risk 3: Performance Impact

**Impact:** LOW - Encryption operations may slow down

**Mitigation:**
- Benchmark encryption/decryption performance
- Cache decrypted values where appropriate
- Use efficient crypto library

**Benchmark Target:**
- Encryption: < 1ms per operation
- Decryption: < 1ms per operation

### Risk 4: Docker Volume Permissions

**Impact:** MEDIUM - Key file may not be readable/writable

**Mitigation:**
- Ensure /data volume has correct permissions
- Add startup check for write permissions
- Document permission requirements

```javascript
// In encryption-key-manager.js
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
```

## Alternatives Considered

### Alternative 1: Use Environment Variable Only

**Pros:**
- Simple implementation
- Follows 12-factor app principles

**Cons:**
- Users must manually generate key
- Higher chance of weak/default keys
- Difficult to rotate keys

**Decision:** Rejected - Too error-prone for average users

### Alternative 2: Use Home Assistant Secrets

**Pros:**
- Integrates with HA ecosystem
- Centralized secret management

**Cons:**
- Dependency on HA API
- Circular dependency (need key to access secrets)
- Complexity

**Decision:** Rejected - Too complex, circular dependency

### Alternative 3: Hardware Security Module (HSM)

**Pros:**
- Military-grade security
- Key never leaves hardware

**Cons:**
- Not available on most HA installations
- Expensive
- Overkill for use case

**Decision:** Rejected - Not practical for target audience

### Selected Solution: Auto-Generated Key in /data

**Pros:**
- ✅ Zero configuration for users
- ✅ Secure by default
- ✅ Persists across restarts
- ✅ Easy to backup
- ✅ No external dependencies

**Cons:**
- ⚠️ Key stored on disk (but with 600 permissions)
- ⚠️ Requires migration for existing users

**Decision:** Accepted - Best balance of security and usability

## References

### Security Standards
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

### Implementation References
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)

### Related Issues
- GitHub Issue: #XXX (Security: Replace default encryption key)
- CVE Database: TBD (if vulnerability is disclosed)

## Appendix

### A. Key Generation Algorithm

```
Input: None
Output: 64-character hexadecimal string

1. Generate 32 random bytes using crypto.randomBytes()
2. Convert bytes to hexadecimal string
3. Validate:
   - Length = 64 characters
   - Format = [0-9a-f]{64}
   - Not in forbidden keys list
4. Return key
```

### B. File Permissions

```bash
/data/.encryption_key
- Owner: addon user
- Permissions: 600 (rw-------)
- Format: Plain text, 64 hex characters
```

### C. Database Schema

No changes required to existing schema. Encryption/decryption happens at application layer.

### D. API Changes

No breaking API changes. Implementation is transparent to API consumers.

---

**Review Status:** ⏳ Pending Review
**Approved By:** TBD
**Approval Date:** TBD
**Implementation Date:** TBD
