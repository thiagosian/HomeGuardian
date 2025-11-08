const logger = require('../utils/logger');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Distinguish operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, details);
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict error
 */
class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      ip: req.ip,
      user: req.user?.id
    });
  } else if (statusCode >= 400) {
    logger.warn('Client error:', {
      error: message,
      method: req.method,
      path: req.path,
      ip: req.ip,
      statusCode
    });
  }

  // Prepare standardized response format
  const response = {
    success: false,
    error: {
      message: message,
      code: err.name || 'ERROR',
      statusCode
    }
  };

  // Add details in development or if provided
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    response.error.stack = err.stack;
    if (err.details) {
      response.error.details = err.details;
    }
  } else if (err.details && Object.keys(err.details).length > 0) {
    response.error.details = err.details;
  }

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  // Send response
  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError('Endpoint');
  error.details = {
    method: req.method,
    path: req.path
  };
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
