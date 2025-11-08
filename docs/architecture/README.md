# Architecture Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Application Layers](#application-layers)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Related Documentation](#related-documentation)

## System Architecture

HomeGuardian follows a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  React SPA (Vite) + Material-UI + React Router          │
│  - Dashboard, History, Diff Viewer, Settings            │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API + WebSocket
┌──────────────────▼──────────────────────────────────────┐
│                    Application Layer                     │
│  Node.js (Express.js) + Middleware Stack                │
│  - Authentication, Routing, Business Logic              │
│  - File Watcher, Git Operations, Backup Manager        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                      Data Layer                          │
│  SQLite + Git Repository + File System                  │
│  - Metadata, Configuration, Version History             │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18.x | JavaScript runtime |
| Framework | Express.js | 4.x | Web framework |
| Git Operations | simple-git | 3.x | Git integration |
| File Watching | Chokidar | 3.x | File system monitoring |
| Database | SQLite | 3.x | Metadata storage |
| Encryption | Node.js crypto | Native | AES-256-GCM encryption |
| YAML Parsing | js-yaml | 4.x | Configuration parsing |
| Testing | Jest | 29.x | Unit/integration tests |
| Linting | ESLint | 8.x | Code quality |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 18.x | UI library |
| Build Tool | Vite | 5.x | Fast build/dev server |
| UI Library | Material-UI | 5.x | Component library |
| Routing | React Router | 6.x | Client-side routing |
| State | React Context | Built-in | State management |
| HTTP Client | Axios | 1.x | API requests |
| Diff Viewer | react-diff-viewer | 3.x | Visual diffs |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container | Docker | Application packaging |
| Orchestration | Kubernetes | Container orchestration |
| CI/CD | GitHub Actions | Automated testing/builds |
| Monitoring | Prometheus | Metrics collection |

## Application Layers

### 1. Presentation Layer (Frontend)

**Location:** `/frontend`

#### Components

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Dashboard/       # Main dashboard
│   │   ├── History/         # Commit history viewer
│   │   ├── DiffViewer/      # Visual diff comparison
│   │   ├── Settings/        # Configuration UI
│   │   └── Common/          # Shared components
│   ├── contexts/            # React Context providers
│   │   ├── BackupContext.jsx
│   │   └── SettingsContext.jsx
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client
│   └── utils/               # Helper functions
```

#### Responsibilities

- User interface rendering
- User input handling
- API communication
- State management
- Real-time updates

### 2. Application Layer (Backend)

**Location:** `/backend`

#### Structure

```
backend/
├── server.js                # Application entry point
├── routes/                  # API endpoint definitions
│   ├── health.js           # Health checks
│   ├── backup.js           # Backup operations
│   ├── commits.js          # Git history
│   └── settings.js         # Configuration
├── middleware/              # Express middleware
│   ├── auth.js             # Authentication
│   ├── error-handler.js    # Error handling
│   ├── security-headers.js # Security headers
│   ├── compression.js      # Response compression
│   └── rate-limiter.js     # Rate limiting
├── services/                # Business logic
│   ├── git-service.js      # Git operations
│   ├── backup-service.js   # Backup management
│   ├── watcher-service.js  # File monitoring
│   └── parser-service.js   # YAML parsing
├── utils/                   # Utilities
│   ├── crypto-manager.js   # Encryption
│   ├── cache.js            # Caching
│   └── pagination.js       # Pagination
└── database/                # Database
    ├── connection.js       # DB connection
    └── schema.sql          # Database schema
```

#### Responsibilities

- Request routing
- Business logic execution
- Authentication/authorization
- Git operations
- File system monitoring
- Data persistence
- Error handling

### 3. Data Layer

#### SQLite Database

**Schema:**

```sql
-- Backup metadata
CREATE TABLE backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commit_hash TEXT NOT NULL,
  message TEXT,
  author TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  files_changed INTEGER,
  remote_synced BOOLEAN DEFAULT 0
);

