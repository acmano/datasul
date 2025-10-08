# Graceful Shutdown

> **Sistema de encerramento limpo e ordenado do servidor**

Gerenciador de shutdown que garante encerramento seguro do servidor sem perder requisições ativas e liberando recursos corretamente.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Por que Graceful Shutdown?](#por-que-graceful-shutdown)
- [Processo de Shutdown](#processo-de-shutdown)
- [Sinais do Sistema](#sinais-do-sistema)
- [API](#api)
- [Configuração](#configuração)
- [Exemplos de Uso](#exemplos-de-uso)
- [Integração com Orquestradores](#integração-com-orquestradores)
- [Timeouts e Exit Codes](#timeouts-e-exit-codes)
- [Monitoramento](#monitoramento)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é Graceful Shutdown?

**Graceful Shutdown** é o processo de encerrar uma aplicação de forma ordenada e segura, garantindo que:

- ✅ Nenhuma requisição ativa seja perdida
- ✅ Recursos sejam liberados corretamente (conexões DB, arquivos, sockets)
- ✅ Logs sejam gravados completamente
- ✅ Estado seja persistido quando necessário
- ✅ Clientes recebam respostas apropriadas

### Características Principais

- ✅ **Zero Downtime** - Não perde requisições em andamento
- ✅ **Resource Cleanup** - Libera memória, conexões, handlers
- ✅ **Signal Handling** - Captura SIGTERM, SIGINT, SIGQUIT
- ✅ **Error Recovery** - Trata uncaughtException e unhandledRejection
- ✅ **Timeout Safety** - Força encerramento se demorar muito
- ✅ **Orchestrator Ready** - Compatível com Docker, Kubernetes
- ✅ **Customizable** - Callbacks para lógica customizada
- ✅ **Observable** - Logs detalhados de todo o processo

---

## Por que Graceful Shutdown?

### Problemas sem Graceful Shutdown

```bash
# ❌ Kill abrupto
$ kill -9 <pid>
```

**Consequências:**
- 🔴 Requisições HTTP interrompidas (500 para clientes)
- 🔴 Transações de banco não commitadas
- 🔴 Conexões não fechadas (conexões órfãs)
- 🔴 Arquivos corrompidos (gravação incompleta)
- 🔴 Cache não persistido
- 🔴 Logs perdidos (buffer não escrito)
- 🔴 Métricas incorretas

### Solução com Graceful Shutdown

```bash
# ✅ Shutdown limpo
$ kill -SIGTERM <pid>
```

**Benefícios:**
- ✅ Requisições completadas normalmente
- ✅ Transações commitadas ou rolled back
- ✅ Conexões fechadas corretamente
- ✅ Arquivos salvos e fechados
- ✅ Cache persistido em disco
- ✅ Logs gravados completamente
- ✅ Métricas finais reportadas

---

## Processo de Shutdown

### Fluxo Completo

```
┌──────────────────────────────────────────────────────────┐
│ 1. SINAL RECEBIDO (SIGTERM, SIGINT, etc.)               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 2. VERIFICAR SE JÁ EM SHUTDOWN                           │
│    - Se sim: ignorar sinal duplicado                     │
│    - Se não: continuar                                   │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 3. MARCAR FLAG isShuttingDown = true                     │
│    - Previne processamento de novos sinais              │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 4. EXECUTAR onShutdownStart() CALLBACK                   │
│    - Lógica customizada de início                       │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 5. INICIAR TIMER DE TIMEOUT                              │
│    - setTimeout(forceShutdown, timeout)                  │
│    - Padrão: 10 segundos                                │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 6. FECHAR SERVIDOR HTTP                                  │
│    - server.close() → para novas conexões               │
│    - Aguarda requisições ativas (máx 5s)                │
│    - Força fechamento de conexões pendentes             │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 7. FECHAR CONEXÕES DE BANCO                              │
│    - DatabaseManager.close()                             │
│    - Aguarda queries ativas                              │
│    - Fecha pools de conexão                              │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 8. CLEANUP CUSTOMIZADO                                   │
│    - Fechar cache (Redis)                                │
│    - Salvar métricas                                     │
│    - Limpar temporários                                  │
│    - Aguardar logs serem gravados                        │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 9. EXECUTAR onShutdownComplete() CALLBACK                │
│    - Lógica customizada final                            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 10. CANCELAR TIMER DE TIMEOUT                            │
│     - clearTimeout(shutdownTimer)                        │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 11. ENCERRAR PROCESSO                                    │
│     - process.exit(0) → sucesso                          │
│     - process.exit(1) → erro                             │
└──────────────────────────────────────────────────────────┘
```

### Timeline Temporal

```
t = 0s      Sinal SIGTERM recebido
            └─ Para de aceitar novas conexões HTTP
            └─ Inicia timer de timeout (10s)

t = 0-5s    Aguardando requisições ativas finalizarem
            └─ Conexão 1: GET /api/items → 200 OK (1.2s)
            └─ Conexão 2: POST /api/users → 201 Created (0.8s)
            └─ Conexão 3: GET /health → 200 OK (0.1s)

t = 5s      Força fechamento de conexões ainda ativas
            └─ connection.destroy() em cada conexão pendente

t = 5.1s    Fechando conexões do banco de dados
            └─ Aguarda queries ativas
            └─ Fecha pool EMP
            └─ Fecha pool MULT

t = 6.2s    Cleanup customizado
            └─ Fecha Redis
            └─ Salva métricas
            └─ Aguarda logs (100ms)

t = 6.5s    Shutdown completo ✅
            └─ process.exit(0)

-----------------------------------------------------------

CENÁRIO DE TIMEOUT:

t = 0s      Sinal SIGTERM recebido
t = 0-10s   Tentando shutdown gracioso
t = 10s     ⚠️ TIMEOUT ATINGIDO
            └─ Força encerramento imediato
            └─ Destrói todas as conexões
            └─ process.exit(0)
```

---

## Sinais do Sistema

### Sinais Capturados

| Sinal | Origem | Comportamento | Exit Code |
|-------|--------|---------------|-----------|
| **SIGTERM** | Docker, K8s, systemd | Shutdown gracioso | 0 |
| **SIGINT** | Ctrl+C terminal | Shutdown gracioso | 0 |
| **SIGQUIT** | Ctrl+\ terminal | Shutdown gracioso | 0 |
| **uncaughtException** | Erro não tratado | Shutdown forçado | 1 |
| **unhandledRejection** | Promise sem .catch() | Shutdown forçado | 1 |

### 1. SIGTERM (Signal Terminate)

**O que é:**
- Sinal padrão para encerramento ordenado
- Permite cleanup antes de encerrar

**Quando acontece:**
- Deploy em Kubernetes
- Scale down de pods
- Docker stop/restart
- systemd restart
- Atualização rolling

**Exemplo:**
```bash
# Enviar SIGTERM manualmente
$ kill -SIGTERM <pid>

# Docker stop (envia SIGTERM, aguarda 10s, depois SIGKILL)
$ docker stop <container>

# Kubernetes (envia SIGTERM, aguarda terminationGracePeriodSeconds)
$ kubectl delete pod <pod-name>
```

**Logs:**
```
🔥 SIGTERM recebido - Iniciando graceful shutdown
🛑 Iniciando processo de shutdown
   signal: SIGTERM
   activeConnections: 3
   timestamp: 2025-10-07T10:30:45.123Z
```

---

### 2. SIGINT (Signal Interrupt)

**O que é:**
- Interrupção pelo teclado (Ctrl+C)
- Comum em desenvolvimento

**Quando acontece:**
- Desenvolvedor pressiona Ctrl+C
- Script mata processo
- IDE para debugging

**Exemplo:**
```bash
# Terminal (desenvolvimento)
$ npm start
Server listening on port 3000
^C  ← Ctrl+C
🔥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown
```

---

### 3. SIGQUIT (Signal Quit)

**O que é:**
- Quit com dump de core
- Usado para debugging

**Quando acontece:**
- Ctrl+\ no terminal
- Debug de processos travados
- Análise de estado interno

**Exemplo:**
```bash
$ npm start
Server listening on port 3000
^\  ← Ctrl+\
🔥 SIGQUIT recebido - Iniciando graceful shutdown
```

---

### 4. uncaughtException

**O que é:**
- Erro não capturado em código síncrono
- Último recurso de error handling

**Quando acontece:**
- throw new Error() sem try/catch
- Erro em código síncrono não tratado
- Bug crítico

**Exemplo:**
```typescript
// ❌ Código que causa uncaughtException
function processData() {
  throw new Error('Falha crítica!');
}

processData(); // Não tem try/catch

// Logs:
❌ Uncaught Exception - Forçando shutdown
   error: Falha crítica!
   stack: Error: Falha crítica!
       at processData (file.ts:123)
```

**Exit code:** 1 (erro)

---

### 5. unhandledRejection

**O que é:**
- Promise rejeitada sem .catch()
- Erro em código assíncrono não tratado

**Quando acontece:**
- Promise.reject() sem catch
- async/await sem try/catch
- throw em função async sem tratamento

**Exemplo:**
```typescript
// ❌ Código que causa unhandledRejection
async function fetchData() {
  throw new Error('Falha na API');
}

fetchData(); // Não tem .catch() nem try/catch

// Logs:
❌ Unhandled Promise Rejection - Forçando shutdown
   reason: Error: Falha na API
```

**Exit code:** 1 (erro)

---

## API

### GracefulShutdown Class

#### Constructor

```typescript
constructor(server: Server, config?: ShutdownConfig)
```

**Parâmetros:**
- `server: Server` - Instância do servidor HTTP do Express
- `config?: ShutdownConfig` - Configurações opcionais

**Exemplo:**
```typescript
const shutdown = new GracefulShutdown(server, {
  timeout: 15000,
  onShutdownStart: async () => {
    log.info('Iniciando shutdown...');
  },
  onShutdownComplete: async () => {
    log.info('Shutdown completo!');
  }
});
```

---

#### init()

Inicializa os listeners de sinais.

**Retorno:** `void`

**Comportamento:**
- Registra handlers para SIGTERM, SIGINT, SIGQUIT
- Registra handlers para uncaughtException, unhandledRejection
- Rastreia conexões HTTP ativas
- Loga configuração

**Exemplo:**
```typescript
shutdown.init();
```

---

#### getStatus()

Retorna status atual do shutdown.

**Retorno:**
```typescript
{
  isShuttingDown: boolean;
  activeConnections: number;
}
```

**Exemplo:**
```typescript
const status = shutdown.getStatus();

console.log('Shutting down:', status.isShuttingDown);
console.log('Active connections:', status.activeConnections);

// Health check endpoint
app.get('/health', (req, res) => {
  const status = shutdown.getStatus();

  if (status.isShuttingDown) {
    res.status(503).json({
      status: 'shutting_down',
      connections: status.activeConnections
    });
  } else {
    res.status(200).json({ status: 'healthy' });
  }
});
```

---

### ShutdownConfig Interface

```typescript
interface ShutdownConfig {
  timeout?: number;
  onShutdownStart?: () => void | Promise<void>;
  onShutdownComplete?: () => void | Promise<void>;
}
```

#### timeout

Timeout em milissegundos para forçar encerramento.

**Tipo:** `number`
**Padrão:** `10000` (10 segundos)

**Valores recomendados:**
- `5000` (5s) - Aplicações leves
- `10000` (10s) - Padrão equilibrado ⭐
- `15000` (15s) - Operações mais longas
- `30000` (30s) - Processos batch

**Exemplo:**
```typescript
{
  timeout: 15000 // 15 segundos
}
```

---

#### onShutdownStart

Callback executado no início do shutdown.

**Tipo:** `() => void | Promise<void>`
**Opcional:** Sim

**Quando executado:** Logo após sinal recebido, antes de fechar recursos

**Uso:**
- Notificar monitoramento
- Marcar instância como "draining"
- Salvar estado atual
- Registrar evento

**Exemplo:**
```typescript
{
  onShutdownStart: async () => {
    await monitoring.notify('instance_shutdown_started', {
      instance: process.env.HOSTNAME,
      connections: getActiveConnections()
    });

    await redis.set('instance:status', 'draining');

    log.info('Notificações de shutdown enviadas');
  }
}
```

---

#### onShutdownComplete

Callback executado após shutdown bem-sucedido.

**Tipo:** `() => void | Promise<void>`
**Opcional:** Sim

**Quando executado:** Após todos recursos fechados, antes de process.exit()

**Uso:**
- Notificar finalização
- Salvar métricas finais
- Limpar recursos externos
- Log de despedida

**Exemplo:**
```typescript
{
  onShutdownComplete: async () => {
    await monitoring.notify('instance_shutdown_complete', {
      instance: process.env.HOSTNAME,
      uptime: process.uptime(),
      duration: shutdownDuration
    });

    await metrics.flush();

    log.info('👋 Adeus! Até breve!');
  }
}
```

---

### Helper Function

#### setupGracefulShutdown()

Helper para criar e inicializar shutdown em uma chamada.

**Assinatura:**
```typescript
function setupGracefulShutdown(
  server: Server,
  config?: ShutdownConfig
): GracefulShutdown
```

**Parâmetros:**
- `server: Server` - Servidor HTTP
- `config?: ShutdownConfig` - Configurações opcionais

**Retorno:** `GracefulShutdown` - Instância criada

**Exemplo:**
```typescript
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const server = app.listen(3000);

setupGracefulShutdown(server, {
  timeout: 15000,
  onShutdownStart: () => log.info('Encerrando...'),
  onShutdownComplete: () => log.info('Encerrado!')
});
```

---

## Configuração

### Setup Básico

```typescript
import express from 'express';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const app = express();

// Rotas...
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Iniciar servidor
const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// Configurar graceful shutdown
setupGracefulShutdown(server);
```

---

### Setup Avançado

```typescript
import express from 'express';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
import { CacheManager } from '@shared/utils/cacheManager';

const app = express();
const server = app.listen(3000);

setupGracefulShutdown(server, {
  // Timeout customizado
  timeout: 15000, // 15 segundos

  // Callback de início
  onShutdownStart: async () => {
    log.info('🛑 Iniciando shutdown...');

    // Notificar load balancer para parar de rotear
    await notifyLoadBalancer('draining');

    // Marcar instância como indisponível
    await serviceDiscovery.markUnavailable();

    // Salvar métricas atuais
    await metrics.snapshot();
  },

  // Callback de conclusão
  onShutdownComplete: async () => {
    log.info('🧹 Finalizando...');

    // Fechar cache Redis
    await CacheManager.close();

    // Flush logs pendentes
    await logger.flush();

    // Salvar métricas finais
    await metrics.finalize();

    // Notificar monitoramento
    await monitoring.notify('shutdown_complete', {
      instance: process.env.HOSTNAME,
      uptime: process.uptime()
    });

    log.info('👋 Adeus!');
  }
});
```

---

## Exemplos de Uso

### 1. Aplicação Express Básica

```typescript
import express from 'express';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const app = express();

app.get('/api/items', async (req, res) => {
  const items = await db.query('SELECT * FROM items');
  res.json(items);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
setupGracefulShutdown(server);
```

**Comportamento ao encerrar:**
```bash
$ npm start
Server running on port 3000

# Ctrl+C
🔥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown
🛑 Iniciando processo de shutdown
📡 Fechando servidor HTTP...
✅ Servidor HTTP fechado (activeConnections: 0)
🗄️ Fechando conexões do banco de dados...
✅ Conexões do banco fechadas
🧹 Executando cleanup final...
✅ Cleanup completo
✅ Graceful shutdown completo (duration: 234ms)
```

---

### 2. Com Callbacks Customizados

```typescript
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const server = app.listen(3000);

setupGracefulShutdown(server, {
  timeout: 15000,

  onShutdownStart: async () => {
    console.log('🚦 Parando de aceitar requisições...');

    // Notificar health check que está em shutdown
    healthCheck.setStatus('draining');

    // Aguardar load balancer perceber (5s)
    await new Promise(resolve => setTimeout(resolve, 5000));
  },

  onShutdownComplete: async () => {
    console.log('💾 Salvando métricas finais...');
    await saveMetrics();

    console.log('📊 Enviando relatório...');
    await sendShutdownReport({
      uptime: process.uptime(),
      requests: totalRequests,
      errors: totalErrors
    });

    console.log('👋 Até logo!');
  }
});
```

---

### 3. Com Health Check

```typescript
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const app = express();
const server = app.listen(3000);

// Setup shutdown
const shutdown = setupGracefulShutdown(server, {
  timeout: 10000
});

// Health check que respeita shutdown
app.get('/health', (req, res) => {
  const status = shutdown.getStatus();

  if (status.isShuttingDown) {
    // HTTP 503 Service Unavailable
    res.status(503).json({
      status: 'shutting_down',
      connections: status.activeConnections,
      message: 'Server is shutting down'
    });
  } else {
    // HTTP 200 OK
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime()
    });
  }
});

// Readiness check para Kubernetes
app.get('/ready', (req, res) => {
  const status = shutdown.getStatus();

  if (status.isShuttingDown) {
    res.status(503).json({ ready: false });
  } else {
    res.status(200).json({ ready: true });
  }
});
```

---

### 4. Com Cache Redis

```typescript
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
import { CacheManager } from '@shared/utils/cacheManager';

const app = express();
const server = app.listen(3000);

// Inicializar cache
CacheManager.initialize('redis');

// Setup shutdown
setupGracefulShutdown(server, {
  timeout: 15000,

  onShutdownComplete: async () => {
    // Fechar conexão Redis
    await CacheManager.close();
    console.log('✅ Redis desconectado');
  }
});
```

---

### 5. Com Worker Threads

```typescript
import { Worker } from 'worker_threads';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const workers: Worker[] = [];

// Criar workers
for (let i = 0; i < 4; i++) {
  const worker = new Worker('./worker.js');
  workers.push(worker);
}

const server = app.listen(3000);

setupGracefulShutdown(server, {
  timeout: 20000,

  onShutdownComplete: async () => {
    console.log('🔧 Encerrando workers...');

    // Enviar sinal para workers
    workers.forEach(worker => {
      worker.postMessage({ type: 'shutdown' });
    });

    // Aguardar workers finalizarem
    await Promise.all(
      workers.map(worker =>
        new Promise(resolve => {
          worker.on('exit', resolve);
        })
      )
    );

    console.log('✅ Workers encerrados');
  }
});
```

---

## Integração com Orquestradores

### Docker

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

# Usar processo que propaga sinais
CMD ["node", "dist/server.js"]

# ❌ NÃO usar npm start (não propaga SIGTERM)
# CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    # Tempo para graceful shutdown antes de SIGKILL
    stop_grace_period: 15s
    restart: unless-stopped
```

**Comandos:**
```bash
# Start (envia SIGTERM ao parar)
$ docker-compose up

# Stop gracioso (aguarda 15s antes de SIGKILL)
$ docker-compose stop

# Restart
$ docker-compose restart
```

---

### Kubernetes

#### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: myapp:latest
        ports:
        - containerPort: 3000

        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

        # Lifecycle hooks
        lifecycle:
          preStop:
            exec:
              # Aguardar antes de enviar SIGTERM
              command: ["/bin/sh", "-c", "sleep 5"]

      # Tempo para graceful shutdown
      terminationGracePeriodSeconds: 30
```

**Processo de Shutdown no K8s:**

```
1. kubectl delete pod api-server-abc123

2. Pod marcado como "Terminating"
   └─ Remove do Service (para de receber tráfego)

3. preStop hook executado
   └─ sleep 5 (aguarda load balancer atualizar)

4. SIGTERM enviado para container
   └─ GracefulShutdown inicia

5. Aguarda terminationGracePeriodSeconds (30s)
   └─ Se ainda rodando: SIGKILL

6. Pod removido
```

---

### PM2

#### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'api-server',
    script: './dist/server.js',
    instances: 4,
    exec_mode: 'cluster',

    // Graceful shutdown
    kill_timeout: 15000, // 15s antes de SIGKILL
    wait_ready: true,
    listen_timeout: 10000,

    // Auto restart
    autorestart: true,
    max_restarts: 10,

    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Comandos:**
```bash
# Start
$ pm2 start ecosystem.config.js

# Reload gracioso (zero downtime)
$ pm2 reload api-server

# Stop gracioso
$ pm2 stop api-server

# Restart
$ pm2 restart api-server
```

---

## Timeouts e Exit Codes

### Timeouts

#### Shutdown Timeout (10s padrão)

Tempo máximo para shutdown completo.

**Comportamento:**
- Aguarda até timeout para shutdown gracioso
- Após timeout: força encerramento

**Configuração:**
```typescript
setupGracefulShutdown(server, {
  timeout: 15000 // 15 segundos
});
```

**Recomendações:**
- **5s** - Aplicações leves (< 100 req/s)
- **10s** - Padrão balanceado (< 500 req/s) ⭐
- **15s** - Operações longas (< 1000 req/s)
- **30s** - Processos batch/workers

---

#### HTTP Server Close Timeout (5s fixo)

Tempo para fechar conexões HTTP ativas.

**Comportamento:**
- server.close() chamado (para novas conexões)
- Aguarda requisições ativas finalizarem
- Após 5s: connection.destroy() em conexões pendentes

**Fixo no código:**
```typescript
setTimeout(() => {
  if (this.activeConnections.size > 0) {
    this.activeConnections.forEach(conn => conn.destroy());
  }
}, 5000); // 5 segundos
```

---

### Exit Codes

| Exit Code | Significado | Quando Acontece |
|-----------|-------------|-----------------|
| **0** | Sucesso | Shutdown gracioso completo |
| **0** | Timeout | Shutdown forçado por timeout |
| **1** | Erro | uncaughtException |
| **1** | Erro | unhandledRejection |
| **1** | Erro | Falha durante shutdown |

#### Exit Code 0 (Sucesso)

```bash
# Shutdown normal
$ kill -SIGTERM <pid>

# Logs:
✅ Graceful shutdown completo
   signal: SIGTERM
   duration: 2341ms

# Process exit
$ echo $?
0
```

#### Exit Code 1 (Erro)

```bash
# Erro não tratado
$ npm start

# Logs:
❌ Uncaught Exception - Forçando shutdown
   error: Cannot read property 'id' of undefined
🔴 FORÇANDO ENCERRAMENTO IMEDIATO
   exitCode: 1

# Process exit
$ echo $?
1
```

---

## Monitoramento

### Logs de Shutdown

```typescript
// Início do shutdown
log.info('🔥 SIGTERM recebido - Iniciando graceful shutdown');

log.info('🛑 Iniciando processo de shutdown', {
  signal: 'SIGTERM',
  activeConnections: 3,
  timestamp: '2025-10-07T10:30:45.123Z'
});

// Fechando servidor HTTP
log.info('📡 Fechando servidor HTTP...');
log.info('✅ Servidor HTTP fechado', {
  activeConnections: 0
});

// Fechando banco de dados
log.info('🗄️ Fechando conexões do banco de dados...');
log.info('✅ Conexões do banco fechadas');

// Cleanup
log.info('🧹 Executando cleanup final...');
log.info('✅ Cleanup completo');

// Conclusão
log.info('✅ Graceful shutdown completo', {
  signal: 'SIGTERM',
  duration: 2341,
  timestamp: '2025-10-07T10:30:47.464Z'
});
```

---

### Métricas

```typescript
// Contador de shutdowns
metrics.increment('shutdown.count', {
  signal: 'SIGTERM',
  exit_code: 0
});

// Duração do shutdown
metrics.timing('shutdown.duration', duration, {
  signal: 'SIGTERM'
});

// Conexões ativas no momento do shutdown
metrics.gauge('shutdown.active_connections', activeConnections);

// Uptime antes do shutdown
metrics.gauge('shutdown.uptime', process.uptime());
```

---

### Health Check Durante Shutdown

```typescript
app.get('/health', (req, res) => {
  const status = shutdown.getStatus();

  if (status.isShuttingDown) {
    res.status(503).json({
      status: 'shutting_down',
      connections: status.activeConnections,
      message: 'Server is gracefully shutting down'
    });
  } else {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  }
});
```

---

## Boas Práticas

### ✅ DO

**1. Sempre use graceful shutdown em produção**
```typescript
// ✅ Correto
const server = app.listen(3000);
setupGracefulShutdown(server);
```

**2. Configure timeout apropriado**
```typescript
// ✅ Baseado no SLA de requisições
setupGracefulShutdown(server, {
  timeout: 15000 // 15s se requisições demoram 5-10s
});
```

**3. Use preStop hook no Kubernetes**
```yaml
# ✅ Aguarda load balancer atualizar
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 5"]
```

**4. Implemente health checks que respeitam shutdown**
```typescript
// ✅ HTTP 503 durante shutdown
app.get('/health', (req, res) => {
  if (shutdown.getStatus().isShuttingDown) {
    res.status(503).json({ status: 'shutting_down' });
  } else {
    res.status(200).json({ status: 'healthy' });
  }
});
```

**5. Feche todos os recursos**
```typescript
// ✅ Cleanup completo
onShutdownComplete: async () => {
  await CacheManager.close();
  await queueManager.disconnect();
  await logger.flush();
}
```

---

### ❌ DON'T

**1. Não use kill -9 (SIGKILL)**
```bash
# ❌ Mata processo abruptamente
$ kill -9 <pid>

# ✅ Permite graceful shutdown
$ kill -SIGTERM <pid>
```

**2. Não ignore sinais**
```typescript
// ❌ Ignora SIGTERM
process.on('SIGTERM', () => {
  console.log('Ignorando...');
});

// ✅ Processa shutdown
process.on('SIGTERM', () => {
  shutdown();
});
```

**3. Não use npm start no Docker**
```dockerfile
# ❌ npm não propaga SIGTERM
CMD ["npm", "start"]

# ✅ node recebe SIGTERM diretamente
CMD ["node", "dist/server.js"]
```

**4. Não esqueça terminationGracePeriodSeconds**
```yaml
# ❌ Padrão muito curto (30s)
spec:
  terminationGracePeriodSeconds: 30

# ✅ Suficiente para shutdown (60s)
spec:
  terminationGracePeriodSeconds: 60
```

**5. Não deixe timeout muito curto**
```typescript
// ❌ Não dá tempo para finalizar
setupGracefulShutdown(server, {
  timeout: 1000 // 1 segundo
});

// ✅ Tempo adequado
setupGracefulShutdown(server, {
  timeout: 10000 // 10 segundos
});
```

---

## Troubleshooting

### Processo não encerra

**Sintomas:**
- Processo não termina após SIGTERM
- Timeout sempre atingido
- process.exit() não funciona

**Causas:**
- Timers ativos (setInterval)
- Conexões abertas (DB, Redis)
- Event listeners não removidos
- Workers não encerrados

**Solução:**
```typescript
onShutdownComplete: async () => {
  // Limpar timers
  clearInterval(myInterval);

  // Fechar conexões
  await redis.disconnect();
  await db.close();

  // Remover listeners
  eventEmitter.removeAllListeners();

  // Encerrar workers
  workers.forEach(w => w.terminate());
}
```

---

### Requisições perdidas

**Sintomas:**
- Erros 502/503 durante deploy
- Requisições interrompidas
- Clientes recebem connection reset

**Causas:**
- Timeout muito curto
- Load balancer não atualizou
- Não aguarda requisições ativas

**Solução:**
```typescript
// 1. Aumentar timeout
setupGracefulShutdown(server, {
  timeout: 15000 // 15 segundos
});

// 2. PreStop hook no K8s
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 5"]

// 3. Callback para aguardar LB
onShutdownStart: async () => {
  await notifyLoadBalancer('draining');
  await sleep(5000); // Aguarda LB atualizar
}
```

---

### Shutdown muito lento

**Sintomas:**
- Shutdown demora > 30s
- Timeout sempre atingido
- K8s envia SIGKILL

**Causas:**
- Operações lentas em callbacks
- Queries longas no banco
- Muitas conexões ativas

**Solução:**
```typescript
// 1. Otimizar callbacks
onShutdownStart: async () => {
  // ❌ Lento
  await saveAllMetrics();

  // ✅ Rápido
  setImmediate(() => saveAllMetrics());
};

// 2. Aumentar timeout
setupGracefulShutdown(server, {
  timeout: 20000 // 20 segundos
});

// 3. Aumentar terminationGracePeriodSeconds
spec:
  terminationGracePeriodSeconds: 60
```

---

### Erros não tratados causam shutdown

**Sintomas:**
- Processo encerra inesperadamente
- Exit code 1
- Logs de uncaughtException

**Causas:**
- Erro sem try/catch
- Promise sem .catch()
- Callback sem error handling

**Solução:**
```typescript
// ❌ Sem tratamento
async function process() {
  throw new Error('Falha');
}

// ✅ Com tratamento
async function process() {
  try {
    // código
  } catch (error) {
    log.error('Erro no processamento', { error });
    // NÃO throw error
  }
}

// ✅ Promise com catch
fetchData()
  .catch(error => {
    log.error('Erro ao buscar dados', { error });
  });
```

---

### Conexões não fecham

**Sintomas:**
- Conexões órfãs no banco
- Redis mostra conexões ativas
- Logs não aparecem

**Causas:**
- Esqueceu de chamar close()
- Conexões não rastreadas
- Cleanup não executado

**Solução:**
```typescript
onShutdownComplete: async () => {
  // Banco de dados
  await DatabaseManager.close();

  // Cache
  await CacheManager.close();

  // Redis
  await redis.disconnect();

  // Logs
  await logger.flush();
  await new Promise(r => setTimeout(r, 100));
}
```

---

## Referências

### Arquivos Relacionados

- `server.ts` - Setup principal do servidor
- `DatabaseManager.ts` - Fechamento de conexões DB
- `logger.ts` - Sistema de logs
- `CacheManager.ts` - Cache Redis

### Documentação Externa

- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
- [Docker Stop Grace Period](https://docs.docker.com/compose/compose-file/#stop_grace_period)
- [Kubernetes Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [PM2 Graceful Shutdown](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/)

### Conceitos

- **Graceful Shutdown** - Encerramento ordenado
- **SIGTERM** - Signal terminate
- **SIGINT** - Signal interrupt
- **SIGKILL** - Kill imediato (não pode ser capturado)
- **Exit Code** - Código de saída do processo
- **terminationGracePeriodSeconds** - Timeout do K8s
- **preStop Hook** - Hook antes do shutdown

---

**Última atualização:** 2025-10-07