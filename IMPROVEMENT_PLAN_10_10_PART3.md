# Plano de Melhoria HomeGuardian 10/10 - Parte 3 (Final)
**Fases 5-6, Cronograma e Validação**

---

## Fase 5: DevOps e Automação (3 semanas)

### Objetivo
Implementar CI/CD completo, monitoring, alertas e Infrastructure as Code.

### Duração
**3 semanas (120 horas)**

---

### 5.1 CI/CD Pipeline Completo

**Prioridade:** 🔴 CRÍTICA
**Esforço:** 32 horas

#### GitHub Actions Workflow

```.github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18.x'

jobs:
  # Job 1: Lint e Type Check
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Backend Lint
        working-directory: ./backend
        run: npm run lint

      - name: Backend Type Check
        working-directory: ./backend
        run: npm run type-check

      - name: Install Frontend Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Frontend Lint
        working-directory: ./frontend
        run: npm run lint

      - name: Frontend Type Check
        working-directory: ./frontend
        run: npm run type-check

  # Job 2: Tests
  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup Git
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"

      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run Backend Tests
        working-directory: ./backend
        run: npm run test:coverage

      - name: Upload Backend Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

      - name: Install Frontend Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run Frontend Tests
        working-directory: ./frontend
        run: npm run test:coverage

      - name: Upload Frontend Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

      - name: Check Coverage Thresholds
        run: |
          BACKEND_COVERAGE=$(jq '.total.lines.pct' ./backend/coverage/coverage-summary.json)
          FRONTEND_COVERAGE=$(jq '.total.lines.pct' ./frontend/coverage/coverage-summary.json)

          echo "Backend Coverage: $BACKEND_COVERAGE%"
          echo "Frontend Coverage: $FRONTEND_COVERAGE%"

          if (( $(echo "$BACKEND_COVERAGE < 90" | bc -l) )); then
            echo "Backend coverage below 90%!"
            exit 1
          fi

          if (( $(echo "$FRONTEND_COVERAGE < 85" | bc -l) )); then
            echo "Frontend coverage below 85%!"
            exit 1
          fi

  # Job 3: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: NPM Audit Backend
        working-directory: ./backend
        run: npm audit --audit-level=moderate

      - name: NPM Audit Frontend
        working-directory: ./frontend
        run: npm audit --audit-level=moderate

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Job 4: Build
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test, security]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Build Frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run build

      - name: Check Bundle Size
        working-directory: ./frontend
        run: |
          BUNDLE_SIZE=$(du -sb dist | cut -f1)
          MAX_SIZE=$((200 * 1024)) # 200KB

          if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
            echo "Bundle size ($BUNDLE_SIZE bytes) exceeds limit ($MAX_SIZE bytes)"
            exit 1
          fi

      - name: Build Docker Image
        run: docker build -t homeguardian:${{ github.sha }} .

      - name: Save Docker Image
        run: docker save homeguardian:${{ github.sha }} > homeguardian.tar

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: docker-image
          path: homeguardian.tar

  # Job 5: E2E Tests
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v3

      - name: Download Docker Image
        uses: actions/download-artifact@v3
        with:
          name: docker-image

      - name: Load Docker Image
        run: docker load < homeguardian.tar

      - name: Start Application
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for Application
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8099/api/health; do sleep 2; done'

      - name: Install Playwright
        working-directory: ./e2e
        run: npm ci && npx playwright install

      - name: Run E2E Tests
        working-directory: ./e2e
        run: npm run test

      - name: Upload E2E Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-screenshots
          path: e2e/test-results/

      - name: Stop Application
        if: always()
        run: docker-compose -f docker-compose.test.yml down

  # Job 6: SonarQube Analysis
  sonar:
    name: SonarQube Analysis
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

      - name: SonarQube Quality Gate
        uses: sonarsource/sonarqube-quality-gate-action@master
        timeout-minutes: 5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### Deployment Workflow

```.github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'

      - name: Build Application
        run: |
          cd frontend && npm ci && npm run build
          cd ../backend && npm ci --only=production

      - name: Build Docker Image
        run: |
          docker build -t ghcr.io/${{ github.repository }}:latest .
          docker tag ghcr.io/${{ github.repository }}:latest \
                     ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push Docker Image
        run: |
          docker push ghcr.io/${{ github.repository }}:latest
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Notify Deployment
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "HomeGuardian deployed: ${{ github.sha }}",
              "version": "${{ github.ref }}"
            }'
