# Memory Cache Adapter - Documentação Completa

> **Módulo:** `shared/utils/cache/MemoryCacheAdapter`
> **Versão:** 1.0.0
> **Arquivo:** `src/shared/utils/cache/MemoryCacheAdapter.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Características](#características)
3. [Quando Usar](#quando-usar)
4. [Biblioteca node-cache](#biblioteca-node-cache)
5. [Classe MemoryCacheAdapter](#classe-memorycacheadapter)
6. [Métodos](#métodos)
7. [Estatísticas](#estatísticas)
8. [Performance](#performance)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Boas Práticas](#boas-práticas)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Implementa cache local utilizando a biblioteca **node-cache**, armazenando dados na memória RAM do processo Node.js.

### Propósito

Fornecer cache **ultra rápido** local para cada instância da aplicação, com acesso direto à memória sem latência de rede.

### Arquitetura

```
┌─────────────────────────────────────┐
│      MemoryCacheAdapter (L1)        │
├─────────────────────────────────────┤
│                                     │
│     ┌─────────────────────┐        │
│     │    node-cache       │        │
│     │   (biblioteca)      │        │
│     └─────────────────────┘        │
│              ↓                      │
│     ┌─────────────────────┐        │
│     │   Memória RAM       │        │
│     │   do processo       │        │
│     └─────────────────────┘        │
│                                     │
└─────────────────────────────────────┘
```

---

## ✨ Características

### Vantagens

| Característica | Descrição |
|----------------|-----------|
| ✅ **Ultra rápido** | ~1ms por operação (acesso direto à memória) |
| ✅ **Zero latência** | Sem rede envolvida |
| ✅ **Simples** | Não requer infraestrutura adicional |
| ✅ **Leve** | Biblioteca pequena e eficiente |
| ✅ **TTL automático** | Expiração e limpeza automáticas |
| ✅ **Type-safe** | Suporte completo a TypeScript generics |

### Desvantagens

| Limitação | Descrição |
|-----------|-----------|
| ❌ **Volátil** | Perde dados ao reiniciar processo |
| ❌ **Não compartilhado** | Cada instância tem cache próprio |
| ❌ **Limitado** | Usa memória RAM do servidor |
| ❌ **Single-instance** | Não funciona em load balanced sem L2 |

---

## 🎯 Quando Usar

### Casos de Uso Ideais

#### 1. Single-Instance Application

```typescript
// App com uma única instância
const cache = new MemoryCacheAdapter(300);

app.get('/items/:id', async (req, res) => {
  const cached = await cache.get(`item:${req.params.id}`);
  if (cached) return res.json(cached);

  // ... buscar do banco
});
```

#### 2. Cache L1 em Arquitetura em Camadas

```typescript
// L1 (memória) + L2 (Redis)
const l1 = new MemoryCacheAdapter(300);
const l2 = new RedisCacheAdapter();
const cache = new LayeredCacheAdapter(l1, l2);
```

#### 3. Desenvolvimento e Testes

```typescript
// Setup simples para dev
const cache = new MemoryCacheAdapter(60); // 1min TTL

// Testes isolados
beforeEach(async () => {
  await cache.flush();
});
```

#### 4. Hot Data em Produção

```typescript
// Dados muito acessados (hot data)
// Mesmo em multi-instance, reduz carga no L2
const hotCache = new MemoryCacheAdapter(300);

