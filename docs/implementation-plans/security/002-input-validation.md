# Implementation Plan: Input Validation with Zod

## Metadata

| Field | Value |
|-------|-------|
| **Plan ID** | SEC-002 |
| **Status** | 🔴 HIGH PRIORITY |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Owner** | TBD |
| **Created** | 2025-11-07 |
| **Target Version** | v1.0.1 |
| **Dependencies** | None |

## Summary

Implement comprehensive input validation across all API endpoints using Zod to prevent injection attacks, data corruption, and improve error messages for API consumers.

## Current State

**Problems:**
1. Minimal validation on most endpoints
2. Type coercion issues
3. Poor error messages
4. Potential SQL injection vectors
5. No request size limits

**Example - Current Validation:**
```javascript
// backend/routes/settings.js
router.post('/', async (req, res) => {
  const { key, value, encrypted } = req.body;

  if (!key) { // Only checks existence
    return res.status(400).json({ error: 'Missing required parameter: key' });
  }

  // No validation for:
  // - key format/length
  // - value type/size
  // - encrypted type
```

## Motivation

### Security Impact
- **Injection Attacks:** Unvalidated input could lead to SQL injection
- **DoS:** Large payloads could exhaust memory
- **Data Integrity:** Invalid data could corrupt database

### Developer Experience
- Better error messages
- Type safety at runtime
- Self-documenting schemas
- Easier testing

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Request Flow                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Client Request                                          │
│       ↓                                                  │
│  Express Middleware                                      │
│       ↓                                                  │
│  [NEW] Zod Validation Middleware ← Schemas              │
│       ↓ (validated data)                                │
│  Route Handler                                           │
│       ↓                                                  │
│  Business Logic                                          │
│       ↓                                                  │
│  Response                                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Technology Choice: Zod

**Why Zod over Joi?**
- ✅ TypeScript-first (future migration path)
- ✅ Better type inference
- ✅ Smaller bundle size
- ✅ More modern API
- ✅ Excellent error messages

### Implementation Components

#### 1. Validation Schemas

**File:** `backend/validation/schemas.js`

```javascript
const { z } = require('zod');

// Common patterns
const hexString = z.string().regex(/^[0-9a-f]+$/i, 'Must be hexadecimal');
const gitUrl = z.string().url().or(
  z.string().regex(/^git@[\w\.-]+:[\w\.-]+\/[\w\.-]+\.git$/, 'Invalid Git URL')
);

// Settings schemas
const settingKeySchema = z.string()
  .min(1, 'Key cannot be empty')
  .max(100, 'Key too long')
  .regex(/^[a-z_][a-z0-9_]*$/, 'Key must be lowercase letters, numbers, and underscores');

const settingValueSchema = z.string()
  .max(10000, 'Value too long (max 10KB)');

const createSettingSchema = z.object({
  key: settingKeySchema,
  value: settingValueSchema,
  encrypted: z.boolean().optional().default(false)
});

const updateSettingSchema = z.object({
  value: settingValueSchema,
  encrypted: z.boolean().optional()
});

// Backup schemas
const createBackupSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .optional()
});

// Remote configuration schemas
const remoteConfigSchema = z.object({
  remoteUrl: gitUrl,
  authType: z.enum(['ssh', 'token'], {
    errorMap: () => ({ message: 'Auth type must be "ssh" or "token"' })
  }),
  token: z.string()
    .min(1, 'Token cannot be empty')
    .max(1000, 'Token too long')
    .optional()
}).refine(
  data => data.authType !== 'token' || data.token,
  {
    message: 'Token is required when authType is "token"',
    path: ['token']
  }
);

// Restore schemas
const restoreFileSchema = z.object({
  filePath: z.string()
    .min(1, 'File path cannot be empty')
    .regex(/^[a-zA-Z0-9_\-\/\.]+$/, 'Invalid file path characters')
    .refine(path => !path.includes('..'), 'Path traversal not allowed'),
  commitHash: z.string()
    .length(40, 'Commit hash must be 40 characters')
    .regex(/^[0-9a-f]{40}$/i, 'Invalid commit hash format')
});

const restoreItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID cannot be empty'),
  itemType: z.enum(['automation', 'script', 'scene']),
  commitHash: z.string()
    .length(40, 'Commit hash must be 40 characters')
    .regex(/^[0-9a-f]{40}$/i, 'Invalid commit hash format')
});

// History schemas
const historyQuerySchema = z.object({
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  offset: z.coerce.number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .optional()
    .default(0),
  search: z.string()
    .max(200, 'Search query too long')
    .optional(),
  type: z.enum(['all', 'manual', 'auto', 'scheduled'])
    .optional()
    .default('all'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
}).refine(
  data => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
  {
    message: 'dateFrom must be before dateTo',
    path: ['dateFrom']
  }
);

// SSH key generation
const sshKeyGenerateSchema = z.object({
  keyType: z.enum(['rsa', 'ed25519']).optional().default('rsa'),
  keySize: z.number()
    .int()
    .min(2048)
    .max(4096)
    .optional()
    .default(4096)
});

// Git user config
const gitUserConfigSchema = z.object({
  userName: z.string()
    .min(1, 'User name cannot be empty')
    .max(100, 'User name too long'),
  userEmail: z.string()
    .email('Invalid email format')
    .max(200, 'Email too long')
});

module.exports = {
  // Settings
  createSettingSchema,
  updateSettingSchema,

  // Backup
  createBackupSchema,

  // Remote
  remoteConfigSchema,

  // Restore
  restoreFileSchema,
  restoreItemSchema,

  // History
  historyQuerySchema,

  // SSH
  sshKeyGenerateSchema,

  // Git
  gitUserConfigSchema,

  // Common
  hexString,
  gitUrl,
  settingKeySchema,
  settingValueSchema
};
```

