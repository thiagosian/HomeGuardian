# Development Guide

## Overview

This guide covers the development setup, workflow, and best practices for contributing to HomeGuardian.

## Prerequisites

### Required Software

- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **Git**: v2.30 or later
- **SQLite**: v3.x
- **Docker**: v20.10+ (for testing containerization)

### Recommended Tools

- **VS Code**: With extensions:
  - ESLint
  - Prettier
  - GitLens
  - Docker
  - SQLite Viewer
- **Postman** or **Insomnia**: For API testing
- **Git GUI**: GitKraken, SourceTree, or similar

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/thiagosian/HomeGuardian.git
cd HomeGuardian
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

### 3. Set Up Git Hooks (Optional)

```bash
# Install husky for pre-commit hooks
npm install -g husky

# Initialize husky
cd backend
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
```

### 4. Configure Development Environment

Create `.env` files for local development:

**backend/.env**
```env
NODE_ENV=development
PORT=8099
DATA_PATH=./dev-data
CONFIG_PATH=./dev-config
LOG_LEVEL=debug

# Database
DATABASE_PATH=./dev-data/homeguardian.db

# Security (for development only)
DISABLE_AUTH=true
ENCRYPTION_KEY_PATH=./dev-data/.encryption_key

# Git
GIT_USER_NAME=Developer
GIT_USER_EMAIL=dev@homeguardian.local
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:8099/api
VITE_WS_URL=ws://localhost:8099
```

### 5. Initialize Development Data

```bash
# Create development directories
mkdir -p backend/dev-data backend/dev-config

# Initialize development Git repository
cd backend/dev-config
git init
git config user.name "Developer"
git config user.email "dev@homeguardian.local"

# Create sample Home Assistant configuration
cat > configuration.yaml << EOF
homeassistant:
  name: Dev Home
  latitude: 0
  longitude: 0

automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml
EOF

echo "[]" > automations.yaml
echo "{}" > scripts.yaml
echo "[]" > scenes.yaml

git add .
git commit -m "Initial development configuration"
cd ../../..
```

## Development Workflow

### Running the Application

#### Backend (Development Mode)

```bash
cd backend
npm run dev
```

This starts the backend with:
- Hot reload (nodemon)
- Debug logging
- Source maps
- Port 8099

#### Frontend (Development Mode)

```bash
cd frontend
npm run dev
```

This starts the frontend with:
- Hot Module Replacement (HMR)
- Vite dev server
- Port 5173

Access the application at: `http://localhost:5173`

### Running Both Concurrently

From the project root:

```bash
# Install concurrently
npm install -g concurrently

# Run both
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

### Code Quality

#### Linting

```bash
# Backend
cd backend
npm run lint
npm run lint:fix  # Auto-fix issues

# Frontend
cd frontend
npm run lint
npm run lint:fix
```

#### Formatting

```bash
# Backend
cd backend
npm run format
npm run format:check

# Frontend
cd frontend
npm run format
npm run format:check
```

#### Type Checking (if using TypeScript)

```bash
npm run type-check
```

### Testing

#### Running Tests

```bash
# Backend - All tests
cd backend
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific test file
npm test -- auth.test.js

# Frontend - All tests
cd frontend
npm test
```

#### Writing Tests

**Unit Test Example (Backend)**

Create file: `backend/__tests__/unit/utils/cache.test.js`

```javascript
const Cache = require('../../../utils/cache');

describe('Cache', () => {
  let cache;

  beforeEach(() => {
    cache = new Cache();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });
  });

  describe('TTL', () => {
    it('should expire values after TTL', (done) => {
      cache.set('key1', 'value1', 100); // 100ms TTL

      setTimeout(() => {
        expect(cache.get('key1')).toBeNull();
        done();
      }, 150);
    });
  });
});
```

**Integration Test Example**

Create file: `backend/__tests__/integration/api/health.test.js`

```javascript
const request = require('supertest');
const app = require('../../../server');

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready', true);
    });
  });
});
```

### Database Management

#### Accessing Development Database

```bash
# SQLite CLI
sqlite3 backend/dev-data/homeguardian.db

# Useful queries
sqlite> .tables
sqlite> .schema backups
sqlite> SELECT * FROM backups LIMIT 10;
```

#### Resetting Database

```bash
# Backup current database
cp backend/dev-data/homeguardian.db backend/dev-data/homeguardian.db.backup

# Delete and restart server to recreate
rm backend/dev-data/homeguardian.db
cd backend && npm run dev
```

#### Database Migrations

When adding new tables or columns:

1. Create migration file: `backend/migrations/YYYY-MM-DD-description.js`
2. Implement `up()` and `down()` functions
3. Run migration: `npm run migrate`

### API Development

#### Testing with curl

```bash
# Health check
curl http://localhost:8099/api/health

# Create backup
curl -X POST http://localhost:8099/api/backup-now \
  -H "Content-Type: application/json" \
  -d '{"message": "Test backup"}'

# List commits
curl http://localhost:8099/api/commits?limit=5
```

#### API Documentation Updates

When adding/modifying endpoints:

1. Update `docs/api/README.md`
2. Add request/response examples
3. Document error cases
4. Update Postman collection

### Frontend Development

#### Component Development

```bash
# Create new component
cd frontend/src/components
mkdir NewComponent
touch NewComponent/index.jsx NewComponent/styles.css
```

**Component Template**

```jsx
// frontend/src/components/NewComponent/index.jsx
import React from 'react';
import './styles.css';