// Top 100 items mais vendidos
await hotCache.set('hot:top100', topItems, 600);
```

### Quando NÃO Usar

❌ **Load-balanced sem L2**
```typescript
// ❌ ERRADO: Cada instância tem cache diferente
// Instance 1: cache tem user:123
// Instance 2: cache não tem user:123 (inconsistência)
const cache = new MemoryCacheAdapter(300);
```

❌ **Dados críticos que não podem ser perdidos**
```typescript
// ❌ ERRADO: Cache volátil para dados críticos
await cache.set('payment:pending', paymentData);
// Restart → dados perdidos
```

❌ **Dados que precisam persistir**
```typescript
// ❌ ERRADO: Cache para persistência
await cache.set('user:sessions', sessions);
// Não persiste entre restarts
```

---

## 📚 Biblioteca node-cache

### Instalação

```bash
npm install node-cache
npm install --save-dev @types/node-cache
```

### Documentação Oficial

https://www.npmjs.com/package/node-cache

### Configurações Aplicadas

```typescript
new NodeCache({
  stdTTL: 300,        // TTL padrão: 5 minutos
  checkperiod: 120,   // Verifica expiração a cada 2 minutos
  useClones: false    // Não clona objetos (melhor performance)
});
```

#### stdTTL (Standard Time To Live)

**Propósito:** Tempo de vida padrão para chaves (segundos).

**Valores típicos:**
- Desenvolvimento: 60s (1min)
- Dados voláteis: 300s (5min)
- Dados estáveis: 3600s (1hora)

#### checkperiod

**Propósito:** Intervalo de verificação de expiração.

**Como funciona:**
- A cada N segundos, varre chaves expiradas
- Quanto menor, mais preciso, mas mais CPU usa
- Padrão: 120s (bom equilíbrio)

**Exemplo:**
```typescript
// Chave expira às 10:05:00
// checkperiod: 120s
// Remoção real: entre 10:05:00 e 10:07:00
```

#### useClones

**Propósito:** Define se objetos são clonados ao retornar.

**useClones: true** (padrão node-cache)
```typescript
const obj = await cache.get('key');
obj.name = 'Modified';
// Não afeta cache (trabalha com clone)
```

**useClones: false** (nossa escolha)
```typescript
const obj = await cache.get('key');
obj.name = 'Modified';
// ⚠️ AFETA CACHE (retorna referência)
```

**Por que false?**
- ✅ **Performance:** Sem overhead de clonagem
- ✅ **Memória:** Não duplica objetos
- ⚠️ **Cuidado:** Tratar como read-only

---

## 🏗️ Classe MemoryCacheAdapter

### Constructor

```typescript
constructor(stdTTL: number = 300, name: string = 'L1-Memory')
```

**Parâmetros:**

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| **stdTTL** | `number` | `300` | TTL padrão em segundos |
| **name** | `string` | `'L1-Memory'` | Nome para logging |

**Exemplos:**

```typescript
// Cache padrão (5min)
const cache = new MemoryCacheAdapter();

// Cache com TTL customizado
const shortCache = new MemoryCacheAdapter(60); // 1min
const longCache = new MemoryCacheAdapter(3600); // 1hora

// Cache com nome customizado
const itemCache = new MemoryCacheAdapter(300, 'Items-Cache');
```

---

## 📚 Métodos

### get<T>(key: string)

Busca valor no cache de memória.

#### Comportamento

1. Busca chave no node-cache
2. Se encontrado e não expirado: retorna valor (HIT)
3. Se não encontrado ou expirado: retorna undefined (MISS)
4. Loga resultado em debug

#### Performance

- **Complexidade:** O(1) - tempo constante
- **Latência:** ~1ms típico
- **Operação:** Síncrona internamente

#### Retorno

```typescript
Promise<T | undefined>
```

#### Exemplos

```typescript
// Busca básica
const item = await cache.get<Item>('item:123');

if (item) {
  console.log('Cache HIT:', item);
} else {
  console.log('Cache MISS');
}

// Pattern Cache-Aside
async function getItem(id: string): Promise<Item> {
  const cached = await cache.get<Item>(`item:${id}`);
  if (cached) return cached;

  const item = await db.findItem(id);
  await cache.set(`item:${id}`, item);

  return item;
}

// Type safety
interface User {
  id: string;
  name: string;
}

const user = await cache.get<User>('user:123');
// TypeScript sabe que é User | undefined
```

#### Pontos Críticos

⚠️ **Retorna referência direta** (useClones: false)
```typescript
const item = await cache.get<Item>('item:123');

// ❌ ERRADO: Modificar objeto retornado
item.name = 'Modified';
// Modifica cache diretamente!