-- SSH keys (encrypted)
CREATE TABLE ssh_keys (
  id INTEGER PRIMARY KEY,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  encrypted BOOLEAN DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Remote repositories
CREATE TABLE remotes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  branch TEXT DEFAULT 'main',
  last_push DATETIME,
  active BOOLEAN DEFAULT 1
);
```

#### Git Repository

**Location:** `/data/repo`

- Stores Home Assistant configuration as Git repository
- Commit history with full diffs
- Remote sync capability
- Branch management

#### File System

```
/data/
├── homeguardian.db         # SQLite database
├── .encryption_key         # AES-256 key (600 permissions)
├── repo/                   # Git repository
│   └── .git/              # Git metadata
├── .ssh/                   # SSH keys
│   ├── id_rsa             # Private key (encrypted)
│   └── id_rsa.pub         # Public key
└── logs/                   # Application logs
```

## Data Flow

### 1. File Change Detection

```
┌─────────────┐
│ HA Config   │ File modified
│ Change      ├──────────────┐
└─────────────┘              │
                             ▼
                    ┌─────────────────┐
                    │ Chokidar        │
                    │ File Watcher    │
                    └────────┬────────┘
                             │ Event
                             ▼
                    ┌─────────────────┐
                    │ Debounce        │ Wait N seconds
                    │ (60s default)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Git Add         │
                    │ Git Commit      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Save to DB      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Auto Push?      │
                    │ (if enabled)    │
                    └─────────────────┘
```

### 2. Backup Creation (Manual)

```
┌─────────────┐
│ User clicks │
│ "Backup Now"│
└──────┬──────┘
       │ POST /api/backup-now
       ▼
┌─────────────────┐
│ Authentication  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Git Operations  │
│ - git add .     │
│ - git commit    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Database │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Response │
│ {commitHash}    │
└─────────────────┘
```

### 3. Restore Operation

```
┌─────────────┐
│ User selects│
│ commit/file │
└──────┬──────┘
       │ POST /api/restore
       ▼