```

---

### 5.2 Monitoring e Observability

**Prioridade:** 🟡 ALTA
**Esforço:** 28 horas

#### Prometheus Metrics

```bash
npm install prom-client
npm install --save-dev @types/prom-client
```

```typescript
// backend/infrastructure/metrics.ts
import { injectable } from 'inversify';
import promClient from 'prom-client';

@injectable()
export class MetricsService {
  private register: promClient.Registry;

  // Counters
  private backupCreatedCounter: promClient.Counter;
  private backupFailedCounter: promClient.Counter;
  private restoreCounter: promClient.Counter;

  // Gauges
  private totalCommitsGauge: promClient.Gauge;
  private watcherStatusGauge: promClient.Gauge;

  // Histograms
  private gitOperationDuration: promClient.Histogram;
  private apiRequestDuration: promClient.Histogram;

  constructor() {
    this.register = new promClient.Registry();

    // Default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register });

    // Custom metrics
    this.backupCreatedCounter = new promClient.Counter({
      name: 'homeguardian_backup_created_total',
      help: 'Total number of backups created',
      labelNames: ['type'], // manual, auto
      registers: [this.register]
    });

    this.backupFailedCounter = new promClient.Counter({
      name: 'homeguardian_backup_failed_total',
      help: 'Total number of failed backups',
      labelNames: ['reason'],
      registers: [this.register]
    });

    this.restoreCounter = new promClient.Counter({
      name: 'homeguardian_restore_total',
      help: 'Total number of restores',
      labelNames: ['type'], // file, item, full
      registers: [this.register]
    });

    this.totalCommitsGauge = new promClient.Gauge({
      name: 'homeguardian_total_commits',
      help: 'Total number of commits in repository',
      registers: [this.register]
    });

    this.watcherStatusGauge = new promClient.Gauge({
      name: 'homeguardian_watcher_status',
      help: 'File watcher status (1=running, 0=stopped)',
      registers: [this.register]
    });

    this.gitOperationDuration = new promClient.Histogram({
      name: 'homeguardian_git_operation_duration_seconds',
      help: 'Duration of git operations',
      labelNames: ['operation'], // commit, push, pull, etc.
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });

    this.apiRequestDuration = new promClient.Histogram({
      name: 'homeguardian_api_request_duration_seconds',
      help: 'API request duration',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.register]
    });
  }

  incrementBackupCreated(type: 'manual' | 'auto'): void {
    this.backupCreatedCounter.inc({ type });
  }

  incrementBackupFailed(reason: string): void {
    this.backupFailedCounter.inc({ reason });
  }

  incrementRestore(type: 'file' | 'item' | 'full'): void {
    this.restoreCounter.inc({ type });
  }

  setTotalCommits(count: number): void {
    this.totalCommitsGauge.set(count);
  }

  setWatcherStatus(running: boolean): void {
    this.watcherStatusGauge.set(running ? 1 : 0);
  }

  observeGitOperation(operation: string, duration: number): void {
    this.gitOperationDuration.observe({ operation }, duration);
  }

  observeApiRequest(method: string, route: string, status: number, duration: number): void {
    this.apiRequestDuration.observe({ method, route, status: status.toString() }, duration);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
```

#### Metrics Middleware

```typescript
// backend/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { container } from '../di/container';
import { TYPES } from '../di/types';
import { MetricsService } from '../infrastructure/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Capturar quando a resposta é finalizada
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const metrics = container.get<MetricsService>(TYPES.MetricsService);

    metrics.observeApiRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
  });

  next();
}
```

#### Metrics Endpoint

```typescript
// backend/routes/metrics.ts
import { Router } from 'express';
import { container } from '../di/container';
import { TYPES } from '../di/types';
import { MetricsService } from '../infrastructure/metrics';

export function createMetricsRouter(): Router {
  const router = Router();

  router.get('/metrics', async (req, res) => {
    const metrics = container.get<MetricsService>(TYPES.MetricsService);
    const data = await metrics.getMetrics();

    res.set('Content-Type', 'text/plain');
    res.send(data);
  });

  return router;
}
```

#### Structured Logging

```typescript
// backend/infrastructure/logger.ts
import winston from 'winston';
import { injectable } from 'inversify';

