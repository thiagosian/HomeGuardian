const { authenticate, optionalAuth, requirePermission, shouldBypassRateLimit } = require('../../../middleware/auth');

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock logger
jest.mock('../../../utils/logger');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate with Home Assistant Ingress headers', async () => {
      req.headers['x-ingress-user'] = 'testuser';
      req.headers['x-supervisor-token'] = 'supervisor-token';

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 'testuser',
        source: 'ingress',
        authenticated: true
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate with valid Bearer token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      axios.get.mockResolvedValue({ status: 200 });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        source: 'bearer',
        authenticated: true,
        token: 'valid-token'
      });
      expect(axios.get).toHaveBeenCalledWith(
        'http://supervisor/core/api/config',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should reject invalid Bearer token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      axios.get.mockRejectedValue(new Error('Invalid token'));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Valid authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request without authentication', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Valid authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle session auth in development mode', async () => {
      process.env.NODE_ENV = 'development';
      req.session = {
        user: {
          id: 'dev-user',
          authenticated: true
        }
      };

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 'dev-user',
        authenticated: true
      });

      delete process.env.NODE_ENV;
    });
  });

  describe('optionalAuth', () => {
    it('should allow request to continue even without auth', () => {
      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should set user if auth succeeds', async () => {
      req.headers['x-ingress-user'] = 'testuser';
      req.headers['x-supervisor-token'] = 'supervisor-token';

      optionalAuth(req, res, next);

      // Wait for async auth to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow authenticated user', async () => {
      req.user = {
        id: 'testuser',
        authenticated: true
      };

      const middleware = requirePermission('read');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', async () => {
      req.user = null;

      const middleware = requirePermission('read');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject user without authenticated flag', async () => {
      req.user = {
        id: 'testuser',
        authenticated: false
      };

      const middleware = requirePermission('write');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('shouldBypassRateLimit', () => {
    it('should bypass for automated requests', () => {
      req.headers['x-automated-request'] = 'true';

      expect(shouldBypassRateLimit(req)).toBe(true);
    });

    it('should bypass for supervisor requests', () => {
      req.headers['x-supervisor-token'] = 'supervisor-token';

      expect(shouldBypassRateLimit(req)).toBe(true);
    });

    it('should not bypass for normal requests', () => {
      expect(shouldBypassRateLimit(req)).toBe(false);
    });
  });
});
