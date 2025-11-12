/**
 * GitLockManager - Robust Git Lock Management with Operation Queue
 *
 * Features:
 * - Serialized operation queue (prevents concurrency issues)
 * - Automatic orphan lock detection and cleanup (>5min)
 * - Retry with exponential backoff (3 attempts)
 * - Configurable timeout (default: 5s)
 * - Detailed metrics and statistics
 * - Graceful shutdown support
 *
 * @author HomeGuardian
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class GitLockManager {
  constructor(repoPath, options = {}) {
    this.repoPath = repoPath;
    this.lockFilePath = path.join(repoPath, '.git', 'index.lock');

    // Configuration
    this.config = {
      timeout: options.timeout || 5000, // 5s default
      maxRetries: options.maxRetries || 3,
      orphanLockAge: options.orphanLockAge || 300000, // 5min default
      cleanupInterval: options.cleanupInterval || 60000, // 1min cleanup check
      operationTimeout: options.operationTimeout || 30000, // 30s per operation
      ...options
    };

    // Operation queue
    this.queue = [];
    this.processing = false;
    this.currentOperation = null;

    // Metrics
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      retriedOperations: 0,
      orphanLocksRemoved: 0,
      queuedOperations: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      lastCleanup: null,
      startTime: Date.now()
    };

    // Cleanup interval
    this.cleanupTimer = null;
    this.isShuttingDown = false;

    // Start cleanup timer
    this.startCleanupTimer();

    logger.info('[GitLockManager] Initialized', {
      repoPath: this.repoPath,
      config: this.config
    });
  }

  /**
   * Execute git operation with lock management
   * @param {Function} operation - Async function to execute
   * @param {Object} options - Operation options
   * @returns {Promise} Operation result
   */
  async executeOperation(operation, options = {}) {
    if (this.isShuttingDown) {
      throw new Error('GitLockManager is shutting down, rejecting new operations');
    }

    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedAt = Date.now();

    return new Promise((resolve, reject) => {
      const queueItem = {
        id: operationId,
        operation,
        options: {
          name: options.name || 'unnamed',
          priority: options.priority || 0,
          ...options
        },
        queuedAt,
        attempts: 0,
        resolve,
        reject
      };

      // Add to queue with priority sorting
      this.queue.push(queueItem);
      this.queue.sort((a, b) => b.options.priority - a.options.priority);

      this.metrics.queuedOperations++;

      logger.debug('[GitLockManager] Operation queued', {
        id: operationId,
        name: queueItem.options.name,
        queueSize: this.queue.length
      });

      // Process queue
      this.processQueue();
    });
  }

  /**
   * Process operation queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0 || this.isShuttingDown) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && !this.isShuttingDown) {
      const queueItem = this.queue.shift();
      this.currentOperation = queueItem;

      try {
        await this.executeWithRetry(queueItem);
      } catch (error) {
        // Error already handled in executeWithRetry
      } finally {
        this.currentOperation = null;
      }
    }

    this.processing = false;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(queueItem) {
    const { id, operation, options, queuedAt, resolve, reject } = queueItem;
    const waitTime = Date.now() - queuedAt;

    // Update wait time metric
    this.updateAverageMetric('averageWaitTime', waitTime);

    let lastError = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      queueItem.attempts = attempt;

      try {
        logger.debug('[GitLockManager] Executing operation', {
          id,
          name: options.name,
          attempt,
          maxRetries: this.config.maxRetries
        });

        // Check and clean orphan locks
        await this.cleanOrphanLock();

        // Execute with timeout
        const startTime = Date.now();
        const result = await this.executeWithTimeout(operation, this.config.operationTimeout);
        const executionTime = Date.now() - startTime;

        // Update metrics
        this.metrics.totalOperations++;
        this.metrics.successfulOperations++;
        if (attempt > 1) {
          this.metrics.retriedOperations++;
        }
        this.updateAverageMetric('averageExecutionTime', executionTime);

        logger.debug('[GitLockManager] Operation completed', {
          id,
          name: options.name,
          attempt,
          executionTime: `${executionTime}ms`
        });

        resolve(result);
        return;

      } catch (error) {
        lastError = error;

        logger.warn('[GitLockManager] Operation failed', {
          id,
          name: options.name,
          attempt,
          maxRetries: this.config.maxRetries,
          error: error.message
        });

        // If it's a lock error and we have retries left, wait with exponential backoff
        if (this.isLockError(error) && attempt < this.config.maxRetries) {
          const backoffTime = this.calculateBackoff(attempt);
          logger.info('[GitLockManager] Retrying after backoff', {
            id,
            attempt,
            backoffTime: `${backoffTime}ms`
          });
          await this.sleep(backoffTime);
        } else if (attempt >= this.config.maxRetries) {
          // Max retries reached
          break;
        }
      }
    }

    // All retries failed
    this.metrics.totalOperations++;
    this.metrics.failedOperations++;

    logger.error('[GitLockManager] Operation failed after all retries', {
      id,
      name: options.name,
      attempts: queueItem.attempts,
      error: lastError?.message
    });

    reject(lastError || new Error('Operation failed after all retries'));
  }

  /**
   * Execute operation with timeout
   */
  async executeWithTimeout(operation, timeout) {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Check if error is a git lock error
   */
  isLockError(error) {
    if (!error || !error.message) return false;
    const message = error.message.toLowerCase();
    return message.includes('index.lock') ||
           message.includes('unable to create') ||
           message.includes('file exists');
  }

  /**
   * Calculate exponential backoff time
   */
  calculateBackoff(attempt) {
    const baseDelay = 1000; // 1s base
    const maxDelay = 10000; // 10s max
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  /**
   * Clean orphan lock files
   */
  async cleanOrphanLock() {
    try {
      const stats = await fs.stat(this.lockFilePath);
      const lockAge = Date.now() - stats.mtimeMs;

      if (lockAge > this.config.orphanLockAge) {
        logger.warn('[GitLockManager] Orphan lock detected, removing', {
          lockAge: `${Math.round(lockAge / 1000)}s`,
          threshold: `${this.config.orphanLockAge / 1000}s`
        });

        await fs.unlink(this.lockFilePath);
        this.metrics.orphanLocksRemoved++;

        logger.info('[GitLockManager] Orphan lock removed successfully');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.debug('[GitLockManager] Error checking lock file', {
          error: error.message
        });
      }
      // Lock file doesn't exist - this is normal
    }
  }

  /**
   * Start periodic cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanOrphanLock();
        this.metrics.lastCleanup = new Date().toISOString();
      } catch (error) {
        logger.error('[GitLockManager] Cleanup timer error', {
          error: error.message
        });
      }
    }, this.config.cleanupInterval);

    // Don't keep process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Update average metric using running average
   */
  updateAverageMetric(metricName, newValue) {
    const currentAvg = this.metrics[metricName];
    const totalOps = this.metrics.totalOperations + 1;
    this.metrics[metricName] = ((currentAvg * (totalOps - 1)) + newValue) / totalOps;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current metrics and statistics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const successRate = this.metrics.totalOperations > 0
      ? (this.metrics.successfulOperations / this.metrics.totalOperations * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      uptime: Math.round(uptime / 1000), // seconds
      successRate: `${successRate}%`,
      currentQueueSize: this.queue.length,
      isProcessing: this.processing,
      currentOperation: this.currentOperation ? {
        id: this.currentOperation.id,
        name: this.currentOperation.options.name,
        attempts: this.currentOperation.attempts,
        queuedFor: `${Date.now() - this.currentOperation.queuedAt}ms`
      } : null,
      averageWaitTime: `${Math.round(this.metrics.averageWaitTime)}ms`,
      averageExecutionTime: `${Math.round(this.metrics.averageExecutionTime)}ms`
    };
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      size: this.queue.length,
      processing: this.processing,
      operations: this.queue.map(item => ({
        id: item.id,
        name: item.options.name,
        priority: item.options.priority,
        queuedFor: `${Date.now() - item.queuedAt}ms`,
        attempts: item.attempts
      }))
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(options = {}) {
    const { timeout = 30000, force = false } = options;

    logger.info('[GitLockManager] Shutdown initiated', {
      queueSize: this.queue.length,
      processing: this.processing,
      timeout: `${timeout}ms`,
      force
    });

    this.isShuttingDown = true;

    // Stop accepting new operations
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (force) {
      // Force shutdown - reject all queued operations
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        item.reject(new Error('GitLockManager force shutdown'));
      }
      logger.warn('[GitLockManager] Force shutdown - all queued operations rejected');
      return;
    }

    // Graceful shutdown - wait for queue to drain
    const startTime = Date.now();

    while (this.queue.length > 0 || this.processing) {
      if (Date.now() - startTime > timeout) {
        logger.warn('[GitLockManager] Shutdown timeout - rejecting remaining operations', {
          remainingOperations: this.queue.length
        });

        while (this.queue.length > 0) {
          const item = this.queue.shift();
          item.reject(new Error('GitLockManager shutdown timeout'));
        }
        break;
      }

      await this.sleep(100);
    }

    logger.info('[GitLockManager] Shutdown complete', {
      finalMetrics: this.getMetrics()
    });
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      retriedOperations: 0,
      orphanLocksRemoved: 0,
      queuedOperations: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      lastCleanup: null,
      startTime: Date.now()
    };

    logger.info('[GitLockManager] Metrics reset');
  }
}

module.exports = GitLockManager;