// ✅ CORRETO: Tratar como read-only
const itemCopy = { ...item };
itemCopy.name = 'Modified';
```

⚠️ **undefined ambíguo**
```typescript
const value = await cache.get('key'); // undefined

// Pode significar:
// 1. Chave não existe
// 2. Chave expirou
// 3. Erro ao buscar

// Não é possível diferenciar
```

---

### set<T>(key, value, ttl?)

Armazena valor no cache de memória.

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| **key** | `string` | Sim | Chave única |
| **value** | `T` | Sim | Valor a armazenar |
| **ttl** | `number` | Não | TTL em segundos |

#### Comportamento

1. Se TTL fornecido: usa TTL específico
2. Se não: usa TTL padrão do construtor
3. Sobrescreve valor se chave já existe
4. Retorna true/false

#### Retorno

```typescript
Promise<boolean>
```

#### Exemplos

```typescript
// TTL específico
await cache.set('item:123', item, 600); // 10min

// TTL padrão
await cache.set('temp:data', data);

// TTL de 1 hora
await cache.set('config:app', config, 3600);

// Verificar sucesso
const ok = await cache.set('key', value);
if (!ok) {
  log.error('Failed to cache');
}

// Sobrescrever
await cache.set('counter', 0);
await cache.set('counter', 1); // Sobrescreve
```

#### TTL em Segundos

⚠️ **IMPORTANTE:** TTL é em **SEGUNDOS**, não milissegundos!

```typescript
// ✅ CORRETO: 10 minutos
await cache.set('key', value, 600);

// ❌ ERRADO: 10 milissegundos (expira imediatamente)
await cache.set('key', value, 10);

// Converter de ms para segundos
const ttlMs = 600000; // 10min em ms
await cache.set('key', value, ttlMs / 1000);
```

#### Pontos Críticos

⚠️ **Objetos armazenados por referência**
```typescript
const user = { id: '123', name: 'John' };
await cache.set('user:123', user);

// Modificar objeto original afeta cache
user.name = 'Jane';
const cached = await cache.get('user:123');
console.log(cached.name); // 'Jane' (modificado!)

// Solução: Clonar antes de armazenar
await cache.set('user:123', { ...user });
```

⚠️ **Limite de memória**
```typescript
// Objetos grandes consomem muita RAM
const bigData = generateHugeArray(); // 100MB
await cache.set('big', bigData); // Pode causar OOM

// Solução: Limitar tamanho ou comprimir
if (JSON.stringify(bigData).length < 1000000) {
  await cache.set('data', bigData);
}
```

---

### delete(key: string)

Remove valor do cache.

#### Retorno

```typescript
Promise<number> // 0 ou 1
```

#### Comportamento

- Retorna `1` se removido
- Retorna `0` se não existia
- Operação é idempotente

#### Exemplos

```typescript
// Remover item
const removed = await cache.delete('item:123');
console.log(`Removed: ${removed} keys`); // 1 ou 0

// Invalidação após update
await db.updateItem('123', newData);
await cache.delete('item:123');

// Idempotente
await cache.delete('key'); // 1
await cache.delete('key'); // 0
await cache.delete('key'); // 0
```

#### Limitações

⚠️ **Não suporta wildcard**
```typescript
// ❌ NÃO FUNCIONA: Wildcard não suportado
await cache.delete('item:*');

// ✅ SOLUÇÃO: Loop ou flush
const keys = await cache.keys('item:*');
for (const key of keys) {
  await cache.delete(key);
}

// Ou flush tudo
await cache.flush();
```

---

### flush()

Limpa todo o cache.

#### Comportamento

- Remove **TODAS** as chaves
- Operação destrutiva e irreversível
- Libera memória ocupada
- Reseta estatísticas internas

#### Exemplos

```typescript
// Limpar em testes
beforeEach(async () => {
  await cache.flush();
});

// Limpar em deploy
await cache.flush();
log.info('Cache limpo');

// Limpar após reload de config
await reloadConfig();
await cache.flush();
```

#### Cuidados

⚠️ **Cache Stampede**
```typescript
// ❌ PERIGOSO em produção com tráfego alto
await cache.flush();
// 1000 requests simultâneos → 1000 queries ao banco