#### 2. Validation Middleware

**File:** `backend/middleware/validate.js`

```javascript
const { ZodError } = require('zod');
const logger = require('../utils/logger');

/**
 * Express middleware factory for Zod validation
 * @param {Object} schema - Zod schema object
 * @param {string} source - 'body' | 'query' | 'params'
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const data = req[source];

      // Validate and parse
      const validated = await schema.parseAsync(data);

      // Replace original data with validated/transformed data
      req[source] = validated;

      // Add validated flag for debugging
      req.validated = true;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validation failed', {
          source,
          errors: formattedErrors,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors
        });
      }

      // Unexpected error
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
}

/**
 * Validate multiple sources at once
 * @param {Object} schemas - { body: schema, query: schema, params: schema }
 * @returns {Function} Express middleware
 */
function validateMultiple(schemas) {
  return async (req, res, next) => {
    try {
      for (const [source, schema] of Object.entries(schemas)) {
        if (schema) {
          const validated = await schema.parseAsync(req[source]);
          req[source] = validated;
        }
      }

      req.validated = true;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validation failed', {
          errors: formattedErrors,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors
        });
      }

      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
}

module.exports = { validate, validateMultiple };
```

#### 3. Update Routes

**File:** `backend/routes/settings.js` (updated)

```javascript
const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const {
  createSettingSchema,
  remoteConfigSchema,
  sshKeyGenerateSchema
} = require('../validation/schemas');

// Apply validation middleware
router.post('/', validate(createSettingSchema), async (req, res) => {
  // req.body is already validated and type-safe
  const { key, value, encrypted } = req.body;

  try {
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

router.post('/ssh/generate', validate(sshKeyGenerateSchema), async (req, res) => {
  const { keyType, keySize } = req.body;

  // Implementation with validated parameters
  // ...
});

router.post('/remote', validate(remoteConfigSchema), async (req, res) => {
  const { remoteUrl, authType, token } = req.body;

  // All fields are validated
  // ...
});

module.exports = router;
```

**File:** `backend/routes/restore.js` (updated)