@injectable()
export class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'homeguardian',
        version: process.env.APP_VERSION || '1.1.0'
      },
      transports: [
        // Console output
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),

        // File output (erros)
        new winston.transports.File({
          filename: '/data/logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),

        // File output (todos)
        new winston.transports.File({
          filename: '/data/logs/combined.log',
          maxsize: 10485760,
          maxFiles: 10
        })
      ]
    });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: error.message,
        stack: error.stack
      });
    } else {
      this.logger.error(message, error);
    }
  }
}
```

#### Health Check Endpoint

```typescript
// backend/routes/health.ts
import { Router } from 'express';
import { container } from '../di/container';
import { TYPES } from '../di/types';
import db from '../config/database';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    git: boolean;
    fileWatcher: boolean;
  };
}

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', async (req, res) => {
    const checks = {
      database: false,
      git: false,
      fileWatcher: false
    };

    let status: HealthStatus['status'] = 'healthy';

    // Check database
    try {
      await db.get('SELECT 1');
      checks.database = true;
    } catch (error) {
      status = 'unhealthy';
    }

    // Check git
    try {
      const gitService = container.get(TYPES.GitService);
      await gitService.status();
      checks.git = true;
    } catch (error) {
      status = 'degraded';
    }

    // Check file watcher
    try {
      const fileWatcher = container.get(TYPES.FileWatcher);
      checks.fileWatcher = fileWatcher.isRunning();

      if (!checks.fileWatcher) {
        status = 'degraded';
      }
    } catch (error) {
      status = 'degraded';
    }

    const health: HealthStatus = {
      status,
      timestamp: Date.now(),
      version: process.env.APP_VERSION || '1.1.0',
      uptime: process.uptime(),
      checks
    };

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  });

  router.get('/ready', async (req, res) => {
    // Readiness check (pode receber tráfego?)
    try {
      await db.get('SELECT 1');
      res.status(200).json({ ready: true });
    } catch (error) {
      res.status(503).json({ ready: false });
    }
  });

  router.get('/live', (req, res) => {
    // Liveness check (está vivo?)
    res.status(200).json({ alive: true });
  });

  return router;
}
```

---

### 5.3 Alerting

**Prioridade:** 🟡 MÉDIA
**Esforço:** 16 horas

#### Alert Manager Configuration

```yaml
# config/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

  routes:
    - match:
        severity: critical
      receiver: 'critical'
      continue: true

    - match:
        severity: warning
      receiver: 'warning'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:8099/api/alerts/webhook'

  - name: 'critical'
    webhook_configs:
      - url: 'http://localhost:8099/api/alerts/webhook'
    # Adicionar integrações: Slack, PagerDuty, etc.

  - name: 'warning'
    webhook_configs:
      - url: 'http://localhost:8099/api/alerts/webhook'
```

#### Prometheus Alerts

```yaml
# config/alerts.yml
groups:
  - name: homeguardian
    interval: 30s
    rules:
      # Backup failures
      - alert: BackupFailureRate
        expr: rate(homeguardian_backup_failed_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High backup failure rate"
          description: "Backup failure rate is {{ $value }} per second"

      - alert: NoBackupsCreated
        expr: increase(homeguardian_backup_created_total[1h]) == 0
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "No backups created in last 2 hours"
          description: "No backups have been created recently"

      # File watcher
      - alert: FileWatcherDown
        expr: homeguardian_watcher_status == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "File watcher is down"
          description: "File watcher has been down for 5 minutes"

      # API performance
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, homeguardian_api_request_duration_seconds_bucket) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "95th percentile latency is {{ $value }}s"

      # Memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 500000000 # 500MB
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }} bytes"

      # Disk space
      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/data"} / node_filesystem_size_bytes{mountpoint="/data"} < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Less than 10% disk space available"
