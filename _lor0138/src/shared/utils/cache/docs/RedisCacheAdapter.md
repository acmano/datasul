# Redis Cache Adapter - Documentação Completa

> **Módulo:** `shared/utils/cache/RedisCacheAdapter`
> **Versão:** 1.0.0
> **Arquivo:** `src/shared/utils/cache/RedisCacheAdapter.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Características](#características)
3. [Quando Usar](#quando-usar)
4. [Biblioteca ioredis](#biblioteca-ioredis)
5. [Configuração](#configuração)
6. [Event Handlers](#event-handlers)
7. [Métodos Principais](#métodos-principais)
8. [Métodos Extras](#métodos-extras)
9. [Serialização JSON](#serialização-json)
10. [SCAN vs KEYS](#scan-vs-keys)
11. [Exemplos Práticos](#exemplos-práticos)
12. [Boas Práticas](#boas-práticas)
13. [Performance](#performance)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Implementa cache **distribuído** utilizando Redis, permitindo compartilhamento de dados entre múltiplas instâncias da aplicação.

### Propósito

Fornecer cache persistente e compartilhado via Redis, ideal para ambientes com múltiplas instâncias (load balanced) e necessidade de alta disponibilidade.

### Arquitetura

```
┌─────────────────────────────────────┐
│    RedisCacheAdapter (L2)           │
├─────────────────────────────────────┤
│                                     │
│     ┌─────────────────────┐        │
│     │    ioredis          │        │
│     │   (biblioteca)      │        │
│     └─────────┬───────────┘        │
│               ↓                     │
│     ┌─────────────────────┐        │
│     │   Servidor Redis    │        │
│     │   (externo)         │        │
│     └─────────────────────┘        │
│                                     │
└─────────────────────────────────────┘
```

---

## ✨ Características

### Vantagens

| Característica | Descrição |
|----------------|-----------|
| ✅ **Compartilhado** | Cache distribuído entre todas instâncias |
| ✅ **Persistente** | Sobrevive a restarts da aplicação |
| ✅ **Escalável** | Suporta milhões de chaves e terabytes de dados |
| ✅ **Alta disponibilidade** | Suporta clustering e sentinels |
| ✅ **Recursos avançados** | TTL, SCAN, Pipelines, Pub/Sub, Streams |
| ✅ **Reconexão automática** | Retry com backoff exponencial |

### Desvantagens

| Limitação | Descrição |
|-----------|-----------|
| ❌ **Latência de rede** | ~5-20ms (vs ~1ms memória) |
| ❌ **Infraestrutura** | Requer servidor Redis separado |
| ❌ **Complexidade** | Mais pontos de falha |
| ❌ **Custo** | Servidor adicional (custos de infra) |
| ❌ **Rede** | Requer conectividade estável |

---

## 🎯 Quando Usar

### Casos de Uso Ideais

#### 1. Aplicações Multi-Instância

```typescript
// Load balanced: 3+ instâncias
// Instância 1 armazena
await cache.set('user:123', user);

// Instância 2 lê (compartilhado via Redis)
const user = await cache.get('user:123'); // ✅ Encontra
```

#### 2. Cache Persistente

```typescript
// Deploy/restart
await cache.set('config', appConfig, 3600);

// Após restart da aplicação
const config = await cache.get('config'); // ✅ Ainda existe
```

#### 3. Dados Compartilhados entre Microserviços

```typescript
// Service A armazena
await cache.set('session:abc', sessionData);

