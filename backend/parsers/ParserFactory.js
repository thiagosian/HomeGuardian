const AutomationParser = require('./AutomationParser');
const logger = require('../utils/logger');

/**
 * Parser Factory
 * Creates appropriate parser based on entity type
 * Implements Factory Pattern for parser creation
 */
class ParserFactory {
  constructor(configPath) {
    this.configPath = configPath || process.env.CONFIG_PATH || '/config';
    this.parsers = new Map();

    // Register available parsers
    this.registerParser('automation', AutomationParser);

    // TODO: Register other parsers
    // this.registerParser('script', ScriptParser);
    // this.registerParser('scene', SceneParser);
    // this.registerParser('blueprint', BlueprintParser);
    // etc.
  }

  /**
   * Register a parser class for a specific type
   * @param {string} type - Entity type
   * @param {Class} ParserClass - Parser class (extends ParserStrategy)
   */
  registerParser(type, ParserClass) {
    this.parsers.set(type, ParserClass);
    logger.debug(`Parser registered for type: ${type}`);
  }

  /**
   * Get parser for specific type
   * @param {string} type - Entity type
   * @returns {ParserStrategy} Parser instance
   * @throws {Error} If no parser registered for type
   */
  getParser(type) {
    const ParserClass = this.parsers.get(type);

    if (!ParserClass) {
      const availableTypes = Array.from(this.parsers.keys()).join(', ');
      throw new Error(
        `No parser registered for type '${type}'. Available types: ${availableTypes}`
      );
    }

    // Create new instance of parser
    return new ParserClass(this.configPath);
  }

  /**
   * Check if parser exists for type
   * @param {string} type - Entity type
   * @returns {boolean} True if parser exists
   */
  hasParser(type) {
    return this.parsers.has(type);
  }

  /**
   * Get all registered parser types
   * @returns {string[]} Array of registered types
   */
  getAvailableTypes() {
    return Array.from(this.parsers.keys());
  }

  /**
   * Parse items of specific type
   * @param {string} type - Entity type
   * @param {Object} options - Parsing options
   * @returns {Promise<Array>} Array of parsed items
   */
  async parse(type, options = {}) {
    const parser = this.getParser(type);
    return await parser.parse(options);
  }

  /**
   * Get item by type and ID
   * @param {string} type - Entity type
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} Item or null
   */
  async getItem(type, id) {
    const parser = this.getParser(type);
    return await parser.getById(id);
  }
}

module.exports = ParserFactory;