```javascript
const { validate } = require('../middleware/validate');
const { restoreFileSchema, restoreItemSchema } = require('../validation/schemas');

router.post('/file', validate(restoreFileSchema), async (req, res) => {
  const { filePath, commitHash } = req.body;

  try {
    const gitService = req.app.locals.gitService;
    await gitService.restoreFile(filePath, commitHash);

    res.json({
      success: true,
      message: 'File restored successfully',
      filePath
    });
  } catch (error) {
    logger.error('Failed to restore file:', error);
    res.status(500).json({
      error: 'Failed to restore file',
      message: error.message
    });
  }
});

router.post('/item', validate(restoreItemSchema), async (req, res) => {
  // Validated input
  const { itemId, itemType, commitHash } = req.body;
  // ...
});

module.exports = router;
```

**File:** `backend/routes/history.js` (updated)

```javascript
const { validate } = require('../middleware/validate');
const { historyQuerySchema } = require('../validation/schemas');

router.get('/', validate(historyQuerySchema, 'query'), async (req, res) => {
  const { limit, offset, search, type, dateFrom, dateTo } = req.query;

  // All query params are validated and type-coerced
  try {
    const gitService = req.app.locals.gitService;
    let history = await gitService.getHistory(limit, offset);

    // Apply filters
    if (search) {
      history = history.filter(commit =>
        commit.message.toLowerCase().includes(search.toLowerCase()) ||
        commit.hash.includes(search)
      );
    }

    if (type !== 'all') {
      const typeFilter = {
        manual: h => !h.is_auto && !h.is_scheduled,
        auto: h => h.is_auto,
        scheduled: h => h.is_scheduled
      };

      history = history.filter(typeFilter[type]);
    }

    if (dateFrom) {
      history = history.filter(h => new Date(h.date) >= dateFrom);
    }

    if (dateTo) {
      history = history.filter(h => new Date(h.date) <= dateTo);
    }

    res.json({
      success: true,
      history,
      pagination: {
        limit,
        offset,
        total: history.length
      }
    });
  } catch (error) {
    logger.error('Failed to get history:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
});

module.exports = router;
```

#### 4. Request Size Limiting

**File:** `backend/server.js` (updated)

```javascript
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Limit request body size
app.use(bodyParser.json({
  limit: '1mb',
  strict: true // Only accept arrays and objects
}));

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '1mb'
}));

// Limit URL length
app.use((req, res, next) => {
  if (req.url.length > 2000) {
    return res.status(414).json({
      error: 'URL too long',
      maxLength: 2000
    });
  }
  next();
});
```

## Implementation Plan

### Phase 1: Setup & Core Schemas (1.5 hours)

- [ ] **Task 1.1:** Install dependencies
  ```bash
  cd backend && npm install zod
  ```
  - **Time:** 5 minutes

- [ ] **Task 1.2:** Create validation infrastructure
  - Create `backend/validation/schemas.js`
  - Create `backend/middleware/validate.js`
  - **Time:** 30 minutes

- [ ] **Task 1.3:** Implement core schemas
  - Settings schemas
  - Backup schemas
  - Remote config schemas
  - **Time:** 45 minutes

- [ ] **Task 1.4:** Add request size limits
  - Update `server.js`
  - Add URL length check
  - **Time:** 10 minutes

### Phase 2: Apply to Routes (1.5 hours)

- [ ] **Task 2.1:** Update settings routes
  - Apply validation to POST `/api/settings`
  - Apply validation to SSH endpoints
  - Apply validation to remote endpoints
  - **Time:** 30 minutes

- [ ] **Task 2.2:** Update restore routes
  - Validate file restore requests
  - Validate item restore requests
  - **Time:** 20 minutes

- [ ] **Task 2.3:** Update history routes
  - Validate query parameters
  - **Time:** 20 minutes

- [ ] **Task 2.4:** Update backup routes
  - Validate backup creation
  - **Time:** 10 minutes

- [ ] **Task 2.5:** Verify all routes covered
  - Audit all API endpoints
  - Add missing validations
  - **Time:** 10 minutes

### Phase 3: Testing (1 hour)

- [ ] **Task 3.1:** Write unit tests for schemas
  - Test valid inputs
  - Test invalid inputs
  - Test edge cases
  - **Time:** 30 minutes