// ✅ MELHOR: Invalidação seletiva
await cache.delete('config:*');
```

---

### keys(pattern?)

Lista chaves no cache.

#### Parâmetros

| Parâmetro | Tipo | Opcional | Descrição |
|-----------|------|----------|-----------|
| **pattern** | `string` | Sim | Pattern com wildcard `*` |

#### Retorno

```typescript
Promise<string[]>
```

#### Pattern Matching

```typescript
// Converte * para regex
'item:*'           → /^item:.*$/
'user:*:profile'   → /^user:.*:profile$/
'GET:*'            → /^GET:.*$/
```

#### Exemplos

```typescript
// Todas chaves
const all = await cache.keys();
console.log(`Total: ${all.length}`);

// Items apenas
const items = await cache.keys('item:*');
// ['item:123', 'item:456', 'item:789']

// Queries GET
const gets = await cache.keys('GET:*');
// ['GET:/api/items', 'GET:/api/users']

// Pattern complexo
const profiles = await cache.keys('user:*:profile');
// ['user:123:profile', 'user:456:profile']
```

#### Performance

⚠️ **Operação O(n)**
```typescript
// Varre TODAS as chaves
const keys = await cache.keys('item:*');

// Pode ser lenta com > 10k chaves
// Não usar em hot path de produção
```

#### Uso Recomendado

```typescript
// ✅ BOM: Admin/debug endpoint
app.get('/admin/cache/keys', async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send();

  const keys = await cache.keys(req.query.pattern);
  res.json({ count: keys.length, keys });
});

// ❌ RUIM: Hot path de produção
app.get('/api/items', async (req, res) => {
  const keys = await cache.keys('item:*');
  // ... usa keys ...
});
```

---

### isReady()

Verifica disponibilidade do cache.

#### Retorno

```typescript
Promise<boolean>
```

#### Comportamento

- **Sempre retorna `true`** para memory cache
- Memória sempre disponível enquanto processo roda
- Implementado para compatibilidade com interface

#### Exemplos

```typescript
// Sempre true
const ready = await cache.isReady(); // true

// Health check
app.get('/health', async (req, res) => {
  res.json({
    cache: await cache.isReady() ? 'ok' : 'down'
  });
});

// Comparação com Redis
const l1Ready = await memCache.isReady(); // true
const l2Ready = await redisCache.isReady(); // pode ser false
```

---

### close()

Fecha cache e libera recursos.

#### Comportamento

- Para timer de verificação de expiração
- Limpa todos dados do cache
- Libera memória
- Usado em graceful shutdown

#### Exemplos

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('Shutting down...');
  await cache.close();
  process.exit(0);
});

// Cleanup em testes
afterAll(async () => {
  await cache.close();
});

// Restart manual
await cache.close();
cache = new MemoryCacheAdapter(300);
```

#### Importância

```typescript
// ✅ BOM: Fecha cache antes de sair
afterAll(async () => {
  await cache.close();
});

// ❌ RUIM: Não fecha cache
afterAll(() => {
  // Deixa timers rodando → memory leak em testes
});
```

---

### getStats()

Retorna estatísticas do cache.

#### Retorno

```typescript
{
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
}
```

#### Cálculo

```typescript
hitRate = (hits / (hits + misses)) * 100
```

#### Exemplos

```typescript
const stats = cache.getStats();

console.log(`Hit Rate: ${stats.hitRate}%`);
console.log(`Total Keys: ${stats.keys}`);
console.log(`Hits: ${stats.hits}`);
console.log(`Misses: ${stats.misses}`);

// Alertar hit rate baixo
if (stats.hitRate < 50) {
  log.warn('Cache hit rate baixo', stats);
}

// Monitorar tamanho
if (stats.keys > 10000) {
  log.warn('Muitas chaves em cache', stats);
}

// Monitoramento periódico
setInterval(() => {
  const stats = cache.getStats();
  log.info('Cache metrics', stats);
}, 60000);
```

