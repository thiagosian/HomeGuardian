const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Detailed health check endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
  const checks = {
    database: false,
    disk: false,
    memory: false
  };

  let status = 'healthy';
  const startTime = Date.now();

  try {
    // Check database
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    checks.database = true;
  } catch (error) {
    status = 'unhealthy';
    logger.error('Database health check failed:', error);
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memThreshold = 500 * 1024 * 1024; // 500MB
  checks.memory = memUsage.heapUsed < memThreshold;

  if (!checks.memory) {
    status = 'degraded';
    logger.warn('High memory usage detected:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
    });
  }

  // Check disk space (if DATA_PATH is accessible)
  try {
    const fs = require('fs');
    const dataPath = process.env.DATA_PATH || '/data';
    fs.accessSync(dataPath, fs.constants.W_OK);
    checks.disk = true;
  } catch (error) {
    status = 'degraded';
    logger.warn('Disk check failed:', error.message);
  }

  const responseTime = Date.now() - startTime;

  const health = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    responseTime: `${responseTime}ms`,
    version: process.env.npm_package_version || '1.1.0',
    environment: process.env.NODE_ENV || 'production',
    checks,
    system: {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
      },
      uptime: Math.floor(process.uptime()) + 's',
      pid: process.pid
    }
  };

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  res.status(httpStatus).json(health);
});

/**
 * Readiness probe
 * GET /api/health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if can handle requests
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      reason: 'Database not available',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness probe
 * GET /api/health/live
 */
router.get('/live', (req, res) => {
  // Simple check - process is running
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

/**
 * Metrics endpoint (Prometheus-compatible)
 * GET /api/health/metrics
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();

  const metrics = [
    '# HELP process_uptime_seconds Process uptime in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${Math.floor(process.uptime())}`,
    '',
    '# HELP process_memory_heap_used_bytes Process heap memory used',
    '# TYPE process_memory_heap_used_bytes gauge',
    `process_memory_heap_used_bytes ${memUsage.heapUsed}`,
    '',
    '# HELP process_memory_heap_total_bytes Process heap memory total',
    '# TYPE process_memory_heap_total_bytes gauge',
    `process_memory_heap_total_bytes ${memUsage.heapTotal}`,
    '',
    '# HELP process_memory_rss_bytes Process resident set size',
    '# TYPE process_memory_rss_bytes gauge',
    `process_memory_rss_bytes ${memUsage.rss}`,
    ''
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

module.exports = router;
