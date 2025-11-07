const { ZodError } = require('zod');
const logger = require('../utils/logger');

/**
 * Express middleware factory for Zod validation
 * @param {Object} schema - Zod schema object
 * @param {string} source - 'body' | 'query' | 'params'
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const data = req[source];

      // Validate and parse
      const validated = await schema.parseAsync(data);

      // Replace original data with validated/transformed data
      req[source] = validated;

      // Add validated flag for debugging
      req.validated = true;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validation failed', {
          source,
          errors: formattedErrors,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors
        });
      }

      // Unexpected error
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
}

/**
 * Validate multiple sources at once
 * @param {Object} schemas - { body: schema, query: schema, params: schema }
 * @returns {Function} Express middleware
 */
function validateMultiple(schemas) {
  return async (req, res, next) => {
    try {
      for (const [source, schema] of Object.entries(schemas)) {
        if (schema) {
          const validated = await schema.parseAsync(req[source]);
          req[source] = validated;
        }
      }

      req.validated = true;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validation failed', {
          errors: formattedErrors,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors
        });
      }

      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
}

module.exports = { validate, validateMultiple };
