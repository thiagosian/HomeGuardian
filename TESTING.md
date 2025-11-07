# Testing Guide

HomeGuardian uses automated testing to ensure code quality and prevent regressions.

## Testing Stack

### Backend
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP API testing
- **SQLite**: In-memory database for tests

### Frontend (Coming Soon)
- **Vitest**: Fast test runner (Vite-native)
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Frontend Tests (Coming Soon)

```bash
cd frontend

# Run all tests
npm test

# Run in watch mode (UI)
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Structure

```
backend/
├── __tests__/
│   ├── setup.js                    # Global test configuration
│   ├── helpers/
│   │   └── test-utils.js           # Test helper functions
│   ├── unit/
│   │   ├── middleware/
│   │   │   ├── validate.test.js    # Validation middleware tests
│   │   │   └── rate-limit.test.js  # Rate limiting tests
│   │   ├── validation/
│   │   │   └── schemas.test.js     # Schema validation tests
│   │   └── services/               # Service layer tests (future)
│   └── integration/
│       └── api.test.js             # API endpoint tests
```

## Writing Tests

### Backend Unit Test Example

```javascript
describe('MyService', () => {
  test('should do something', () => {
    const result = myService.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Backend Integration Test Example

```javascript
const request = require('supertest');
const app = require('../../server');

describe('GET /api/status', () => {
  test('should return system status', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body.status).toBeDefined();
  });
});
```

### Frontend Component Test Example (Future)

```javascript
import { render, screen } from '@testing-library/react';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Test Helpers

The `test-utils.js` file provides helper functions for common test scenarios:

```javascript
const { createTestCommit, createTestSetting } = require('../helpers/test-utils');

// Create a test commit in the database
await createTestCommit({
  commit_message: 'Test commit',
  is_auto: 1
});

// Create a test setting
await createTestSetting('key', 'value', false);
```

## Coverage Goals

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Backend Middleware | 80% | ✅ Implemented |
| Backend Validation | 90% | ✅ Implemented |
| Backend Services | 80% | 📝 Planned |
| Backend Routes | 70% | 🔄 In Progress |
| Frontend Components | 60% | 📝 Planned |
| **Overall** | **70%** | 🔄 In Progress |

## Best Practices

### Test Isolation
- Each test should be independent and not rely on other tests
- Use `beforeEach` and `afterEach` to set up and tear down test state
- Clear database between tests (handled in `setup.js`)

### Test Naming
- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Example: `should reject invalid data when validation fails`

### Assertions
- Use specific assertions that clearly show what is expected
- Prefer `toBe()` for primitives and `toEqual()` for objects
- Use `toBeInTheDocument()` for DOM element existence
- Always check both success and failure cases

### Mocking
- Mock external dependencies (APIs, file system, database)
- Use Jest's built-in mocking: `jest.fn()`, `jest.mock()`
- Reset mocks between tests to avoid side effects

### Async Tests
- Always use `async/await` for asynchronous code
- Don't forget to `await` promises in tests
- Use `waitFor()` in React tests for async updates

## Continuous Integration

Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request to `main`
- Before creating releases

CI will fail if:
- Any test fails
- Coverage drops below threshold
- Tests timeout (>5 minutes)

## Troubleshooting

### Tests Fail Locally But Pass in CI
- Ensure you're using the correct Node.js version (18+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for environment-specific issues

### Tests Timeout
- Increase Jest timeout: `jest.setTimeout(10000)` in setup.js
- Check for unhandled promises or async operations
- Ensure cleanup happens in `afterEach`/`afterAll`

### Database Errors
- Ensure test database is properly initialized in `setup.js`
- Check that tables are cleared between tests
- Use unique IDs/keys to avoid conflicts

### Rate Limiting Tests Fail
- Rate limit tests may be timing-sensitive
- Increase test timeout for rate limit tests
- Consider using fake timers: `jest.useFakeTimers()`

## Future Enhancements

- [ ] Frontend component tests with Vitest + React Testing Library
- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Code coverage badges in README
- [ ] Automated test report generation

## Contributing

When submitting a pull request:
1. Write tests for new features
2. Update existing tests if behavior changes
3. Ensure all tests pass: `npm test`
4. Maintain or improve coverage: `npm run test:coverage`

---

**Questions?** Open an issue or ask in GitHub Discussions.
