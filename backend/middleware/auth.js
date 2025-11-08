const axios = require('axios');
const logger = require('../utils/logger');

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
 */
async function authenticate(req, res, next) {
  try {
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
        return next();
      }
    }

    // Mode 3: Session (development only)
    if (process.env.NODE_ENV === 'development' && req.session?.user) {
      req.user = req.session.user;
      return next();
    }

    // No valid authentication found
    logger.warn(`Unauthorized access attempt: ${req.method} ${req.path} from ${req.ip}`);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication required'
    });

  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
}

/**
 * Optional authentication middleware
 * Attempts authentication but allows request to continue even if it fails
 */
function optionalAuth(req, res, next) {
  authenticate(req, res, (err) => {
    // Even if authentication fails, allow request to continue
    if (err || !req.user) {
      req.user = null;
    }
    next();
  });
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
  shouldBypassRateLimit
};