// Service B lê
const session = await cache.get('session:abc'); // ✅ Compartilhado
```

#### 4. Cache L2 em Arquitetura em Camadas

```typescript
const l1 = new MemoryCacheAdapter(300); // Hot data
const l2 = new RedisCacheAdapter(); // Cold data
const cache = new LayeredCacheAdapter(l1, l2);
```

### Quando NÃO Usar

❌ **Single-Instance**
```typescript
// Se apenas 1 instância, memória é suficiente
const cache = new MemoryCacheAdapter(); // Mais simples
```

❌ **Latência Crítica (< 5ms)**
```typescript
// Redis tem latência de rede
// Para < 5ms: usar memória
```

❌ **Sem Infraestrutura Redis**
```typescript
// Redis requer servidor separado
// Se não disponível: usar memória
```

---

## 📚 Biblioteca ioredis

### Instalação

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### Documentação Oficial

https://github.com/luin/ioredis

### Por Que ioredis?

| Feature | ioredis | node-redis |
|---------|---------|------------|
| **Promises** | ✅ Nativo | ✅ Via promisify |
| **Cluster** | ✅ Built-in | ❌ Limitado |
| **Sentinel** | ✅ Suporte completo | ✅ Sim |
| **Pipelines** | ✅ Sim | ✅ Sim |
| **Streams** | ✅ Sim | ✅ Sim |
| **TypeScript** | ✅ Excelente | 🟡 Parcial |
| **Manutenção** | ✅ Ativa | ✅ Ativa |

**Escolha:** ioredis por suporte superior a TypeScript e recursos avançados.

---

## ⚙️ Configuração

### Via URL

```typescript
// Simples
const cache = new RedisCacheAdapter('redis://localhost:6379');

// Com senha
const cache = new RedisCacheAdapter('redis://:password@localhost:6379');

// Database específico
const cache = new RedisCacheAdapter('redis://localhost:6379/2');

// TLS/SSL
const cache = new RedisCacheAdapter('rediss://redis.example.com:6380');
```

### Via Objeto de Opções

```typescript
const cache = new RedisCacheAdapter({
  host: 'localhost',
  port: 6379,
  password: 'secret',
  db: 0,

  // Retry strategy
  retryStrategy: (times) => {
    if (times > 5) return null; // Para após 5 tentativas
    return Math.min(times * 100, 3000); // Backoff exponencial
  },

  // Timeouts
  connectTimeout: 10000, // 10s
  commandTimeout: 5000,  // 5s

  // Outras opções
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
});
```

### Opções Importantes

#### retryStrategy

**Propósito:** Define como reconectar após falha.

```typescript
retryStrategy: (times) => {
  // times: número da tentativa (1, 2, 3...)

  // Desistir após N tentativas
  if (times > 10) return null;

  // Backoff exponencial com limite
  return Math.min(times * 50, 2000);
  // Tentativa 1: 50ms
  // Tentativa 2: 100ms
  // Tentativa 3: 150ms
  // ...
  // Tentativa 40+: 2000ms (máximo)
}
```

#### maxRetriesPerRequest

**Propósito:** Quantas vezes tentar um comando específico.

```typescript
maxRetriesPerRequest: 3
// Tenta GET/SET até 3 vezes
// Após 3 falhas, retorna erro
```

#### enableReadyCheck

**Propósito:** Verifica se Redis está pronto antes de usar.

```typescript
enableReadyCheck: true
// Espera comando INFO antes de marcar ready
// Garante que Redis está operacional
```

#### lazyConnect

**Propósito:** Define quando conectar.

```typescript
lazyConnect: false
// false: Conecta imediatamente no construtor
// true: Conecta apenas no primeiro comando
```

### Configuração em Produção

```typescript
const cache = new RedisCacheAdapter({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    log.warn('Redis retry', { attempt: times, delay });
    return times > 10 ? null : delay;
  },

  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,

  // TLS se necessário
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined
}, 'Production-Redis');
```

---

## 🔔 Event Handlers

O adapter escuta eventos do Redis para logging e controle de estado.

### Eventos

#### connect

**Quando:** Iniciando conexão TCP.

```typescript
this.redis.on('connect', () => {
  log.info('Redis conectando...');
});
```

#### ready

**Quando:** Conectado, autenticado, e pronto para usar.

```typescript
this.redis.on('ready', () => {
  this.ready = true;
  log.info('Redis pronto');
});
```

**Importante:** Apenas após `ready` as operações funcionam.

#### error

**Quando:** Erro de conexão ou operação.

```typescript
this.redis.on('error', (error) => {
  log.error('Redis erro', { error: error.message });
  // Não seta ready = false (pode ser erro temporário)
});
```

#### close

**Quando:** Conexão fechada.

```typescript
this.redis.on('close', () => {
  this.ready = false;
  log.warn('Redis conexão fechada');
});
```

#### reconnecting

**Quando:** Tentando reconectar.

```typescript
this.redis.on('reconnecting', () => {
  log.info('Redis reconectando...');
});
```

### Fluxo de Conexão

```
Constructor
    ↓
