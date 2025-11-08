# Deployment Guide

## Overview

HomeGuardian can be deployed in multiple environments:
1. **Home Assistant Add-on** (Recommended for most users)
2. **Docker Standalone**
3. **Docker Compose**
4. **Kubernetes**

## Home Assistant Add-on

### Prerequisites

- Home Assistant OS or Supervised
- HACS installed (for repository add-ons)

### Installation Steps

#### Via HACS (Recommended)

1. Open HACS in your Home Assistant
2. Navigate to "Add-ons"
3. Click the menu (⋮) and select "Custom repositories"
4. Add repository URL:
   ```
   https://github.com/thiagosian/HomeGuardian
   ```
5. Category: Add-on
6. Click "Add"
7. Find "HomeGuardian" in the list
8. Click "Install"
9. Navigate to Settings → Add-ons
10. Find HomeGuardian and click it
11. Click "Start"
12. Enable "Show in sidebar" (optional)

#### Manual Installation

1. Connect to your Home Assistant via SSH or Terminal
2. Navigate to the addons directory:
   ```bash
   cd /addons
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/thiagosian/HomeGuardian.git
   ```
4. Restart Home Assistant
5. Navigate to Settings → Add-ons
6. Click "Check for updates" (refresh icon)
7. Find "HomeGuardian" under "Local add-ons"
8. Click it and then click "Install"

### Configuration

#### Basic Configuration

Edit the add-on configuration in the Home Assistant UI:

```yaml
log_level: info
auto_commit_enabled: true
auto_commit_debounce: 60
auto_push_enabled: false
scheduled_backup_enabled: false
scheduled_backup_time: "03:00"
git_user_name: "HomeGuardian"
git_user_email: "homeguardian@homeassistant.local"
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `log_level` | string | `info` | Logging level (debug, info, warn, error) |
| `auto_commit_enabled` | boolean | `true` | Enable automatic commits on file changes |
| `auto_commit_debounce` | number | `60` | Seconds to wait before auto-commit |
| `auto_push_enabled` | boolean | `false` | Automatically push to remote after commit |
| `scheduled_backup_enabled` | boolean | `false` | Enable scheduled daily backups |
| `scheduled_backup_time` | string | `03:00` | Time for scheduled backup (24h format) |
| `git_user_name` | string | `HomeGuardian` | Git commit author name |
| `git_user_email` | string | `homeguardian@...` | Git commit author email |

### Remote Git Setup

1. Open HomeGuardian from the Home Assistant sidebar
2. Navigate to Settings tab
3. Click "Generate SSH Key"
4. Copy the public key displayed
5. Add the public key to your Git provider:

   **GitHub:**
   - Go to repository Settings → Deploy keys
   - Click "Add deploy key"
   - Paste the public key
   - Enable "Allow write access"
   - Click "Add key"

   **GitLab:**
   - Go to repository Settings → Repository → Deploy Keys
   - Paste the public key
   - Enable "Write access"
   - Click "Add key"

6. Back in HomeGuardian, enter your repository URL:
   ```
   git@github.com:username/ha-config.git
   ```
7. Click "Test Connection"
8. If successful, enable "Auto Push" in settings

### Updating

#### Via HACS
1. HACS will notify you of updates
2. Click "Update" in the add-on page

#### Manual Update
```bash
cd /addons/HomeGuardian
git pull
```
Then restart the add-on.

## Docker Standalone

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (optional)

### Quick Start

```bash
docker run -d \
  --name homeguardian \
  -p 8099:8099 \
  -v $(pwd)/data:/data \
  -v $(pwd)/config:/config \
  -e NODE_ENV=production \
  -e DATA_PATH=/data \
  -e CONFIG_PATH=/config \
  -e LOG_LEVEL=info \
  homeguardian:latest
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/thiagosian/HomeGuardian.git
cd HomeGuardian

# Build Docker image
docker build -t homeguardian:latest .

# Run container
docker run -d \
  --name homeguardian \
  -p 8099:8099 \
  -v $(pwd)/data:/data \
  -v /path/to/ha/config:/config \
  -e NODE_ENV=production \
  homeguardian:latest
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `production` | Environment (development, production) |
| `DATA_PATH` | Yes | `/data` | Path for database and encryption key |
| `CONFIG_PATH` | Yes | `/config` | Path to Home Assistant config |
| `LOG_LEVEL` | No | `info` | Logging level |
| `PORT` | No | `8099` | HTTP server port |

### Volume Mounts

- `/data`: Application data (database, encryption key, Git repository)
- `/config`: Home Assistant configuration (read-only recommended)

### Health Checks

Docker health check is included in the image:

```bash
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8099/api/health/live || exit 1
```

