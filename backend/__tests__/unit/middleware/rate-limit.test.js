const {
  backupLimiter,
  restoreLimiter,
  settingsLimiter,
  readLimiter,
  statusLimiter
} = require('../../../middleware/rate-limit');

describe('Rate Limiting Middleware', () => {
  test('backupLimiter should be configured with correct limits', () => {
    expect(backupLimiter).toBeDefined();
    // Basic smoke test - actual functionality tested in integration tests
  });

  test('restoreLimiter should be configured', () => {
    expect(restoreLimiter).toBeDefined();
  });

  test('settingsLimiter should be configured', () => {
    expect(settingsLimiter).toBeDefined();
  });

  test('readLimiter should be configured', () => {
    expect(readLimiter).toBeDefined();
  });

  test('statusLimiter should be configured', () => {
    expect(statusLimiter).toBeDefined();
  });

  test('all limiters should be functions', () => {
    const limiters = [
      backupLimiter,
      restoreLimiter,
      settingsLimiter,
      readLimiter,
      statusLimiter
    ];

    limiters.forEach(limiter => {
      expect(typeof limiter).toBe('function');
    });
  });
});
