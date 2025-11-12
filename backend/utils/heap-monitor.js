/**
 * HeapMonitor - Proactive Memory Management and Leak Detection
 *
 * Features:
 * - Real-time monitoring (30s interval)
 * - 4 pressure levels: Normal/Warning/Critical/Emergency
 * - Forced garbage collection at critical levels
 * - Memory leak detection via linear regression
 * - Configurable thresholds (70%/85%/95%)
 * - Callback system for each pressure level
 *
 * @author HomeGuardian
 * @version 1.0.0
 */

const logger = require('./logger');
const v8 = require('v8');

/**
 * Pressure levels
 */
const PressureLevel = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
};

class HeapMonitor {
  constructor(options = {}) {
    // Configuration
    this.config = {
      monitorInterval: options.monitorInterval || 30000, // 30s default
      warningThreshold: options.warningThreshold || 0.70, // 70%
      criticalThreshold: options.criticalThreshold || 0.85, // 85%
      emergencyThreshold: options.emergencyThreshold || 0.95, // 95%
      leakDetectionWindow: options.leakDetectionWindow || 10, // samples for trend analysis
      leakDetectionThreshold: options.leakDetectionThreshold || 0.05, // 5% growth per sample
      forceGcOnCritical: options.forceGcOnCritical !== false, // default true
      forceGcOnEmergency: options.forceGcOnEmergency !== false, // default true
      ...options
    };

    // State
    this.currentLevel = PressureLevel.NORMAL;
    this.previousLevel = null;
    this.monitorTimer = null;
    this.isMonitoring = false;
    this.isShuttingDown = false;

    // History for leak detection
    this.history = [];
    this.maxHistorySize = Math.max(this.config.leakDetectionWindow * 2, 20);

    // Callbacks
    this.callbacks = {
      [PressureLevel.NORMAL]: [],
      [PressureLevel.WARNING]: [],
      [PressureLevel.CRITICAL]: [],
      [PressureLevel.EMERGENCY]: []
    };

    // Metrics
    this.metrics = {
      totalChecks: 0,
      normalCount: 0,
      warningCount: 0,
      criticalCount: 0,
      emergencyCount: 0,
      gcTriggered: 0,
      leaksDetected: 0,
      startTime: Date.now(),
      lastCheck: null,
      peakHeapUsed: 0,
      peakHeapUsedTime: null
    };

    logger.info('[HeapMonitor] Initialized', {
      config: this.config
    });
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('[HeapMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.isShuttingDown = false;

    logger.info('[HeapMonitor] Starting memory monitoring', {
      interval: `${this.config.monitorInterval}ms`,
      thresholds: {
        warning: `${(this.config.warningThreshold * 100).toFixed(0)}%`,
        critical: `${(this.config.criticalThreshold * 100).toFixed(0)}%`,
        emergency: `${(this.config.emergencyThreshold * 100).toFixed(0)}%`
      }
    });

    // Initial check
    this.checkMemory();

    // Schedule periodic checks
    this.monitorTimer = setInterval(() => {
      if (!this.isShuttingDown) {
        this.checkMemory();
      }
    }, this.config.monitorInterval);

    // Don't keep process alive
    if (this.monitorTimer.unref) {
      this.monitorTimer.unref();
    }
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }

    logger.info('[HeapMonitor] Stopping memory monitoring');

    this.isMonitoring = false;
    this.isShuttingDown = true;

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Check memory and update pressure level
   */
  checkMemory() {
    try {
      const memoryUsage = process.memoryUsage();
      const heapStats = v8.getHeapStatistics();

      const heapUsed = memoryUsage.heapUsed;
      const heapTotal = memoryUsage.heapTotal;
      const heapLimit = heapStats.heap_size_limit;
      const heapUsageRatio = heapUsed / heapLimit;

      // Record snapshot
      const snapshot = {
        timestamp: Date.now(),
        heapUsed,
        heapTotal,
        heapLimit,
        heapUsageRatio,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers || 0
      };

      // Add to history
      this.addToHistory(snapshot);

      // Update metrics
      this.metrics.totalChecks++;
      this.metrics.lastCheck = new Date().toISOString();

      if (heapUsed > this.metrics.peakHeapUsed) {
        this.metrics.peakHeapUsed = heapUsed;
        this.metrics.peakHeapUsedTime = snapshot.timestamp;
      }

      // Determine pressure level
      const newLevel = this.determinePressureLevel(heapUsageRatio);
      const levelChanged = newLevel !== this.currentLevel;

      if (levelChanged) {
        this.previousLevel = this.currentLevel;
        this.currentLevel = newLevel;

        logger.info('[HeapMonitor] Pressure level changed', {
          from: this.previousLevel,
          to: this.currentLevel,
          heapUsage: this.formatBytes(heapUsed),
          heapLimit: this.formatBytes(heapLimit),
          usageRatio: `${(heapUsageRatio * 100).toFixed(2)}%`
        });

        // Update level-specific metrics
        this.updateLevelMetrics(newLevel);

        // Trigger callbacks
        this.triggerCallbacks(newLevel, snapshot);

        // Handle critical/emergency levels
        this.handleCriticalLevel(newLevel, snapshot);
      }

      // Check for memory leaks
      if (this.history.length >= this.config.leakDetectionWindow) {
        this.detectMemoryLeak();
      }

    } catch (error) {
      logger.error('[HeapMonitor] Error checking memory', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Determine pressure level based on heap usage ratio
   */
  determinePressureLevel(heapUsageRatio) {
    if (heapUsageRatio >= this.config.emergencyThreshold) {
      return PressureLevel.EMERGENCY;
    } else if (heapUsageRatio >= this.config.criticalThreshold) {
      return PressureLevel.CRITICAL;
    } else if (heapUsageRatio >= this.config.warningThreshold) {
      return PressureLevel.WARNING;
    } else {
      return PressureLevel.NORMAL;
    }
  }

  /**
   * Handle critical pressure levels
   */
  handleCriticalLevel(level, snapshot) {
    if (level === PressureLevel.CRITICAL && this.config.forceGcOnCritical) {
      this.forceGarbageCollection('critical');
    } else if (level === PressureLevel.EMERGENCY && this.config.forceGcOnEmergency) {
      this.forceGarbageCollection('emergency');
    }
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(reason) {
    try {
      if (global.gc) {
        const beforeGc = process.memoryUsage().heapUsed;
        logger.warn('[HeapMonitor] Forcing garbage collection', {
          reason,
          heapUsedBefore: this.formatBytes(beforeGc)
        });

        global.gc();
        this.metrics.gcTriggered++;

        const afterGc = process.memoryUsage().heapUsed;
        const freed = beforeGc - afterGc;

        logger.info('[HeapMonitor] Garbage collection completed', {
          heapUsedAfter: this.formatBytes(afterGc),
          freed: this.formatBytes(freed),
          freedPercentage: `${((freed / beforeGc) * 100).toFixed(2)}%`
        });
      } else {
        logger.warn('[HeapMonitor] GC not exposed - run with --expose-gc flag');
      }
    } catch (error) {
      logger.error('[HeapMonitor] Error forcing GC', {
        error: error.message
      });
    }
  }

  /**
   * Detect memory leaks using linear regression
   */
  detectMemoryLeak() {
    try {
      const recentHistory = this.history.slice(-this.config.leakDetectionWindow);

      if (recentHistory.length < this.config.leakDetectionWindow) {
        return;
      }

      // Calculate linear regression on heap usage
      const { slope, rSquared } = this.linearRegression(recentHistory);

      // Normalize slope to per-sample growth rate
      const avgHeap = recentHistory.reduce((sum, s) => sum + s.heapUsed, 0) / recentHistory.length;
      const growthRate = slope / avgHeap;

      // Detect leak: positive slope, high R², growth rate exceeds threshold
      const isLeak = slope > 0 &&
                     rSquared > 0.7 &&
                     growthRate > this.config.leakDetectionThreshold;

      if (isLeak) {
        this.metrics.leaksDetected++;

        logger.warn('[HeapMonitor] Potential memory leak detected', {
          growthRate: `${(growthRate * 100).toFixed(2)}%`,
          slope: this.formatBytes(slope),
          rSquared: rSquared.toFixed(3),
          samples: recentHistory.length,
          avgHeap: this.formatBytes(avgHeap),
          trend: recentHistory.map(s => this.formatBytes(s.heapUsed)).join(' → ')
        });

        // Trigger leak detection callback
        this.triggerLeakCallbacks({
          growthRate,
          slope,
          rSquared,
          samples: recentHistory,
          avgHeap
        });
      }
    } catch (error) {
      logger.error('[HeapMonitor] Error detecting memory leak', {
        error: error.message
      });
    }
  }

  /**
   * Calculate linear regression for leak detection
   * Returns { slope, intercept, rSquared }
   */
  linearRegression(samples) {
    const n = samples.length;
    const x = samples.map((_, i) => i); // time indices
    const y = samples.map(s => s.heapUsed);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return { slope, intercept, rSquared };
  }

  /**
   * Add snapshot to history
   */
  addToHistory(snapshot) {
    this.history.push(snapshot);

    // Trim history to max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Update level-specific metrics
   */
  updateLevelMetrics(level) {
    switch (level) {
      case PressureLevel.NORMAL:
        this.metrics.normalCount++;
        break;
      case PressureLevel.WARNING:
        this.metrics.warningCount++;
        break;
      case PressureLevel.CRITICAL:
        this.metrics.criticalCount++;
        break;
      case PressureLevel.EMERGENCY:
        this.metrics.emergencyCount++;
        break;
    }
  }

  /**
   * Register callback for pressure level
   */
  onPressureLevel(level, callback) {
    if (!this.callbacks[level]) {
      throw new Error(`Invalid pressure level: ${level}`);
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.callbacks[level].push(callback);

    logger.debug('[HeapMonitor] Callback registered', {
      level,
      totalCallbacks: this.callbacks[level].length
    });
  }

  /**
   * Register callback for leak detection
   */
  onLeakDetected(callback) {
    if (!this.callbacks.leak) {
      this.callbacks.leak = [];
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.callbacks.leak.push(callback);
  }

  /**
   * Trigger callbacks for pressure level
   */
  triggerCallbacks(level, snapshot) {
    const callbacks = this.callbacks[level] || [];

    callbacks.forEach(callback => {
      try {
        callback({
          level,
          previousLevel: this.previousLevel,
          snapshot,
          metrics: this.getMetrics()
        });
      } catch (error) {
        logger.error('[HeapMonitor] Error in callback', {
          level,
          error: error.message
        });
      }
    });
  }

  /**
   * Trigger leak detection callbacks
   */
  triggerLeakCallbacks(leakInfo) {
    const callbacks = this.callbacks.leak || [];

    callbacks.forEach(callback => {
      try {
        callback(leakInfo);
      } catch (error) {
        logger.error('[HeapMonitor] Error in leak callback', {
          error: error.message
        });
      }
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    return {
      ...this.metrics,
      uptime: Math.round(uptime / 1000), // seconds
      currentLevel: this.currentLevel,
      previousLevel: this.previousLevel,
      isMonitoring: this.isMonitoring,
      current: {
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapLimit: this.formatBytes(heapStats.heap_size_limit),
        heapUsageRatio: `${((memoryUsage.heapUsed / heapStats.heap_size_limit) * 100).toFixed(2)}%`,
        rss: this.formatBytes(memoryUsage.rss),
        external: this.formatBytes(memoryUsage.external)
      },
      peak: {
        heapUsed: this.formatBytes(this.metrics.peakHeapUsed),
        time: this.metrics.peakHeapUsedTime ? new Date(this.metrics.peakHeapUsedTime).toISOString() : null
      },
      thresholds: {
        warning: `${(this.config.warningThreshold * 100).toFixed(0)}%`,
        critical: `${(this.config.criticalThreshold * 100).toFixed(0)}%`,
        emergency: `${(this.config.emergencyThreshold * 100).toFixed(0)}%`
      },
      historySize: this.history.length
    };
  }

  /**
   * Get memory snapshot history
   */
  getHistory(limit = 20) {
    const history = this.history.slice(-limit);

    return history.map(snapshot => ({
      timestamp: new Date(snapshot.timestamp).toISOString(),
      heapUsed: this.formatBytes(snapshot.heapUsed),
      heapTotal: this.formatBytes(snapshot.heapTotal),
      heapUsageRatio: `${(snapshot.heapUsageRatio * 100).toFixed(2)}%`,
      rss: this.formatBytes(snapshot.rss)
    }));
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      totalChecks: 0,
      normalCount: 0,
      warningCount: 0,
      criticalCount: 0,
      emergencyCount: 0,
      gcTriggered: 0,
      leaksDetected: 0,
      startTime: Date.now(),
      lastCheck: null,
      peakHeapUsed: 0,
      peakHeapUsedTime: null
    };

    logger.info('[HeapMonitor] Metrics reset');
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    logger.info('[HeapMonitor] Shutting down', {
      finalMetrics: this.getMetrics()
    });

    this.stop();
  }
}

module.exports = { HeapMonitor, PressureLevel };
