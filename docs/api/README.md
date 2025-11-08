# API Documentation

## Overview

HomeGuardian provides a comprehensive REST API for programmatic access to all features. The API supports multiple authentication methods and follows REST best practices.

## Base URL

```
http://homeassistant.local:8099/api
```

When accessed via Home Assistant Ingress:
```
http://homeassistant.local:8123/api/hassio_ingress/{token}/api
```

## Authentication

### Method 1: Home Assistant Ingress (Recommended)

When accessed through Home Assistant, authentication is automatic via the `X-Ingress-User` header.

```bash
# No additional authentication needed when accessing via Ingress
curl http://homeassistant.local:8123/api/hassio_ingress/xxx/api/status
```

### Method 2: Bearer Token

For direct API access, use a Bearer token in the Authorization header.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://homeassistant.local:8099/api/status
```

### Method 3: Session Authentication (Development)

Session-based authentication is available in development mode.

```bash
curl -b cookies.txt http://homeassistant.local:8099/api/status
```

## Health & Status Endpoints

### GET /api/health

Returns comprehensive system health information.

**Response (200 OK)**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": "5ms",
  "version": "1.1.0",
  "environment": "production",
  "checks": {
    "database": true,
    "disk": true,
    "memory": true
  },
  "system": {
    "memory": {
      "heapUsed": "45MB",
      "heapTotal": "128MB",
      "rss": "150MB"
    },
    "uptime": "3600s",
    "pid": 1234
  }
}
```

**Status Values**
- `healthy`: All checks pass
- `degraded`: Some non-critical checks fail
- `unhealthy`: Critical checks fail

### GET /api/health/ready

Kubernetes readiness probe endpoint. Returns 200 when ready to serve traffic.

**Response (200 OK)**
```json
{
  "ready": true,
  "timestamp": "2025-11-08T12:00:00.000Z"
}
```

**Response (503 Service Unavailable)**
```json
{
  "ready": false,
  "reason": "Database not available",
  "timestamp": "2025-11-08T12:00:00.000Z"
}
```

### GET /api/health/live

Kubernetes liveness probe endpoint. Returns 200 if application is alive.

**Response (200 OK)**
```json
{
  "alive": true,
  "timestamp": "2025-11-08T12:00:00.000Z",
  "uptime": 3600
}
```

### GET /api/health/metrics

Returns Prometheus-compatible metrics.

**Response (200 OK, text/plain)**
```
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3600

# HELP process_memory_heap_used_bytes Process heap memory used
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes 47185920
```

## Git Operations

### GET /api/status

Get current backup status and statistics.

**Response (200 OK)**
```json
{
  "initialized": true,
  "lastBackup": "2025-11-08T12:00:00.000Z",
  "totalCommits": 145,
  "remoteConfigured": true,
  "remoteSynced": true,
  "currentBranch": "main",
  "uncommittedChanges": 0,
  "diskUsage": {
    "used": "256MB",
    "available": "9.7GB",
    "percent": 2.6
  }
}
```

### POST /api/backup-now

Create an immediate backup (Git commit).

**Request Body**
```json
{
  "message": "Manual backup before configuration change"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "commitHash": "abc123def456",
  "message": "Manual backup before configuration change",
  "timestamp": "2025-11-08T12:00:00.000Z",
  "filesChanged": 3
}
```

**Response (400 Bad Request)**
```json
{
  "error": "No changes to commit",
  "statusCode": 400
}
```

### GET /api/commits

List Git commits with pagination.

**Query Parameters**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page
- `since` (ISO date): Only commits after this date
- `until` (ISO date): Only commits before this date

**Response (200 OK)**
```json
{
  "data": [
    {
      "hash": "abc123",
      "message": "Backup: Updated automations.yaml",
      "author": "HomeGuardian",
      "date": "2025-11-08T12:00:00.000Z",
      "filesChanged": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  },
  "links": {
    "self": "/api/commits?page=1&limit=20",
    "next": "/api/commits?page=2&limit=20",
    "last": "/api/commits?page=8&limit=20"
  }
}
```

### GET /api/commits/:hash

Get details of a specific commit.

**Response (200 OK)**
```json
{
  "hash": "abc123",
  "message": "Backup: Updated automations.yaml",
  "author": "HomeGuardian",
  "email": "homeguardian@homeassistant.local",
  "date": "2025-11-08T12:00:00.000Z",
  "files": [
    {
      "path": "automations.yaml",
      "status": "modified",
      "additions": 5,
      "deletions": 2
    }
  ]
}
```

### GET /api/commits/:hash/diff

Get diff for a specific commit.

**Query Parameters**
- `file` (string, optional): Show diff for specific file only

**Response (200 OK)**
```json
{
  "hash": "abc123",
  "files": [
    {
      "path": "automations.yaml",
      "diff": "--- a/automations.yaml\n+++ b/automations.yaml\n@@ -10,3 +10,5 @@\n..."
    }
  ]
}
```

### POST /api/restore

Restore a file or entire commit.

**Request Body**
```json
{
  "commitHash": "abc123",
  "file": "automations.yaml"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "File restored successfully",
  "backupCommit": "backup-xyz789",
  "restoredFile": "automations.yaml"
}
```

## Configuration Management

### GET /api/settings

Get current add-on settings.

**Response (200 OK)**
```json
{
  "autoCommitEnabled": true,
  "autoCommitDebounce": 60,
  "autoPushEnabled": true,
  "scheduledBackupEnabled": true,
  "scheduledBackupTime": "03:00",
  "gitUserName": "HomeGuardian",
  "gitUserEmail": "homeguardian@homeassistant.local",
  "remoteUrl": "git@github.com:user/ha-config.git",
  "remoteBranch": "main"
}
```

