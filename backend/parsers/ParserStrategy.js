/**
 * Base Parser Strategy
 * Abstract class that all specific parsers must extend
 * Implements Strategy Pattern for Home Assistant configuration parsing
 */
class ParserStrategy {
  constructor(configPath) {
    if (this.constructor === ParserStrategy) {
      throw new Error('ParserStrategy is abstract and cannot be instantiated directly');
    }
    this.configPath = configPath || process.env.CONFIG_PATH || '/config';
  }

  /**
   * Parse items of specific type
   * Must be implemented by subclasses
   * @param {Object} options - Parsing options (includeRaw, etc.)
   * @returns {Promise<Array>} Array of parsed items
   */
  async parse(options = {}) {
    throw new Error('parse() must be implemented by subclass');
  }

  /**
   * Get item by ID
   * Must be implemented by subclasses
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} Item or null
   */
  async getById(id) {
    throw new Error('getById() must be implemented by subclass');
  }

  /**
   * Get item type name
   * @returns {string} Type name (automation, script, etc.)
   */
  getType() {
    throw new Error('getType() must be implemented by subclass');
  }
}

module.exports = ParserStrategy;