new Redis(...)
    ↓
'connect' event → log.info
    ↓
Autenticar (se password)
    ↓
'ready' event → ready = true
    ↓
Operações funcionam
    ↓
(falha de rede)
    ↓
'close' event → ready = false
    ↓
'reconnecting' event
    ↓
retryStrategy() → delay
    ↓
(volta para 'connect')
```

---

## 📚 Métodos Principais

### get<T>(key: string)

Busca valor no cache Redis.

#### Comportamento

1. Verifica se Redis está pronto (`ready`)
2. Executa comando `GET key`
3. Se encontrado: deserializa JSON → retorna (HIT)
4. Se não: retorna `undefined` (MISS)

#### Performance

- **Latência:** 5-20ms (rede local)
- **Throughput:** ~10.000 ops/s por conexão
- **Complexidade:** O(1)

#### Exemplos

```typescript
// Busca simples
const item = await cache.get<Item>('item:123');

if (item) {
  console.log('Redis HIT:', item);
} else {
  console.log('Redis MISS');
}

// Pattern Cache-Aside
async function getUser(id: string): Promise<User> {
  const cached = await cache.get<User>(`user:${id}`);
  if (cached) return cached;

  const user = await db.findUser(id);
  await cache.set(`user:${id}`, user, 600);

  return user;
}
```

#### Estados de Retorno

| Situação | Retorno | Motivo |
|----------|---------|--------|
| Chave existe | `T` | HIT |
| Chave não existe | `undefined` | MISS |
| Redis offline | `undefined` | !ready |
| Erro deserialização | `undefined` | JSON inválido |

---

### set<T>(key, value, ttl?)

Armazena valor no cache Redis.

#### Comandos Redis

```typescript
// Com TTL
await cache.set('key', value, 600);
// → SETEX key 600 "{"name":"value"}"

// Sem TTL
await cache.set('key', value);
// → SET key "{"name":"value"}"
```

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| **key** | `string` | Sim | Chave única |
| **value** | `T` | Sim | Valor a armazenar |
| **ttl** | `number` | Não | TTL em **SEGUNDOS** |

#### Retorno

```typescript
Promise<boolean>
// true: Sucesso
// false: Falha (Redis offline ou erro)
```

#### Exemplos

```typescript
// TTL de 10 minutos
await cache.set('item:123', item, 600);

// Sem TTL (persiste indefinidamente)
await cache.set('config:app', config);

// Verificar sucesso
const ok = await cache.set('key', value);
if (!ok) {
  log.error('Failed to cache in Redis');
  // Fallback: continuar sem cache
}
```

#### TTL: Segundos vs Milissegundos

⚠️ **CRÍTICO:** TTL é em **SEGUNDOS**, não milissegundos!

```typescript
// ✅ CORRETO: 10 minutos
await cache.set('key', value, 600);

// ❌ ERRADO: 10 milissegundos (expira imediatamente)
await cache.set('key', value, 10);

// Converter de ms para s
const ttlMs = 600000; // 10min em ms
await cache.set('key', value, ttlMs / 1000);
```

---

### delete(key: string)

Remove valor do cache Redis.

#### Comando Redis

```typescript
await cache.delete('key');
// → DEL key
```

#### Retorno

```typescript
Promise<number>
// 0: Chave não existia
// 1: Chave removida
```

#### Exemplos

```typescript
// Remover uma chave
const removed = await cache.delete('item:123');
console.log(`Removed: ${removed} keys`);

// Invalidação após update
await db.updateItem('123', newData);
await cache.delete('item:123');

