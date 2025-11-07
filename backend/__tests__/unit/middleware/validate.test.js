const { validate, validateMultiple } = require('../../../middleware/validate');
const { z } = require('zod');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'POST'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('validate()', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().min(0, 'Age must be positive')
    });

    test('should validate valid body data', async () => {
      req.body = { name: 'John', age: 25 };
      const middleware = validate(testSchema);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validated).toBe(true);
      expect(req.body).toEqual({ name: 'John', age: 25 });
    });

    test('should reject invalid data', async () => {
      req.body = { name: '', age: -5 };
      const middleware = validate(testSchema);

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'age' })
          ])
        })
      );
    });

    test('should validate query parameters', async () => {
      const querySchema = z.object({
        page: z.coerce.number().min(1)
      });

      req.query = { page: '5' };
      const middleware = validate(querySchema, 'query');

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(5); // Type coerced to number
    });

    test('should validate route params', async () => {
      const paramsSchema = z.object({
        id: z.string().regex(/^[0-9]+$/, 'Invalid ID')
      });

      req.params = { id: '123' };
      const middleware = validate(paramsSchema, 'params');

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validated).toBe(true);
    });

    test('should handle unexpected errors', async () => {
      const brokenSchema = {
        parseAsync: jest.fn().mockRejectedValue(new Error('Unexpected error'))
      };

      const middleware = validate(brokenSchema);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal validation error'
      });
    });
  });

  describe('validateMultiple()', () => {
    test('should validate multiple sources', async () => {
      const schemas = {
        body: z.object({ name: z.string() }),
        query: z.object({ page: z.coerce.number() }),
        params: z.object({ id: z.string() })
      };

      req.body = { name: 'John' };
      req.query = { page: '1' };
      req.params = { id: '123' };

      const middleware = validateMultiple(schemas);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validated).toBe(true);
      expect(req.query.page).toBe(1);
    });

    test('should reject if any source fails validation', async () => {
      const schemas = {
        body: z.object({ name: z.string().min(1) }),
        query: z.object({ page: z.coerce.number().min(1) })
      };

      req.body = { name: '' }; // Invalid
      req.query = { page: '5' }; // Valid

      const middleware = validateMultiple(schemas);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
