# Git Lock & Heap Memory Management Solution

## 📋 Sumário Executivo

Esta solução resolve dois problemas críticos identificados no HomeGuardian:

1. **Git Lock Conflicts**: Múltiplas operações git concorrentes causando falhas com `index.lock`
2. **Heap Memory Exhaustion**: Processo Node.js crashando por falta de memória

## 🎯 Problemas Identificados

### 1. Git Lock Conflicts

**Sintoma:**
```
fatal: Unable to create '/config/.git/index.lock': File exists.
Another git process seems to be running in this repository
```

**Causa Raiz:**
- FileWatcher executando auto-commits
- Scheduler executando commits agendados
- API permitindo commits manuais
- Todas operações sem sincronização, competindo pelo lock do git

### 2. Heap Memory Exhaustion

**Sintoma:**
```
<--- Last few GCs --->
[79:0x7f3cc6882000] 263661809 ms: Mark-Compact 248.1 (258.8) -> 247.4 (259.3) MB
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Causa Raiz:**
- Sem monitoramento proativo de memória
- Cache crescendo sem limites
- Operações git carregando diffs grandes
- Garbage collection não sendo forçado em situações críticas

## ✅ Solução Implementada

### 1. GitLockManager (`backend/utils/git-lock-manager.js`)

Gerenciamento robusto de locks git com fila serializada.

#### Recursos Implementados:

✅ **Fila de Operações Serializada**
- Todas operações git passam por uma fila única
- Execução serializada garante uma operação por vez
- Priorização: Manual (2) > Push (2) > Restore (1) > Initial (1) > Auto (0)

✅ **Detecção e Limpeza de Locks Órfãos**
- Verifica idade do lock file a cada operação
- Remove automaticamente locks > 5 minutos (configurável)
- Cleanup periódico a cada 60 segundos

✅ **Retry com Exponential Backoff**
- 3 tentativas por operação (configurável)
- Backoff: 1s → 2s → 4s (com jitter ±20%)
- Detecção inteligente de erros de lock

✅ **Timeout Configurável**
- Timeout por operação: 30s (padrão)
- Timeout global: 5s (padrão)
- Previne operações travadas indefinidamente

✅ **Métricas Detalhadas**
```javascript
{
  totalOperations: 150,
  successfulOperations: 148,
  failedOperations: 2,
  retriedOperations: 5,
  orphanLocksRemoved: 1,
  successRate: "98.67%",
  averageWaitTime: "125ms",
  averageExecutionTime: "450ms"
}
```

✅ **Graceful Shutdown**
- Aguarda fila drenar (timeout: 30s)
- Rejeita novas operações durante shutdown
- Force shutdown disponível se necessário

#### Configuração via Variáveis de Ambiente:

```bash
GIT_LOCK_TIMEOUT=5000              # Timeout global (ms)
GIT_LOCK_MAX_RETRIES=3             # Máximo de tentativas
GIT_LOCK_ORPHAN_AGE=300000         # Idade para considerar órfão (ms)
GIT_OPERATION_TIMEOUT=30000        # Timeout por operação (ms)
```

### 2. HeapMonitor (`backend/utils/heap-monitor.js`)

Monitoramento proativo de memória com 4 níveis de pressão.

#### Recursos Implementados:

✅ **Monitoramento em Tempo Real**
- Intervalo: 30 segundos (configurável)
- Coleta: heapUsed, heapTotal, heapLimit, RSS, external

✅ **4 Níveis de Pressão**

| Nível | Threshold | Ação |
|-------|-----------|------|
| **NORMAL** | < 70% | Monitoramento passivo |
| **WARNING** | 70-85% | Log de alerta |
| **CRITICAL** | 85-95% | Force GC + log crítico |
| **EMERGENCY** | > 95% | Force GC + alerta iminente crash |

✅ **Garbage Collection Forçada**
- Automática em níveis CRITICAL e EMERGENCY
- Requer flag `--expose-gc` no Node.js
- Logs de memória liberada

✅ **Detecção de Memory Leaks**
- Análise de regressão linear em 10 amostras
- Detecta crescimento consistente > 5%
- Coeficiente R² > 0.7 para confirmar tendência

✅ **Sistema de Callbacks**
```javascript
heapMonitor.onPressureLevel(PressureLevel.CRITICAL, ({ level, snapshot }) => {
  // Tomar ação quando memória crítica
});