┌─────────────────┐
│ Create Safety   │
│ Backup First    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Git Checkout    │
│ File/Commit     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Database │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notify HA       │
│ Reload Required │
└─────────────────┘
```

## Security Architecture

### Authentication Flow

```
┌─────────────────┐
│ User Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Authentication Middleware               │
│                                         │
│ 1. Check X-Ingress-User header         │
│    ├─ Yes → Authenticate via HA        │
│    └─ No  → Continue                   │
│                                         │
│ 2. Check Bearer Token                  │
│    ├─ Valid → Authenticate             │
│    └─ Invalid → Continue               │
│                                         │
│ 3. Check Session (dev only)            │
│    ├─ Valid → Authenticate             │
│    └─ Invalid → 401 Unauthorized       │
└─────────────────────────────────────────┘
```

### Data Encryption

**Encryption Manager:** `backend/utils/crypto-manager.js`

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes, randomly generated per encryption)
- **Tag Size:** 128 bits (16 bytes, for authentication)

**Encrypted Data:**
- SSH private keys
- Personal access tokens
- Sensitive settings
- Remote repository credentials

**Key Management:**
- Auto-generated on first startup
- Stored at `/data/.encryption_key`
- Permissions: 600 (read/write owner only)
- Key rotation supported (re-encrypts all data)

### Security Headers

Applied via `security-headers.js` middleware:

```javascript
{
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### Command Injection Prevention

All system commands use `execFile` instead of `exec`:

```javascript
// Safe - arguments passed as array
await execFile('ssh-keygen', ['-t', 'rsa', '-b', '4096'], options);

// Unsafe - would allow injection
await exec(`ssh-keygen -t rsa -b 4096`);
```

## Deployment Architecture

### Home Assistant Add-on

```
┌────────────────────────────────────────────┐
│ Home Assistant Supervisor                  │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Ingress Proxy                        │ │
│  │ (Authentication + Routing)           │ │
│  └───────────────┬──────────────────────┘ │
│                  │                         │
│  ┌───────────────▼──────────────────────┐ │
│  │ HomeGuardian Add-on                  │ │
│  │                                      │ │
│  │  ├─ Frontend (Port 8099)             │ │
│  │  ├─ Backend (Express.js)             │ │
│  │  └─ Services                         │ │
│  │                                      │ │
│  │  Volumes:                            │ │
│  │  - /data (addon data)                │ │
│  │  - /config (HA config, read-only)    │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

### Kubernetes Deployment

```
┌─────────────────────────────────────────────┐
│ Kubernetes Cluster                          │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ Ingress Controller                     │ │
│  └──────────────┬─────────────────────────┘ │
│                 │                            │
│  ┌──────────────▼─────────────────────────┐ │
│  │ Service (ClusterIP)                    │ │
│  │ Port 8099                              │ │
│  └──────────────┬─────────────────────────┘ │
│                 │                            │
│  ┌──────────────▼─────────────────────────┐ │
│  │ Deployment                             │ │
│  │ - Replicas: 1                          │ │
│  │ - Liveness Probe: /api/health/live    │ │
│  │ - Readiness Probe: /api/health/ready  │ │
│  │                                        │ │
│  │ Pod                                    │ │
│  │  ┌──────────────────────────────────┐ │ │
│  │  │ Container: homeguardian          │ │ │
│  │  │ - Image: homeguardian:latest     │ │ │
│  │  │ - Resources:                     │ │ │
│  │  │   * Requests: 256Mi, 250m CPU    │ │ │
│  │  │   * Limits: 512Mi, 500m CPU      │ │ │
│  │  │                                  │ │ │
│  │  │ Volumes:                         │ │ │
│  │  │ - data (PVC 10Gi)                │ │ │
│  │  │ - config (PVC 1Gi)               │ │ │
│  │  └──────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ PersistentVolumeClaims                 │ │
│  │ - homeguardian-data (10Gi)             │ │
│  │ - homeguardian-config (1Gi)            │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Docker Standalone

```
┌────────────────────────────────────────┐
│ Docker Host                            │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Container: homeguardian          │ │
│  │                                  │ │
│  │ Port Mapping: 8099:8099          │ │
│  │                                  │ │
│  │ Volumes:                         │ │
│  │ - ./data:/data                   │ │
│  │ - ./config:/config               │ │
│  │                                  │ │
│  │ Health Check:                    │ │
│  │ - Interval: 30s                  │ │
│  │ - Endpoint: /api/health/live     │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Performance Optimizations

### Caching Strategy

**In-Memory Cache:** `backend/utils/cache.js`

- TTL-based expiration
- Auto-cleanup every 5 minutes
- Caches:
  - API responses (30-60 seconds)
  - Git operations (5 seconds)
  - File metadata (60 seconds)

### Response Compression

**Compression Middleware:** `backend/middleware/compression.js`

- Gzip compression for responses > 1KB
- Supports: text/html, application/json, text/css, etc.
- Typical compression: 60-80% size reduction

### Pagination

**Pagination Utility:** `backend/utils/pagination.js`

- Default page size: 20 items
- Maximum page size: 100 items
- HATEOAS links for navigation
- Reduces memory usage for large datasets

### Database Optimization

- Indexed columns: commit_hash, timestamp
- Connection pooling
- Prepared statements
- Auto-vacuum enabled

## Monitoring and Observability

### Health Checks

See: [health-checks.md](health-checks.md)

- `/api/health` - Detailed health status
- `/api/health/ready` - Kubernetes readiness
- `/api/health/live` - Kubernetes liveness
- `/api/health/metrics` - Prometheus metrics

### Metrics Collected

- Process uptime
- Memory usage (heap used, heap total, RSS)
- Request count and latency
- Error rates
- Git operation timing
- Database query performance

### Logging

**Log Levels:**
- `debug`: Detailed debugging information
- `info`: General informational messages
- `warn`: Warning messages (4xx errors)
- `error`: Error messages (5xx errors)

**Log Format:**
```
[TIMESTAMP] LEVEL: message { context }
```

**Context includes:**
- Request ID
- User ID
- HTTP method and path
- IP address
- Response time

## Error Handling

See: [error-handling.md](error-handling.md)

### Error Classes Hierarchy

```
Error (JavaScript base)
└── AppError (Base operational error)
    ├── ValidationError (400)
    ├── AuthenticationError (401)
    ├── AuthorizationError (403)
    ├── NotFoundError (404)
    ├── ConflictError (409)
    └── RateLimitError (429)
```

### Error Flow

```
Route Handler
    │
    ├─ Throws Error
    │
    ▼
asyncHandler Wrapper
    │
    ├─ Catches Error
    │
    ▼
Error Handler Middleware
    │
    ├─ Logs Error
    ├─ Formats Response
    │
    ▼
Response to Client
```

## Scalability Considerations

### Current Limitations

1. **Single Instance Only**
   - Git repository requires exclusive access
   - File watcher conflicts with multiple instances
   - SQLite doesn't support concurrent writes well

2. **File System Dependencies**
   - Requires persistent storage
   - Direct file access needed for Git operations

3. **Stateful Application**
   - In-memory cache
   - File watcher state
   - Active connections

### Future Scalability Options

1. **Distributed Git Operations**
   - Git operations queue
   - Leader election for file watcher
   - Distributed cache (Redis)

2. **Database Migration**
   - PostgreSQL for multi-instance support
   - Connection pooling
   - Read replicas

3. **Horizontal Scaling**
   - Stateless API layer
   - Separate file watcher service
   - Shared storage (NFS, EFS)

## Related Documentation

### Architecture Documents

- [Error Handling](error-handling.md) - Error handling architecture and custom error classes
- [Health Checks](health-checks.md) - Health check endpoints and Kubernetes integration

### API Documentation

- [API Reference](../api/README.md) - Complete API documentation with examples

### Deployment Guides

- [Deployment Guide](../DEPLOYMENT.md) - Installation and deployment instructions
- [Development Guide](../DEVELOPMENT.md) - Development setup and workflow
- [Troubleshooting Guide](../TROUBLESHOOTING.md) - Common issues and solutions

### Implementation Plans

- [Improvement Plans](../implementation-plans/README.md) - Roadmap and planned features

## Architecture Decision Records (ADRs)

### ADR-001: Native Crypto vs crypto-js

**Decision:** Use Node.js native `crypto` module instead of `crypto-js`

**Rationale:**
- Native module is better maintained
- Better performance
- Smaller bundle size
- FIPS compliance support
- No dependency vulnerabilities

### ADR-002: SQLite vs PostgreSQL

**Decision:** Use SQLite for initial version

**Rationale:**
- Zero configuration
- Perfect for single-instance deployments
- Embedded in application
- Sufficient for expected data volume
- Can migrate to PostgreSQL later if needed

### ADR-003: execFile vs exec

**Decision:** Use `execFile` for all system commands

**Rationale:**
- Prevents command injection attacks
- Arguments passed as array, not string
- Shell metacharacters automatically escaped
- Security best practice

### ADR-004: Monorepo vs Separate Repos

**Decision:** Monorepo with `/backend` and `/frontend`

**Rationale:**
- Easier to keep API contracts in sync
- Single version number
- Simpler CI/CD pipeline
- Atomic commits across full stack

## Contributing to Architecture

When making architectural changes:

1. **Document decisions** - Add ADR entry
2. **Update diagrams** - Keep documentation current
3. **Consider backwards compatibility** - Plan migrations
4. **Review security implications** - Security review required
5. **Update related docs** - Keep all docs in sync

## Support

For architecture questions:
- GitHub Discussions: https://github.com/thiagosian/HomeGuardian/discussions
- GitHub Issues: https://github.com/thiagosian/HomeGuardian/issues
