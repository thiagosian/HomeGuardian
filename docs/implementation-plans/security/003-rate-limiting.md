# Implementation Plan: API Rate Limiting

## Metadata

| Field | Value |
|-------|-------|
| **Plan ID** | SEC-003 |
| **Status** | 🟠 HIGH PRIORITY |
| **Priority** | P1 |
| **Effort** | 2 hours |
| **Owner** | TBD |
| **Created** | 2025-11-07 |
| **Target Version** | v1.0.1 |

## Summary

Implement rate limiting on API endpoints to prevent abuse, DoS attacks, and resource exhaustion.

## Current State

**Problem:** No rate limiting implemented
- Single user can spam `/api/backup/now`
- Resource-intensive operations unprotected
- No protection against brute force

## Technical Design

### Strategy: express-rate-limit

```javascript
// Basic Implementation
const rateLimit = require('express-rate-limit');

const backupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: 'Too many backup requests',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

app.use('/api/backup/now', backupLimiter);
```

### Rate Limit Tiers

| Endpoint | Window | Max Requests | Reason |
|----------|--------|--------------|--------|
| `/api/backup/now` | 1 min | 5 | Resource intensive |
| `/api/restore/*` | 1 min | 10 | Safety critical |
| `/api/settings` | 1 min | 30 | Moderate usage |
| `/api/history` | 1 min | 60 | Read-heavy |
| `/api/status` | 1 min | 120 | Real-time updates |

## Implementation Plan

### Phase 1: Setup (30 minutes)

- [ ] Install `express-rate-limit`
- [ ] Create `backend/middleware/rate-limit.js`
- [ ] Define rate limit configurations

### Phase 2: Apply Limits (30 minutes)

- [ ] Add to backup endpoints
- [ ] Add to restore endpoints
- [ ] Add to settings endpoints

### Phase 3: Testing (1 hour)

- [ ] Test rate limit enforcement
- [ ] Test header responses
- [ ] Load testing

## Code Implementation

**File:** `backend/middleware/rate-limit.js`

```javascript
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Custom handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

// Backup operations - very restrictive
const backupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for scheduled/automated requests
    return req.headers['x-automated'] === 'true';
  }
});

// Restore operations - restrictive
const restoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: rateLimitHandler
});

// Settings - moderate
const settingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  handler: rateLimitHandler
});

// Read operations - lenient
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  handler: rateLimitHandler
});

// Status - very lenient (for real-time updates)
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  handler: rateLimitHandler
});

module.exports = {
  backupLimiter,
  restoreLimiter,
  settingsLimiter,
  readLimiter,
  statusLimiter
};
```

**Update:** `backend/server.js`

```javascript
const {
  backupLimiter,
  restoreLimiter,
  settingsLimiter,
  readLimiter,
  statusLimiter
} = require('./middleware/rate-limit');

// Apply rate limiters
app.use('/api/backup', backupLimiter);
app.use('/api/restore', restoreLimiter);
app.use('/api/settings', settingsLimiter);
app.use('/api/history', readLimiter);
app.use('/api/status', statusLimiter);
```

## Testing

```javascript
describe('Rate Limiting', () => {
  test('enforces backup rate limit', async () => {
    // Make 6 requests in quick succession
    for (let i = 0; i < 6; i++) {
      const response = await request(app).post('/api/backup/now');

      if (i < 5) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
        expect(response.body.error).toBe('Too many requests');
      }
    }
  });

  test('includes rate limit headers', async () => {
    const response = await request(app).get('/api/status');

    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
    expect(response.headers['ratelimit-reset']).toBeDefined();
  });
});
```

## Success Metrics

- ✅ All critical endpoints protected
- ✅ Rate limit headers returned
- ✅ 0 DoS incidents
- ✅ < 1% legitimate requests blocked

---

**Status:** ✅ Ready for Implementation