```

---

### 5.4 Infrastructure as Code

**Prioridade:** 🟡 MÉDIA
**Esforço:** 24 horas

#### Docker Compose para Desenvolvimento

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  homeguardian:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app/backend
      - ./frontend:/app/frontend
      - ./data:/data
      - ./config:/config
    ports:
      - "8099:8099"
      - "5173:5173" # Vite HMR
    environment:
      - NODE_ENV=development
      - DATA_PATH=/data
      - CONFIG_PATH=/config
      - LOG_LEVEL=debug
    depends_on:
      - redis
      - prometheus

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./config/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./config/grafana:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus

volumes:
  redis_data:
  prometheus_data:
  grafana_data:
```

#### Kubernetes Manifests

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homeguardian
  labels:
    app: homeguardian
spec:
  replicas: 1
  selector:
    matchLabels:
      app: homeguardian
  template:
    metadata:
      labels:
        app: homeguardian
    spec:
      containers:
      - name: homeguardian
        image: ghcr.io/thiagosian/homeguardian:latest
        ports:
        - containerPort: 8099
        env:
        - name: DATA_PATH
          value: /data
        - name: CONFIG_PATH
          value: /config
        - name: LOG_LEVEL
          value: info
        - name: REDIS_URL
          value: redis://redis:6379
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
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8099
          initialDelaySeconds: 10
          periodSeconds: 5
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

---
apiVersion: v1
kind: Service
metadata:
  name: homeguardian
spec:
  selector:
    app: homeguardian
  ports:
  - port: 8099
    targetPort: 8099
  type: ClusterIP
```

---

### Checklist Fase 5: DevOps

- [ ] CI pipeline configurado (lint, test, security)
- [ ] CD pipeline configurado (build, deploy)
- [ ] Coverage gates (90% backend, 85% frontend)
- [ ] Security scanning (Trivy, Snyk)
- [ ] SonarQube integration
- [ ] E2E tests no CI
- [ ] Prometheus metrics implementadas
- [ ] Grafana dashboards criados
- [ ] Alert rules configuradas
- [ ] Health/readiness/liveness endpoints
- [ ] Structured logging (JSON)
- [ ] Docker Compose para dev
- [ ] Kubernetes manifests
- [ ] IaC para infrastructure

---

## Fase 6: Documentação e Excelência (3 semanas)

### Objetivo
Documentação completa, API documentation, e-books, tutoriais e certificação de qualidade.

### Duração
**3 semanas (120 horas)**

---

### 6.1 API Documentation

**Prioridade:** 🟡 ALTA
**Esforço:** 24 horas

#### OpenAPI/Swagger Specification

```bash
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

```typescript
// backend/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeGuardian API',
      version: '1.1.0',
      description: 'Git-powered configuration manager for Home Assistant',
      contact: {
        name: 'API Support',
        url: 'https://github.com/thiagosian/HomeGuardian',
        email: 'support@homeguardian.io'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8099',
        description: 'Development server'
      },
      {
        url: 'https://homeassistant.local/api/hassio_ingress/xxx',
        description: 'Home Assistant Ingress'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ingressAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Ingress-User'
        }
      },
      schemas: {
        GitCommit: {
          type: 'object',
          properties: {
            hash: {
              type: 'string',
              example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
            },
            message: {
              type: 'string',
              example: 'Manual backup'
            },
            author: {
              type: 'string',
              example: 'HomeGuardian'
            },
            timestamp: {
              type: 'number',
              example: 1699401234567
            },
            files: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            message: {
              type: 'string'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        ingressAuth: []
      }
    ]
  },
  apis: ['./routes/*.ts']
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }));

  // JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
```

#### Documented Route Example

```typescript
// backend/routes/backup.ts
/**
 * @swagger
 * /api/backup/backup-now:
 *   post:
 *     summary: Create a manual backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Manual backup
 *     responses:
 *       200:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GitCommit'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post('/backup-now', authenticate, async (req, res) => {
  // ...
});
```

---

### 6.2 Comprehensive Documentation

**Prioridade:** 🟡 ALTA
**Esforço:** 40 horas

#### Documentation Structure

