# Health Check Endpoints

## Overview

HomeGuardian provides multiple health check endpoints for monitoring and orchestration.

## Endpoints

### 1. Detailed Health Check
`GET /api/health`

Returns comprehensive system health information.

**Response (200 - Healthy)**
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

**Response (503 - Unhealthy)**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": false,
    "disk": true,
    "memory": true
  }
}
```

**Status Values**
- `healthy`: All checks pass
- `degraded`: Some non-critical checks fail
- `unhealthy`: Critical checks fail

### 2. Readiness Probe
`GET /api/health/ready`

Used by orchestrators (Kubernetes) to determine if pod can receive traffic.

**Response (200 - Ready)**
```json
{
  "ready": true,
  "timestamp": "2025-11-08T12:00:00.000Z"
}
```

**Response (503 - Not Ready)**
```json
{
  "ready": false,
  "reason": "Database not available",
  "timestamp": "2025-11-08T12:00:00.000Z"
}
```

### 3. Liveness Probe
`GET /api/health/live`

Used by orchestrators to determine if pod should be restarted.

**Response (200 - Alive)**
```json
{
  "alive": true,
  "timestamp": "2025-11-08T12:00:00.000Z",
  "uptime": 3600
}
```

### 4. Metrics Endpoint
`GET /api/health/metrics`

Returns Prometheus-compatible metrics.

**Response (text/plain)**
```
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3600

# HELP process_memory_heap_used_bytes Process heap memory used
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes 47185920

# HELP process_memory_heap_total_bytes Process heap memory total
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes 134217728
```

## Kubernetes Integration

### Deployment Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homeguardian
spec:
  template:
    spec:
      containers:
      - name: homeguardian
        image: homeguardian:latest
        ports:
        - containerPort: 8099
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 8099
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8099
          initialDelaySeconds: 10
          periodSeconds: 5
```

## Monitoring Setup

### Prometheus Scrape Config
```yaml
scrape_configs:
  - job_name: 'homeguardian'
    static_configs:
      - targets: ['homeguardian:8099']
    metrics_path: '/api/health/metrics'
    scrape_interval: 15s
```

## Health Check Thresholds

| Check | Threshold | Action if Failed |
|-------|-----------|------------------|
| Database | Connection test | Status: unhealthy |
| Memory | < 500MB heap used | Status: degraded |
| Disk | Write access to /data | Status: degraded |

## Troubleshooting

### Database Check Failing
- Check database connection
- Verify DATABASE_PATH environment variable
- Check disk space

### Memory Check Failing
- Check for memory leaks
- Review recent changes
- Consider increasing memory limits

### Disk Check Failing
- Verify /data directory exists
- Check directory permissions (should be writable)
- Check disk space