---

## 📊 Estatísticas

### Métricas

| Métrica | Descrição | Tipo |
|---------|-----------|------|
| **hits** | Número de cache hits | Counter |
| **misses** | Número de cache misses | Counter |
| **keys** | Total de chaves no cache | Gauge |
| **hitRate** | Taxa de acerto (%) | Calculated |

### Interpretação

| Hit Rate | Classificação | Ação |
|----------|---------------|------|
| **> 80%** | 🟢 Excelente | Manter estratégia |
| **50-80%** | 🟡 Bom | Monitorar |
| **< 50%** | 🔴 Ruim | Revisar TTL/estratégia |

### Monitoramento

```typescript
// Dashboard de métricas
app.get('/metrics/cache', (req, res) => {
  const stats = cache.getStats();

  res.json({
    ...stats,
    status: stats.hitRate > 50 ? 'healthy' : 'degraded',
    memoryUsage: process.memoryUsage().heapUsed,
    recommendation: stats.hitRate < 50
      ? 'Increase TTL or review caching strategy'
      : 'Cache performing well'
  });
});
```

---

## ⚡ Performance

### Benchmarks

| Operação | Latência | Throughput |
|----------|----------|------------|
| **get** | ~1ms | 10.000 ops/s |
| **set** | ~1ms | 10.000 ops/s |
| **delete** | ~1ms | 10.000 ops/s |
| **keys** | ~10ms (10k keys) | - |

### Comparação

| Cache | Latência | Shared | Persistent |
|-------|----------|--------|------------|
| **Memory** | ~1ms | ❌ | ❌ |
| **Redis** | ~5ms | ✅ | ✅ |
| **Layered (L1 hit)** | ~1ms | ✅ | ✅ |

### Consumo de Memória

```typescript
// Exemplo de uso
// 1000 items @ 10KB cada = ~10MB
// Aceitável para maioria dos casos

// Monitorar uso
const stats = cache.getStats();
const memUsage = process.memoryUsage();

console.log(`Keys: ${stats.keys}`);
console.log(`Heap: ${memUsage.heapUsed / 1024 / 1024} MB`);
```

---

## 💡 Exemplos Práticos

### Setup Básico

```typescript
import { MemoryCacheAdapter } from './MemoryCacheAdapter';

// Cache padrão
const cache = new MemoryCacheAdapter(300, 'MainCache');

export { cache };
```

### Cache de Items

```typescript
interface Item {
  id: string;
  name: string;
  price: number;
}

async function getItem(id: string): Promise<Item | null> {
  const cacheKey = `item:${id}`;

  // Tentar cache
  const cached = await cache.get<Item>(cacheKey);
  if (cached) return cached;

  // Buscar banco
  const item = await db.items.findById(id);
  if (!item) return null;

  // Armazenar
  await cache.set(cacheKey, item, 600);

  return item;
}
```

### Cache de Queries

```typescript
async function searchItems(query: string): Promise<Item[]> {
  const cacheKey = `search:${query}`;

  const cached = await cache.get<Item[]>(cacheKey);
  if (cached) return cached;

  const results = await db.items.search(query);

  // TTL menor para queries (dados podem mudar)
  await cache.set(cacheKey, results, 120);

  return results;
}
```

### Cache de Configuração

```typescript
interface AppConfig {
  apiUrl: string;
  timeout: number;
  features: string[];
}

async function getConfig(): Promise<AppConfig> {
  const cached = await cache.get<AppConfig>('config:app');
  if (cached) return cached;

  const config = await loadConfigFromFile();

  // TTL longo para config (muda raramente)
  await cache.set('config:app', config, 3600);

  return config;
}

// Invalidar ao recarregar
async function reloadConfig() {
  await cache.delete('config:app');
  return getConfig();
}
```

### Rate Limiting

```typescript
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;

  let count = await cache.get<number>(key) || 0;
  count++;

  await cache.set(key, count, 60); // 1min window

  return count <= 100; // Max 100 req/min
}

app.use(async (req, res, next) => {
  if (!await checkRateLimit(req.user.id)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
});
```