const NewComponent = ({ prop1, prop2 }) => {
  return (
    <div className="new-component">
      <h2>{prop1}</h2>
      <p>{prop2}</p>
    </div>
  );
};

export default NewComponent;
```

#### State Management

HomeGuardian uses React Context for state management:

```jsx
// Example: Using BackupContext
import { useBackup } from '../../contexts/BackupContext';

const MyComponent = () => {
  const { commits, loading, fetchCommits } = useBackup();

  useEffect(() => {
    fetchCommits();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : `${commits.length} commits`}
    </div>
  );
};
```

#### Styling

- Use CSS Modules for component-specific styles
- Follow Material-UI theming conventions
- Responsive design: mobile-first approach

### Debugging

#### Backend Debugging

**VS Code Launch Configuration** (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "restart": true,
      "runtimeExecutable": "nodemon",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

**Manual Debugging**

```bash
# Start with inspector
node --inspect backend/server.js

# Or with nodemon
nodemon --inspect backend/server.js

# Chrome DevTools: chrome://inspect
```

#### Frontend Debugging

- Use React DevTools browser extension
- Use Redux DevTools for state debugging
- Chrome DevTools → Sources → Webpack sources

### Git Workflow

#### Branch Naming

- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation
- `refactor/description`: Code refactoring
- `test/description`: Test additions/fixes

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(api): add pagination to commits endpoint

Add query parameters for page and limit to /api/commits.
Includes HATEOAS links for navigation.

Closes #123
```

```
fix(watcher): prevent duplicate commits on rapid file changes

Increase debounce time and add file hash comparison
to avoid committing identical content.

Fixes #456
```

### Docker Development

#### Building Image

```bash
docker build -t homeguardian:dev .
```

#### Running Container

```bash
docker run -it --rm \
  -p 8099:8099 \
  -v $(pwd)/backend/dev-data:/data \
  -v $(pwd)/backend/dev-config:/config \
  -e NODE_ENV=development \
  homeguardian:dev
```

#### Docker Compose Development

```bash
# Start services
docker-compose -f docker-compose.dev.yml up

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Code Style Guide

### JavaScript/Node.js

- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use async/await over callbacks
- Maximum function length: 50 lines
- Maximum complexity: 10
- Use meaningful variable names

**Good:**
```javascript
const getUserById = async (userId) => {
  const user = await db.findUser(userId);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
};
```

**Bad:**
```javascript
function getUser(id) {
  return db.findUser(id).then(u => {
    if (!u) throw new Error('Not found');
    return u;
  });
}
```

### React

- Use functional components with hooks
- Keep components small and focused
- Use PropTypes or TypeScript for type checking
- Extract complex logic to custom hooks

### Error Handling

Always use custom error classes:

```javascript
const { NotFoundError, ValidationError } = require('../middleware/error-handler');

// Good
throw new NotFoundError('User');

// Bad
throw new Error('User not found');
```

### Security

- Never commit secrets or API keys
- Use parameterized queries (prepared statements)
- Validate all user input
- Use `execFile` instead of `exec`
- Encrypt sensitive data at rest

## Performance Guidelines

### Backend

- Use caching for frequently accessed data
- Implement pagination for large datasets
- Use connection pooling for databases
- Profile with Node.js profiler

### Frontend

- Lazy load components
- Memoize expensive computations
- Optimize images and assets
- Use virtual scrolling for long lists

## Documentation

### Code Comments

- Document "why", not "what"
- Use JSDoc for functions

```javascript
/**
 * Rotates the encryption key and re-encrypts all sensitive data.
 * This is a critical operation that should be done rarely.
 *
 * @returns {Promise<void>}
 * @throws {Error} If re-encryption fails
 */
async function rotateKey() {
  // Implementation
}
```

### README Updates

When adding features, update:
- Feature list in README.md
- Architecture section
- Configuration options

## Release Process

### Version Bump

```bash
# Patch: 1.0.0 → 1.0.1
npm version patch

# Minor: 1.0.0 → 1.1.0
npm version minor

# Major: 1.0.0 → 2.0.0
npm version major
```

### Changelog

Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [1.1.0] - 2025-11-08

### Added
- Pagination support for commits API
- Health check endpoints for Kubernetes

### Changed
- Improved error handling with custom error classes

### Fixed
- Command injection vulnerability in SSH key generation

### Security
- Replaced crypto-js with native Node.js crypto
```

### Building Release

```bash
# Build frontend
cd frontend
npm run build

# Build Docker image
docker build -t homeguardian:1.1.0 .
docker tag homeguardian:1.1.0 homeguardian:latest

# Create Git tag
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 8099
lsof -i :8099

# Kill process
kill -9 <PID>
```

#### Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Git Issues

```bash
# Reset development repository
cd backend/dev-config
rm -rf .git
git init
git add .
git commit -m "Reset development repo"
```

## Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community help
- **Documentation**: Check docs/ directory first
- **Code Review**: Tag maintainers in PRs

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Pull request process
- Code review guidelines
- Community guidelines
- License information
