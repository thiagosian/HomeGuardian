const logger = require('../utils/logger');

/**
 * Service Injector Middleware
 * Injects commonly used services into req object for easy access in routes
 *
 * @param {object} container - Service container instance
 * @returns {Function} Express middleware
 *
 * @example
 * app.use(serviceInjector(container));
 *
 * // In routes
 * router.get('/status', (req, res) => {
 *   const gitService = req.services.get('gitService');
 *   // ...
 * });
 */
function serviceInjector(container) {
  return (req, res, next) => {
    // Attach container to request
    req.services = container;

    // Add convenience methods
    req.getService = (name) => {
      try {
        return container.get(name);
      } catch (error) {
        logger.error(`Service ${name} not available:`, error);
        // Return a descriptive error response
        res.status(503).json({
          error: 'Service Unavailable',
          message: `Required service '${name}' is not available`,
          service: name
        });
        throw error; // Re-throw to prevent route execution
      }
    };

    next();
  };
}

/**
 * Require specific services middleware
 * Validates that required services are available before executing route
 *
 * @param {...string} serviceNames - Names of required services
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/backup', requireServices('gitService', 'db'), async (req, res) => {
 *   const gitService = req.services.get('gitService');
 *   // ...
 * });
 */
function requireServices(...serviceNames) {
  return (req, res, next) => {
    const missing = [];

    for (const name of serviceNames) {
      if (!req.services || !req.services.has(name)) {
        missing.push(name);
      }
    }

    if (missing.length > 0) {
      logger.error(`Missing required services: ${missing.join(', ')}`);
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Required services not available',
        missing: missing
      });
    }

    next();
  };
}

module.exports = { serviceInjector, requireServices };