```
docs/
├── README.md (overview)
├── getting-started/
│   ├── installation.md
│   ├── configuration.md
│   ├── first-backup.md
│   └── remote-sync.md
├── guides/
│   ├── backup-strategies.md
│   ├── restore-procedures.md
│   ├── automation-workflows.md
│   └── troubleshooting.md
├── api/
│   ├── README.md
│   ├── authentication.md
│   ├── endpoints.md
│   └── webhooks.md
├── architecture/
│   ├── overview.md
│   ├── backend.md
│   ├── frontend.md
│   ├── security.md
│   └── diagrams/
├── development/
│   ├── setup.md
│   ├── contributing.md
│   ├── testing.md
│   └── release-process.md
├── deployment/
│   ├── docker.md
│   ├── kubernetes.md
│   └── monitoring.md
└── reference/
    ├── configuration-options.md
    ├── environment-variables.md
    ├── cli-commands.md
    └── troubleshooting.md
```

#### Architecture Documentation

```markdown
# docs/architecture/overview.md

# HomeGuardian Architecture

## High-Level Overview

HomeGuardian implements a Clean Architecture pattern with Domain-Driven Design principles, structured in distinct layers with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │  REST API    │  │   WebSocket  │      │
│  │  (React UI)  │  │   (Routes)   │  │   (Events)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Use Cases (Business Logic)               │   │
│  │  • CreateBackup  • RestoreBackup  • SyncRemote      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Entities   │  │Value Objects │  │  Aggregates  │      │
│  │  • Backup    │  │• CommitHash  │  │• Repository  │      │
│  │• Notification│  │  • FilePath  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Repositories│  │   Services   │  │   External   │      │
│  │  • Backup    │  │   • Git      │  │  • Database  │      │
│  │  • Settings  │  │   • FileWatch│  │   • Redis    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Dependency Injection (InversifyJS)
All dependencies are injected via constructor, making the codebase highly testable and maintainable.

### 2. Repository Pattern
Data access is abstracted through repository interfaces, allowing easy database swapping.

### 3. Use Case Pattern
Business logic is encapsulated in Use Cases, each representing a single user action.

### 4. Event-Driven Architecture
System events trigger asynchronous handlers, enabling loose coupling and extensibility.

## Data Flow Example: Creating a Backup

```
User clicks "Backup Now" →
  Frontend sends POST /api/backup/backup-now →
    Route handler validates request →
      Use Case: CreateBackupUseCase.execute() →
        Domain: Validate backup entity →
          GitService: Create commit →
            Repository: Save to database →
              EventBus: Emit 'backup.created' →
                Handlers: Send notifications, update metrics →
  Response returned to user
```

[... continue com mais detalhes ...]
```

---

### 6.3 Code Quality Certification

**Prioridade:** 🟡 MÉDIA
**Esforço:** 24 horas

#### SonarQube Quality Profile

```properties
# sonar-project.properties
sonar.projectKey=homeguardian
sonar.projectName=HomeGuardian
sonar.projectVersion=1.1.0

# Source directories
sonar.sources=backend,frontend/src
sonar.tests=backend/__tests__,frontend/src/__tests__

# Language-specific settings
sonar.typescript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info
sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info

# Exclusions
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.test.ts,**/*.test.tsx

# Quality Gates
sonar.qualitygate.wait=true

# Code coverage minimum
sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx
sonar.typescript.coverage.reportPaths=coverage/coverage-final.json
```

#### Quality Gates Custom Configuration

```yaml
# .sonarqube/quality-gate.json
{
  "name": "HomeGuardian Quality Gate",
  "conditions": [
    {
      "metric": "new_coverage",
      "op": "LT",
      "error": "85"
    },
    {
      "metric": "new_duplicated_lines_density",
      "op": "GT",
      "error": "3"
    },
    {
      "metric": "new_maintainability_rating",
      "op": "GT",
      "error": "1"
    },
    {
      "metric": "new_reliability_rating",
      "op": "GT",
      "error": "1"
    },
    {
      "metric": "new_security_rating",
      "op": "GT",
      "error": "1"
    },
    {
      "metric": "new_security_hotspots_reviewed",
      "op": "LT",
      "error": "100"
    }
  ]
}
```

---

### 6.4 Accessibility (A11y)

**Prioridade:** 🟢 MÉDIA
**Esforço:** 16 horas

#### Accessibility Testing

```bash
cd frontend
npm install --save-dev @axe-core/react eslint-plugin-jsx-a11y
```