---

## ✅ Boas Práticas

### 1. Sempre Use TTL

```typescript
// ✅ BOM: Com TTL
await cache.set('key', value, 300);

// ❌ RUIM: Sem TTL (pode acumular)
await cache.set('key', value);
```

### 2. Namespacing de Chaves

```typescript
// ✅ BOM: Namespace claro
await cache.set('item:123', item);
await cache.set('user:456', user);

// ❌ RUIM: Sem namespace
await cache.set('123', item);
await cache.set('456', user);
```

### 3. Tratar Objetos como Read-Only

```typescript
// ✅ BOM: Clonar antes de modificar
const item = await cache.get<Item>('item:123');
const modified = { ...item, name: 'New' };

// ❌ RUIM: Modificar objeto retornado
const item = await cache.get<Item>('item:123');
item.name = 'New'; // Modifica cache!
```

### 4. Invalidação Ativa

```typescript
// ✅ BOM: Invalidar ao atualizar
async function updateItem(id: string, data: Partial<Item>) {
  const item = await db.items.update(id, data);
  await cache.delete(`item:${id}`);
  return item;
}

// ❌ RUIM: Deixar expirar naturalmente
async function updateItem(id: string, data: Partial<Item>) {
  return db.items.update(id, data);
  // Cache fica desatualizado até expirar
}
```

### 5. Monitorar Estatísticas

```typescript
// ✅ BOM: Monitoramento ativo
setInterval(() => {
  const stats = cache.getStats();
  if (stats.hitRate < 50) {
    log.warn('Low hit rate', stats);
  }
}, 60000);

// ❌ RUIM: Sem monitoramento
// Cache pode estar ineficaz
```

---

## 🔧 Troubleshooting

### Problema: Memory Leak

**Sintomas:**
```typescript
const stats = cache.getStats();
console.log(`Keys: ${stats.keys}`); // Crescendo indefinidamente
```

**Causas:**

1. **Sem TTL**
   ```typescript
   // ❌ Chaves sem TTL nunca expiram
   await cache.set('key', value);

   // ✅ Sempre definir TTL
   await cache.set('key', value, 300);
   ```

2. **Chaves únicas por request**
   ```typescript
   // ❌ Cada request gera chave nova
   await cache.set(`query:${userId}:${timestamp}`, data);

   // ✅ Chaves reutilizáveis
   await cache.set(`query:${userId}`, data);
   ```

**Solução:**
```typescript
// Limitar tamanho do cache
if (stats.keys > 10000) {
  await cache.flush();
}

// Ou definir maxKeys (se node-cache suportar)
```

---

### Problema: Cache Ineficaz (Low Hit Rate)

**Diagnóstico:**
```typescript
const stats = cache.getStats();
console.log(`Hit Rate: ${stats.hitRate}%`); // < 30%
```

**Causas:**

1. **TTL muito curto**
   ```typescript
   // ❌ Expira muito rápido
   await cache.set('key', value, 10);

   // ✅ TTL adequado
   await cache.set('key', value, 300);
   ```

2. **Dados não são reutilizados**
   ```typescript
   // Verificar distribuição de acessos
   const keys = await cache.keys();
   // Se cada chave tem 1 acesso, cache não ajuda
   ```

---

### Problema: High Memory Usage

**Diagnóstico:**
```typescript
const mem = process.memoryUsage();
console.log(`Heap: ${mem.heapUsed / 1024 / 1024} MB`);
```

**Soluções:**

1. **Reduzir TTL**
   ```typescript
   // Menos tempo = menos dados acumulados
   const cache = new MemoryCacheAdapter(60); // 1min
   ```

2. **Limitar tamanho dos valores**
   ```typescript
   // Só cachear se pequeno
   if (JSON.stringify(data).length < 100000) {
     await cache.set(key, data);
   }
   ```

3. **Flush periódico**
   ```typescript
   // Limpar a cada hora
   setInterval(() => {
     cache.flush();
   }, 3600000);
   ```

---

**Última atualização:** 2025-10-07