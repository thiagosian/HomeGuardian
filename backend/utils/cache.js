/**
 * Simple in-memory cache implementation
 * For production, replace with Redis
 */
class Cache {
  constructor() {
    this.store = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  get(key) {
    if (!this.store.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    const now = Date.now();

    // Check if expired
    if (timestamp && now > timestamp) {
      this.delete(key);
      return null;
    }

    return this.store.get(key);
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 300000) {
    this.store.set(key, value);

    if (ttl > 0) {
      const expiresAt = Date.now() + ttl;
      this.timestamps.set(key, expiresAt);
    }

    return true;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
    this.timestamps.delete(key);
    return true;
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
    this.timestamps.clear();
    return true;
  }

  /**
   * Get cache size
   * @returns {number} Number of items in cache
   */
  size() {
    return this.store.size;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now > timestamp) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  stats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now > timestamp) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.store.size,
      active,
      expired,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough approximation)
   * @returns {string} Memory usage estimate
   */
  estimateMemoryUsage() {
    const size = JSON.stringify([...this.store.entries()]).length;
    return `~${Math.round(size / 1024)}KB`;
  }
}

// Singleton instance
const cache = new Cache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const cleaned = cache.cleanup();
  if (cleaned > 0) {
    console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
  }
}, 300000);

module.exports = cache;
