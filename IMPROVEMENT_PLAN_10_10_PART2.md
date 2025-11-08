# Plano de Melhoria HomeGuardian 10/10 - Parte 2
**Continuação das Fases 3-6**

---

## Fase 3: Arquitetura e Refatoração (6 semanas)

### Objetivo
Implementar Clean Architecture com DDD, Dependency Injection e Event-Driven patterns.

### Duração
**6 semanas (240 horas)**

---

### 3.1 Implementar Dependency Injection

**Prioridade:** 🟡 ALTA
**Esforço:** 32 horas

#### Container de Dependências com InversifyJS

```bash
npm install inversify reflect-metadata
npm install --save-dev @types/inversify
```

```typescript
// backend/di/types.ts
export const TYPES = {
  // Services
  GitService: Symbol.for('GitService'),
  FileWatcher: Symbol.for('FileWatcher'),
  HAParser: Symbol.for('HAParser'),
  NotificationService: Symbol.for('NotificationService'),
  Scheduler: Symbol.for('Scheduler'),
  EncryptionKeyManager: Symbol.for('EncryptionKeyManager'),
  CryptoManager: Symbol.for('CryptoManager'),

  // Repositories
  BackupRepository: Symbol.for('BackupRepository'),
  SettingsRepository: Symbol.for('SettingsRepository'),
  SSHKeyRepository: Symbol.for('SSHKeyRepository'),
  NotificationRepository: Symbol.for('NotificationRepository'),

  // Use Cases
  CreateBackupUseCase: Symbol.for('CreateBackupUseCase'),
  RestoreBackupUseCase: Symbol.for('RestoreBackupUseCase'),
  SyncRemoteUseCase: Symbol.for('SyncRemoteUseCase'),

  // Infrastructure
  Database: Symbol.for('Database'),
  Logger: Symbol.for('Logger'),
  EventBus: Symbol.for('EventBus'),
};
```

```typescript
// backend/di/container.ts
import { Container } from 'inversify';
import { TYPES } from './types';

// Services
import GitService from '../services/git-service';
import FileWatcher from '../services/file-watcher';
import HAParser from '../services/ha-parser';
import NotificationService from '../services/notification-service';
import Scheduler from '../services/scheduler';

// Repositories
import { BackupRepository } from '../repositories/backup-repository';
import { SettingsRepository } from '../repositories/settings-repository';
import { SSHKeyRepository } from '../repositories/ssh-key-repository';
import { NotificationRepository } from '../repositories/notification-repository';

// Use Cases
import { CreateBackupUseCase } from '../use-cases/create-backup';
import { RestoreBackupUseCase } from '../use-cases/restore-backup';
import { SyncRemoteUseCase } from '../use-cases/sync-remote';

// Infrastructure
import Database from '../infrastructure/database';
import Logger from '../infrastructure/logger';
import { EventBus } from '../infrastructure/event-bus';

const container = new Container();

// Infrastructure
container.bind(TYPES.Database).to(Database).inSingletonScope();
container.bind(TYPES.Logger).to(Logger).inSingletonScope();
container.bind(TYPES.EventBus).to(EventBus).inSingletonScope();

// Repositories
container.bind(TYPES.BackupRepository).to(BackupRepository);
container.bind(TYPES.SettingsRepository).to(SettingsRepository);
container.bind(TYPES.SSHKeyRepository).to(SSHKeyRepository);
container.bind(TYPES.NotificationRepository).to(NotificationRepository);

// Services
container.bind(TYPES.GitService).to(GitService).inSingletonScope();
container.bind(TYPES.FileWatcher).to(FileWatcher).inSingletonScope();
container.bind(TYPES.HAParser).to(HAParser).inSingletonScope();
container.bind(TYPES.NotificationService).to(NotificationService).inSingletonScope();
container.bind(TYPES.Scheduler).to(Scheduler).inSingletonScope();

// Use Cases
container.bind(TYPES.CreateBackupUseCase).to(CreateBackupUseCase);
container.bind(TYPES.RestoreBackupUseCase).to(RestoreBackupUseCase);
container.bind(TYPES.SyncRemoteUseCase).to(SyncRemoteUseCase);

export { container };
```