- [ ] **Task 3.2:** Write integration tests
  - Test API endpoints with validation
  - Test error responses
  - **Time:** 20 minutes

- [ ] **Task 3.3:** Manual testing
  - Test with Postman/curl
  - Verify error messages
  - **Time:** 10 minutes

## Testing Strategy

### Unit Tests

**File:** `backend/__tests__/validation/schemas.test.js`

```javascript
const {
  createSettingSchema,
  remoteConfigSchema,
  restoreFileSchema,
  historyQuerySchema
} = require('../../validation/schemas');

describe('Validation Schemas', () => {
  describe('createSettingSchema', () => {
    test('accepts valid setting', () => {
      const valid = {
        key: 'test_key',
        value: 'test_value',
        encrypted: false
      };

      expect(() => createSettingSchema.parse(valid)).not.toThrow();
    });

    test('rejects empty key', () => {
      const invalid = {
        key: '',
        value: 'test'
      };

      expect(() => createSettingSchema.parse(invalid)).toThrow('Key cannot be empty');
    });

    test('rejects invalid key format', () => {
      const invalid = {
        key: 'Invalid-Key!',
        value: 'test'
      };

      expect(() => createSettingSchema.parse(invalid)).toThrow();
    });

    test('rejects oversized value', () => {
      const invalid = {
        key: 'test_key',
        value: 'x'.repeat(10001)
      };

      expect(() => createSettingSchema.parse(invalid)).toThrow('Value too long');
    });

    test('defaults encrypted to false', () => {
      const data = {
        key: 'test_key',
        value: 'test_value'
      };

      const result = createSettingSchema.parse(data);
      expect(result.encrypted).toBe(false);
    });
  });

  describe('remoteConfigSchema', () => {
    test('accepts valid HTTPS URL', () => {
      const valid = {
        remoteUrl: 'https://github.com/user/repo.git',
        authType: 'token',
        token: 'github_pat_123456'
      };

      expect(() => remoteConfigSchema.parse(valid)).not.toThrow();
    });

    test('accepts valid SSH URL', () => {
      const valid = {
        remoteUrl: 'git@github.com:user/repo.git',
        authType: 'ssh'
      };

      expect(() => remoteConfigSchema.parse(valid)).not.toThrow();
    });

    test('requires token when authType is token', () => {
      const invalid = {
        remoteUrl: 'https://github.com/user/repo.git',
        authType: 'token'
        // Missing token
      };

      expect(() => remoteConfigSchema.parse(invalid)).toThrow('Token is required');
    });

    test('rejects invalid authType', () => {
      const invalid = {
        remoteUrl: 'https://github.com/user/repo.git',
        authType: 'basic'
      };

      expect(() => remoteConfigSchema.parse(invalid)).toThrow();
    });
  });

  describe('restoreFileSchema', () => {
    test('accepts valid restore request', () => {
      const valid = {
        filePath: 'automations.yaml',
        commitHash: 'a'.repeat(40)
      };

      expect(() => restoreFileSchema.parse(valid)).not.toThrow();
    });

    test('rejects path traversal', () => {
      const invalid = {
        filePath: '../../../etc/passwd',
        commitHash: 'a'.repeat(40)
      };

      expect(() => restoreFileSchema.parse(invalid)).toThrow('Path traversal not allowed');
    });

    test('rejects invalid commit hash length', () => {
      const invalid = {
        filePath: 'test.yaml',
        commitHash: 'abc123'
      };

      expect(() => restoreFileSchema.parse(invalid)).toThrow('must be 40 characters');
    });

    test('rejects non-hex commit hash', () => {
      const invalid = {
        filePath: 'test.yaml',
        commitHash: 'z'.repeat(40)
      };

      expect(() => restoreFileSchema.parse(invalid)).toThrow('Invalid commit hash format');
    });
  });

  describe('historyQuerySchema', () => {
    test('coerces string numbers to integers', () => {
      const data = {
        limit: '25',
        offset: '50'
      };

      const result = historyQuerySchema.parse(data);
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(50);
    });

    test('applies default values', () => {
      const data = {};

      const result = historyQuerySchema.parse(data);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
      expect(result.type).toBe('all');
    });

    test('enforces limit constraints', () => {
      const tooHigh = { limit: 200 };
      expect(() => historyQuerySchema.parse(tooHigh)).toThrow('cannot exceed 100');

      const tooLow = { limit: 0 };
      expect(() => historyQuerySchema.parse(tooLow)).toThrow('must be at least 1');
    });

    test('validates date range', () => {
      const invalid = {
        dateFrom: new Date('2025-12-31'),
        dateTo: new Date('2025-01-01')
      };

      expect(() => historyQuerySchema.parse(invalid)).toThrow('dateFrom must be before dateTo');
    });
  });
});
```

