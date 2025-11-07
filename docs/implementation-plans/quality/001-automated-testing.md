# Implementation Plan: Automated Testing Infrastructure

## Metadata

| Field | Value |
|-------|-------|
| **Plan ID** | QA-001 |
| **Status** | 🔴 CRITICAL |
| **Priority** | P0 |
| **Effort** | 8 hours (initial setup) |
| **Owner** | TBD |
| **Created** | 2025-11-07 |
| **Target Version** | v1.0.1 |

## Summary

Establish comprehensive automated testing infrastructure for HomeGuardian with unit tests, integration tests, and E2E tests to ensure code quality and prevent regressions.

## Current State

**Problem:**
- 0 test files
- No testing framework configured
- No CI/CD test pipeline
- Refactoring is risky
- No regression detection

**Risk Level:** 🔴 HIGH

## Motivation

### Quality Impact
- Catch bugs before production
- Safe refactoring
- Documentation through tests
- Faster development cycles

### Business Impact
- Fewer support tickets
- Higher user confidence
- Easier onboarding for contributors
- Professional image

## Technical Design

### Testing Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Testing Pyramid                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                    E2E Tests (10%)                       │
│                  ┌──────────────┐                        │
│                  │  Playwright  │                        │
│                  └──────────────┘                        │
│                                                          │
│              Integration Tests (30%)                     │
│          ┌──────────────────────────┐                    │
│          │  API Tests (Supertest)   │                    │
│          │  Database Tests          │                    │
│          └──────────────────────────┘                    │
│                                                          │
│               Unit Tests (60%)                           │
│     ┌──────────────────────────────────────┐            │
│     │  Services, Utils, Validators, etc.   │            │
│     │  React Components (RTL)              │            │
│     └──────────────────────────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP API testing
- **sqlite3**: In-memory database for tests

**Frontend:**
- **Vitest**: Fast test runner (Vite-native)
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation

**E2E:**
- **Playwright**: Browser automation (future)

### Test Coverage Goals

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Services (GitService, etc.) | 80% | High |
| Routes/Controllers | 70% | High |
| Utils | 90% | High |
| React Components | 60% | Medium |
| Integration | 50% | High |

## Implementation Plan

### Phase 1: Backend Testing Setup (3 hours)

#### Task 1.1: Install Dependencies (15 min)

```bash
cd backend
npm install --save-dev jest supertest @types/jest
```

**File:** `backend/package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "services/**/*.js",
      "routes/**/*.js",
      "utils/**/*.js",
      "!**/__tests__/**"
    ],
    "testMatch": [
      "**/__tests__/**/*.test.js"
    ],
    "setupFilesAfterEnv": ["<rootDir>/__tests__/setup.js"]
  }
}
```

#### Task 1.2: Create Test Infrastructure (30 min)

**File:** `backend/__tests__/setup.js`

```javascript
// Global test setup
const db = require('../config/database');
const logger = require('../utils/logger');

// Suppress logs during tests
logger.transports.forEach(transport => {
  transport.silent = true;
});

// Setup test database
beforeAll(async () => {
  process.env.DATA_PATH = '/tmp/homeguardian-test';
  await db.initialize();
});

afterAll(async () => {
  // Cleanup
  if (db.close) {
    await db.close();
  }
});

// Clear database between tests
afterEach(async () => {
  await db.run('DELETE FROM backup_history');
  await db.run('DELETE FROM settings');
  await db.run('DELETE FROM ssh_keys');
});
```

**File:** `backend/__tests__/helpers/test-utils.js`

```javascript
const db = require('../../config/database');

/**
 * Create a test commit in database
 */
async function createTestCommit(overrides = {}) {
  const defaults = {
    commit_hash: 'abc123' + Math.random().toString(36).substring(7),
    commit_message: 'Test commit',
    commit_date: new Date().toISOString(),
    is_auto: 1,
    is_scheduled: 0,
    push_status: 'pending'
  };

  const data = { ...defaults, ...overrides };

  await db.run(
    `INSERT INTO backup_history
     (commit_hash, commit_message, commit_date, is_auto, is_scheduled, push_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.commit_hash, data.commit_message, data.commit_date,
     data.is_auto, data.is_scheduled, data.push_status]
  );

  return data;
}

/**
 * Create test setting
 */
async function createTestSetting(key, value, encrypted = false) {
  await db.run(
    'INSERT INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
    [key, value, encrypted ? 1 : 0]
  );
}

/**
 * Get all settings
 */
async function getAllSettings() {
  return await db.all('SELECT * FROM settings');
}