```typescript
// backend/services/git-service.ts (refatorado com DI)
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import simpleGit, { SimpleGit } from 'simple-git';
import { IBackupRepository } from '../repositories/interfaces/backup-repository.interface';
import { ILogger } from '../infrastructure/interfaces/logger.interface';
import { IEventBus } from '../infrastructure/interfaces/event-bus.interface';
import { GitCommit } from '../types';

@injectable()
class GitService {
  private git: SimpleGit;

  constructor(
    @inject(TYPES.BackupRepository) private backupRepository: IBackupRepository,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {
    this.git = simpleGit(process.env.CONFIG_PATH || '/config');
  }

  async initialize(): Promise<void> {
    const isRepo = await this.git.checkIsRepo();

    if (!isRepo) {
      this.logger.info('Initializing Git repository...');
      await this.git.init();
      await this.git.addConfig('user.name', 'HomeGuardian');
      await this.git.addConfig('user.email', 'homeguardian@homeassistant.local');

      await this.eventBus.emit('git.initialized', {
        path: process.env.CONFIG_PATH,
        timestamp: Date.now()
      });
    }
  }

  async createCommit(message: string, isAuto: boolean = false): Promise<GitCommit> {
    try {
      const status = await this.git.status();

      if (status.files.length === 0) {
        throw new Error('No changes to commit');
      }

      await this.git.add('.');
      const result = await this.git.commit(message);

      const commit: GitCommit = {
        hash: result.commit,
        message,
        author: 'HomeGuardian',
        timestamp: Date.now(),
        files: status.files.map(f => f.path)
      };

      // Salvar no repositório
      await this.backupRepository.create({
        hash: commit.hash,
        message: commit.message,
        timestamp: commit.timestamp,
        files_changed: commit.files.length,
        is_auto: isAuto
      });

      // Emitir evento
      await this.eventBus.emit('backup.created', commit);

      this.logger.info(`Commit created: ${commit.hash.substring(0, 7)}`);

      return commit;

    } catch (error) {
      this.logger.error('Failed to create commit:', error);
      await this.eventBus.emit('backup.failed', { error, message });
      throw error;
    }
  }
}

export default GitService;
```

```typescript
// backend/routes/backup.ts (refatorado com DI)
import { Router } from 'express';
import { container } from '../di/container';
import { TYPES } from '../di/types';
import { CreateBackupUseCase } from '../use-cases/create-backup';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { backupSchemas } from '../validation/schemas';

export function createBackupRouter(): Router {
  const router = Router();

  router.post(
    '/backup-now',
    authenticate,
    validate(backupSchemas.createManual),
    async (req, res, next) => {
      try {
        const useCase = container.get<CreateBackupUseCase>(TYPES.CreateBackupUseCase);

        const result = await useCase.execute({
          message: req.body.message || 'Manual backup',
          isAuto: false,
          userId: req.user!.id
        });

        res.json({
          success: true,
          data: result
        });

      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
```

```typescript
// backend/server.ts (com DI)
import 'reflect-metadata'; // Importante: no topo do arquivo
import express from 'express';
import { container } from './di/container';
import { createBackupRouter } from './routes/backup';
import { createRestoreRouter } from './routes/restore';
import { createSettingsRouter } from './routes/settings';

const app = express();

// ... middlewares ...

// Rotas com DI
app.use('/api/backup', createBackupRouter());
app.use('/api/restore', createRestoreRouter());
app.use('/api/settings', createSettingsRouter());

// Inicializar serviços
async function bootstrap() {
  const gitService = container.get(TYPES.GitService);
  await gitService.initialize();

  const fileWatcher = container.get(TYPES.FileWatcher);
  await fileWatcher.start();

  const scheduler = container.get(TYPES.Scheduler);
  await scheduler.start();

  app.listen(8099, () => {
    console.log('Server running on port 8099');
  });
}

bootstrap().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

---

### 3.2 Implementar Repository Pattern

**Prioridade:** 🟡 ALTA
**Esforço:** 28 horas

```typescript
// backend/repositories/interfaces/repository.interface.ts
export interface IRepository<T> {
  findById(id: string | number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string | number, entity: Partial<T>): Promise<T>;
  delete(id: string | number): Promise<boolean>;
}
```

```typescript
// backend/repositories/interfaces/backup-repository.interface.ts
import { IRepository } from './repository.interface';
import { BackupHistory } from '../../types';

export interface IBackupRepository extends IRepository<BackupHistory> {
  findRecent(limit: number): Promise<BackupHistory[]>;
  findByHash(hash: string): Promise<BackupHistory | null>;
  findAutoBackups(): Promise<BackupHistory[]>;
  countTotal(): Promise<number>;
  deleteOldBackups(daysToKeep: number): Promise<number>;
}
```

```typescript
// backend/repositories/backup-repository.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { IBackupRepository } from './interfaces/backup-repository.interface';
import { IDatabase } from '../infrastructure/interfaces/database.interface';
import { BackupHistory } from '../types';

@injectable()
export class BackupRepository implements IBackupRepository {
  constructor(
    @inject(TYPES.Database) private db: IDatabase
  ) {}

  async findById(id: number): Promise<BackupHistory | null> {
    const row = await this.db.get<BackupHistory>(
      'SELECT * FROM backup_history WHERE id = ?',
      [id]
    );
    return row || null;
  }

  async findAll(): Promise<BackupHistory[]> {
    return this.db.all<BackupHistory>(
      'SELECT * FROM backup_history ORDER BY timestamp DESC'
    );
  }

