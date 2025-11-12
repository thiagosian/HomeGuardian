const logger = require('../utils/logger');

/**
 * Service Container with validation and dependency injection
 * Manages application services with type safety and validation
 *
 * @example
 * const container = new ServiceContainer();
 * container.register('gitService', gitService);
 * const git = container.get('gitService');
 */
class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.initializing = new Set();
  }

  /**
   * Register a service in the container
   * @param {string} name - Service name
   * @param {object} service - Service instance
   * @param {object} options - Registration options
   * @param {boolean} options.required - Whether service is required (default: true)
   * @param {string} options.description - Service description for logging
   * @throws {Error} If service is null or name already registered
   */
  register(name, service, options = {}) {
    const { required = true, description = '' } = options;

    // Validate service name
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }

    // Check for duplicate registration
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }

    // Validate service instance
    if (required && !service) {
      throw new Error(`Service '${name}' cannot be null or undefined`);
    }

    // Register service
    this.services.set(name, {
      instance: service,
      required,
      description,
      registeredAt: new Date()
    });

    logger.info(`Service registered: ${name}${description ? ` - ${description}` : ''}`);
  }

  /**
   * Get a service from the container
   * @param {string} name - Service name
   * @returns {object} Service instance
   * @throws {Error} If service not found or not initialized
   */
  get(name) {
    if (!this.services.has(name)) {
      throw new Error(
        `Service '${name}' not registered. Available services: ${this.getServiceNames().join(', ')}`
      );
    }

    const serviceInfo = this.services.get(name);

    if (!serviceInfo.instance) {
      throw new Error(
        `Service '${name}' is registered but not initialized`
      );
    }

    return serviceInfo.instance;
  }

  /**
   * Check if a service exists in the container
   * @param {string} name - Service name
   * @returns {boolean} True if service exists
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Get list of all registered service names
   * @returns {string[]} Array of service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Get metadata about a service
   * @param {string} name - Service name
   * @returns {object} Service metadata
   */
  getServiceInfo(name) {
    if (!this.services.has(name)) {
      return null;
    }

    const info = this.services.get(name);
    return {
      name,
      description: info.description,
      required: info.required,
      initialized: !!info.instance,
      registeredAt: info.registeredAt
    };
  }

  /**
   * Get all services metadata
   * @returns {object[]} Array of service metadata
   */
  getAllServicesInfo() {
    return this.getServiceNames().map(name => this.getServiceInfo(name));
  }

  /**
   * Validate all required services are initialized
   * @throws {Error} If any required service is not initialized
   */
  validateServices() {
    const missingServices = [];

    for (const [name, info] of this.services.entries()) {
      if (info.required && !info.instance) {
        missingServices.push(name);
      }
    }

    if (missingServices.length > 0) {
      throw new Error(
        `Required services not initialized: ${missingServices.join(', ')}`
      );
    }

    logger.info('All required services validated successfully');
  }

  /**
   * Clear all services (for testing/cleanup)
   */
  clear() {
    this.services.clear();
    this.initializing.clear();
    logger.info('Service container cleared');
  }

  /**
   * Get service instance safely with optional default
   * @param {string} name - Service name
   * @param {object} defaultValue - Default value if service not found
   * @returns {object} Service instance or default value
   */
  getSafe(name, defaultValue = null) {
    try {
      return this.get(name);
    } catch (error) {
      logger.warn(`Service '${name}' not found, returning default value`);
      return defaultValue;
    }
  }
}

// Export singleton instance
const container = new ServiceContainer();

module.exports = container;
module.exports.ServiceContainer = ServiceContainer;
