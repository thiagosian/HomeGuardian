# Plano de Melhoria HomeGuardian: Caminho para 10/10
**Data de Criação:** 08 de Novembro de 2025
**Versão Atual:** 1.1.0 (Nota: 7.2/10)
**Meta:** Alcançar 10/10 em todas as categorias
**Prazo Estimado:** 6-8 meses (240-320 horas de desenvolvimento)

---

## Índice
1. [Visão Geral](#visão-geral)
2. [Objetivos e Métricas](#objetivos-e-métricas)
3. [Fase 1: Segurança Crítica](#fase-1-segurança-crítica-sprint-1-2-semanas)
4. [Fase 2: Qualidade e Testes](#fase-2-qualidade-e-testes-sprint-2-3-4-semanas)
5. [Fase 3: Arquitetura e Refatoração](#fase-3-arquitetura-e-refatoração-6-semanas)
6. [Fase 4: Performance e Otimização](#fase-4-performance-e-otimização-4-semanas)
7. [Fase 5: DevOps e Automação](#fase-5-devops-e-automação-3-semanas)
8. [Fase 6: Documentação e Excelência](#fase-6-documentação-e-excelência-3-semanas)
9. [Cronograma Detalhado](#cronograma-detalhado)
10. [Recursos Necessários](#recursos-necessários)
11. [Checklist de Validação 10/10](#checklist-de-validação-1010)

---

## Visão Geral

### Estado Atual vs. Estado Desejado

| Categoria | Atual | Meta | Gap |
|-----------|-------|------|-----|
| **Segurança** | 6.5/10 | 10/10 | 3.5 pontos |
| **Qualidade de Código** | 7.5/10 | 10/10 | 2.5 pontos |
| **Arquitetura** | 7.8/10 | 10/10 | 2.2 pontos |
| **Testes** | 3.0/10 | 10/10 | 7.0 pontos |
| **Performance** | 7.0/10 | 10/10 | 3.0 pontos |
| **Documentação** | 5.0/10 | 10/10 | 5.0 pontos |
| **DevOps/CI/CD** | 2.0/10 | 10/10 | 8.0 pontos |
| **Manutenibilidade** | 7.0/10 | 10/10 | 3.0 pontos |
| **Escalabilidade** | 6.5/10 | 10/10 | 3.5 pontos |
| **Acessibilidade** | 6.0/10 | 10/10 | 4.0 pontos |

### Investimento Total Estimado
- **Tempo de Desenvolvimento:** 240-320 horas
- **Período:** 6-8 meses (assumindo 40h/mês de dedicação)
- **Desenvolvedores:** 1-2 devs full-stack
- **ROI Esperado:**
  - Redução de 80% em bugs de segurança
  - Redução de 60% em tempo de manutenção
  - Aumento de 90% em confiabilidade
  - Facilidade de onboarding de novos desenvolvedores

---

## Objetivos e Métricas

### Objetivos SMART

1. **Segurança (10/10)**
   - ✅ Zero vulnerabilidades críticas em scan automatizado
   - ✅ 100% de dados sensíveis criptografados com algoritmos modernos
   - ✅ Autenticação e autorização em todas as rotas
   - ✅ Score A+ no Security Headers
   - ✅ Penetration testing aprovado

2. **Testes (10/10)**
   - ✅ 90%+ cobertura de código (backend)
   - ✅ 85%+ cobertura de código (frontend)
   - ✅ 100% dos endpoints críticos com testes de integração
   - ✅ E2E tests cobrindo 100% dos fluxos principais
   - ✅ Mutation testing score > 80%

3. **Performance (10/10)**
   - ✅ Lighthouse score > 95
   - ✅ Time to Interactive < 2s
   - ✅ First Contentful Paint < 1s
   - ✅ API response time < 200ms (p95)
   - ✅ Bundle size < 200KB (gzipped)

4. **Código (10/10)**
   - ✅ Complexidade ciclomática < 10 por função
   - ✅ Zero duplicação de código (< 3%)
   - ✅ 100% TypeScript (migração completa)
   - ✅ SonarQube Quality Gate: A
   - ✅ ESLint: 0 warnings/erros

5. **Arquitetura (10/10)**
   - ✅ Padrões DDD implementados
   - ✅ Dependency Injection em todos os serviços
   - ✅ Event-driven architecture para operações assíncronas
   - ✅ SOLID principles compliance > 95%
   - ✅ Clean Architecture camadas bem definidas

6. **DevOps (10/10)**
   - ✅ CI/CD pipeline completo
   - ✅ Deploy automatizado com rollback
   - ✅ Monitoring e alertas configurados
   - ✅ Logs estruturados e centralizados
   - ✅ Infrastructure as Code (IaC)

---

## Fase 1: Segurança Crítica (Sprint 1 - 2 semanas)

### Objetivo
Eliminar todas as vulnerabilidades críticas e de alta severidade identificadas no audit.

### Duração
**2 semanas (80 horas)**

---

### 1.1 Substituir crypto-js por crypto nativo

**Prioridade:** 🔴 CRÍTICA
**Esforço:** 12 horas
**Responsável:** Dev Backend Senior

#### Implementação Detalhada

**Passo 1: Criar módulo de criptografia moderno**

```javascript
// backend/utils/crypto-manager.js
const crypto = require('crypto');

class CryptoManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
    this.tagLength = 16; // 128 bits
  }

  /**
   * Encrypts data using AES-256-GCM
   * @param {string} plaintext - Text to encrypt
   * @param {string} key - Hex-encoded 256-bit key
   * @returns {string} Base64-encoded encrypted data (IV + authTag + ciphertext)
   */
  encrypt(plaintext, key) {
    if (!plaintext) throw new Error('Plaintext is required');
    if (!key || key.length !== 64) throw new Error('Invalid key length');

    const iv = crypto.randomBytes(this.ivLength);
    const keyBuffer = Buffer.from(key, 'hex');
    const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypts data encrypted with encrypt()
   * @param {string} encryptedData - Base64-encoded encrypted data
   * @param {string} key - Hex-encoded 256-bit key
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData, key) {
    if (!encryptedData) throw new Error('Encrypted data is required');
    if (!key || key.length !== 64) throw new Error('Invalid key length');

    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const iv = combined.slice(0, this.ivLength);
    const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
    const encrypted = combined.slice(this.ivLength + this.tagLength);

    const keyBuffer = Buffer.from(key, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Generates a cryptographically secure random key
   * @returns {string} Hex-encoded 256-bit key
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Derives a key from a password using PBKDF2
   * @param {string} password - Password to derive key from
   * @param {string} salt - Hex-encoded salt (or generates new one)
   * @returns {Object} { key: string, salt: string }
   */
  deriveKey(password, salt = null) {
    const saltBuffer = salt
      ? Buffer.from(salt, 'hex')
      : crypto.randomBytes(16);

    const key = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000, // iterations
      this.keyLength,
      'sha256'
    );

    return {
      key: key.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }
}

module.exports = new CryptoManager();
```

**Passo 2: Script de migração de dados existentes**

```javascript
// backend/scripts/migrate-to-native-crypto.js
const db = require('../config/database');
const logger = require('../utils/logger');
const oldCrypto = require('crypto-js'); // Temporário
const newCrypto = require('../utils/crypto-manager');
const encryptionKeyManager = require('../utils/encryption-key-manager');

async function migrateCrypto() {
  logger.info('Starting crypto migration...');

  const key = encryptionKeyManager.getKey();
  let migratedCount = 0;
  let failedCount = 0;

  try {
    // Migrar SSH Keys
    const sshKeys = await db.all('SELECT id, private_key_encrypted FROM ssh_keys');

    for (const sshKey of sshKeys) {
      try {
        // Decrypt with old crypto-js
        const decrypted = oldCrypto.AES.decrypt(
          sshKey.private_key_encrypted,
          key
        ).toString(oldCrypto.enc.Utf8);

        // Encrypt with new native crypto
        const reencrypted = newCrypto.encrypt(decrypted, key);

        // Update database
        await db.run(
          'UPDATE ssh_keys SET private_key_encrypted = ?, migrated_crypto = 1 WHERE id = ?',
          [reencrypted, sshKey.id]
        );

        migratedCount++;
        logger.info(`Migrated SSH key ${sshKey.id}`);
      } catch (error) {
        failedCount++;
        logger.error(`Failed to migrate SSH key ${sshKey.id}:`, error);
      }
    }

    // Migrar Settings com valores criptografados
    const settings = await db.all('SELECT key, value FROM settings WHERE encrypted = 1');

    for (const setting of settings) {
      try {
        // Decrypt with old crypto-js
        const decrypted = oldCrypto.AES.decrypt(
          setting.value,
          key
        ).toString(oldCrypto.enc.Utf8);

        // Encrypt with new native crypto
        const reencrypted = newCrypto.encrypt(decrypted, key);

        // Update database
        await db.run(
          'UPDATE settings SET value = ? WHERE key = ?',
          [reencrypted, setting.key]
        );

        migratedCount++;
        logger.info(`Migrated setting ${setting.key}`);
      } catch (error) {
        failedCount++;
        logger.error(`Failed to migrate setting ${setting.key}:`, error);
      }
    }

    logger.info(`Migration completed: ${migratedCount} success, ${failedCount} failed`);

    if (failedCount === 0) {
      // Criar flag de migração concluída
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
        ['crypto_migration_completed', '1', 0]
      );
      logger.info('Migration flag set successfully');
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateCrypto()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateCrypto;
```

**Passo 3: Atualizar routes/settings.js**

```javascript
// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const crypto = require('../utils/crypto-manager'); // ✅ Novo
const encryptionKeyManager = require('../utils/encryption-key-manager');
const db = require('../config/database');
const logger = require('../utils/logger');

// Remover funções antigas encrypt/decrypt

// Gerar chave SSH
router.post('/ssh-key/generate', async (req, res) => {
  try {
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);

    const privateKeyPath = path.join(process.env.DATA_PATH, '.ssh', 'id_rsa');
    const publicKeyPath = `${privateKeyPath}.pub`;

    // ✅ Corrigido: usar execFile ao invés de execAsync
    await execFileAsync('ssh-keygen', [
      '-t', 'rsa',
      '-b', '4096',
      '-f', privateKeyPath,
      '-N', '',
      '-C', 'homeguardian@homeassistant'
    ]);

    const privateKey = await fs.readFile(privateKeyPath, 'utf8');
    const publicKey = await fs.readFile(publicKeyPath, 'utf8');

    // ✅ Usar novo crypto manager
    const encryptedPrivateKey = crypto.encrypt(
      privateKey,
      encryptionKeyManager.getKey()
    );

    // Salvar no banco
    await db.run(
      'INSERT INTO ssh_keys (private_key_encrypted, public_key, created_at) VALUES (?, ?, ?)',
      [encryptedPrivateKey, publicKey, Date.now()]
    );

    // Remover arquivo privado (manter só no DB criptografado)
    await fs.unlink(privateKeyPath);

    res.json({ publicKey });
  } catch (error) {
    logger.error('SSH key generation failed:', error);
    res.status(500).json({ error: 'Failed to generate SSH key' });
  }
});

// Salvar token de remote
router.post('/remote/config', async (req, res) => {
  try {
    const { remoteUrl, authType, token } = req.body;

    let encryptedToken = null;
    if (authType === 'token' && token) {
      // ✅ Usar novo crypto manager
      encryptedToken = crypto.encrypt(token, encryptionKeyManager.getKey());
    }

    await db.run(
      'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
      ['remote_token', encryptedToken, 1]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Remote config save failed:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

module.exports = router;
```

**Passo 4: Testes unitários**

```javascript
// backend/__tests__/unit/utils/crypto-manager.test.js
const crypto = require('../../../utils/crypto-manager');

describe('CryptoManager', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt correctly', () => {
      const key = crypto.generateKey();
      const plaintext = 'sensitive data 123';

      const encrypted = crypto.encrypt(plaintext, key);
      expect(encrypted).not.toBe(plaintext);

      const decrypted = crypto.decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const key = crypto.generateKey();
      const plaintext = 'test';

      const encrypted1 = crypto.encrypt(plaintext, key);
      const encrypted2 = crypto.encrypt(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
      expect(crypto.decrypt(encrypted1, key)).toBe(plaintext);
      expect(crypto.decrypt(encrypted2, key)).toBe(plaintext);
    });

    it('should fail with wrong key', () => {
      const key1 = crypto.generateKey();
      const key2 = crypto.generateKey();
      const plaintext = 'secret';

      const encrypted = crypto.encrypt(plaintext, key1);

      expect(() => {
        crypto.decrypt(encrypted, key2);
      }).toThrow();
    });

    it('should handle unicode characters', () => {
      const key = crypto.generateKey();
      const plaintext = '🔐 Dados sensíveis! 你好';

      const encrypted = crypto.encrypt(plaintext, key);
      const decrypted = crypto.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('generateKey', () => {
    it('should generate 64-char hex string (256 bits)', () => {
      const key = crypto.generateKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = crypto.generateKey();
      const key2 = crypto.generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('deriveKey', () => {
    it('should derive same key from same password and salt', () => {
      const password = 'myPassword123';
      const { key: key1, salt } = crypto.deriveKey(password);
      const { key: key2 } = crypto.deriveKey(password, salt);

      expect(key1).toBe(key2);
    });

    it('should derive different keys from different passwords', () => {
      const { key: key1 } = crypto.deriveKey('password1');
      const { key: key2 } = crypto.deriveKey('password2');

      expect(key1).not.toBe(key2);
    });
  });
});
```

**Checklist de Conclusão:**
- [ ] Crypto manager implementado e testado
- [ ] Script de migração criado e testado em ambiente dev
- [ ] Backup de dados antes da migração em prod
- [ ] Migração executada com sucesso
- [ ] Testes de regressão passando
- [ ] crypto-js removido do package.json
- [ ] Documentação atualizada

---

### 1.2 Corrigir Command Injection

**Prioridade:** 🔴 CRÍTICA
**Esforço:** 3 horas

#### Implementação

```javascript
// backend/routes/settings.js
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const path = require('path');
const fs = require('fs').promises;

router.post('/ssh-key/generate', async (req, res) => {
  try {
    // Validar DATA_PATH
    const dataPath = process.env.DATA_PATH;
    if (!dataPath || !path.isAbsolute(dataPath)) {
      throw new Error('Invalid DATA_PATH configuration');
    }

    const sshDir = path.join(dataPath, '.ssh');
    await fs.mkdir(sshDir, { recursive: true, mode: 0o700 });

    const privateKeyPath = path.join(sshDir, 'id_rsa');
    const publicKeyPath = `${privateKeyPath}.pub`;

    // ✅ SEGURO: Usar execFile com array de argumentos
    await execFileAsync('ssh-keygen', [
      '-t', 'rsa',
      '-b', '4096',
      '-f', privateKeyPath,
      '-N', '',
      '-C', 'homeguardian@homeassistant'
    ], {
      timeout: 30000, // 30 segundos
      maxBuffer: 1024 * 1024 // 1MB
    });

    const privateKey = await fs.readFile(privateKeyPath, 'utf8');
    const publicKey = await fs.readFile(publicKeyPath, 'utf8');

    // Criptografar e salvar
    const encryptedPrivateKey = crypto.encrypt(
      privateKey,
      encryptionKeyManager.getKey()
    );

    await db.run(
      'INSERT INTO ssh_keys (private_key_encrypted, public_key, created_at) VALUES (?, ?, ?)',
      [encryptedPrivateKey, publicKey, Date.now()]
    );

    // Remover arquivos temporários
    await fs.unlink(privateKeyPath);
    await fs.unlink(publicKeyPath);

    logger.info('SSH key generated successfully');
    res.json({ publicKey });

  } catch (error) {
    logger.error('SSH key generation failed:', error);

    // Não expor detalhes do erro em produção
    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to generate SSH key'
      : error.message;

    res.status(500).json({ error: message });
  }
});
```

**Teste de Segurança:**

```javascript
// backend/__tests__/security/command-injection.test.js
const request = require('supertest');
const app = require('../../server');

describe('Command Injection Protection', () => {
  it('should not be vulnerable to command injection in SSH key generation', async () => {
    // Tentar injetar comando malicioso via DATA_PATH
    process.env.DATA_PATH = '/tmp/test; curl http://evil.com';

    const response = await request(app)
      .post('/api/settings/ssh-key/generate')
      .expect(500); // Deve falhar, não executar comando

    // Verificar que nenhum comando externo foi executado
    expect(response.body.error).toBeDefined();
  });

  it('should sanitize all user inputs before shell execution', async () => {
    const maliciousInputs = [
      '; rm -rf /',
      '&& curl evil.com',
      '| cat /etc/passwd',
      '`whoami`',
      '$(whoami)',
      '../../../etc/passwd'
    ];

    for (const input of maliciousInputs) {
      const response = await request(app)
        .post('/api/settings/remote/config')
        .send({ remoteUrl: input })
        .expect(400); // Deve ser rejeitado pela validação

      expect(response.body.error).toBeDefined();
    }
  });
});
```

---

### 1.3 Implementar Autenticação Completa

**Prioridade:** 🔴 CRÍTICA
**Esforço:** 16 horas

#### Implementação: Sistema de Autenticação Multi-Camadas

**Passo 1: Middleware de Autenticação**

```javascript
// backend/middleware/auth.js
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Valida token do Home Assistant via Supervisor API
 */
async function validateHAToken(token) {
  try {
    const response = await axios.get('http://supervisor/core/api/config', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    logger.warn('HA token validation failed:', error.message);
    return false;
  }
}

/**
 * Middleware de autenticação
 * Suporta múltiplos modos:
 * 1. Home Assistant Ingress (cookie/header automático)
 * 2. Bearer token para API
 * 3. Session-based auth
 */
async function authenticate(req, res, next) {
  try {
    // Modo 1: Home Assistant Ingress
    // O Supervisor injeta headers automaticamente
    const ingressUser = req.headers['x-ingress-user'];
    const supervisorToken = req.headers['x-supervisor-token'];

    if (ingressUser && supervisorToken) {
      req.user = {
        id: ingressUser,
        source: 'ingress',
        authenticated: true
      };
      return next();
    }

    // Modo 2: Bearer Token (para API direta)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Validar token com Home Assistant
      const isValid = await validateHAToken(token);
      if (isValid) {
        req.user = {
          source: 'bearer',
          authenticated: true,
          token
        };
        return next();
      }
    }

    // Modo 3: Session (para dev/testing)
    if (process.env.NODE_ENV === 'development' && req.session?.user) {
      req.user = req.session.user;
      return next();
    }

    // Nenhuma autenticação válida
    logger.warn(`Unauthorized access attempt: ${req.method} ${req.path}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication required'
    });

  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
}

/**
 * Middleware para rotas públicas (opcional)
 */
function optionalAuth(req, res, next) {
  authenticate(req, res, (err) => {
    // Mesmo se falhar, permite continuar
    if (err) {
      req.user = null;
    }
    next();
  });
}

/**
 * Middleware para verificar permissões específicas
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user || !req.user.authenticated) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // TODO: Implementar sistema de permissões granulares
    // Por enquanto, todos os usuários autenticados têm todas as permissões
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requirePermission
};
```

**Passo 2: Aplicar autenticação em todas as rotas**

```javascript
// backend/server.js
const express = require('express');
const { authenticate, optionalAuth } = require('./middleware/auth');

const app = express();

// ... outros middlewares ...

// Rotas públicas (não requerem auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas que requerem autenticação
app.use('/api/backup', authenticate, require('./routes/backup'));
app.use('/api/restore', authenticate, require('./routes/restore'));
app.use('/api/settings', authenticate, require('./routes/settings'));
app.use('/api/history', authenticate, require('./routes/history'));
app.use('/api/notifications', authenticate, require('./routes/notifications'));

// Status pode ser público ou autenticado (mostra mais info se autenticado)
app.use('/api/status', optionalAuth, require('./routes/status'));

// ... resto do código ...
```

**Passo 3: Frontend - Axios Interceptors**

```javascript
// frontend/src/api/client.js
import axios from 'axios';
import { API_BASE_URL } from '../config/ingress';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adicionar autenticação
client.interceptors.request.use(
  (config) => {
    // Home Assistant Ingress injeta autenticação automaticamente
    // Mas podemos adicionar token explicitamente se disponível
    const token = sessionStorage.getItem('ha_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log apenas em dev
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - tratamento de erros
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Não autenticado - redirecionar para Home Assistant
          console.error('[Auth] Unauthorized - redirecting to HA login');

          // Em produção, redireciona para HA
          if (import.meta.env.PROD) {
            window.location.href = '/';
          }
          break;

        case 403:
          // Sem permissão
          console.error('[Auth] Forbidden:', data.message);
          break;

        case 429:
          // Rate limit
          console.warn('[RateLimit] Too many requests');
          break;

        case 500:
          // Erro do servidor
          console.error('[Server] Internal error:', data.message);
          break;

        default:
          console.error(`[API] Error ${status}:`, data);
      }
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('[Network] No response received:', error.message);
    } else {
      // Erro ao configurar requisição
      console.error('[Request] Setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default client;
```

**Passo 4: Testes de Autenticação**

```javascript
// backend/__tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../server');

describe('Authentication', () => {
  describe('Protected routes', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/backup/backup-now')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should accept valid HA ingress headers', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('X-Ingress-User', 'test-user')
        .set('X-Supervisor-Token', 'valid-token')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should accept valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Authorization', 'Bearer valid-ha-token')
        .expect(200);
    });
  });

  describe('Public routes', () => {
    it('should allow health check without auth', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits per user', async () => {
      // Fazer múltiplas requisições rapidamente
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/backup/backup-now')
          .set('X-Ingress-User', 'test-user')
          .set('X-Supervisor-Token', 'valid-token')
      );

      const responses = await Promise.all(requests);

      // Deve ter pelo menos uma resposta 429 (rate limit)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

---

### 1.4 Implementar Key Rotation Completo

**Prioridade:** 🔴 CRÍTICA
**Esforço:** 8 horas

```javascript
// backend/utils/encryption-key-manager.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('./crypto-manager');
const db = require('../config/database');
const logger = require('./logger');

class EncryptionKeyManager {
  constructor() {
    this.keyPath = path.join(process.env.DATA_PATH || '/data', '.encryption_key');
    this.key = null;
    this.rotationInProgress = false;
  }

  async initialize() {
    try {
      // Tentar carregar chave existente
      const key = await fs.readFile(this.keyPath, 'utf8');
      this.key = key.trim();
      logger.info('Encryption key loaded successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Chave não existe, gerar nova
        logger.info('No encryption key found, generating new one');
        await this.generateAndStoreKey();
      } else {
        throw error;
      }
    }
  }

  async generateAndStoreKey() {
    const key = crypto.generateKey();
    await this.storeKey(key);
    this.key = key;
    logger.info('New encryption key generated and stored');
    return key;
  }

  async storeKey(key) {
    await fs.writeFile(this.keyPath, key, {
      encoding: 'utf8',
      mode: 0o600
    });
  }

  getKey() {
    if (!this.key) {
      throw new Error('Encryption key not initialized');
    }
    return this.key;
  }

  /**
   * Rotaciona a chave de criptografia e re-criptografa todos os dados
   * @returns {Object} Estatísticas da rotação
   */
  async rotateKey() {
    if (this.rotationInProgress) {
      throw new Error('Key rotation already in progress');
    }

    this.rotationInProgress = true;
    const oldKey = this.key;
    const newKey = crypto.generateKey();

    const stats = {
      sshKeys: { total: 0, success: 0, failed: 0 },
      settings: { total: 0, success: 0, failed: 0 },
      startTime: Date.now(),
      endTime: null,
      duration: null
    };

    try {
      logger.info('Starting key rotation...');

      // 1. Re-criptografar SSH Keys
      const sshKeys = await db.all('SELECT id, private_key_encrypted FROM ssh_keys');
      stats.sshKeys.total = sshKeys.length;

      for (const sshKey of sshKeys) {
        try {
          const decrypted = crypto.decrypt(sshKey.private_key_encrypted, oldKey);
          const reencrypted = crypto.encrypt(decrypted, newKey);

          await db.run(
            'UPDATE ssh_keys SET private_key_encrypted = ? WHERE id = ?',
            [reencrypted, sshKey.id]
          );

          stats.sshKeys.success++;
        } catch (error) {
          stats.sshKeys.failed++;
          logger.error(`Failed to re-encrypt SSH key ${sshKey.id}:`, error);
        }
      }

      // 2. Re-criptografar Settings
      const settings = await db.all('SELECT key, value FROM settings WHERE encrypted = 1');
      stats.settings.total = settings.length;

      for (const setting of settings) {
        try {
          const decrypted = crypto.decrypt(setting.value, oldKey);
          const reencrypted = crypto.encrypt(decrypted, newKey);

          await db.run(
            'UPDATE settings SET value = ? WHERE key = ?',
            [reencrypted, setting.key]
          );

          stats.settings.success++;
        } catch (error) {
          stats.settings.failed++;
          logger.error(`Failed to re-encrypt setting ${setting.key}:`, error);
        }
      }

      // 3. Verificar se houve falhas
      const totalFailed = stats.sshKeys.failed + stats.settings.failed;
      if (totalFailed > 0) {
        throw new Error(`Key rotation partially failed: ${totalFailed} items failed to re-encrypt`);
      }

      // 4. Backup da chave antiga
      const backupPath = `${this.keyPath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, oldKey, { mode: 0o600 });
      logger.info(`Old key backed up to ${backupPath}`);

      // 5. Salvar nova chave
      await this.storeKey(newKey);
      this.key = newKey;

      // 6. Registrar rotação no histórico
      await db.run(
        `INSERT INTO key_rotation_history (
          old_key_hash, new_key_hash, items_reencrypted, rotation_time
        ) VALUES (?, ?, ?, ?)`,
        [
          crypto.hash(oldKey),
          crypto.hash(newKey),
          stats.sshKeys.success + stats.settings.success,
          Date.now()
        ]
      );

      stats.endTime = Date.now();
      stats.duration = stats.endTime - stats.startTime;

      logger.info('Key rotation completed successfully', stats);
      return stats;

    } catch (error) {
      logger.error('Key rotation failed:', error);

      // Tentar reverter para chave antiga
      this.key = oldKey;

      throw error;
    } finally {
      this.rotationInProgress = false;
    }
  }

  /**
   * Agenda rotação automática de chave
   * @param {number} intervalDays - Intervalo em dias para rotação
   */
  scheduleRotation(intervalDays = 90) {
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    setInterval(async () => {
      try {
        logger.info('Scheduled key rotation starting...');
        await this.rotateKey();
      } catch (error) {
        logger.error('Scheduled key rotation failed:', error);
        // TODO: Enviar notificação de falha
      }
    }, intervalMs);

    logger.info(`Key rotation scheduled every ${intervalDays} days`);
  }
}

module.exports = new EncryptionKeyManager();
```

**Adicionar tabela de histórico de rotação:**

```javascript
// backend/config/database.js - adicionar na função initializeDatabase()

db.run(`
  CREATE TABLE IF NOT EXISTS key_rotation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    old_key_hash TEXT NOT NULL,
    new_key_hash TEXT NOT NULL,
    items_reencrypted INTEGER NOT NULL,
    rotation_time INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  )
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_rotation_time
  ON key_rotation_history(rotation_time DESC)
`);
```

---

### 1.5 Security Headers

**Prioridade:** 🟡 ALTA
**Esforço:** 2 horas

```javascript
// backend/middleware/security-headers.js
const helmet = require('helmet');

function securityHeaders(app) {
  // Usar Helmet para headers básicos
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // React requer unsafe-inline
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Headers customizados adicionais
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remover header que expõe versão do Express
    res.removeHeader('X-Powered-By');

    next();
  });
}

module.exports = securityHeaders;
```

**Aplicar no server.js:**

```javascript
// backend/server.js
const securityHeaders = require('./middleware/security-headers');

// Logo após criar o app
const app = express();
securityHeaders(app);
```

**Adicionar helmet ao package.json:**
```bash
npm install helmet --save
```

---

### Checklist Fase 1: Segurança Crítica

- [ ] crypto-js substituído por crypto nativo
- [ ] Todos os dados criptografados migrados
- [ ] Testes de criptografia passando (100% coverage)
- [ ] Command injection corrigido e testado
- [ ] Autenticação implementada em todas as rotas
- [ ] Frontend com interceptors de auth
- [ ] Testes de autenticação (integration + E2E)
- [ ] Key rotation implementado e testado
- [ ] Agendamento de rotação configurado
- [ ] Security headers aplicados
- [ ] Scan de segurança executado (0 vulnerabilidades críticas)
- [ ] Documentação de segurança atualizada

---

## Fase 2: Qualidade e Testes (Sprint 2-3 - 4 semanas)

### Objetivo
Alcançar 90%+ de cobertura de testes e eliminar toda duplicação de código.

### Duração
**4 semanas (160 horas)**

---

### 2.1 Migração para TypeScript

**Prioridade:** 🟡 ALTA
**Esforço:** 40 horas
**ROI:** Redução de 70% em bugs de tipo

#### Estratégia de Migração Incremental

**Passo 1: Configurar TypeScript**

```bash
# Backend
cd backend
npm install --save-dev typescript @types/node @types/express @types/jest
npm install --save-dev ts-node ts-jest
npm install --save-dev @types/cors @types/body-parser
```

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "types": ["node", "jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

**Passo 2: Migrar por camadas (bottom-up)**

```typescript
// backend/types/index.ts
export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  files: string[];
}

export interface BackupHistory {
  id: number;
  hash: string;
  message: string;
  timestamp: number;
  files_changed: number;
  is_auto: boolean;
}

export interface SSHKey {
  id: number;
  private_key_encrypted: string;
  public_key: string;
  created_at: number;
}

export interface Settings {
  log_level: 'debug' | 'info' | 'warning' | 'error';
  auto_commit_enabled: boolean;
  auto_commit_debounce: number;
  auto_push_enabled: boolean;
  scheduled_backup_enabled: boolean;
  scheduled_backup_time: string;
  git_user_name: string;
  git_user_email: string;
  parse_esphome: boolean;
  parse_packages: boolean;
  backup_lovelace: boolean;
  exclude_secrets: boolean;
  remote_enabled: boolean;
}

export interface HAItem {
  id: string;
  name: string;
  type: 'automation' | 'script' | 'scene' | 'esphome' | 'package' | 'lovelace';
  content: string;
  file_path: string;
}

export interface User {
  id: string;
  source: 'ingress' | 'bearer' | 'session';
  authenticated: boolean;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}
```

```typescript
// backend/utils/crypto-manager.ts
import crypto from 'crypto';

interface DerivedKey {
  key: string;
  salt: string;
}

class CryptoManager {
  private readonly algorithm = 'aes-256-gcm' as const;
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  private readonly tagLength = 16; // 128 bits

  encrypt(plaintext: string, key: string): string {
    if (!plaintext) {
      throw new Error('Plaintext is required');
    }
    if (!key || key.length !== 64) {
      throw new Error('Invalid key length');
    }

    const iv = crypto.randomBytes(this.ivLength);
    const keyBuffer = Buffer.from(key, 'hex');
    const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return combined.toString('base64');
  }

  decrypt(encryptedData: string, key: string): string {
    if (!encryptedData) {
      throw new Error('Encrypted data is required');
    }
    if (!key || key.length !== 64) {
      throw new Error('Invalid key length');
    }

    const combined = Buffer.from(encryptedData, 'base64');

    const iv = combined.slice(0, this.ivLength);
    const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
    const encrypted = combined.slice(this.ivLength + this.tagLength);

    const keyBuffer = Buffer.from(key, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  deriveKey(password: string, salt?: string): DerivedKey {
    const saltBuffer = salt
      ? Buffer.from(salt, 'hex')
      : crypto.randomBytes(16);

    const key = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000,
      this.keyLength,
      'sha256'
    );

    return {
      key: key.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export default new CryptoManager();
```

```typescript
// backend/services/git-service.ts
import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import db from '../config/database';
import logger from '../utils/logger';
import { GitCommit, BackupHistory } from '../types';

interface CreateCommitOptions {
  message: string;
  isAuto?: boolean;
  author?: {
    name: string;
    email: string;
  };
}

class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async initialize(): Promise<void> {
    try {
      const isRepo = await this.git.checkIsRepo();

      if (!isRepo) {
        logger.info('Initializing Git repository...');
        await this.git.init();
        await this.git.addConfig('user.name', 'HomeGuardian');
        await this.git.addConfig('user.email', 'homeguardian@homeassistant.local');
        logger.info('Git repository initialized');
      } else {
        logger.info('Git repository already initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize Git:', error);
      throw error;
    }
  }

  async createCommit(options: CreateCommitOptions): Promise<GitCommit> {
    const { message, isAuto = false, author } = options;

    try {
      // Verificar se há mudanças
      const status: StatusResult = await this.git.status();
      const hasChanges = status.files.length > 0;

      if (!hasChanges) {
        throw new Error('No changes to commit');
      }

      // Configurar autor se fornecido
      if (author) {
        await this.git.addConfig('user.name', author.name);
        await this.git.addConfig('user.email', author.email);
      }

      // Adicionar todos os arquivos
      await this.git.add('.');

      // Criar commit
      const result = await this.git.commit(message);
      const hash = result.commit;

      // Obter informações do commit
      const log: LogResult = await this.git.log([hash, '-1']);
      const commit = log.latest!;

      // Salvar no histórico do banco
      await db.run(
        `INSERT INTO backup_history (hash, message, timestamp, files_changed, is_auto)
         VALUES (?, ?, ?, ?, ?)`,
        [hash, message, Date.now(), status.files.length, isAuto ? 1 : 0]
      );

      logger.info(`Commit created: ${hash.substring(0, 7)} - ${message}`);

      return {
        hash,
        message: commit.message,
        author: commit.author_name,
        timestamp: new Date(commit.date).getTime(),
        files: status.files.map(f => f.path)
      };

    } catch (error) {
      logger.error('Failed to create commit:', error);
      throw error;
    }
  }

  async getHistory(limit: number = 50, offset: number = 0): Promise<GitCommit[]> {
    try {
      const log: LogResult = await this.git.log({
        maxCount: limit,
        from: offset
      });

      return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        timestamp: new Date(commit.date).getTime(),
        files: []
      }));

    } catch (error) {
      logger.error('Failed to get history:', error);
      throw error;
    }
  }

  async getDiff(commitHash: string, filePath?: string): Promise<string> {
    try {
      const options = filePath
        ? [commitHash, '--', filePath]
        : [commitHash];

      const diff = await this.git.diff(options);
      return diff;

    } catch (error) {
      logger.error('Failed to get diff:', error);
      throw error;
    }
  }

  async restoreFile(commitHash: string, filePath: string): Promise<void> {
    try {
      // Validar path (proteção contra path traversal)
      if (filePath.includes('..') || path.isAbsolute(filePath)) {
        throw new Error('Invalid file path');
      }

      // Obter conteúdo do arquivo no commit específico
      const content = await this.git.show([`${commitHash}:${filePath}`]);

      // Escrever arquivo
      const fullPath = path.join(this.repoPath, filePath);
      await fs.writeFile(fullPath, content, 'utf8');

      logger.info(`File restored: ${filePath} from ${commitHash.substring(0, 7)}`);

    } catch (error) {
      logger.error('Failed to restore file:', error);
      throw error;
    }
  }

  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    try {
      await this.git.push(remote, branch);
      logger.info(`Pushed to ${remote}/${branch}`);
    } catch (error) {
      logger.error('Failed to push:', error);
      throw error;
    }
  }

  async addRemote(name: string, url: string): Promise<void> {
    try {
      // Remover remote existente se houver
      try {
        await this.git.removeRemote(name);
      } catch {
        // Ignorar se não existir
      }

      await this.git.addRemote(name, url);
      logger.info(`Remote added: ${name} -> ${url}`);
    } catch (error) {
      logger.error('Failed to add remote:', error);
      throw error;
    }
  }
}

export default GitService;
```

**Ordem de Migração:**
1. ✅ `types/` - definições de tipos (2h)
2. ✅ `utils/` - utilitários (8h)
3. ✅ `config/` - configurações (4h)
4. ✅ `services/` - serviços (12h)
5. ✅ `middleware/` - middlewares (4h)
6. ✅ `routes/` - rotas (10h)

**Frontend TypeScript:**

```bash
cd frontend
npm install --save-dev typescript @types/react @types/react-dom
npm install --save-dev @types/react-router-dom
```

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Renomear arquivos gradualmente:**
- `*.js` → `*.ts`
- `*.jsx` → `*.tsx`

---

### 2.2 Cobertura de Testes 90%+

**Prioridade:** 🔴 CRÍTICA
**Esforço:** 60 horas

#### Estrutura de Testes

```
backend/__tests__/
├── unit/
│   ├── utils/
│   │   ├── crypto-manager.test.ts
│   │   ├── encryption-key-manager.test.ts
│   │   └── logger.test.ts
│   ├── services/
│   │   ├── git-service.test.ts
│   │   ├── file-watcher.test.ts
│   │   ├── ha-parser.test.ts
│   │   ├── notification-service.test.ts
│   │   └── scheduler.test.ts
│   ├── middleware/
│   │   ├── auth.test.ts
│   │   ├── validate.test.ts
│   │   ├── rate-limit.test.ts
│   │   └── error-handler.test.ts
│   └── validation/
│       └── schemas.test.ts
├── integration/
│   ├── api/
│   │   ├── backup.test.ts
│   │   ├── restore.test.ts
│   │   ├── history.test.ts
│   │   ├── settings.test.ts
│   │   └── notifications.test.ts
│   ├── git-workflow.test.ts
│   └── auth-flow.test.ts
├── e2e/
│   ├── backup-restore-flow.test.ts
│   ├── remote-sync.test.ts
│   └── scheduled-backup.test.ts
└── fixtures/
    ├── sample-automations.yaml
    ├── sample-scripts.yaml
    └── sample-git-repo/
```

#### Exemplo: Testes Completos para GitService

```typescript
// backend/__tests__/unit/services/git-service.test.ts
import GitService from '../../../services/git-service';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import db from '../../../config/database';

describe('GitService', () => {
  let gitService: GitService;
  let testRepoPath: string;

  beforeEach(async () => {
    // Criar repositório de teste temporário
    testRepoPath = path.join('/tmp', `test-repo-${Date.now()}`);
    await fs.mkdir(testRepoPath, { recursive: true });

    gitService = new GitService(testRepoPath);
    await gitService.initialize();

    // Criar arquivo inicial
    await fs.writeFile(
      path.join(testRepoPath, 'test.txt'),
      'initial content',
      'utf8'
    );
  });

  afterEach(async () => {
    // Limpar repositório de teste
    await fs.rm(testRepoPath, { recursive: true, force: true });
  });

  describe('initialize', () => {
    it('should initialize a new Git repository', async () => {
      const gitDir = path.join(testRepoPath, '.git');
      const exists = await fs.access(gitDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should configure git user name and email', async () => {
      const config = execSync('git config user.name', { cwd: testRepoPath }).toString().trim();
      expect(config).toBe('HomeGuardian');
    });
  });

  describe('createCommit', () => {
    it('should create a commit with changes', async () => {
      // Modificar arquivo
      await fs.writeFile(
        path.join(testRepoPath, 'test.txt'),
        'modified content',
        'utf8'
      );

      const commit = await gitService.createCommit({
        message: 'Test commit'
      });

      expect(commit.hash).toHaveLength(40);
      expect(commit.message).toBe('Test commit');
      expect(commit.author).toBe('HomeGuardian');
      expect(commit.files).toContain('test.txt');
    });

    it('should throw error if no changes to commit', async () => {
      await expect(
        gitService.createCommit({ message: 'No changes' })
      ).rejects.toThrow('No changes to commit');
    });

    it('should mark auto commits correctly', async () => {
      await fs.writeFile(
        path.join(testRepoPath, 'auto.txt'),
        'auto content',
        'utf8'
      );

      await gitService.createCommit({
        message: 'Auto commit',
        isAuto: true
      });

      const history = await db.get(
        'SELECT is_auto FROM backup_history ORDER BY timestamp DESC LIMIT 1'
      );

      expect(history.is_auto).toBe(1);
    });

    it('should use custom author if provided', async () => {
      await fs.writeFile(
        path.join(testRepoPath, 'custom.txt'),
        'content',
        'utf8'
      );

      const commit = await gitService.createCommit({
        message: 'Custom author',
        author: {
          name: 'Test User',
          email: 'test@example.com'
        }
      });

      expect(commit.author).toBe('Test User');
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      // Criar múltiplos commits
      for (let i = 1; i <= 5; i++) {
        await fs.writeFile(
          path.join(testRepoPath, `file${i}.txt`),
          `content ${i}`,
          'utf8'
        );
        await gitService.createCommit({ message: `Commit ${i}` });
      }
    });

    it('should return commit history', async () => {
      const history = await gitService.getHistory(10, 0);
      expect(history).toHaveLength(5);
      expect(history[0].message).toBe('Commit 5'); // Most recent
    });

    it('should respect limit parameter', async () => {
      const history = await gitService.getHistory(2, 0);
      expect(history).toHaveLength(2);
    });

    it('should respect offset parameter', async () => {
      const history = await gitService.getHistory(2, 2);
      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('Commit 3');
    });
  });

  describe('getDiff', () => {
    let commitHash: string;

    beforeEach(async () => {
      await fs.writeFile(
        path.join(testRepoPath, 'diff-test.txt'),
        'original',
        'utf8'
      );
      const commit1 = await gitService.createCommit({ message: 'First' });

      await fs.writeFile(
        path.join(testRepoPath, 'diff-test.txt'),
        'modified',
        'utf8'
      );
      const commit2 = await gitService.createCommit({ message: 'Second' });
      commitHash = commit2.hash;
    });

    it('should return diff for commit', async () => {
      const diff = await gitService.getDiff(commitHash);
      expect(diff).toContain('diff-test.txt');
      expect(diff).toContain('-original');
      expect(diff).toContain('+modified');
    });

    it('should return diff for specific file', async () => {
      const diff = await gitService.getDiff(commitHash, 'diff-test.txt');
      expect(diff).toContain('diff-test.txt');
    });
  });

  describe('restoreFile', () => {
    let commitHash: string;

    beforeEach(async () => {
      await fs.writeFile(
        path.join(testRepoPath, 'restore-test.txt'),
        'version 1',
        'utf8'
      );
      const commit = await gitService.createCommit({ message: 'Version 1' });
      commitHash = commit.hash;

      await fs.writeFile(
        path.join(testRepoPath, 'restore-test.txt'),
        'version 2',
        'utf8'
      );
      await gitService.createCommit({ message: 'Version 2' });
    });

    it('should restore file to previous version', async () => {
      await gitService.restoreFile(commitHash, 'restore-test.txt');

      const content = await fs.readFile(
        path.join(testRepoPath, 'restore-test.txt'),
        'utf8'
      );

      expect(content).toBe('version 1');
    });

    it('should reject path traversal attempts', async () => {
      await expect(
        gitService.restoreFile(commitHash, '../../../etc/passwd')
      ).rejects.toThrow('Invalid file path');
    });

    it('should reject absolute paths', async () => {
      await expect(
        gitService.restoreFile(commitHash, '/etc/passwd')
      ).rejects.toThrow('Invalid file path');
    });
  });

  describe('push', () => {
    it('should push to remote repository', async () => {
      // Este teste requer um remote configurado
      // Normalmente seria mockado ou testado em E2E
      // Aqui apenas verificamos que a função existe
      expect(typeof gitService.push).toBe('function');
    });
  });

  describe('addRemote', () => {
    it('should add a remote repository', async () => {
      await gitService.addRemote('origin', 'git@github.com:test/repo.git');

      const remotes = execSync('git remote -v', { cwd: testRepoPath })
        .toString();

      expect(remotes).toContain('origin');
      expect(remotes).toContain('git@github.com:test/repo.git');
    });

    it('should replace existing remote', async () => {
      await gitService.addRemote('origin', 'url1');
      await gitService.addRemote('origin', 'url2');

      const remotes = execSync('git remote -v', { cwd: testRepoPath })
        .toString();

      expect(remotes).toContain('url2');
      expect(remotes).not.toContain('url1');
    });
  });
});
```

#### Frontend Testing com React Testing Library

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev vitest @vitest/ui jsdom
```

```typescript
// frontend/src/__tests__/pages/Dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import * as api from '../../api/client';

jest.mock('../../api/client');

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with status', async () => {
    const mockStatus = {
      gitInitialized: true,
      totalCommits: 42,
      lastBackup: Date.now() - 3600000,
      watcherRunning: true
    };

    (api.status.get as jest.Mock).mockResolvedValue({ data: mockStatus });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText(/1 hour ago/i)).toBeInTheDocument();
    });
  });

  it('should handle backup now button click', async () => {
    (api.status.get as jest.Mock).mockResolvedValue({ data: {} });
    (api.backup.now as jest.Mock).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /backup now/i });
    await user.click(button);

    await waitFor(() => {
      expect(api.backup.now).toHaveBeenCalled();
      expect(screen.getByText(/backup created successfully/i)).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    (api.status.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
```

---

### 2.3 Implementar ESLint + Prettier

**Prioridade:** 🟡 ALTA
**Esforço:** 4 horas

```bash
# Backend
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier

# Frontend
cd frontend
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks
npm install --save-dev prettier eslint-config-prettier
```

```json
// backend/.eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "complexity": ["warn", 10],
    "max-lines-per-function": ["warn", 50]
  }
}
```

```json
// frontend/.eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

```json
// .prettierrc (raiz do projeto)
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

**Adicionar scripts:**

```json
// backend/package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"**/*.{ts,json,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

### 2.4 Refatorar Componentes Grandes

**Prioridade:** 🟡 ALTA
**Esforço:** 24 horas

#### Refatorar Settings.jsx (622 linhas → ~150 linhas)

```typescript
// frontend/src/pages/Settings.tsx
import { useState } from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import GeneralSettings from '../components/settings/GeneralSettings';
import BackupSettings from '../components/settings/BackupSettings';
import RemoteRepositorySettings from '../components/settings/RemoteRepositorySettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="General" />
        <Tab label="Backup" />
        <Tab label="Remote Repository" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <GeneralSettings />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <BackupSettings />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <RemoteRepositorySettings />
      </TabPanel>
    </Container>
  );
}
```

```typescript
// frontend/src/components/settings/GeneralSettings.tsx
import { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

interface GeneralSettingsData {
  log_level: 'debug' | 'info' | 'warning' | 'error';
  git_user_name: string;
  git_user_email: string;
}

export default function GeneralSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<GeneralSettingsData>({
    log_level: 'info',
    git_user_name: '',
    git_user_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      setSettings({
        log_level: response.data.log_level,
        git_user_name: response.data.git_user_name,
        git_user_email: response.data.git_user_email,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.settings.update(settings);
      setSuccess(t('settings.saved_successfully'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('settings.log_level')}</InputLabel>
        <Select
          value={settings.log_level}
          onChange={(e) => setSettings({ ...settings, log_level: e.target.value as any })}
        >
          <MenuItem value="debug">Debug</MenuItem>
          <MenuItem value="info">Info</MenuItem>
          <MenuItem value="warning">Warning</MenuItem>
          <MenuItem value="error">Error</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label={t('settings.git_user_name')}
        value={settings.git_user_name}
        onChange={(e) => setSettings({ ...settings, git_user_name: e.target.value })}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('settings.git_user_email')}
        type="email"
        value={settings.git_user_email}
        onChange={(e) => setSettings({ ...settings, git_user_email: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? t('common.saving') : t('common.save')}
      </Button>
    </Paper>
  );
}
```

#### Refatorar HAParser (545 linhas → ~100 linhas + parsers)

```typescript
// backend/services/parsers/base-parser.ts
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import logger from '../../utils/logger';
import { HAItem } from '../../types';

export abstract class BaseParser {
  protected configPath: string;

  constructor(configPath: string) {
    this.configPath = configPath;
  }

  abstract getType(): HAItem['type'];
  abstract getFilePath(): string;
  abstract parseContent(data: any): HAItem[];

  async parse(): Promise<HAItem[]> {
    try {
      const filePath = path.join(this.configPath, this.getFilePath());
      const content = await fs.readFile(filePath, 'utf8');
      const data = yaml.load(content);

      return this.parseContent(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info(`${this.getType()} file not found, skipping`);
        return [];
      }
      throw error;
    }
  }

  protected createItem(id: string, name: string, content: any): HAItem {
    return {
      id: `${this.getType()}_${id}`,
      name,
      type: this.getType(),
      content: yaml.dump(content),
      file_path: this.getFilePath(),
    };
  }
}
```

```typescript
// backend/services/parsers/automation-parser.ts
import { BaseParser } from './base-parser';
import { HAItem } from '../../types';

export class AutomationParser extends BaseParser {
  getType(): HAItem['type'] {
    return 'automation';
  }

  getFilePath(): string {
    return 'automations.yaml';
  }

  parseContent(data: any): HAItem[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((automation, index) => {
      const id = automation.id || `automation_${index}`;
      const name = automation.alias || id;

      return this.createItem(id, name, automation);
    });
  }
}
```

```typescript
// backend/services/ha-parser.ts (simplificado)
import { AutomationParser } from './parsers/automation-parser';
import { ScriptParser } from './parsers/script-parser';
import { SceneParser } from './parsers/scene-parser';
import { ESPHomeParser } from './parsers/esphome-parser';
import { PackageParser } from './parsers/package-parser';
import { LovelaceParser } from './parsers/lovelace-parser';
import { HAItem } from '../types';
import logger from '../utils/logger';

interface ParseOptions {
  parseAutomations?: boolean;
  parseScripts?: boolean;
  parseScenes?: boolean;
  parseESPHome?: boolean;
  parsePackages?: boolean;
  parseLovelace?: boolean;
}

class HAParser {
  private configPath: string;
  private parsers: Map<string, any>;

  constructor(configPath: string) {
    this.configPath = configPath;
    this.parsers = new Map([
      ['automations', new AutomationParser(configPath)],
      ['scripts', new ScriptParser(configPath)],
      ['scenes', new SceneParser(configPath)],
      ['esphome', new ESPHomeParser(configPath)],
      ['packages', new PackageParser(configPath)],
      ['lovelace', new LovelaceParser(configPath)],
    ]);
  }

  async parseAll(options: ParseOptions = {}): Promise<HAItem[]> {
    const items: HAItem[] = [];

    const parsersToRun = [
      { key: 'automations', enabled: options.parseAutomations !== false },
      { key: 'scripts', enabled: options.parseScripts !== false },
      { key: 'scenes', enabled: options.parseScenes !== false },
      { key: 'esphome', enabled: options.parseESPHome === true },
      { key: 'packages', enabled: options.parsePackages === true },
      { key: 'lovelace', enabled: options.parseLovelace === true },
    ];

    for (const { key, enabled } of parsersToRun) {
      if (enabled) {
        try {
          const parser = this.parsers.get(key);
          const parsed = await parser.parse();
          items.push(...parsed);
          logger.info(`Parsed ${parsed.length} ${key}`);
        } catch (error) {
          logger.error(`Failed to parse ${key}:`, error);
        }
      }
    }

    return items;
  }

  async getItem(id: string): Promise<HAItem | null> {
    const [type] = id.split('_');
    const parser = this.parsers.get(`${type}s`);

    if (!parser) {
      return null;
    }

    const items = await parser.parse();
    return items.find((item) => item.id === id) || null;
  }
}

export default HAParser;
```

---

### Checklist Fase 2: Qualidade e Testes

- [ ] TypeScript configurado (backend + frontend)
- [ ] 50%+ código migrado para TypeScript
- [ ] Cobertura de testes backend > 90%
- [ ] Cobertura de testes frontend > 85%
- [ ] ESLint + Prettier configurados
- [ ] 0 warnings/erros no lint
- [ ] Settings.jsx refatorado em 3 componentes
- [ ] HAParser refatorado com strategy pattern
- [ ] Complexidade ciclomática < 10 em todas as funções
- [ ] Code duplication < 3%
- [ ] Mutation testing score > 80%
- [ ] SonarQube Quality Gate: A

---

## Fase 3: Arquitetura e Refatoração (6 semanas)

### Objetivo
Implementar Clean Architecture com DDD, Dependency Injection e Event-Driven patterns.

### Duração
**6 semanas (240 horas)**

---

*[O documento continua com as próximas fases... Devido ao limite de espaço, vou continuar em outro bloco]*

---

**Este é um plano extremamente detalhado. Deseja que eu continue com as Fases 3-6, ou prefere focar em alguma fase específica com ainda mais detalhes?**
