# Error Handling Architecture

## Overview

HomeGuardian implements a centralized error handling system with custom error classes and a global error handler middleware.

## Error Classes

### AppError (Base Class)
```javascript
new AppError(message, statusCode, details)
```
Base class for all operational errors. Includes:
- `message`: Error message
- `statusCode`: HTTP status code
- `details`: Additional context
- `isOperational`: Flag to distinguish from programming errors

### Specialized Errors

#### ValidationError (400)
```javascript
new ValidationError('Invalid input', { field: 'email' })
```
Used for request validation failures.

#### AuthenticationError (401)
```javascript
new AuthenticationError('Token expired')
```
Used when authentication fails or is missing.

#### AuthorizationError (403)
```javascript
new AuthorizationError('Insufficient permissions')
```
Used when user lacks required permissions.

#### NotFoundError (404)
```javascript
new NotFoundError('User')
```
Used when a resource doesn't exist.

#### ConflictError (409)
```javascript
new ConflictError('Email already exists')
```
Used for state conflicts (e.g., duplicate resources).

#### RateLimitError (429)
```javascript
new RateLimitError('Too many login attempts')
```
Used when rate limits are exceeded.

## Usage in Routes

### With asyncHandler
```javascript
const { asyncHandler, NotFoundError } = require('../middleware/error-handler');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({ user });
}));
```

### Manual Error Handling
```javascript
router.post('/users', async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.json({ user });
  } catch (error) {
    next(new ConflictError('User already exists'));
  }
});
```

## Error Response Format

### Production
```json
{
  "error": "User not found",
  "statusCode": 404
}
```

### Development
```json
{
  "error": "User not found",
  "statusCode": 404,
  "stack": "Error: User not found\n    at ...",
  "details": {
    "userId": "123"
  }
}
```

## Logging

- **5xx errors**: Logged as errors with full stack trace
- **4xx errors**: Logged as warnings
- All logs include request context (method, path, IP, user)

## Integration

In `server.js`:
```javascript
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');

// ... routes ...

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);
```
