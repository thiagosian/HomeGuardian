const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Authentication mode configuration
 * - 'required': Authentication is mandatory (secure, for production)
 * - 'optional': Authentication is optional (default, for trusted networks/reverse proxy)
 * - 'disabled': No authentication (development only)
 */
const AUTH_MODE = process.env.AUTH_MODE || 'optional';

// Log authentication mode on startup
if (AUTH_MODE === 'disabled') {
  logger.warn('⚠️  Authentication is DISABLED - This should only be used in development!');
} else if (AUTH_MODE === 'optional') {
  logger.info('ℹ️  Authentication is OPTIONAL - Access allowed without credentials');
} else {
  logger.info('🔒 Authentication is REQUIRED - All requests must be authenticated');
}

/**
 * Validates Home Assistant token via Supervisor API
 * @param {string} token - Bearer token
 * @returns {Promise<boolean>} True if valid
 */
async function validateHAToken(token) {
  try {
    const response = await axios.get('http://supervisor/core/api/config', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    logger.warn('HA token validation failed:', error.message);
    return false;
  }
}

/**
 * Authentication middleware
 * Supports multiple authentication modes:
 * 1. Home Assistant Ingress (automatic headers)
 * 2. Bearer token for API access
 * 3. Session-based auth (development)
 *
 * Behavior depends on AUTH_MODE environment variable:
 * - 'required': Reject requests without valid authentication (401)
 * - 'optional': Allow requests without authentication (default)
 * - 'disabled': Skip authentication entirely
 */
async function authenticate(req, res, next) {
  try {
    // If authentication is disabled, skip all checks
    if (AUTH_MODE === 'disabled') {
      req.user = {
        source: 'disabled',
        authenticated: false
      };
      return next();
    }

    // Try to authenticate the request
    let authenticated = false;

    // Mode 1: Home Assistant Ingress
    // Supervisor injects these headers automatically
    const ingressUser = req.headers['x-ingress-user'];
    const supervisorToken = req.headers['x-supervisor-token'];

    if (ingressUser && supervisorToken) {
      req.user = {
        id: ingressUser,
        source: 'ingress',
        authenticated: true
      };
      authenticated = true;
      return next();
    }

    // Mode 2: Bearer Token (for direct API access)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Validate token with Home Assistant
      const isValid = await validateHAToken(token);
      if (isValid) {
        req.user = {
          source: 'bearer',
          authenticated: true,
          token
        };
        authenticated = true;
        return next();
      }
    }

    // Mode 3: Session (development only)
    if (process.env.NODE_ENV === 'development' && req.session?.user) {
      req.user = req.session.user;
      authenticated = true;
      return next();
    }

    // No valid authentication found
    if (AUTH_MODE === 'required') {
      // In 'required' mode, reject unauthenticated requests
      logger.warn(`Unauthorized access attempt: ${req.method} ${req.path} from ${req.ip}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication required'
      });
    } else {
      // In 'optional' mode, allow unauthenticated requests
      req.user = {
        source: 'anonymous',
        authenticated: false
      };
      return next();
    }

  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
}

/**
 * Optional authentication middleware (DEPRECATED)
 * Note: This is now redundant since the main authenticate() middleware
 * respects AUTH_MODE. Use authenticate() directly instead.
 * This function is kept for backward compatibility only.
 */
function optionalAuth(req, res, next) {
  // Simply call authenticate - it will handle optional mode
  authenticate(req, res, next);
}

/**
 * Middleware to require specific permissions
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user || !req.user.authenticated) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource'
      });
    }

    // For now, all authenticated users have all permissions
    // In the future, implement granular permissions here

    next();
  };
}

/**
 * Rate limiting bypass for automated requests
 * @param {Request} req - Express request
 * @returns {boolean} True if should bypass rate limiting
 */
function shouldBypassRateLimit(req) {
  // Check if request is from automated system
  const automatedHeader = req.headers['x-automated-request'];
  if (automatedHeader === 'true') {
    return true;
  }

  // Check if request is from supervisor
  const supervisorToken = req.headers['x-supervisor-token'];
  if (supervisorToken) {
    return true;
  }

  return false;
}

module.exports = {
  authenticate,
  optionalAuth,
  requirePermission,
  shouldBypassRateLimit,
  AUTH_MODE
};