heapMonitor.onLeakDetected((leakInfo) => {
  // Alertar sobre possível vazamento
});
```

✅ **Métricas Detalhadas**
```javascript
{
  currentLevel: "normal",
  totalChecks: 500,
  normalCount: 480,
  warningCount: 15,
  criticalCount: 4,
  emergencyCount: 1,
  gcTriggered: 5,
  leaksDetected: 0,
  peakHeapUsed: "245.67 MB",
  uptime: 15000
}
```

#### Configuração via Variáveis de Ambiente:

```bash
HEAP_MONITOR_INTERVAL=30000        # Intervalo de verificação (ms)
HEAP_WARNING_THRESHOLD=0.70        # 70% threshold para warning
HEAP_CRITICAL_THRESHOLD=0.85       # 85% threshold para critical
HEAP_EMERGENCY_THRESHOLD=0.95      # 95% threshold para emergency
HEAP_GC_ON_CRITICAL=true           # Force GC em critical
HEAP_GC_ON_EMERGENCY=true          # Force GC em emergency
```

## 🔧 Integração

### GitService (`backend/services/git-service.js`)

Todas operações git foram modificadas para usar GitLockManager:

```javascript
// Antes
await this.git.commit(message);

// Depois
await this.lockManager.executeOperation(async () => {
  await this.git.commit(message);
}, { name: 'git-commit', priority: 1 });
```

**Operações protegidas:**
- `initialize()` - Init e configuração
- `createInitialCommit()` - Commit inicial
- `createCommit()` - Commits manual/auto/scheduled
- `restoreFile()` - Restauração de arquivos
- `configureRemote()` - Configuração de remotes
- `push()` - Push para remote

### Server (`backend/server.js`)

HeapMonitor integrado na inicialização:

```javascript
// Inicialização
const heapMonitor = new HeapMonitor({ /* config */ });

// Callbacks registrados para cada nível
heapMonitor.onPressureLevel(PressureLevel.WARNING, handler);
heapMonitor.onPressureLevel(PressureLevel.CRITICAL, handler);
heapMonitor.onPressureLevel(PressureLevel.EMERGENCY, handler);
heapMonitor.onLeakDetected(handler);

// Start monitoring
heapMonitor.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  heapMonitor.shutdown();
  await gitService.shutdown({ timeout: 10000 });
});
```

## 📊 Endpoints de Monitoramento

### 1. Heap Monitor Metrics
```
GET /api/health/heap
```

Retorna métricas completas do HeapMonitor incluindo histórico.

### 2. Git Lock Manager Metrics
```
GET /api/health/git-locks
```

Retorna métricas do GitLockManager e status da fila.

### 3. Dashboard Consolidado
```
GET /api/health/dashboard
```

Dashboard combinado com todas métricas:
- Informações do processo
- Uso de memória
- Métricas do HeapMonitor
- Métricas do GitLockManager

## 🚀 Deploy

### Dockerfile Update

Adicione a flag `--expose-gc` ao Node.js para permitir GC forçado:

```dockerfile
CMD ["node", "--expose-gc", "backend/server.js"]
```

### Docker Compose

```yaml
services:
  homeguardian:
    environment:
      # Git Lock Configuration
      - GIT_LOCK_TIMEOUT=5000
      - GIT_LOCK_MAX_RETRIES=3
      - GIT_OPERATION_TIMEOUT=30000

      # Heap Monitor Configuration
      - HEAP_MONITOR_INTERVAL=30000
      - HEAP_WARNING_THRESHOLD=0.70
      - HEAP_CRITICAL_THRESHOLD=0.85
      - HEAP_EMERGENCY_THRESHOLD=0.95
      - HEAP_GC_ON_CRITICAL=true
      - HEAP_GC_ON_EMERGENCY=true