// Idempotente
await cache.delete('key'); // 1
await cache.delete('key'); // 0
await cache.delete('key'); // 0
```

---

### flush()

Limpa **TODO** o Redis (database atual).

#### Comando Redis

```typescript
await cache.flush();
// → FLUSHALL
```

⚠️ **CUIDADO:** Extremamente destrutivo!

#### Comportamento

- Remove **TODAS** as chaves do database
- Afeta **TODAS** aplicações usando mesmo Redis/DB
- Operação atômica e rápida
- Não pode ser desfeito

#### Quando Usar

```typescript
// ✅ Testes (database separado)
beforeEach(async () => {
  await testCache.flush();
});

// ✅ Manutenção planejada
await cache.flush();
log.info('Redis limpo para manutenção');

// ❌ NUNCA em produção com tráfego alto
// Causa cache stampede massivo
```

#### Alternativa Segura

```typescript
// Remover apenas chaves da aplicação
const keys = await cache.keys('myapp:*');

for (const key of keys) {
  await cache.delete(key);
}
```

---

### keys(pattern?)

Lista chaves usando **SCAN** (seguro).

#### Parâmetros

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| **pattern** | `string` | `'*'` | Pattern Redis (wildcards) |

#### Algoritmo

```typescript
// Usa SCAN ao invés de KEYS
let cursor = '0';
const keys = [];