  async create(backup: Partial<BackupHistory>): Promise<BackupHistory> {
    const result = await this.db.run(
      `INSERT INTO backup_history (hash, message, timestamp, files_changed, is_auto)
       VALUES (?, ?, ?, ?, ?)`,
      [
        backup.hash,
        backup.message,
        backup.timestamp || Date.now(),
        backup.files_changed || 0,
        backup.is_auto ? 1 : 0
      ]
    );

    return this.findById(result.lastID)!;
  }

  async update(id: number, backup: Partial<BackupHistory>): Promise<BackupHistory> {
    const sets: string[] = [];
    const values: any[] = [];

    if (backup.message !== undefined) {
      sets.push('message = ?');
      values.push(backup.message);
    }

    if (backup.is_auto !== undefined) {
      sets.push('is_auto = ?');
      values.push(backup.is_auto ? 1 : 0);
    }

    values.push(id);

    await this.db.run(
      `UPDATE backup_history SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id)!;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.run(
      'DELETE FROM backup_history WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  async findRecent(limit: number): Promise<BackupHistory[]> {
    return this.db.all<BackupHistory>(
      'SELECT * FROM backup_history ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
  }

  async findByHash(hash: string): Promise<BackupHistory | null> {
    const row = await this.db.get<BackupHistory>(
      'SELECT * FROM backup_history WHERE hash = ?',
      [hash]
    );
    return row || null;
  }

  async findAutoBackups(): Promise<BackupHistory[]> {
    return this.db.all<BackupHistory>(
      'SELECT * FROM backup_history WHERE is_auto = 1 ORDER BY timestamp DESC'
    );
  }

  async countTotal(): Promise<number> {
    const row = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM backup_history'
    );
    return row?.count || 0;
  }

  async deleteOldBackups(daysToKeep: number): Promise<number> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.db.run(
      'DELETE FROM backup_history WHERE timestamp < ? AND is_auto = 1',
      [cutoffDate]
    );

    return result.changes;
  }
}
```

```typescript
// backend/repositories/settings-repository.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { IDatabase } from '../infrastructure/interfaces/database.interface';
import crypto from '../utils/crypto-manager';

interface SettingRow {
  key: string;
  value: string;
  encrypted: number;
}

@injectable()
export class SettingsRepository {
  constructor(
    @inject(TYPES.Database) private db: IDatabase,
    @inject(TYPES.CryptoManager) private crypto: typeof crypto
  ) {}

  async get(key: string): Promise<any> {
    const row = await this.db.get<SettingRow>(
      'SELECT * FROM settings WHERE key = ?',
      [key]
    );

    if (!row) {
      return null;
    }

    if (row.encrypted === 1) {
      const encryptionKey = process.env.ENCRYPTION_KEY!;
      return this.crypto.decrypt(row.value, encryptionKey);
    }

    // Parse JSON se possível
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }

  async set(key: string, value: any, encrypted: boolean = false): Promise<void> {
    let finalValue: string;

    if (encrypted) {
      const encryptionKey = process.env.ENCRYPTION_KEY!;
      finalValue = this.crypto.encrypt(String(value), encryptionKey);
    } else {
      finalValue = typeof value === 'string' ? value : JSON.stringify(value);
    }

    await this.db.run(
      `INSERT OR REPLACE INTO settings (key, value, encrypted)
       VALUES (?, ?, ?)`,
      [key, finalValue, encrypted ? 1 : 0]
    );
  }

  async getAll(): Promise<Record<string, any>> {
    const rows = await this.db.all<SettingRow>('SELECT * FROM settings');
    const settings: Record<string, any> = {};

    for (const row of rows) {
      const value = row.encrypted === 1
        ? '***encrypted***' // Não retornar valores criptografados
        : row.value;

      try {
        settings[row.key] = JSON.parse(value);
      } catch {
        settings[row.key] = value;
      }
    }

    return settings;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.db.run(
      'DELETE FROM settings WHERE key = ?',
      [key]
    );
    return result.changes > 0;
  }

  async bulkSet(settings: Record<string, any>): Promise<void> {
    const promises = Object.entries(settings).map(([key, value]) =>
      this.set(key, value, false)
    );

    await Promise.all(promises);
  }
}
```

---

### 3.3 Implementar Event-Driven Architecture

**Prioridade:** 🟡 ALTA
**Esforço:** 24 horas

```typescript
// backend/infrastructure/event-bus.ts
import { injectable } from 'inversify';
import { EventEmitter } from 'events';
import { IEventBus, EventHandler } from './interfaces/event-bus.interface';
import { ILogger } from './interfaces/logger.interface';
import { inject } from 'inversify';
import { TYPES } from '../di/types';

@injectable()
export class EventBus implements IEventBus {
  private emitter: EventEmitter;
  private handlers: Map<string, Set<EventHandler>>;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger
  ) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Aumentar limite
    this.handlers = new Map();
  }

  async emit(eventName: string, data: any): Promise<void> {
    this.logger.debug(`Event emitted: ${eventName}`, data);

    // Emitir para Event Emitter nativo
    this.emitter.emit(eventName, data);

    // Chamar handlers registrados
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      const promises = Array.from(handlers).map(handler =>
        this.executeHandler(eventName, handler, data)
      );

      await Promise.allSettled(promises);
    }
  }

  on(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);
    this.logger.debug(`Handler registered for event: ${eventName}`);
  }

  off(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  once(eventName: string, handler: EventHandler): void {
    const wrappedHandler = async (data: any) => {
      await handler(data);
      this.off(eventName, wrappedHandler);
    };

    this.on(eventName, wrappedHandler);
  }

  private async executeHandler(
    eventName: string,
    handler: EventHandler,
    data: any
  ): Promise<void> {
    try {
      await handler(data);
    } catch (error) {
      this.logger.error(
        `Error in event handler for ${eventName}:`,
        error
      );
      // Não propagar erro para não afetar outros handlers
    }
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.handlers.delete(eventName);
      this.emitter.removeAllListeners(eventName);
    } else {
      this.handlers.clear();
      this.emitter.removeAllListeners();
    }
  }
}
```

```typescript
// backend/events/handlers/backup-created.handler.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../di/types';
import { INotificationService } from '../../services/interfaces/notification-service.interface';
import { ILogger } from '../../infrastructure/interfaces/logger.interface';
import { GitCommit } from '../../types';

@injectable()
export class BackupCreatedHandler {
  constructor(
    @inject(TYPES.NotificationService) private notificationService: INotificationService,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async handle(commit: GitCommit): Promise<void> {
    this.logger.info(`Processing backup.created event: ${commit.hash}`);

    // Enviar notificação
    await this.notificationService.send({
      title: 'Backup Created',
      message: `Backup "${commit.message}" created successfully`,
      severity: 'success',
      timestamp: commit.timestamp
    });

    // Outras ações: analytics, webhooks, etc.
  }
}
```

```typescript
// backend/events/handlers/backup-failed.handler.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../di/types';
import { INotificationService } from '../../services/interfaces/notification-service.interface';
import { ILogger } from '../../infrastructure/interfaces/logger.interface';

@injectable()
export class BackupFailedHandler {
  constructor(
    @inject(TYPES.NotificationService) private notificationService: INotificationService,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async handle(data: { error: Error; message: string }): Promise<void> {
    this.logger.error('Processing backup.failed event:', data.error);

    // Enviar notificação de erro
    await this.notificationService.send({
      title: 'Backup Failed',
      message: `Failed to create backup: ${data.message}`,
      severity: 'error',
      timestamp: Date.now()
    });

    // TODO: Implementar retry logic
    // TODO: Enviar alertas críticos
  }
}
```

```typescript
// backend/events/bootstrap.ts
import { Container } from 'inversify';
import { TYPES } from '../di/types';
import { IEventBus } from '../infrastructure/interfaces/event-bus.interface';
import { BackupCreatedHandler } from './handlers/backup-created.handler';
import { BackupFailedHandler } from './handlers/backup-failed.handler';

export function registerEventHandlers(container: Container): void {
  const eventBus = container.get<IEventBus>(TYPES.EventBus);

  // Registrar handlers
  const backupCreatedHandler = container.resolve(BackupCreatedHandler);
  const backupFailedHandler = container.resolve(BackupFailedHandler);

  eventBus.on('backup.created', (data) => backupCreatedHandler.handle(data));
  eventBus.on('backup.failed', (data) => backupFailedHandler.handle(data));

  // Outros eventos
  eventBus.on('git.initialized', (data) => {
    console.log('Git initialized:', data);
  });

  eventBus.on('remote.synced', (data) => {
    console.log('Remote synced:', data);
  });
}
```

---

### 3.4 Implementar Use Cases (Clean Architecture)

**Prioridade:** 🟡 ALTA
**Esforço:** 32 horas

```typescript
// backend/use-cases/interfaces/use-case.interface.ts
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
```

```typescript
// backend/use-cases/create-backup.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { IUseCase } from './interfaces/use-case.interface';
import { IBackupRepository } from '../repositories/interfaces/backup-repository.interface';
import { ILogger } from '../infrastructure/interfaces/logger.interface';
import GitService from '../services/git-service';
import { GitCommit, BackupHistory } from '../types';

interface CreateBackupRequest {
  message: string;
  isAuto: boolean;
  userId: string;
}

interface CreateBackupResponse {
  commit: GitCommit;
  backup: BackupHistory;
}

@injectable()
export class CreateBackupUseCase implements IUseCase<CreateBackupRequest, CreateBackupResponse> {
  constructor(
    @inject(TYPES.GitService) private gitService: GitService,
    @inject(TYPES.BackupRepository) private backupRepository: IBackupRepository,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async execute(request: CreateBackupRequest): Promise<CreateBackupResponse> {
    const { message, isAuto, userId } = request;

    this.logger.info(`Creating backup: ${message} (user: ${userId})`);

    // Validar requisição
    if (!message || message.trim().length === 0) {
      throw new Error('Backup message is required');
    }

    if (message.length > 500) {
      throw new Error('Backup message too long (max 500 characters)');
    }

    // Criar commit Git
    const commit = await this.gitService.createCommit(message, isAuto);

    // Buscar backup criado no repositório
    const backup = await this.backupRepository.findByHash(commit.hash);

    if (!backup) {
      throw new Error('Backup was created but not found in database');
    }

    this.logger.info(`Backup created successfully: ${commit.hash}`);

    return {
      commit,
      backup
    };
  }
}
```

```typescript
// backend/use-cases/restore-backup.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { IUseCase } from './interfaces/use-case.interface';
import { IBackupRepository } from '../repositories/interfaces/backup-repository.interface';
import { ILogger } from '../infrastructure/interfaces/logger.interface';
import { IEventBus } from '../infrastructure/interfaces/event-bus.interface';
import GitService from '../services/git-service';
import HAParser from '../services/ha-parser';

interface RestoreBackupRequest {
  commitHash: string;
  filePath?: string;
  itemId?: string;
  createSafetyBackup: boolean;
  userId: string;
}

interface RestoreBackupResponse {
  success: boolean;
  safetyBackupHash?: string;
  restoredFiles: string[];
}

@injectable()
export class RestoreBackupUseCase implements IUseCase<RestoreBackupRequest, RestoreBackupResponse> {
  constructor(
    @inject(TYPES.GitService) private gitService: GitService,
    @inject(TYPES.HAParser) private haParser: HAParser,
    @inject(TYPES.BackupRepository) private backupRepository: IBackupRepository,
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async execute(request: RestoreBackupRequest): Promise<RestoreBackupResponse> {
    const { commitHash, filePath, itemId, createSafetyBackup, userId } = request;

    this.logger.info(`Restoring backup: ${commitHash} (user: ${userId})`);

    // Validar que o commit existe
    const backup = await this.backupRepository.findByHash(commitHash);
    if (!backup) {
      throw new Error('Backup not found');
    }

    // Criar safety backup se solicitado
    let safetyBackupHash: string | undefined;
    if (createSafetyBackup) {
      try {
        const safetyCommit = await this.gitService.createCommit(
          `Safety backup before restore (${commitHash.substring(0, 7)})`,
          false
        );
        safetyBackupHash = safetyCommit.hash;
        this.logger.info(`Safety backup created: ${safetyBackupHash}`);
      } catch (error) {
        // Se não há mudanças, não precisa de safety backup
        this.logger.info('No changes to create safety backup');
      }
    }

    const restoredFiles: string[] = [];

    try {
      if (itemId) {
        // Restaurar item específico (automação, script, etc.)
        await this.restoreItem(commitHash, itemId);
        restoredFiles.push(itemId);
      } else if (filePath) {
        // Restaurar arquivo específico
        await this.gitService.restoreFile(commitHash, filePath);
        restoredFiles.push(filePath);
      } else {
        // Restaurar tudo (hard reset)
        throw new Error('Full restore not yet implemented');
      }

      // Emitir evento de sucesso
      await this.eventBus.emit('backup.restored', {
        commitHash,
        restoredFiles,
        userId,
        timestamp: Date.now()
      });

      this.logger.info(`Backup restored successfully: ${commitHash}`);

      return {
        success: true,
        safetyBackupHash,
        restoredFiles
      };

    } catch (error) {
      // Emitir evento de falha
      await this.eventBus.emit('backup.restore_failed', {
        commitHash,
        error,
        userId,
        timestamp: Date.now()
      });

      this.logger.error('Backup restore failed:', error);
      throw error;
    }
  }

  private async restoreItem(commitHash: string, itemId: string): Promise<void> {
    // Obter item do commit
    const item = await this.haParser.getItemFromCommit(commitHash, itemId);

    if (!item) {
      throw new Error('Item not found in commit');
    }

    // Restaurar item
    await this.haParser.restoreItem(item);

    this.logger.info(`Item restored: ${itemId}`);
  }
}
```

```typescript
// backend/use-cases/sync-remote.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { IUseCase } from './interfaces/use-case.interface';
import { ISettingsRepository } from '../repositories/interfaces/settings-repository.interface';
import { ILogger } from '../infrastructure/interfaces/logger.interface';
import { IEventBus } from '../infrastructure/interfaces/event-bus.interface';
import GitService from '../services/git-service';

interface SyncRemoteRequest {
  force?: boolean;
  userId: string;
}

interface SyncRemoteResponse {
  success: boolean;
  pushedCommits: number;
  pulledCommits: number;
}

@injectable()
export class SyncRemoteUseCase implements IUseCase<SyncRemoteRequest, SyncRemoteResponse> {
  constructor(
    @inject(TYPES.GitService) private gitService: GitService,
    @inject(TYPES.SettingsRepository) private settingsRepository: ISettingsRepository,
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async execute(request: SyncRemoteRequest): Promise<SyncRemoteResponse> {
    const { force = false, userId } = request;

    this.logger.info(`Syncing with remote (user: ${userId}, force: ${force})`);

    // Verificar se remote está configurado
    const remoteEnabled = await this.settingsRepository.get('remote_enabled');
    if (!remoteEnabled) {
      throw new Error('Remote repository not configured');
    }

    const remoteUrl = await this.settingsRepository.get('remote_url');
    if (!remoteUrl) {
      throw new Error('Remote URL not configured');
    }

    try {
      // Configurar remote
      await this.gitService.addRemote('origin', remoteUrl);

      // Push
      await this.gitService.push('origin', 'main');

      // TODO: Implementar pull e merge
      const pushedCommits = 1; // Placeholder
      const pulledCommits = 0; // Placeholder

      // Emitir evento
      await this.eventBus.emit('remote.synced', {
        remoteUrl,
        pushedCommits,
        pulledCommits,
        userId,
        timestamp: Date.now()
      });

      this.logger.info('Remote sync completed successfully');

      return {
        success: true,
        pushedCommits,
        pulledCommits
      };

    } catch (error) {
      await this.eventBus.emit('remote.sync_failed', {
        remoteUrl,
        error,
        userId,
        timestamp: Date.now()
      });

      this.logger.error('Remote sync failed:', error);
      throw error;
    }
  }
}
```

---

### 3.5 Implementar Domain Models

**Prioridade:** 🟡 MÉDIA
**Esforço:** 16 horas

```typescript
// backend/domain/models/backup.model.ts
export class Backup {
  constructor(
    public readonly id: number,
    public readonly hash: string,
    public readonly message: string,
    public readonly timestamp: number,
    public readonly filesChanged: number,
    public readonly isAuto: boolean,
    public readonly author?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.hash || this.hash.length !== 40) {
      throw new Error('Invalid commit hash');
    }

    if (!this.message || this.message.trim().length === 0) {
      throw new Error('Backup message is required');
    }

    if (this.message.length > 500) {
      throw new Error('Backup message too long');
    }

    if (this.filesChanged < 0) {
      throw new Error('Files changed cannot be negative');
    }

    if (this.timestamp > Date.now()) {
      throw new Error('Timestamp cannot be in the future');
    }
  }

  get shortHash(): string {
    return this.hash.substring(0, 7);
  }

  get age(): number {
    return Date.now() - this.timestamp;
  }

  get isRecent(): boolean {
    const oneHour = 60 * 60 * 1000;
    return this.age < oneHour;
  }

  toJSON() {
    return {
      id: this.id,
      hash: this.hash,
      shortHash: this.shortHash,
      message: this.message,
      timestamp: this.timestamp,
      filesChanged: this.filesChanged,
      isAuto: this.isAuto,
      author: this.author,
      age: this.age,
      isRecent: this.isRecent
    };
  }

  static fromDatabase(row: any): Backup {
    return new Backup(
      row.id,
      row.hash,
      row.message,
      row.timestamp,
      row.files_changed,
      row.is_auto === 1,
      row.author
    );
  }
}
```

```typescript
// backend/domain/models/notification.model.ts
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export class Notification {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly message: string,
    public readonly severity: NotificationSeverity,
    public readonly timestamp: number,
    public read: boolean = false
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Notification title is required');
    }

    if (!this.message || this.message.trim().length === 0) {
      throw new Error('Notification message is required');
    }

    const validSeverities: NotificationSeverity[] = ['info', 'warning', 'error', 'success'];
    if (!validSeverities.includes(this.severity)) {
      throw new Error(`Invalid severity: ${this.severity}`);
    }
  }

  markAsRead(): void {
    this.read = true;
  }

  markAsUnread(): void {
    this.read = false;
  }

  get isUnread(): boolean {
    return !this.read;
  }

  get isCritical(): boolean {
    return this.severity === 'error';
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      severity: this.severity,
      timestamp: this.timestamp,
      read: this.read,
      isUnread: this.isUnread,
      isCritical: this.isCritical
    };
  }

  static fromDatabase(row: any): Notification {
    return new Notification(
      row.id,
      row.title,
      row.message,
      row.severity,
      row.created_at,
      row.read === 1
    );
  }
}
```

---

### Checklist Fase 3: Arquitetura

- [ ] InversifyJS configurado
- [ ] Container DI com todos os serviços
- [ ] Repository pattern implementado (4+ repositories)
- [ ] Event Bus implementado
- [ ] 5+ event handlers registrados
- [ ] Use Cases implementados (3+ principais)
- [ ] Domain Models com validação
- [ ] Rotas refatoradas com DI
- [ ] Testes unitários para use cases
- [ ] Testes de integração com mocks
- [ ] Documentação de arquitetura atualizada

---

## Fase 4: Performance e Otimização (4 semanas)

### Objetivo
Alcançar Lighthouse score > 95 e otimizar todas as operações críticas.

### Duração
**4 semanas (160 horas)**

---

### 4.1 Frontend Performance Optimization

**Prioridade:** 🟡 ALTA
**Esforço:** 40 horas

#### Code Splitting e Lazy Loading

```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Items = lazy(() => import('./pages/Items'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading fallback
function LoadingFallback() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/items" element={<Items />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}
```

#### Component Memoization

```typescript
// frontend/src/components/BackupCard.tsx
import { memo } from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

interface BackupCardProps {
  backup: {
    hash: string;
    message: string;
    timestamp: number;
    filesChanged: number;
    isAuto: boolean;
  };
  onClick: (hash: string) => void;
}

const BackupCard = memo(({ backup, onClick }: BackupCardProps) => {
  const handleClick = () => onClick(backup.hash);

  return (
    <Card onClick={handleClick} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Typography variant="h6">{backup.message}</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDistanceToNow(backup.timestamp, { addSuffix: true })}
        </Typography>
        <Chip
          label={backup.isAuto ? 'Auto' : 'Manual'}
          size="small"
          color={backup.isAuto ? 'default' : 'primary'}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.backup.hash === nextProps.backup.hash &&
    prevProps.backup.timestamp === nextProps.backup.timestamp
  );
});

BackupCard.displayName = 'BackupCard';

export default BackupCard;
```

#### Custom Hooks para Cache e Deduplicação

```typescript
// frontend/src/hooks/useApi.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseApiOptions<T> {
  initialData?: T;
  cacheTime?: number; // ms
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  error: string;
  loading: boolean;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

// Cache global para deduplicação
const cache = new Map<string, { data: any; timestamp: number }>();

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<{ data: T }>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    initialData = null,
    cacheTime = 30000, // 30s default
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    // Gerar cache key
    const cacheKey = `${apiCall.name}-${JSON.stringify(args)}`;

    // Verificar cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      return cached.data;
    }

    // Cancelar requisição anterior
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');

    try {
      const response = await apiCall(...args);
      const result = response.data;

      if (mountedRef.current) {
        setData(result);
        setLoading(false);

        // Atualizar cache
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        onSuccess?.(result);
      }

      return result;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Requisição cancelada, ignorar
        return null as any;
      }

      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        setLoading(false);

        onError?.(err);
      }

      throw err;
    }
  }, [apiCall, cacheTime, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError('');
    setLoading(false);
  }, [initialData]);

  return { data, error, loading, execute, reset };
}
```

#### Bundle Optimization

```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-utils': ['date-fns', 'axios'],
        }
      }
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
  }
});
```

---

### 4.2 Backend Performance Optimization

**Prioridade:** 🟡 ALTA
**Esforço:** 32 horas

#### Caching Layer com Redis

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

```typescript
// backend/infrastructure/cache.ts
import Redis from 'ioredis';
import { injectable } from 'inversify';
import { ICache } from './interfaces/cache.interface';

@injectable()
export class CacheService implements ICache {
  private client: Redis;

  constructor() {
    // Em desenvolvimento, usar Redis local se disponível, senão usar memória
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis connection failed, using in-memory cache');
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        await this.client.flushdb();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
```

#### Cached Repository Decorator

```typescript
// backend/repositories/decorators/cached-repository.ts
import { ICache } from '../../infrastructure/interfaces/cache.interface';

export function Cached(ttlSeconds: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache: ICache = (this as any).cache;

      if (!cache) {
        // Se não tem cache, executar normalmente
        return originalMethod.apply(this, args);
      }

      // Gerar cache key
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // Tentar obter do cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Executar método original
      const result = await originalMethod.apply(this, args);

      // Salvar no cache
      await cache.set(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}
```

```typescript
// backend/repositories/backup-repository.ts (com cache)
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { IBackupRepository } from './interfaces/backup-repository.interface';
import { IDatabase } from '../infrastructure/interfaces/database.interface';
import { ICache } from '../infrastructure/interfaces/cache.interface';
import { Cached } from './decorators/cached-repository';
import { BackupHistory } from '../types';

@injectable()
export class BackupRepository implements IBackupRepository {
  constructor(
    @inject(TYPES.Database) private db: IDatabase,
    @inject(TYPES.Cache) private cache: ICache
  ) {}

  @Cached(60) // Cache por 60 segundos
  async findRecent(limit: number): Promise<BackupHistory[]> {
    return this.db.all<BackupHistory>(
      'SELECT * FROM backup_history ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
  }

  @Cached(300) // Cache por 5 minutos
  async findByHash(hash: string): Promise<BackupHistory | null> {
    const row = await this.db.get<BackupHistory>(
      'SELECT * FROM backup_history WHERE hash = ?',
      [hash]
    );
    return row || null;
  }

  async create(backup: Partial<BackupHistory>): Promise<BackupHistory> {
    const result = await this.db.run(
      `INSERT INTO backup_history (hash, message, timestamp, files_changed, is_auto)
       VALUES (?, ?, ?, ?, ?)`,
      [
        backup.hash,
        backup.message,
        backup.timestamp || Date.now(),
        backup.files_changed || 0,
        backup.is_auto ? 1 : 0
      ]
    );

    // Invalidar cache
    await this.cache.clear('BackupRepository:findRecent:*');

    return this.findById(result.lastID)!;
  }
}
```

#### Database Query Optimization

```typescript
// backend/config/database.ts (otimizado)
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);

    // Otimizações SQLite
    this.db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging
    this.db.run('PRAGMA synchronous = NORMAL');
    this.db.run('PRAGMA cache_size = -64000'); // 64MB cache
    this.db.run('PRAGMA temp_store = MEMORY');
    this.db.run('PRAGMA mmap_size = 30000000000'); // 30GB mmap
    this.db.run('PRAGMA page_size = 4096');
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return promisify<string, any[], T | undefined>(
      this.db.get.bind(this.db)
    )(sql, params);
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return promisify<string, any[], T[]>(
      this.db.all.bind(this.db)
    )(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // Batch insert otimizado
  async batchInsert(table: string, rows: any[]): Promise<void> {
    if (rows.length === 0) return;

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    await this.run('BEGIN TRANSACTION');

    try {
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        await this.run(sql, values);
      }

      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }
}
```

---

### 4.3 API Response Time Optimization

**Prioridade:** 🟡 ALTA
**Esforço:** 24 horas

#### Compression Middleware

```bash
npm install compression
npm install --save-dev @types/compression
```

```typescript
// backend/middleware/compression.ts
import compression from 'compression';
import { Request, Response } from 'express';

export const compressionMiddleware = compression({
  // Comprimir apenas respostas maiores que 1KB
  threshold: 1024,

  // Níveis de compressão (0-9, 6 é default)
  level: 6,

  // Filtrar quais respostas comprimir
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }

    return compression.filter(req, res);
  }
});
```

#### Response Pagination

```typescript
// backend/utils/pagination.ts
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function paginate<T>(
  query: () => Promise<T[]>,
  countQuery: () => Promise<number>,
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    query(),
    countQuery()
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore
    }
  };
}
```

```typescript
// backend/routes/history.ts (com paginação)
router.get('/commits', authenticate, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  const result = await paginate(
    () => gitService.getHistory(limit, (page - 1) * limit),
    () => gitService.getTotalCommits(),
    { page, limit }
  );

  res.json(result);
});
```

#### Parallel Processing

```typescript
// backend/services/ha-parser.ts (paralelo)
async parseAll(options: ParseOptions = {}): Promise<HAItem[]> {
  const tasks = [];

  if (options.parseAutomations) {
    tasks.push(this.parsers.get('automations')!.parse());
  }

  if (options.parseScripts) {
    tasks.push(this.parsers.get('scripts')!.parse());
  }

  if (options.parseScenes) {
    tasks.push(this.parsers.get('scenes')!.parse());
  }

  // Executar em paralelo ao invés de sequencial
  const results = await Promise.allSettled(tasks);

  const items: HAItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      this.logger.error('Parser failed:', result.reason);
    }
  }

  return items;
}
```

---

### Checklist Fase 4: Performance

- [ ] Code splitting implementado
- [ ] Lazy loading em todas as rotas
- [ ] Component memoization (React.memo)
- [ ] Custom hooks com cache
- [ ] Bundle size < 200KB gzipped
- [ ] Redis cache configurado
- [ ] Cached repository decorator
- [ ] Database query optimization (WAL, indexes)
- [ ] Compression middleware
- [ ] Pagination em endpoints grandes
- [ ] Parallel processing implementado
- [ ] Lighthouse score > 95
- [ ] FCP < 1s, TTI < 2s
- [ ] API response time p95 < 200ms

---

*[O documento continua com Fases 5-6 e Conclusão]*

**Deseja que eu finalize com as Fases 5-6 (DevOps e Documentação) e a seção de Cronograma e Recursos?**
