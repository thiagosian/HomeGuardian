const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Custom handler for rate limit exceeded
 * Logs the event and returns a structured error response
 */
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent')
  });

  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Backup operations - very restrictive (5 requests/min)
 * Backup operations are resource-intensive and should be limited
 */
const backupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip for scheduled/automated requests
    return req.headers['x-automated'] === 'true';
  }
});

/**
 * Restore operations - restrictive (10 requests/min)
 * Restore operations are safety-critical and should be limited
 */
const restoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Settings operations - moderate (30 requests/min)
 * Settings changes are infrequent but not critical
 */
const settingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Read operations - lenient (60 requests/min)
 * History and read operations are less resource-intensive
 */
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Status operations - very lenient (120 requests/min)
 * Status checks are lightweight and need high frequency for real-time updates
 */
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Git history operations - moderate (20 requests/min)
 * Git operations are more expensive than simple reads
 * Lower limit to prevent abuse and protect Git performance
 */
const gitHistoryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per IP + entity type for fairness
    // Use ipKeyGenerator to properly handle IPv6 addresses
    const normalizedIp = ipKeyGenerator(req);
    return `${normalizedIp}:${req.params.type || req.query.type || 'all'}`;
  }
});

/**
 * Items/Entity operations - moderate (50 requests/min)
 * Entity lookups involve file parsing which is moderately expensive
 */
const itemsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Allow unlimited access to specific item lookups (less expensive)
    // Only limit bulk/list operations
    return req.params.id !== undefined;
  }
});

/**
 * Entity history operations - restrictive (15 requests/min)
 * Combines entity parsing + git operations, very expensive
 */
const entityHistoryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per IP + entity to prevent hammering specific entities
    // Use ipKeyGenerator to properly handle IPv6 addresses
    const normalizedIp = ipKeyGenerator(req);
    return `${normalizedIp}:${req.params.type}:${req.params.id}`;
  }
});

/**
 * Batch operations - very restrictive (10 requests/min)
 * Batch requests can be extremely expensive
 */
const batchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Stricter per-IP limit for batch operations
    // Use ipKeyGenerator to properly handle IPv6 addresses
    return ipKeyGenerator(req);
  }
});

module.exports = {
  backupLimiter,
  restoreLimiter,
  settingsLimiter,
  readLimiter,
  statusLimiter,
  gitHistoryLimiter,
  itemsLimiter,
  entityHistoryLimiter,
  batchLimiter
};