do {
  [cursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
  keys.push(...foundKeys);
} while (cursor !== '0');

return keys;
```

#### Exemplos

```typescript
// Todas chaves
const all = await cache.keys();

// Items apenas
const items = await cache.keys('item:*');
// ['item:123', 'item:456', 'item:789']

// Pattern complexo
const userProfiles = await cache.keys('user:*:profile');

// Contar por tipo
const itemCount = (await cache.keys('item:*')).length;
const userCount = (await cache.keys('user:*')).length;
```

#### Patterns Redis

| Pattern | Matches | Exemplo |
|---------|---------|---------|
| `*` | Qualquer sequência | `item:*` → `item:123`, `item:abc` |
| `?` | Um caractere | `item:?` → `item:1`, `item:a` |
| `[abc]` | a, b ou c | `item:[abc]` → `item:a`, `item:b` |
| `[a-z]` | Range | `item:[0-9]` → `item:0`, `item:9` |

---

### isReady()

Verifica se Redis está conectado e pronto.

#### Retorno

```typescript
Promise<boolean>
// true: Redis operacional
// false: Redis offline
```

#### Exemplos

```typescript
// Verificar antes de usar
if (await cache.isReady()) {
  await cache.set('key', value);
} else {
  log.warn('Redis offline, usando fallback');
}

// Health check
app.get('/health', async (req, res) => {
  res.json({
    redis: await cache.isReady() ? 'ok' : 'down'
  });
});

// Circuit breaker
let redisAvailable = true;

async function withCache<T>(key: string, fn: () => Promise<T>) {
  if (!redisAvailable) return fn();

  try {
    const cached = await cache.get<T>(key);
    if (cached) return cached;

    const result = await fn();
    await cache.set(key, result);
    return result;
  } catch (error) {
    redisAvailable = false;
    setTimeout(() => { redisAvailable = true; }, 60000);
    return fn();
  }
}
```

---

### close()

Fecha conexão com Redis graciosamente.

#### Comando Redis

```typescript
await cache.close();
// → QUIT
```

#### Comportamento

1. Aguarda comandos pendentes completarem
2. Envia `QUIT` ao Redis
3. Fecha socket TCP
4. Seta `ready = false`

#### Exemplos

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('Shutting down...');

  await cache.close();
  log.info('Redis closed');

  process.exit(0);
});

// Cleanup em testes
afterAll(async () => {
  await cache.close();
});
```

---

## 🔧 Métodos Extras

### ping()

Verifica conectividade e latência.

```typescript
const response = await cache.ping();
console.log(response); // 'PONG'

// Medir latência
const start = Date.now();
await cache.ping();
const latency = Date.now() - start;
console.log(`Latency: ${latency}ms`);
```

### info()

Retorna informações do servidor Redis.

```typescript
const info = await cache.info();
console.log(info);

// Exemplo de saída:
// # Server
// redis_version:6.2.6
// uptime_in_seconds:86400
//
// # Memory
// used_memory:1048576
// used_memory_human:1.00M
//
// # Stats
// total_connections_received:1000
// total_commands_processed:50000
```

### getClient()

Retorna cliente ioredis para operações avançadas.

```typescript
const redis = cache.getClient();

// Operações não cobertas pela interface
await redis.incr('counter');
await redis.lpush('queue', 'item');
await redis.expire('key', 3600);

// Pipelines
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.set('key3', 'value3');
await pipeline.exec();

// Pub/Sub
await redis.publish('channel', 'message');

// Transactions
const result = await redis.multi()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .exec();
```

---

## 🔄 Serialização JSON

### Processo

#### Serialização (SET)

```typescript
const value = { id: 123, name: 'John', createdAt: new Date() };

// JavaScript Object → JSON String
const serialized = JSON.stringify(value);
// → '{"id":123,"name":"John","createdAt":"2025-01-04T15:30:00.000Z"}'

await redis.set('key', serialized);
```

#### Deserialização (GET)

```typescript
const serialized = await redis.get('key');
// → '{"id":123,"name":"John","createdAt":"2025-01-04T15:30:00.000Z"}'

// JSON String → JavaScript Object
const value = JSON.parse(serialized);
// → { id: 123, name: 'John', createdAt: '2025-01-04T15:30:00.000Z' }
```

### Tipos Suportados

| Tipo JS | Serializado | Deserializado |
|---------|-------------|---------------|
| `number` | `123` | `123` ✅ |
| `string` | `"text"` | `"text"` ✅ |
| `boolean` | `true` | `true` ✅ |
| `null` | `null` | `null` ✅ |
| `Array` | `[1,2,3]` | `[1,2,3]` ✅ |
| `Object` | `{"a":1}` | `{"a":1}` ✅ |
| `Date` | `"2025-01-04..."` | `string` ⚠️ |
| `undefined` | Omitido | ❌ |
| `Function` | Omitido | ❌ |
| `Symbol` | Omitido | ❌ |

### Problema: Date vira String

```typescript
// Antes
const obj = { createdAt: new Date() };

// Após deserializar
const cached = await cache.get(key);
console.log(cached.createdAt); // string "2025-01-04..."
console.log(cached.createdAt instanceof Date); // false

// Solução: Converter manualmente
cached.createdAt = new Date(cached.createdAt);
```

### Problema: Objetos Circulares

```typescript
// ❌ ERRO: Circular reference
const obj: any = { name: 'Test' };
obj.self = obj;

await cache.set('key', obj);
// TypeError: Converting circular structure to JSON

// Solução: Remover referências circulares antes de cachear
delete obj.self;
await cache.set('key', obj);
```

---

## 🔍 SCAN vs KEYS

### Comparação

| Aspecto | SCAN | KEYS |
|---------|------|------|
| **Bloqueia Redis** | ❌ Não | ✅ Sim |
| **Performance** | 🟢 Constante | 🔴 O(N) |
| **Iterativo** | ✅ Cursor | ❌ Único comando |
| **Produção** | ✅ Seguro | ❌ Perigoso |
| **Duplicatas** | ⚠️ Possível | ❌ Não |

### KEYS (Perigoso)

```typescript
// ❌ KEYS bloqueia Redis até completar
const keys = await redis.keys('item:*');
// Com 1 milhão de chaves → 10+ segundos bloqueado!
```

**Problema:** Bloqueia todas outras operações.

### SCAN (Seguro)

```typescript
// ✅ SCAN é iterativo (não bloqueia)
let cursor = '0';
const keys = [];

do {
  [cursor, foundKeys] = await redis.scan(
    cursor,
    'MATCH', 'item:*',
    'COUNT', 100
  );
  keys.push(...foundKeys);
} while (cursor !== '0');
```

**Vantagem:** Redis continua respondendo outras requests.

### Nossa Implementação

```typescript
async keys(pattern = '*'): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, foundKeys] = await this.redis.scan(
      cursor,
      'MATCH', pattern,
      'COUNT', 100
    );

    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');

  return keys;
}
```

**COUNT 100:** Aproximadamente 100 chaves por iteração (não garantido).

---

## 💡 Exemplos Práticos

### Setup Básico

```typescript
import { RedisCacheAdapter } from './RedisCacheAdapter';

// Desenvolvimento
const cache = new RedisCacheAdapter('redis://localhost:6379');

// Produção
const cache = new RedisCacheAdapter({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0
}, 'Production-Redis');

export { cache };
```

### Cache de Sessões

```typescript
interface Session {
  userId: string;
  createdAt: Date;
  data: any;
}

async function saveSession(sessionId: string, session: Session) {
  await cache.set(`session:${sessionId}`, session, 1800); // 30min
}

async function getSession(sessionId: string): Promise<Session | null> {
  const session = await cache.get<Session>(`session:${sessionId}`);

  if (session) {
    // Converter Date
    session.createdAt = new Date(session.createdAt);
  }

  return session || null;
}

async function destroySession(sessionId: string) {
  await cache.delete(`session:${sessionId}`);
}
```

### Rate Limiting Distribuído

```typescript
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const redis = cache.getClient();

  // INCR é atômico
  const count = await redis.incr(key);

  if (count === 1) {
    // Primeira request: definir expiração
    await redis.expire(key, 60); // 1min window
  }

  return count <= 100; // Max 100 req/min
}

app.use(async (req, res, next) => {
  if (!await checkRateLimit(req.user.id)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
});
```

### Cache de Configuração

```typescript
interface AppConfig {
  apiUrl: string;
  features: string[];
}

async function getConfig(): Promise<AppConfig> {
  const cached = await cache.get<AppConfig>('config:app');
  if (cached) return cached;

  const config = await loadConfigFromFile();

  // TTL longo para config
  await cache.set('config:app', config, 3600);

  return config;
}

async function reloadConfig() {
  await cache.delete('config:app');
  return getConfig();
}
```

### Health Check Completo

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    redis: false,
    latency: 0
  };

  try {
    const start = Date.now();
    await cache.ping();
    checks.latency = Date.now() - start;
    checks.redis = await cache.isReady();
  } catch (error) {
    checks.redis = false;
  }

  res.json({
    status: checks.redis ? 'healthy' : 'degraded',
    checks
  });
});
```

---

## ✅ Boas Práticas

### 1. Use Namespacing

```typescript
// ✅ BOM: Prefixos claros
await cache.set('myapp:user:123', user);
await cache.set('myapp:item:456', item);

