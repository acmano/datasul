# Health Check Service

> Serviço de verificação de saúde do sistema (banco de dados, memória, disco)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [API Reference](#api-reference)
- [Status e Critérios](#status-e-critérios)
- [Checks Individuais](#checks-individuais)
- [Exemplos de Uso](#exemplos-de-uso)
- [Performance](#performance)
- [Melhorias Futuras](#melhorias-futuras)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Serviço responsável por verificar a saúde geral do sistema através de múltiplas verificações: banco de dados, memória e disco. Utilizado por endpoints de monitoramento e probes do Kubernetes/Docker.

### Características

- ✅ **3 checks** - Database, Memory, Disk
- ✅ **Execução paralela** - Promise.all para otimização
- ✅ **Status agregado** - healthy, degraded, unhealthy
- ✅ **Thread-safe** - Pode ser chamado concorrentemente
- ✅ **Fail-fast** - Captura erros individuais
- ✅ **Métricas detalhadas** - Tempo de resposta, percentuais

### Tecnologias

- **DatabaseManager** - Verificação de banco
- **os (Node.js)** - Métricas de sistema
- **TypeScript** - Tipagem forte

---

## Arquitetura

### Fluxo de Execução

```
check()
  ↓
Promise.all([
  checkDatabase(),
  checkMemory(),
  checkDisk()
])
  ↓
determineOverallStatus()
  ↓
return HealthStatus
```

### Execução Paralela

```typescript
// Todos os checks executam simultaneamente
const [db, mem, disk] = await Promise.all([
  this.checkDatabase(),  // ~10-100ms
  this.checkMemory(),    // ~1ms
  this.checkDisk()       // ~1ms
]);
// Tempo total = MAX(db, mem, disk)
```

**Benefício:**
- Sem paralelismo: 10 + 1 + 1 = 12ms
- Com paralelismo: MAX(10, 1, 1) = 10ms

---

### Estrutura de Dados

**HealthStatus:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,           // ISO 8601
  uptime: number,              // segundos
  checks: {
    database: DatabaseCheck,
    memory: MemoryCheck,
    disk: DiskCheck
  }
}
```

**DatabaseCheck:**
```typescript
{
  status: 'ok' | 'degraded' | 'error',
  responseTime?: number,       // ms
  connectionType?: string,     // sqlserver, odbc, mock
  mode?: string,              // REAL_DATABASE, MOCK_DATA
  error?: string
}
```

**MemoryCheck:**
```typescript
{
  status: 'ok' | 'warning' | 'critical',
  used: number,               // MB
  total: number,              // MB
  percentage: number,         // 0-100
  free: number                // MB
}
```

**DiskCheck:**
```typescript
{
  status: 'ok' | 'warning' | 'critical',
  message?: string
}
```

---

## API Reference

### check()

```typescript
static async check(): Promise<HealthStatus>
```

Executa verificação completa de saúde do sistema.

**Retorno:**
- `HealthStatus` - Status completo do sistema

**O que faz:**
1. Executa 3 checks em paralelo (database, memory, disk)
2. Agrega resultados
3. Determina status geral
4. Adiciona timestamp e uptime
5. Retorna resultado completo

**Performance:**
- **Típico:** 10-100ms (banco local)
- **Remoto:** 50-500ms (banco remoto)
- **Timeout:** Depende do DatabaseManager

**Exemplo:**
```typescript
const health = await HealthCheckService.check();

console.log(`Status: ${health.status}`);
console.log(`Uptime: ${health.uptime}s`);
console.log(`Database: ${health.checks.database.status}`);
console.log(`Memory: ${health.checks.memory.percentage}%`);
```

**Resposta (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 45,
      "connectionType": "sqlserver",
      "mode": "REAL_DATABASE"
    },
    "memory": {
      "status": "ok",
      "used": 2048,
      "total": 8192,
      "percentage": 25,
      "free": 6144
    },
    "disk": {
      "status": "ok",
      "message": "Verificação básica"
    }
  }
}
```

**Resposta (503 Unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "error",
      "error": "Connection refused",
      "responseTime": 5000
    },
    "memory": {
      "status": "critical",
      "used": 7500,
      "total": 8192,
      "percentage": 92,
      "free": 692
    },
    "disk": {
      "status": "ok"
    }
  }
}
```

---

### checkDatabase() (privado)

```typescript
private static async checkDatabase(): Promise<DatabaseCheck>
```

Verifica saúde do banco de dados.

**O que faz:**
1. Verifica se `DatabaseManager` está inicializado
2. Obtém status da conexão atual
3. Executa query de teste: `SELECT 1 as test`
4. Mede tempo de resposta
5. Determina status baseado em critérios

**Critérios de Status:**

| Status | Condição |
|--------|----------|
| **ok** | Conectado + resposta < 1s + modo REAL |
| **degraded** | Conectado + resposta > 1s OU modo MOCK |
| **error** | Não inicializado OU query falhou |

**Resposta (ok):**
```json
{
  "status": "ok",
  "responseTime": 45,
  "connectionType": "sqlserver",
  "mode": "REAL_DATABASE"
}
```

**Resposta (degraded):**
```json
{
  "status": "degraded",
  "responseTime": 1500,
  "connectionType": "sqlserver",
  "mode": "REAL_DATABASE"
}
```

**Resposta (error):**
```json
{
  "status": "error",
  "error": "Connection timeout",
  "responseTime": 5000
}
```

---

### checkMemory() (privado)

```typescript
private static async checkMemory(): Promise<MemoryCheck>
```

Verifica uso de memória do sistema.

**O que faz:**
1. Obtém memória total e livre do sistema (os.totalmem(), os.freemem())
2. Calcula memória usada
3. Converte para MB
4. Calcula percentual de uso
5. Determina status baseado em thresholds

**Critérios de Status:**

| Status | Condição | Risco |
|--------|----------|-------|
| **ok** | < 75% | Nenhum |
| **warning** | 75% - 90% | Moderado |
| **critical** | > 90% | Alto (OOM) |

**Thresholds:**
```typescript
const MEMORY_THRESHOLDS = {
  CRITICAL: 90,  // > 90% = critical
  WARNING: 75    // > 75% = warning
};
```

**Resposta (ok):**
```json
{
  "status": "ok",
  "used": 2048,
  "total": 8192,
  "percentage": 25,
  "free": 6144
}
```

**Resposta (warning):**
```json
{
  "status": "warning",
  "used": 6553,
  "total": 8192,
  "percentage": 80,
  "free": 1639
}
```

**Resposta (critical):**
```json
{
  "status": "critical",
  "used": 7536,
  "total": 8192,
  "percentage": 92,
  "free": 656
}
```

**⚠️ IMPORTANTE:**
Valores são da **memória total do sistema**, não apenas do processo Node.js.

---

### checkDisk() (privado)

```typescript
private static async checkDisk(): Promise<DiskCheck>
```

Verifica status do disco.

**⚠️ IMPLEMENTAÇÃO BÁSICA:**
Atualmente sempre retorna `ok` com mensagem de TODO.

**O que DEVERIA fazer:**
1. Verificar espaço livre em disco
2. Verificar IOPS (operações de I/O)
3. Verificar latência de leitura/escrita

**Critérios Sugeridos:**

| Status | Condição |
|--------|----------|
| **ok** | Espaço livre > 20% |
| **warning** | Espaço livre 10-20% |
| **critical** | Espaço livre < 10% |

**Resposta Atual:**
```json
{
  "status": "ok",
  "message": "Verificação básica - TODO: implementar verificação completa"
}
```

**TODO: Implementação Futura**
```typescript
// Exemplo com biblioteca 'diskusage'
import diskusage from 'diskusage';

const info = await diskusage.check('/');
const freePercentage = (info.free / info.total) * 100;

if (freePercentage < 10) return { status: 'critical' };
if (freePercentage < 20) return { status: 'warning' };
return { status: 'ok' };
```

---

### determineOverallStatus() (privado)

```typescript
private static determineOverallStatus(
  database: DatabaseCheck,
  memory: MemoryCheck,
  disk: DiskCheck
): 'healthy' | 'degraded' | 'unhealthy'
```

Determina o status geral do sistema baseado nos checks individuais.

**Lógica de Prioridade:**

1. **unhealthy** - Se qualquer check crítico falhou
2. **degraded** - Se algum check está degraded/warning
3. **healthy** - Se todos estão ok

**Algoritmo:**

```typescript
// 1. Verifica falhas críticas
if (db.status === 'error' || mem.status === 'critical') {
  return 'unhealthy';
}

// 2. Verifica degradações
if (db.status === 'degraded' ||
    mem.status === 'warning' ||
    disk.status === 'warning' ||
    disk.status === 'critical') {
  return 'degraded';
}

// 3. Todos OK
return 'healthy';
```

**Exemplos:**

| DB | Memory | Disk | Resultado |
|----|--------|------|-----------|
| ok | ok | ok | **healthy** |
| ok | warning | ok | **degraded** |
| degraded | ok | ok | **degraded** |
| error | ok | ok | **unhealthy** |
| ok | critical | ok | **unhealthy** |
| error | critical | critical | **unhealthy** |

---

## Status e Critérios

### Status Geral

**healthy:**
- Todos os componentes operando normalmente
- Sistema pronto para produção
- Status HTTP: 200

**degraded:**
- Algum componente com performance reduzida
- Sistema operacional mas não ideal
- Investigação recomendada
- Status HTTP: 200 ou 503 (configurável)

**unhealthy:**
- Componente crítico falhou
- Sistema pode estar instável
- Intervenção necessária
- Status HTTP: 503

---

### Mapeamento de Status

**Database:**

| Condição | Status | Significado |
|----------|--------|-------------|
| Query OK + < 1s | ok | Perfeito |
| Query OK + > 1s | degraded | Lento |
| Modo MOCK | degraded | Não é produção |
| Não inicializado | error | Crítico |
| Query falhou | error | Crítico |

**Memory:**

| Uso | Status | Ação |
|-----|--------|------|
| < 75% | ok | Nenhuma |
| 75-90% | warning | Monitorar |
| > 90% | critical | Investigar (OOM iminente) |

**Disk:**

| Livre | Status | Ação |
|-------|--------|------|
| > 20% | ok | Nenhuma |
| 10-20% | warning | Limpar logs |
| < 10% | critical | Urgente |

---

## Checks Individuais

### Check de Database

**Query Executada:**
```sql
SELECT 1 as test
```

**Por que SELECT 1?**
- Query mais rápida possível
- Não acessa tabelas
- Testa apenas conectividade
- Overhead mínimo

**Fluxo:**

```
checkDatabase()
  ↓
DatabaseManager.isReady()?
  ├─ NO → return { status: 'error' }
  └─ YES → continua
  ↓
getConnectionStatus()
  ↓
mode === 'MOCK_DATA'?
  ├─ YES → return { status: 'degraded' }
  └─ NO → continua
  ↓
queryEmp('SELECT 1')
  ↓
responseTime < 1000ms?
  ├─ YES → status: 'ok'
  └─ NO → status: 'degraded'
```

---

### Check de Memory

**Cálculos:**

```typescript
totalMem = os.totalmem()      // Bytes totais
freeMem = os.freemem()        // Bytes livres
usedMem = totalMem - freeMem  // Bytes usados

// Conversão para MB
usedMB = Math.round(usedMem / 1024 / 1024)
totalMB = Math.round(totalMem / 1024 / 1024)
freeMB = Math.round(freeMem / 1024 / 1024)

// Percentual
percentage = Math.round((usedMem / totalMem) * 100)
```

**Exemplo:**
```
Total: 8192 MB
Free: 6144 MB
Used: 2048 MB
Percentage: 25%
Status: ok
```

---

### Check de Disk

**Implementação Atual:**
```typescript
return {
  status: 'ok',
  message: 'TODO'
};
```

**Implementação Futura Sugerida:**

```typescript
import { promisify } from 'util';
import { statfs } from 'fs';

const statfsAsync = promisify(statfs);

async function checkDisk(): Promise<DiskCheck> {
  try {
    const stats = await statfsAsync('/');

    // Calcula espaço livre
    const totalSpace = stats.blocks * stats.bsize;
    const freeSpace = stats.bfree * stats.bsize;
    const freePercentage = (freeSpace / totalSpace) * 100;

    // Determina status
    if (freePercentage < 10) {
      return {
        status: 'critical',
        message: `Apenas ${freePercentage.toFixed(1)}% livre`
      };
    }

    if (freePercentage < 20) {
      return {
        status: 'warning',
        message: `${freePercentage.toFixed(1)}% livre`
      };
    }

    return {
      status: 'ok',
      message: `${freePercentage.toFixed(1)}% livre`
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}
```

---

## Exemplos de Uso

### Controller

```typescript
// HealthCheckController.ts
import { HealthCheckService } from '@shared/services/healthCheck.service';

export class HealthCheckController {
  static async healthCheck(req, res) {
    const health = await HealthCheckService.check();

    // Status code baseado na saúde
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  }

  static async liveness(req, res) {
    // Liveness: apenas verifica se processo está vivo
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  static async readiness(req, res) {
    // Readiness: verifica se está pronto para tráfego
    const health = await HealthCheckService.check();

    // Ready apenas se database OK
    const isReady = health.checks.database.status === 'ok';
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}
```

---

### Monitoramento com Prometheus

```typescript
// prometheus-exporter.ts
import { HealthCheckService } from '@shared/services/healthCheck.service';
import { register, Gauge } from 'prom-client';

// Métricas
const healthStatus = new Gauge({
  name: 'app_health_status',
  help: 'Overall health status (1=healthy, 0.5=degraded, 0=unhealthy)'
});

const dbResponseTime = new Gauge({
  name: 'app_db_response_time_ms',
  help: 'Database response time in milliseconds'
});

const memoryUsagePercent = new Gauge({
  name: 'app_memory_usage_percent',
  help: 'Memory usage percentage'
});

// Atualizar métricas a cada 10s
setInterval(async () => {
  const health = await HealthCheckService.check();

  // Status geral
  const statusValue = {
    'healthy': 1,
    'degraded': 0.5,
    'unhealthy': 0
  }[health.status];
  healthStatus.set(statusValue);

  // Database
  if (health.checks.database.responseTime) {
    dbResponseTime.set(health.checks.database.responseTime);
  }

  // Memory
  memoryUsagePercent.set(health.checks.memory.percentage);
}, 10000);

export { register };
```

---

### Alertas

```typescript
// AlertService.ts
import { HealthCheckService } from '@shared/services/healthCheck.service';

export class AlertService {
  static async checkAndAlert() {
    const health = await HealthCheckService.check();

    // Alerta se unhealthy
    if (health.status === 'unhealthy') {
      await this.sendAlert('CRITICAL', 'Sistema unhealthy', health);
    }

    // Alerta se degraded por muito tempo
    if (health.status === 'degraded') {
      await this.sendAlert('WARNING', 'Sistema degraded', health);
    }

    // Alerta específico de memória
    if (health.checks.memory.status === 'critical') {
      await this.sendAlert('CRITICAL', `Memória crítica: ${health.checks.memory.percentage}%`, health);
    }

    // Alerta específico de database
    if (health.checks.database.status === 'error') {
      await this.sendAlert('CRITICAL', 'Database offline', health);
    }
  }

  private static async sendAlert(level, message, health) {
    // Enviar para Slack, PagerDuty, etc
    console.error(`[${level}] ${message}`, health);
  }
}

// Executar a cada minuto
setInterval(() => AlertService.checkAndAlert(), 60000);
```

---

## Performance

### Tempos Típicos

| Check | Tempo Típico | Depende De |
|-------|--------------|------------|
| checkDatabase | 10-100ms | Latência do banco |
| checkMemory | < 1ms | API nativa do Node |
| checkDisk | < 1ms | Implementação básica |
| **Total** | **10-100ms** | Paralelização |

### Otimizações

**1. Execução Paralela:**
```typescript
// ✅ Paralelo (rápido)
const [db, mem, disk] = await Promise.all([...]);

// ❌ Sequencial (lento)
const db = await checkDatabase();
const mem = await checkMemory();
const disk = await checkDisk();
```

**2. Cache de Resultados:**
```typescript
// Cache de 30s
let cachedHealth: HealthStatus | null = null;
let lastCheck = 0;

static async check(): Promise<HealthStatus> {
  const now = Date.now();

  // Retorna cache se < 30s
  if (cachedHealth && (now - lastCheck) < 30000) {
    return cachedHealth;
  }

  // Executa check
  cachedHealth = await this.performCheck();
  lastCheck = now;

  return cachedHealth;
}
```

**3. Timeout na Query:**
```typescript
// DatabaseManager com timeout
await DatabaseManager.queryEmp('SELECT 1', { timeout: 5000 });
```

---

## Melhorias Futuras

### 1. Implementar Check de Disk

```typescript
import diskusage from 'diskusage';

private static async checkDisk(): Promise<DiskCheck> {
  const info = await diskusage.check('/');
  const freePercent = (info.free / info.total) * 100;

  if (freePercent < 10) {
    return { status: 'critical', freePercent };
  }
  if (freePercent < 20) {
    return { status: 'warning', freePercent };
  }
  return { status: 'ok', freePercent };
}
```

---

### 2. Check de Serviços Externos

```typescript
interface ExternalServicesCheck {
  redis: ServiceCheck;
  smtp: ServiceCheck;
  apiTerceira: ServiceCheck;
}

private static async checkExternalServices() {
  const [redis, smtp, api] = await Promise.all([
    this.checkRedis(),
    this.checkSMTP(),
    this.checkAPI()
  ]);

  return { redis, smtp, apiTerceira: api };
}
```

---

### 3. Histórico de Health

```typescript
// Manter histórico de 100 últimos checks
private static healthHistory: HealthStatus[] = [];

static async check(): Promise<HealthStatus> {
  const health = await this.performCheck();

  // Adicionar ao histórico
  this.healthHistory.push(health);
  if (this.healthHistory.length > 100) {
    this.healthHistory.shift();
  }

  return health;
}

static getHistory() {
  return this.healthHistory;
}
```

---

### 4. SLA Calculator

```typescript
static calculateSLA(periodHours: number = 24): number {
  const history = this.healthHistory.filter(h => {
    const age = Date.now() - new Date(h.timestamp).getTime();
    return age < periodHours * 3600 * 1000;
  });

  const healthyCount = history.filter(h => h.status === 'healthy').length;
  return (healthyCount / history.length) * 100;
}

// SLA nas últimas 24h
const sla = HealthCheckService.calculateSLA(24);
console.log(`SLA: ${sla.toFixed(2)}%`);
```

---

## Troubleshooting

### Problema: Database sempre "error"

**Sintoma:**
```json
{
  "database": {
    "status": "error",
    "error": "Banco de dados não inicializado"
  }
}
```

**Causa:**
- `DatabaseManager.initialize()` não foi chamado
- DatabaseManager não está pronto

**Solução:**
```typescript
// server.ts
await DatabaseManager.initialize();
await DatabaseManager.connect();

// Verificar
const isReady = DatabaseManager.isReady();
console.log('DB Ready:', isReady);
```

---

### Problema: Database sempre "degraded"

**Sintoma:**
```json
{
  "database": {
    "status": "degraded",
    "mode": "MOCK_DATA"
  }
}
```

**Causa:**
- Sistema está usando dados mock
- Banco real não está conectado

**Solução:**
```typescript
// Verificar variáveis de ambiente
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

// Forçar modo LIVE
process.env.NODE_ENV = 'production';
```

---

### Problema: Memory sempre "critical"

**Sintoma:**
```json
{
  "memory": {
    "status": "critical",
    "percentage": 95
  }
}
```

**Causa:**
- Vazamento de memória (memory leak)
- Sistema com pouca memória
- Processo consumindo muito

**Diagnóstico:**
```bash
# Ver memória do processo
ps aux | grep node

# Ver memória total do sistema
free -h

# Heap snapshot
node --inspect server.js
# Chrome DevTools → Memory → Take Snapshot
```

**Solução:**
1. Reiniciar aplicação
2. Aumentar memória do container
3. Investigar memory leaks
4. Otimizar código

---

### Problema: Check muito lento

**Sintoma:**
- Health check demora > 5s
- Timeout em liveness probe

**Diagnóstico:**
```typescript
// Adicionar logs de tempo
const start = Date.now();
const db = await this.checkDatabase();
console.log(`DB check: ${Date.now() - start}ms`);

const mem = await this.checkMemory();
console.log(`Mem check: ${Date.now() - start}ms`);
```

**Causa Comum:**
- Database lento (> 1s)
- Network latency alto

**Solução:**
```typescript
// Adicionar timeout na query
await DatabaseManager.queryEmp('SELECT 1', {
  timeout: 1000 // 1s
});

// Ou usar cache
if (cachedResult && Date.now() - lastCheck < 30000) {
  return cachedResult;
}
```

---

## Referências

### Arquivos Relacionados

- `healthCheck.routes.ts` - Rotas de health check
- `HealthCheckController.ts` - Controller
- `DatabaseManager.ts` - Gerenciador de banco
- `logger.ts` - Sistema de logging

### Links Externos

- [Node.js os module](https://nodejs.org/api/os.html) - APIs de sistema
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) - Liveness/Readiness
- [Health Check Pattern](https://microservices.io/patterns/observability/health-check-api.html) - Padrão de design

### Conceitos

- **Health Check** - Verificação de saúde
- **Liveness Probe** - Verifica se processo está vivo
- **Readiness Probe** - Verifica se pronto para tráfego
- **OOM** - Out Of Memory
- **SLA** - Service Level Agreement

---

## Resumo

### O que é?

Serviço de verificação de saúde do sistema que verifica banco de dados, memória e disco, retornando status agregado.

### Método Principal

```typescript
static async check(): Promise<HealthStatus>
```

**Execução:** Paralela (Promise.all)

**Performance:** 10-100ms típico

### Checks

| Check | Status | Critérios |
|-------|--------|-----------|
| **Database** | ok / degraded / error | Conectividade + tempo |
| **Memory** | ok / warning / critical | < 75% / 75-90% / > 90% |
| **Disk** | ok / warning / critical | TODO: implementar |

### Status Geral

| Status | Significado | HTTP |
|--------|-------------|------|
| **healthy** | Tudo OK | 200 |
| **degraded** | Algum warning | 200/503 |
| **unhealthy** | Falha crítica | 503 |

### Uso

```typescript
// Controller
const health = await HealthCheckService.check();
const statusCode = health.status === 'healthy' ? 200 : 503;
res.status(statusCode).json(health);
```

---

**Última atualização:** 2025-10-07