```typescript
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Accessible Components

```typescript
// frontend/src/components/AccessibleButton.tsx
import { Button, ButtonProps } from '@mui/material';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel: string;
  loading?: boolean;
}

export default function AccessibleButton({
  ariaLabel,
  loading = false,
  disabled,
  children,
  ...props
}: AccessibleButtonProps) {
  return (
    <Button
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Button>
  );
}
```

---

### Checklist Fase 6: Documentação

- [ ] OpenAPI/Swagger documentation completa
- [ ] Architecture diagrams (C4 model)
- [ ] Getting Started guide
- [ ] API reference documentation
- [ ] Deployment guides (Docker, K8s)
- [ ] Troubleshooting guide
- [ ] Contributing guidelines
- [ ] Code comments (JSDoc/TSDoc) > 80%
- [ ] README atualizado
- [ ] CHANGELOG mantido
- [ ] SonarQube Quality Gate: A
- [ ] Accessibility score > 90 (Lighthouse)
- [ ] Documentation website (opcional)

---

## Cronograma Detalhado (6-8 meses)

### Mês 1: Segurança e Fundações
**Semanas 1-2:** Fase 1 - Segurança Crítica (80h)
- Substituir crypto-js (12h)
- Corrigir command injection (3h)
- Implementar autenticação (16h)
- Key rotation (8h)
- Security headers (2h)
- Testes de segurança (20h)
- Documentação (10h)
- Buffer (9h)

**Semanas 3-4:** Fase 2 Início - TypeScript Migration (80h)
- Setup TypeScript (8h)
- Migrar utils/ (8h)
- Migrar services/ (12h)
- Migrar routes/ (10h)
- Migrar frontend (20h)
- Testes unitários iniciais (15h)
- ESLint + Prettier (4h)
- Buffer (3h)

### Mês 2: Testes e Qualidade
**Semanas 5-8:** Fase 2 Continuação - Cobertura de Testes (160h)
- Testes GitService (12h)
- Testes HAParser (16h)
- Testes NotificationService (12h)
- Testes FileWatcher (10h)
- Testes de rotas (20h)
- Testes de middleware (8h)
- Testes frontend (Dashboard) (12h)
- Testes frontend (History) (10h)
- Testes frontend (Settings) (12h)
- Testes frontend (Items) (8h)
- Testes de integração (20h)
- Refatorar Settings.jsx (12h)
- Refatorar HAParser (12h)
- Buffer (6h)

### Mês 3: Arquitetura (Parte 1)
**Semanas 9-12:** Fase 3 Início - Clean Architecture (160h)
- Setup InversifyJS (8h)
- Definir interfaces (12h)
- Implementar DI container (12h)
- Refatorar GitService com DI (8h)
- Implementar BackupRepository (10h)
- Implementar SettingsRepository (10h)
- Implementar SSHKeyRepository (8h)
- Implementar NotificationRepository (8h)
- Criar EventBus (12h)
- Implementar event handlers (12h)
- Refatorar rotas com DI (16h)
- Testes com mocks (20h)
- Documentação de arquitetura (16h)
- Buffer (8h)

### Mês 4: Arquitetura (Parte 2)
**Semanas 13-16:** Fase 3 Continuação - Use Cases e Domain (160h)
- Implementar CreateBackupUseCase (12h)
- Implementar RestoreBackupUseCase (16h)
- Implementar SyncRemoteUseCase (12h)
- Implementar ListBackupsUseCase (8h)
- Domain models: Backup (8h)
- Domain models: Notification (6h)
- Domain models: Settings (6h)
- Value objects (12h)
- Validators de domínio (12h)
- Parsers refatorados com strategy (20h)
- Testes de use cases (24h)
- Testes de integração E2E (16h)
- Buffer (8h)

### Mês 5: Performance
**Semanas 17-20:** Fase 4 - Performance e Otimização (160h)
- Code splitting frontend (8h)
- Lazy loading (6h)
- Component memoization (10h)
- Custom hooks (useApi) (8h)
- Bundle optimization (8h)
- Lighthouse optimization (12h)
- Setup Redis (8h)
- Implementar cache service (12h)
- Cached repository decorator (8h)
- Database optimization (12h)
- Compression middleware (4h)
- Pagination implementation (8h)
- Parallel processing (8h)
- WebSocket/SSE (16h)
- Performance testing (16h)
- Testes de carga (10h)
- Buffer (6h)

### Mês 6: DevOps (Parte 1)
**Semanas 21-23:** Fase 5 Início - CI/CD (120h)
- GitHub Actions CI pipeline (16h)
- Coverage gates (8h)
- Security scanning (12h)
- SonarQube integration (12h)
- E2E tests no CI (16h)
- GitHub Actions CD pipeline (16h)
- Docker multi-stage builds (8h)
- Container registry setup (8h)
- Prometheus metrics (16h)
- Grafana dashboards (8h)

### Mês 7: DevOps (Parte 2)
**Semanas 24-26:** Fase 5 Continuação - Monitoring e IaC (120h)
- Alert rules (12h)
- AlertManager config (8h)
- Health endpoints (8h)
- Structured logging (12h)
- Log aggregation (12h)
- Docker Compose dev (8h)
- Docker Compose prod (8h)
- Kubernetes manifests (16h)
- Helm charts (16h)
- Terraform/IaC (16h)
- Disaster recovery (4h)

### Mês 8: Documentação e Finalização
**Semanas 27-30:** Fase 6 - Documentação e Excelência (120h)
- OpenAPI/Swagger (16h)
- Architecture documentation (16h)
- Getting Started guides (12h)
- API reference (12h)
- Deployment guides (12h)
- Troubleshooting guide (8h)
- Contributing guidelines (8h)
- Code comments (12h)
- Accessibility improvements (8h)
- Documentation website (12h)
- Final QA e testing (12h)
- Performance final audit (8h)
- Security final audit (8h)
- Release preparation (4h)

---

## Recursos Necessários

### Equipe
- **1 Backend Developer Senior** (TypeScript, Node.js, Git)
- **1 Frontend Developer** (React, TypeScript, Performance)
- **1 DevOps Engineer** (part-time, 50%)
- **1 QA Engineer** (part-time, 25%)

### Ferramentas e Serviços
- **Desenvolvimento:**
  - IDE/Editor (VS Code recomendado)
  - Git + GitHub
  - Docker Desktop
  - Postman/Insomnia

- **CI/CD:**
  - GitHub Actions (incluído no GitHub)
  - SonarQube Cloud (gratuito para projetos open-source)
  - Codecov (gratuito para open-source)

- **Monitoring:**
  - Prometheus (self-hosted)
  - Grafana (self-hosted)
  - Sentry (opcional, para error tracking)

- **Infrastructure:**
  - Redis (self-hosted ou cloud)
  - PostgreSQL (migração futura opcional)

### Budget Estimado
| Item | Custo Mensal | Custo Total (8 meses) |
|------|--------------|----------------------|
| Desenvolvedores (2x) | $0 (open-source) | $0 |
| DevOps (0.5x) | $0 (open-source) | $0 |
| QA (0.25x) | $0 (open-source) | $0 |
| SonarQube Cloud | $0 (free tier) | $0 |
| Codecov | $0 (free tier) | $0 |
| Sentry | $26 (dev plan) | $208 |
| Infrastructure | $50 (servers) | $400 |
| **TOTAL** | **~$76** | **~$608** |

*Nota: Custos baseados em projeto open-source. Para empresa, adicionar salários.*

---

## Checklist de Validação 10/10

### Segurança (10/10)
- [ ] Zero vulnerabilidades críticas/altas em scan automatizado
- [ ] Criptografia AES-256-GCM para dados sensíveis
- [ ] Autenticação e autorização em 100% das rotas protegidas
- [ ] Security Headers: A+ rating (securityheaders.com)
- [ ] Penetration testing aprovado
- [ ] OWASP Top 10: 100% mitigado
- [ ] Secrets scanning no CI
- [ ] Dependency scanning automatizado

### Testes (10/10)
- [ ] Backend coverage ≥ 90%
- [ ] Frontend coverage ≥ 85%
- [ ] 100% endpoints críticos com testes integração
- [ ] E2E tests cobrindo 100% dos fluxos principais
- [ ] Mutation testing score ≥ 80%
- [ ] Tests running < 5 min no CI
- [ ] Zero testes flaky

### Performance (10/10)
- [ ] Lighthouse Performance ≥ 95
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] API p95 response time < 200ms
- [ ] Bundle size < 200KB gzipped
- [ ] Tree-shaking configurado

### Código (10/10)
- [ ] 100% TypeScript (backend + frontend)
- [ ] Complexidade ciclomática < 10
- [ ] Code duplication < 3%
- [ ] SonarQube Quality Gate: A
- [ ] ESLint: 0 warnings/errors
- [ ] Prettier: 100% formatted
- [ ] TSDoc/JSDoc: ≥ 80% coverage
- [ ] SOLID principles: ≥ 95% compliance

### Arquitetura (10/10)
- [ ] Clean Architecture implementada
- [ ] DDD patterns aplicados
- [ ] Dependency Injection em todos os serviços
- [ ] Repository Pattern para data access
- [ ] Event-Driven Architecture
- [ ] Use Cases para business logic
- [ ] Domain models com validação
- [ ] Separation of concerns clara

### DevOps (10/10)
- [ ] CI pipeline completo (< 10 min)
- [ ] CD pipeline com rollback automático
- [ ] Coverage gates enforcement
- [ ] Security scanning automatizado
- [ ] E2E tests no CI
- [ ] SonarQube Quality Gate
- [ ] Automated deployments
- [ ] Infrastructure as Code

### Monitoring (10/10)
- [ ] Prometheus metrics implementadas
- [ ] Grafana dashboards configurados
- [ ] Alert rules para eventos críticos
- [ ] Health/readiness/liveness endpoints
- [ ] Structured logging (JSON)
- [ ] Log aggregation configurado
- [ ] Distributed tracing (opcional)
- [ ] Error tracking (Sentry)

### Documentação (10/10)
- [ ] OpenAPI/Swagger 100% completo
- [ ] Architecture diagrams (C4 model)
- [ ] Getting Started guide
- [ ] API reference
- [ ] Deployment guides
- [ ] Troubleshooting guide
- [ ] Contributing guidelines
- [ ] CHANGELOG atualizado

### Accessibility (10/10)
- [ ] Lighthouse Accessibility ≥ 95
- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation 100%
- [ ] Screen reader compatible
- [ ] Color contrast ratios ≥ 4.5:1
- [ ] Focus indicators visíveis
- [ ] ARIA labels corretos
- [ ] Axe DevTools: 0 violations

### User Experience (10/10)
- [ ] Loading states em todas as operações
- [ ] Error messages claras e úteis
- [ ] Success feedback imediato
- [ ] Responsive design (mobile-first)
- [ ] Offline support (PWA)
- [ ] Internationalization (i18n)
- [ ] Theming (light/dark mode)
- [ ] Smooth animations/transitions

---

## Conclusão

Este plano detalhado de 6-8 meses transformará o HomeGuardian de **7.2/10 para 10/10** em todas as categorias avaliadas. O investimento total estimado é de:

- **240-320 horas** de desenvolvimento
- **~$600** em infraestrutura e ferramentas
- **ROI esperado:**
  - 80% redução em bugs de segurança
  - 60% redução em tempo de manutenção
  - 90% aumento em confiabilidade
  - 100% facilidade de onboarding

### Priorização Sugerida

Se não for possível executar o plano completo, priorize nesta ordem:

1. **Fase 1 (Segurança)** - CRÍTICO - 2 semanas
2. **Fase 2 (Testes)** - ALTA - 4 semanas
3. **Fase 5 (DevOps Básico)** - ALTA - 2 semanas
4. **Fase 3 (Arquitetura)** - MÉDIA - 6 semanas
5. **Fase 4 (Performance)** - MÉDIA - 4 semanas
6. **Fase 6 (Documentação)** - BAIXA - 3 semanas

### Marcos Principais

**Mês 2:** ✅ Segurança resolvida + TypeScript completo
**Mês 4:** ✅ Testes 90%+ + Clean Architecture
**Mês 6:** ✅ Performance otimizada + CI/CD completo
**Mês 8:** ✅ **CERTIFICAÇÃO 10/10 EM TODAS AS CATEGORIAS**

---

**Este plano foi criado para ser executado de forma incremental. Cada fase entrega valor imediato e pode ser validada independentemente.**

**Pronto para começar a jornada para 10/10? 🚀**