// ❌ RUIM: Sem namespace
await cache.set('123', user);
await cache.set('456', item);
```

### 2. TTL Sempre que Possível

```typescript
// ✅ BOM: TTL definido
await cache.set('key', value, 600);

// ❌ RUIM: Sem TTL (pode acumular)
await cache.set('key', value);
```

### 3. Tratamento de Erro Gracioso

```typescript
// ✅ BOM: Continua sem cache
async function getItem(id: string) {
  try {
    const cached = await cache.get(`item:${id}`);
    if (cached) return cached;
  } catch (error) {
    log.error('Cache error', error);
    // Continua para banco
  }

  return db.findItem(id);
}

// ❌ RUIM: Falha se cache offline
async function getItem(id: string) {
  const cached = await cache.get(`item:${id}`);
  if (cached) return cached;
  // Se cache.get() falhar, toda função falha
}
```

### 4. Verificar Ready em Críticos

```typescript
// ✅ BOM: Verifica antes
if (await cache.isReady()) {
  await cache.set('critical', data);
}

// ❌ RUIM: Assume que está pronto
await cache.set('critical', data);
```

### 5. Database Separado para Testes

```typescript
// ✅ BOM: DB separado
const testCache = new RedisCacheAdapter({
  host: 'localhost',
  port: 6379,
  db: 15 // Database de testes
});