```

### Home Assistant Add-on

Atualize `config.yaml`:

```yaml
options:
  git_lock_timeout: 5000
  git_lock_max_retries: 3
  heap_monitor_interval: 30000
  heap_warning_threshold: 0.70
  heap_critical_threshold: 0.85
  heap_emergency_threshold: 0.95
```

## 📈 Resultados Esperados

### Git Lock Issues
- ✅ Zero conflitos de lock
- ✅ Operações serializadas e ordenadas
- ✅ Retry automático em falhas transitórias
- ✅ Cleanup automático de locks órfãos
- ✅ Métricas para debugging

### Heap Memory Issues
- ✅ Monitoramento proativo antes do crash
- ✅ GC forçado em situações críticas
- ✅ Detecção precoce de memory leaks
- ✅ Logs detalhados para análise
- ✅ Previne crashes inesperados

## 🧪 Testes

### Teste de Concorrência Git

```bash
# Simular múltiplas operações simultâneas
for i in {1..10}; do
  curl -X POST http://localhost:8099/api/backup/create &
done
wait

# Verificar métricas
curl http://localhost:8099/api/health/git-locks
```

### Teste de Pressão de Memória

```bash
# Monitorar heap em tempo real
watch -n 5 'curl -s http://localhost:8099/api/health/heap | jq ".metrics.currentLevel"'

# Forçar operações que consomem memória
for i in {1..100}; do
  curl http://localhost:8099/api/history?limit=1000
done
```

## 📚 Arquivos Modificados

### Novos Arquivos
- `backend/utils/git-lock-manager.js` - GitLockManager implementation
- `backend/utils/heap-monitor.js` - HeapMonitor implementation
- `MEMORY_AND_GIT_LOCK_SOLUTION.md` - Esta documentação

### Arquivos Modificados
- `backend/services/git-service.js` - Integração GitLockManager
- `backend/server.js` - Integração HeapMonitor
- `backend/routes/health.js` - Novos endpoints de monitoramento

## 🎓 Melhores Práticas Aplicadas

1. **Separation of Concerns**: Managers isolados e reutilizáveis
2. **Graceful Degradation**: Sistema continua operando sob pressão
3. **Observability**: Métricas detalhadas em todos componentes
4. **Configurability**: Todas thresholds configuráveis via env vars
5. **Production Ready**: Error handling robusto e logging estruturado
6. **Performance**: Operações async não-bloqueantes
7. **Resource Management**: Cleanup automático e shutdown gracioso

## 🔍 Troubleshooting

### Git locks ainda ocorrendo?

1. Verificar logs para ver retry attempts
2. Checar métricas em `/api/health/git-locks`
3. Aumentar `GIT_LOCK_MAX_RETRIES` se necessário
4. Verificar se cleanup de órfãos está funcionando

### Memória ainda crescendo?

1. Monitorar `/api/health/heap` para leak detection
2. Verificar se `--expose-gc` está habilitado
3. Ajustar thresholds se necessário
4. Analisar histórico de memória para padrões

### Performance degradada?

1. Checar `averageWaitTime` nas métricas git
2. Revisar prioridades de operações
3. Ajustar timeouts se necessário
4. Considerar aumentar recursos de hardware

## 📞 Suporte

Para issues ou dúvidas:
- GitHub Issues: https://github.com/thiagosian/HomeGuardian/issues
- Logs: Verificar `/data/logs/` no container

## 📄 Licença

Esta solução segue a mesma licença do projeto HomeGuardian.