### Integration Tests

**File:** `backend/__tests__/integration/validation.test.js`

```javascript
const request = require('supertest');
const app = require('../../server');

describe('API Validation', () => {
  describe('POST /api/settings', () => {
    test('returns 400 for invalid key', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({
          key: 'Invalid Key!',
          value: 'test'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveLength(1);
      expect(response.body.details[0].field).toBe('key');
    });

    test('returns 400 for oversized value', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({
          key: 'test_key',
          value: 'x'.repeat(10001)
        })
        .expect(400);

      expect(response.body.details[0].message).toContain('too long');
    });

    test('accepts valid input', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({
          key: 'test_key',
          value: 'test_value',
          encrypted: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/history', () => {
    test('validates query parameters', async () => {
      const response = await request(app)
        .get('/api/history?limit=abc')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('enforces limit constraints', async () => {
      const response = await request(app)
        .get('/api/history?limit=200')
        .expect(400);

      expect(response.body.details[0].message).toContain('cannot exceed 100');
    });

    test('coerces valid string numbers', async () => {
      const response = await request(app)
        .get('/api/history?limit=25&offset=10')
        .expect(200);

      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(10);
    });
  });

  describe('POST /api/restore/file', () => {
    test('prevents path traversal', async () => {
      const response = await request(app)
        .post('/api/restore/file')
        .send({
          filePath: '../../../etc/passwd',
          commitHash: 'a'.repeat(40)
        })
        .expect(400);

      expect(response.body.details[0].message).toContain('Path traversal');
    });

    test('validates commit hash format', async () => {
      const response = await request(app)
        .post('/api/restore/file')
        .send({
          filePath: 'test.yaml',
          commitHash: 'invalid'
        })
        .expect(400);

      expect(response.body.details[0].field).toBe('commitHash');
    });
  });

  describe('Request size limits', () => {
    test('rejects oversized JSON body', async () => {
      const largePayload = {
        key: 'test',
        value: 'x'.repeat(2 * 1024 * 1024) // 2MB
      };

      const response = await request(app)
        .post('/api/settings')
        .send(largePayload)
        .expect(413); // Payload Too Large

      expect(response.body.error).toContain('too large');
    });
  });
});
```

## Success Metrics

- ✅ 100% of API endpoints have input validation
- ✅ All validation schemas have unit tests
- ✅ Error messages are clear and actionable
- ✅ 0 SQL injection vulnerabilities
- ✅ Request size limits prevent DoS

## Risks & Mitigations

### Risk 1: Breaking Changes for API Consumers

**Impact:** MEDIUM

**Mitigation:**
- Introduce in minor version (v1.0.1)
- Previously accepted invalid inputs now rejected
- Provide detailed error messages
- Update API documentation

### Risk 2: Performance Impact

**Impact:** LOW

**Mitigation:**
- Zod is fast (~10µs per validation)
- Benchmark critical paths
- Consider caching compiled schemas

### Risk 3: Overly Strict Validation

**Impact:** LOW

**Mitigation:**
- Start with reasonable limits
- Monitor user feedback
- Adjust limits based on real usage

## References

- [Zod Documentation](https://zod.dev/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

**Status:** ✅ Ready for Implementation