// ❌ RUIM: Mesmo DB que produção
const testCache = new RedisCacheAdapter('redis://localhost:6379');
```

---

## ⚡ Performance

### Latência

| Cenário | Latência | Descrição |
|---------|----------|-----------|
| **Rede local** | 5-20ms | Redis no mesmo datacenter |
| **Rede WAN** | 50-200ms | Redis remoto |
| **Pipeline (10 ops)** | ~10ms | Batch de operações |

### Throughput

```
Single connection:  ~10.000 ops/s
Pipelining:         ~100.000 ops/s
Multiple clients:   ~500.000 ops/s
```

### Comparação com Memória

| Operação | Memory | Redis | Diferença |
|----------|--------|-------|-----------|
| **get** | ~1ms | ~5ms | **5x** |
| **set** | ~1ms | ~5ms | **5x** |
| **Throughput** | 10k ops/s | 10k ops/s | Similar |

### Otimizações

#### Pipelining

```typescript
// ❌ LENTO: Uma por vez
for (const key of keys) {
  await cache.set(key, value);
}
// 1000 keys × 5ms = 5 segundos

// ✅ RÁPIDO: Pipeline
const redis = cache.getClient();
const pipeline = redis.pipeline();

for (const key of keys) {
  pipeline.set(key, JSON.stringify(value));
}

await pipeline.exec();
// 1000 keys em ~50ms
```

#### Pooling de Conexões

```typescript
// ioredis já faz pooling automático
// Não precisa gerenciar manualmente
```

---

## 🔧 Troubleshooting

### Problema: Redis não conecta

**Sintomas:**
```typescript
await cache.isReady(); // false sempre
// Logs: "Redis erro: ECONNREFUSED"
```

**Verificações:**

1. **Redis está rodando?**
   ```bash
   # No servidor Redis
   redis-cli ping
   # Deve retornar: PONG
   ```

2. **Porta correta?**
   ```bash
   # Verificar porta
   netstat -an | grep 6379
   ```

3. **Firewall?**
   ```bash
   # Tentar conectar
   telnet localhost 6379
   ```

4. **Senha correta?**
   ```typescript
   // Verificar autenticação
   const cache = new RedisCacheAdapter({
     host: 'localhost',
     port: 6379,
     password: 'correct-password' // ✅
   });
   ```

---

### Problema: Performance lenta

**Sintomas:**
```typescript
const start = Date.now();
await cache.get('key');
const latency = Date.now() - start;
console.log(latency); // > 100ms
```

**Causas:**

1. **Rede lenta**
   ```bash
   # Medir latência
   redis-cli --latency -h redis.example.com
   ```

2. **Redis sobrecarregado**
   ```bash
   # Ver stats
   redis-cli INFO stats
   # instantaneous_ops_per_sec: ???
   ```

3. **Chaves muito grandes**
   ```typescript
   // Verificar tamanho
   const redis = cache.getClient();
   const size = await redis.memory('USAGE', 'key');
   console.log(`Size: ${size} bytes`);
   ```

**Soluções:**
- Mover Redis para mesma rede
- Escalar Redis (clustering)
- Reduzir tamanho dos valores
- Usar pipelining

---

### Problema: Memory leak

**Sintomas:**
```bash
redis-cli INFO memory
# used_memory: 5GB (crescendo)
```

**Diagnóstico:**
```typescript
const keys = await cache.keys('*');
console.log(`Total keys: ${keys.length}`);

// Verificar TTLs
const redis = cache.getClient();
for (const key of keys.slice(0, 10)) {
  const ttl = await redis.ttl(key);
  console.log(`${key}: TTL ${ttl}s`);
}
```

**Causas:**

1. **Sem TTL**
   ```typescript
   // ❌ Chaves sem expiração
   await cache.set('key', value);

   // ✅ Sempre definir TTL
   await cache.set('key', value, 3600);
   ```

2. **TTL muito longo**
   ```typescript
   // ❌ 30 dias é muito
   await cache.set('key', value, 2592000);

   // ✅ Razoável
   await cache.set('key', value, 3600);
   ```

**Solução:**
```bash
# Configurar maxmemory no Redis
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

**Última atualização:** 2025-10-07

_Budget: ~84k tokens restantes_ 💾