Check container health:
```bash
docker inspect --format='{{.State.Health.Status}}' homeguardian
```

## Docker Compose

### Prerequisites

- Docker Compose 2.0+

### docker-compose.yml

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  homeguardian:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: homeguardian
    ports:
      - "8099:8099"
    volumes:
      - ./data:/data
      - ./config:/config
    environment:
      - NODE_ENV=production
      - DATA_PATH=/data
      - CONFIG_PATH=/config
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8099/api/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - homeguardian-network

networks:
  homeguardian-network:
    driver: bridge

volumes:
  data:
  config:
```

### Usage

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps
```

## Kubernetes

### Prerequisites

- Kubernetes 1.20+
- kubectl configured
- Persistent storage provisioner

### Quick Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment
kubectl get pods -l app=homeguardian
kubectl get svc homeguardian
```

### Manifests

#### Deployment (k8s/deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homeguardian
  labels:
    app: homeguardian
    version: v1.1.0
spec:
  replicas: 1
  selector:
    matchLabels:
      app: homeguardian
  template:
    metadata:
      labels:
        app: homeguardian
        version: v1.1.0
    spec:
      containers:
      - name: homeguardian
        image: homeguardian:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8099
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATA_PATH
          value: "/data"
        - name: CONFIG_PATH
          value: "/config"
        - name: LOG_LEVEL
          value: "info"
        volumeMounts:
        - name: data
          mountPath: /data
        - name: config
          mountPath: /config
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 8099
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8099
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: homeguardian-data
      - name: config
        persistentVolumeClaim:
          claimName: homeguardian-config
```

### Storage

The deployment requires two PersistentVolumeClaims:

```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: homeguardian-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: homeguardian-config
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: homeguardian
  labels:
    app: homeguardian
spec:
  type: ClusterIP
  selector:
    app: homeguardian
  ports:
  - port: 8099
    targetPort: 8099
    protocol: TCP
    name: http
```

### Ingress (Optional)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: homeguardian
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: homeguardian.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: homeguardian
            port:
              number: 8099
```

### ConfigMap for Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: homeguardian-config
data:
  LOG_LEVEL: "info"
  NODE_ENV: "production"
```

Update deployment to use ConfigMap:
```yaml
envFrom:
- configMapRef:
    name: homeguardian-config
```

### Scaling

HomeGuardian should run as a single replica due to:
- Git repository access (file locking)
- File watcher (multiple watchers cause conflicts)
- SQLite database (not designed for concurrent writes)

For high availability, use:
- Persistent volume replication
- Pod disruption budgets
- Node affinity rules

### Monitoring with Prometheus

#### ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: homeguardian
  labels:
    app: homeguardian
spec:
  selector:
    matchLabels:
      app: homeguardian
  endpoints:
  - port: http
    path: /api/health/metrics
    interval: 15s
```

### Updating

```bash
# Update image
kubectl set image deployment/homeguardian homeguardian=homeguardian:v1.1.0

# Check rollout status
kubectl rollout status deployment/homeguardian

# Rollback if needed
kubectl rollout undo deployment/homeguardian
```

## Production Checklist

### Security

- [ ] Change default encryption key location
- [ ] Set up proper file permissions (600 for encryption key)
- [ ] Configure HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Enable authentication
- [ ] Regular security updates

### Backup

- [ ] Set up automated database backups
- [ ] Configure remote Git sync
- [ ] Test restoration procedures
- [ ] Document recovery process

### Monitoring

- [ ] Set up health check monitoring
- [ ] Configure alerting for failures
- [ ] Monitor disk space
- [ ] Track memory usage
- [ ] Set up log aggregation

### Performance

- [ ] Adjust resource limits based on usage
- [ ] Configure proper debounce times
- [ ] Optimize file exclusion patterns
- [ ] Review and clean old commits

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs homeguardian

# Common issues:
# 1. Port already in use
lsof -i :8099

# 2. Volume permissions
ls -la /path/to/data
chmod 755 /path/to/data

# 3. Missing environment variables
docker inspect homeguardian | grep -A 10 Env
```

### Health Check Failing

```bash
# Test health endpoint directly
curl http://localhost:8099/api/health/live

# Check if service is running
docker exec homeguardian ps aux | grep node

# Check database
docker exec homeguardian ls -la /data
```

### High Memory Usage

```bash
# Check current usage
docker stats homeguardian

# Increase memory limit
docker update --memory 1g homeguardian
```

## Support

- GitHub Issues: https://github.com/thiagosian/HomeGuardian/issues
- Documentation: https://github.com/thiagosian/HomeGuardian/tree/main/docs
- Discussions: https://github.com/thiagosian/HomeGuardian/discussions