### PUT /api/settings

Update add-on settings.

**Request Body**
```json
{
  "autoCommitEnabled": true,
  "autoCommitDebounce": 120
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "autoCommitEnabled": true,
    "autoCommitDebounce": 120
  }
}
```

### POST /api/settings/ssh-key

Generate new SSH key pair.

**Request Body**
```json
{
  "regenerate": false
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "publicKey": "ssh-rsa AAAAB3NzaC1yc2EAAA... homeguardian@homeassistant"
}
```

### POST /api/settings/remote

Configure remote Git repository.

**Request Body**
```json
{
  "url": "git@github.com:user/ha-config.git",
  "branch": "main"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Remote configured successfully"
}
```

### POST /api/settings/remote/test

Test remote Git connection.

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

**Response (400 Bad Request)**
```json
{
  "error": "SSH authentication failed",
  "statusCode": 400,
  "details": {
    "reason": "Public key not authorized"
  }
}
```

### POST /api/settings/remote/push

Manually push to remote repository.

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Pushed to remote successfully",
  "commits": 5
}
```

## File Operations

### GET /api/files

List files in Home Assistant configuration.

**Query Parameters**
- `path` (string, default: "/"): Directory path
- `includeHidden` (boolean, default: false): Include hidden files

**Response (200 OK)**
```json
{
  "path": "/",
  "files": [
    {
      "name": "automations.yaml",
      "type": "file",
      "size": 2048,
      "modified": "2025-11-08T12:00:00.000Z"
    },
    {
      "name": "scripts",
      "type": "directory",
      "modified": "2025-11-08T11:00:00.000Z"
    }
  ]
}
```

### GET /api/files/content

Get file content.

**Query Parameters**
- `path` (string, required): File path

**Response (200 OK)**
```json
{
  "path": "automations.yaml",
  "content": "- id: '1234'\n  alias: Test\n  ...",
  "size": 2048,
  "modified": "2025-11-08T12:00:00.000Z"
}
```

## Parsed Configuration

### GET /api/parsed/automations

Get parsed automations from `automations.yaml`.

**Response (200 OK)**
```json
{
  "automations": [
    {
      "id": "1234",
      "alias": "Turn on lights at sunset",
      "trigger": [...],
      "action": [...]
    }
  ]
}
```

### GET /api/parsed/scripts

Get parsed scripts from `scripts.yaml`.

**Response (200 OK)**
```json
{
  "scripts": [
    {
      "name": "morning_routine",
      "sequence": [...]
    }
  ]
}
```

### GET /api/parsed/scenes

Get parsed scenes from `scenes.yaml`.

**Response (200 OK)**
```json
{
  "scenes": [
    {
      "id": "relaxing",
      "name": "Relaxing",
      "entities": {...}
    }
  ]
}
```

## Error Responses

All errors follow a consistent format:

**Development Mode**
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

**Production Mode**
```json
{
  "error": "User not found",
  "statusCode": 404
}
```

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created
- `204 No Content`: Request succeeded, no content to return
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authentication endpoints**: 5 requests per minute per IP
- **Backup operations**: 10 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699459200
```

## Compression

All responses larger than 1KB are automatically compressed with gzip when the client supports it.

**Request Header**
```
Accept-Encoding: gzip, deflate
```

## Caching

- Health endpoints: No caching
- Status endpoints: 5-second cache
- Commit list: 30-second cache
- File content: 60-second cache

Cache headers:
```
Cache-Control: public, max-age=60
ETag: "abc123"
```

## Webhooks (Planned)

Future versions will support webhooks for events:
- Backup completed
- Backup failed
- Remote push failed
- Disk space warning

## Examples

### Complete Backup Workflow

```bash
# 1. Check status
curl http://homeassistant.local:8099/api/status

# 2. Create backup
curl -X POST http://homeassistant.local:8099/api/backup-now \
  -H "Content-Type: application/json" \
  -d '{"message": "Before major update"}'

# 3. List recent commits
curl http://homeassistant.local:8099/api/commits?limit=5

# 4. View specific commit
curl http://homeassistant.local:8099/api/commits/abc123

# 5. Get diff
curl http://homeassistant.local:8099/api/commits/abc123/diff

# 6. Restore if needed
curl -X POST http://homeassistant.local:8099/api/restore \
  -H "Content-Type: application/json" \
  -d '{"commitHash": "abc123", "file": "automations.yaml"}'
```

### Setting Up Remote Sync

```bash
# 1. Generate SSH key
curl -X POST http://homeassistant.local:8099/api/settings/ssh-key \
  -H "Content-Type: application/json" \
  -d '{"regenerate": false}'

# 2. Add public key to GitHub/GitLab (manual step)

# 3. Configure remote
curl -X POST http://homeassistant.local:8099/api/settings/remote \
  -H "Content-Type: application/json" \
  -d '{"url": "git@github.com:user/ha-config.git", "branch": "main"}'

# 4. Test connection
curl -X POST http://homeassistant.local:8099/api/settings/remote/test

# 5. Push to remote
curl -X POST http://homeassistant.local:8099/api/settings/remote/push
```

## Support

For API issues or questions:
- GitHub Issues: https://github.com/thiagosian/HomeGuardian/issues
- Discussions: https://github.com/thiagosian/HomeGuardian/discussions