module.exports = {
  createTestCommit,
  createTestSetting,
  getAllSettings
};
```

#### Task 1.3: Write Core Service Tests (1.5 hours)

**File:** `backend/__tests__/unit/services/git-service.test.js`

```javascript
const GitService = require('../../../services/git-service');
const fs = require('fs').promises;
const path = require('path');
const db = require('../../../config/database');

describe('GitService', () => {
  let gitService;
  let testConfigPath;

  beforeEach(async () => {
    testConfigPath = path.join('/tmp', `test-config-${Date.now()}`);
    await fs.mkdir(testConfigPath, { recursive: true });

    process.env.CONFIG_PATH = testConfigPath;
    process.env.DATA_PATH = '/tmp/homeguardian-test';

    gitService = new GitService();
  });

  afterEach(async () => {
    try {
      await fs.rm(testConfigPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    test('should initialize git repository on first run', async () => {
      await gitService.initialize();

      const isRepo = await gitService.isGitRepository();
      expect(isRepo).toBe(true);
    });

    test('should create .gitignore file', async () => {
      await gitService.initialize();

      const gitignorePath = path.join(testConfigPath, '.gitignore');
      const exists = await fs.access(gitignorePath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    test('should create initial commit', async () => {
      await gitService.initialize();

      const log = await gitService.git.log({ maxCount: 1 });
      expect(log.latest).toBeDefined();
      expect(log.latest.message).toContain('Initial commit');
    });

    test('should configure git user', async () => {
      await gitService.initialize();

      const userName = await gitService.git.getConfig('user.name');
      const userEmail = await gitService.git.getConfig('user.email');

      expect(userName.value).toBe('HomeGuardian');
      expect(userEmail.value).toBe('homeguardian@homeassistant.local');
    });

    test('should not reinitialize existing repository', async () => {
      await gitService.initialize();
      const firstLog = await gitService.git.log({ maxCount: 1 });

      await gitService.initialize();
      const secondLog = await gitService.git.log({ maxCount: 1 });

      expect(firstLog.latest.hash).toBe(secondLog.latest.hash);
    });
  });

  describe('createCommit', () => {
    beforeEach(async () => {
      await gitService.initialize();
    });

    test('should create commit with changes', async () => {
      // Create a test file
      const testFile = path.join(testConfigPath, 'test.yaml');
      await fs.writeFile(testFile, 'test: content');

      const result = await gitService.createCommit('Test commit', false);

      expect(result).toBeDefined();
      expect(result.hash).toBeTruthy();
      expect(result.message).toBe('Test commit');
      expect(result.filesChanged).toHaveLength(1);
    });

    test('should return null when no changes', async () => {
      const result = await gitService.createCommit('No changes');

      expect(result).toBeNull();
    });

    test('should record commit in database', async () => {
      const testFile = path.join(testConfigPath, 'test.yaml');
      await fs.writeFile(testFile, 'test: content');

      await gitService.createCommit('Test commit', false);

      const commits = await db.all('SELECT * FROM backup_history');
      expect(commits).toHaveLength(2); // Initial + test commit
      expect(commits[1].commit_message).toBe('Test commit');
    });

    test('should mark auto commits correctly', async () => {
      const testFile = path.join(testConfigPath, 'test.yaml');
      await fs.writeFile(testFile, 'auto test');

      await gitService.createCommit('Auto commit', true, false);

      const commit = await db.get(
        'SELECT * FROM backup_history WHERE commit_message = ?',
        ['Auto commit']
      );

      expect(commit.is_auto).toBe(1);
      expect(commit.is_scheduled).toBe(0);
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      await gitService.initialize();

      // Create multiple test commits
      for (let i = 0; i < 5; i++) {
        const testFile = path.join(testConfigPath, `test${i}.yaml`);
        await fs.writeFile(testFile, `content ${i}`);
        await gitService.createCommit(`Commit ${i}`);
      }
    });

    test('should return commit history', async () => {
      const history = await gitService.getHistory(10, 0);

      expect(history).toHaveLength(6); // 5 test commits + initial
      expect(history[0].message).toContain('Commit 4');
    });

    test('should respect limit', async () => {
      const history = await gitService.getHistory(3, 0);

      expect(history).toHaveLength(3);
    });

    test('should include short hash', async () => {
      const history = await gitService.getHistory(1, 0);

      expect(history[0].shortHash).toBeTruthy();
      expect(history[0].shortHash).toHaveLength(7);
    });
  });

  describe('restoreFile', () => {
    beforeEach(async () => {
      await gitService.initialize();
    });

    test('should restore file to previous version', async () => {
      const testFile = path.join(testConfigPath, 'test.yaml');

      // Create v1
      await fs.writeFile(testFile, 'version: 1');
      const v1 = await gitService.createCommit('Version 1');

      // Create v2
      await fs.writeFile(testFile, 'version: 2');
      await gitService.createCommit('Version 2');

      // Restore to v1
      await gitService.restoreFile('test.yaml', v1.hash);

      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('version: 1');
    });

    test('should create safety backup before restore', async () => {
      const testFile = path.join(testConfigPath, 'test.yaml');

      await fs.writeFile(testFile, 'original');
      const original = await gitService.createCommit('Original');

      await fs.writeFile(testFile, 'modified');
      await gitService.createCommit('Modified');

      await gitService.restoreFile('test.yaml', original.hash);

      const commits = await db.all('SELECT * FROM backup_history');
      const safetyBackup = commits.find(c =>
        c.commit_message.includes('Safety backup')
      );

      expect(safetyBackup).toBeDefined();
    });
  });

  describe('getStatus', () => {
    beforeEach(async () => {
      await gitService.initialize();
    });

    test('should return clean status when no changes', async () => {
      const status = await gitService.getStatus();

      expect(status.isClean).toBe(true);
      expect(status.modified).toHaveLength(0);
      expect(status.created).toHaveLength(0);
    });

    test('should detect modified files', async () => {
      const testFile = path.join(testConfigPath, '.gitignore');
      await fs.appendFile(testFile, '\n# Modified');

      const status = await gitService.getStatus();

      expect(status.isClean).toBe(false);
      expect(status.modified).toContain('.gitignore');
    });

    test('should detect new files', async () => {
      const testFile = path.join(testConfigPath, 'new_file.yaml');
      await fs.writeFile(testFile, 'new content');

      const status = await gitService.getStatus();

      expect(status.isClean).toBe(false);
      expect(status.created).toContain('new_file.yaml');
    });
  });
});
```

**File:** `backend/__tests__/unit/services/file-watcher.test.js`

```javascript
const FileWatcher = require('../../../services/file-watcher');
const GitService = require('../../../services/git-service');
const path = require('path');
const fs = require('fs').promises;

describe('FileWatcher', () => {
  let fileWatcher;
  let gitService;
  let testConfigPath;

  beforeEach(async () => {
    testConfigPath = path.join('/tmp', `test-watcher-${Date.now()}`);
    await fs.mkdir(testConfigPath, { recursive: true });

    process.env.CONFIG_PATH = testConfigPath;
    process.env.AUTO_COMMIT_DEBOUNCE = '1'; // 1 second for testing

    gitService = new GitService();
    await gitService.initialize();

    fileWatcher = new FileWatcher(gitService);
  });

  afterEach(async () => {
    if (fileWatcher.isRunning) {
      await fileWatcher.stop();
    }

    try {
      await fs.rm(testConfigPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('start and stop', () => {
    test('should start watcher', async () => {
      await fileWatcher.start();

      expect(fileWatcher.isRunning).toBe(true);
    });

    test('should not start if already running', async () => {
      await fileWatcher.start();
      await fileWatcher.start(); // Should not throw

      expect(fileWatcher.isRunning).toBe(true);
    });

    test('should stop watcher', async () => {
      await fileWatcher.start();
      await fileWatcher.stop();

      expect(fileWatcher.isRunning).toBe(false);
    });
  });

  describe('file change detection', () => {
    test('should detect file creation', async (done) => {
      await fileWatcher.start();

      const testFile = path.join(testConfigPath, 'new_file.yaml');
      await fs.writeFile(testFile, 'content');

      // Wait for debounce + processing
      setTimeout(() => {
        expect(fileWatcher.changedFiles.size).toBeGreaterThan(0);
        done();
      }, 1500);
    });

    test('should detect file modification', async (done) => {
      const testFile = path.join(testConfigPath, 'test.yaml');
      await fs.writeFile(testFile, 'initial');
      await gitService.createCommit('Initial');

      await fileWatcher.start();

      await fs.writeFile(testFile, 'modified');

      setTimeout(() => {
        expect(fileWatcher.changedFiles.size).toBeGreaterThan(0);
        done();
      }, 1500);
    });
  });

  describe('getStatus', () => {
    test('should return watcher status', async () => {
      await fileWatcher.start();

      const status = fileWatcher.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.debounceTime).toBe(1000);
      expect(status.changedFiles).toBeDefined();
    });
  });
});
```

#### Task 1.4: Write Integration Tests (1 hour)

**File:** `backend/__tests__/integration/api.test.js`

```javascript
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');
const { createTestCommit } = require('../helpers/test-utils');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await db.initialize();
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /api/status', () => {
    test('should return system status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.status.git).toBeDefined();
      expect(response.body.status.watcher).toBeDefined();
    });
  });

  describe('POST /api/backup/now', () => {
    test('should create manual backup', async () => {
      const response = await request(app)
        .post('/api/backup/now')
        .send({ message: 'Manual test backup' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/history', () => {
    beforeEach(async () => {
      await createTestCommit({ commit_message: 'Test commit 1' });
      await createTestCommit({ commit_message: 'Test commit 2' });
    });

    test('should return commit history', async () => {
      const response = await request(app)
        .get('/api/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.history).toBeDefined();
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/history?limit=1&offset=0')
        .expect(200);

      expect(response.body.history).toHaveLength(1);
    });
  });

  describe('POST /api/settings', () => {
    test('should create setting', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({
          key: 'test_setting',
          value: 'test_value',
          encrypted: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const setting = await db.get(
        'SELECT * FROM settings WHERE key = ?',
        ['test_setting']
      );

      expect(setting.value).toBe('test_value');
    });
  });
});
```

### Phase 2: Frontend Testing Setup (2 hours)

#### Task 2.1: Install Frontend Dependencies (15 min)

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**File:** `frontend/vite.config.js` (update)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/'
      ]
    }
  }
});
```

**File:** `frontend/package.json` (update)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### Task 2.2: Create Test Infrastructure (15 min)

**File:** `frontend/src/__tests__/setup.js`

```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

#### Task 2.3: Write Component Tests (1.5 hours)

**File:** `frontend/src/__tests__/components/Dashboard.test.jsx`

```javascript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../pages/Dashboard';
import { api } from '../../api/client';

// Mock API
vi.mock('../../api/client', () => ({
  api: {
    status: {
      get: vi.fn()
    },
    backup: {
      now: vi.fn()
    }
  }
}));

describe('Dashboard', () => {
  beforeEach(() => {
    api.status.get.mockResolvedValue({
      data: {
        status: {
          git: {
            isClean: true,
            modified: [],
            created: []
          },
          watcher: {
            isRunning: true,
            changedFiles: []
          },
          lastCommit: {
            hash: 'abc123',
            shortHash: 'abc123',
            message: 'Test commit',
            date: new Date().toISOString()
          },
          remote: {
            configured: false
          }
        }
      }
    });
  });

  test('renders dashboard title', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  test('displays git status', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/clean/i)).toBeInTheDocument();
    });
  });

  test('backup now button triggers backup', async () => {
    const user = userEvent.setup();
    api.backup.now.mockResolvedValue({ data: { success: true } });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/backup now/i)).toBeInTheDocument();
    });

    const backupButton = screen.getByText(/backup now/i);
    await user.click(backupButton);

    expect(api.backup.now).toHaveBeenCalled();
  });

  test('shows loading state while fetching', () => {
    render(<Dashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    api.status.get.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Phase 3: CI/CD Integration (30 min)

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run backend tests
        working-directory: ./backend
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
```

### Phase 4: Documentation (30 min)

**File:** `TESTING.md`

```markdown
# Testing Guide

## Running Tests

### Backend Tests

\`\`\`bash
cd backend

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
\`\`\`

### Frontend Tests

\`\`\`bash
cd frontend

# Run all tests
npm test

# Run in watch mode (UI)
npm run test:ui

# Run with coverage
npm run test:coverage
\`\`\`

## Writing Tests

### Backend Unit Test Example

\`\`\`javascript
describe('MyService', () => {
  test('should do something', () => {
    const result = myService.doSomething();
    expect(result).toBe(expected);
  });
});
\`\`\`

### Frontend Component Test Example

\`\`\`javascript
import { render, screen } from '@testing-library/react';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
\`\`\`

## Coverage Goals

- Backend Services: 80%
- Backend Routes: 70%
- Frontend Components: 60%
- Overall: 70%
```

## Success Metrics

- ✅ 70%+ overall test coverage
- ✅ All new code includes tests
- ✅ CI/CD pipeline runs tests automatically
- ✅ Tests run in < 30 seconds
- ✅ 0 flaky tests

## Rollout Plan

1. **Week 1:** Setup infrastructure + core service tests
2. **Week 2:** API integration tests + critical component tests
3. **Week 3:** Increase coverage to 70%
4. **Ongoing:** Maintain coverage with new features

---

**Status:** ✅ Ready for Implementation
