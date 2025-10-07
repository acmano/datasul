# Cache Adapter - Documentação Completa

> **Módulo:** `shared/utils/cache/CacheAdapter`
> **Versão:** 1.0.0
> **Arquivo:** `src/shared/utils/cache/CacheAdapter.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Propósito](#propósito)
3. [Padrões de Projeto](#padrões-de-projeto)
4. [Implementações Disponíveis](#implementações-disponíveis)
5. [Interface CacheAdapter](#interface-cacheadapter)
6. [Interface CacheStats](#interface-cachestats)
7. [Boas Práticas](#boas-práticas)
8. [Exemplos de Uso](#exemplos-de-uso)
9. [Comparação de Implementações](#comparação-de-implementações)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Define contrato padrão para implementações de cache, permitindo trocar backend (memória, Redis, etc) sem modificar código da aplicação.

### Benefícios

- ✅ **Abstração:** Troca de backend sem alterar código
- ✅ **Testabilidade:** Facilita mocks e testes
- ✅ **Flexibilidade:** Suporta múltiplas estratégias
- ✅ **Consistência:** Interface única para todos adapters
- ✅ **Escalabilidade:** Suporta cache em camadas (L1 + L2)

---

## 🎨 Propósito

### Problema

Sem abstração de cache:

```typescript
// ❌ Código acoplado ao Redis
import Redis from 'ioredis';

const redis = new Redis();

// Código específico do Redis em toda aplicação
await redis.set('key', JSON.stringify(value));
const data = JSON.parse(await redis.get('key'));
```

**Problemas:**
- Difícil trocar de Redis para memória
- Impossível testar sem Redis rodando
- Lógica de serialização espalhada
- Sem type safety

### Solução

Com CacheAdapter:

```typescript
// ✅ Código desacoplado
const cache: CacheAdapter = getCacheAdapter();

// Interface consistente
await cache.set('key', value);
const data = await cache.get<MyType>('key');
```

**Benefícios:**
- Trocar implementação via config
- Testar com mock ou memória
- Serialização automática
- Type safety com generics

---

## 🏗️ Padrões de Projeto

### Strategy Pattern

Permite escolher algoritmo/implementação em runtime.

```typescript
// Diferentes estratégias
const strategies = {
  memory: new MemoryCacheAdapter(300),
  redis: new RedisCacheAdapter(),
  layered: new LayeredCacheAdapter()
};

// Escolher em runtime
const cache: CacheAdapter = strategies[config.cacheType];
```

### Adapter Pattern

Adapta diferentes backends para interface única.

```typescript
// Backend 1: Redis
class RedisCacheAdapter implements CacheAdapter {
  async get<T>(key: string) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : undefined;
  }
}

// Backend 2: Memória
class MemoryCacheAdapter implements CacheAdapter {
  async get<T>(key: string) {
    return this.store.get(key);
  }
}

// Mesma interface, backends diferentes
```

---

## 🔌 Implementações Disponíveis

### 1. MemoryCacheAdapter (L1)

**Uso:** Cache local em memória.

**Características:**
- ✅ Muito rápido (acesso direto)
- ✅ Zero latência de rede
- ✅ Não requer serviço externo
- ❌ Não compartilhado entre instâncias
- ❌ Perdido em restart
- ❌ Limitado pela RAM disponível

**Quando usar:**
- Desenvolvimento local
- Single instance
- Dados frequentes e pequenos
- Cache temporário (sessões)

**Exemplo:**
```typescript
const cache = new MemoryCacheAdapter(300); // 300s TTL padrão
```

### 2. RedisCacheAdapter (L2)

**Uso:** Cache distribuído via Redis.

**Características:**
- ✅ Compartilhado entre instâncias
- ✅ Persistência opcional
- ✅ Escalável horizontalmente
- ✅ Suporta wildcards e patterns
- ❌ Latência de rede (~1-5ms)
- ❌ Requer serviço Redis

**Quando usar:**
- Produção multi-instância
- Dados compartilhados
- Cache persistente
- Alto volume

**Exemplo:**
```typescript
const cache = new RedisCacheAdapter({
  host: 'redis.example.com',
  port: 6379
});
```

### 3. LayeredCacheAdapter (L1 + L2)

**Uso:** Cache em duas camadas (memória + Redis).

**Características:**
- ✅ Melhor de dois mundos
- ✅ L1 para hot data (rápido)
- ✅ L2 para cold data (compartilhado)
- ✅ Otimiza latência e hit rate
- ❌ Complexidade adicional
- ❌ Sincronização entre camadas

**Quando usar:**
- Produção de alta performance
- Dados muito acessados
- Necessita baixa latência
- Múltiplas instâncias

**Exemplo:**
```typescript
const l1 = new MemoryCacheAdapter(60);
const l2 = new RedisCacheAdapter();
const cache = new LayeredCacheAdapter(l1, l2);
```

---

## 📚 Interface CacheAdapter

### Métodos Obrigatórios

| Método | Retorno | Propósito |
|--------|---------|-----------|
| **get** | `Promise<T \| undefined>` | Buscar valor |
| **set** | `Promise<boolean>` | Armazenar valor |
| **delete** | `Promise<number>` | Remover valor |
| **flush** | `Promise<void>` | Limpar tudo |
| **keys** | `Promise<string[]>` | Listar chaves |
| **isReady** | `Promise<boolean>` | Verificar disponibilidade |
| **close** | `Promise<void>` | Fechar conexões |

### get<T>(key: string)

Busca valor no cache.

#### Comportamento

- ✅ Retorna valor se encontrado e não expirado
- ✅ Retorna `undefined` se não encontrado ou expirado
- ✅ Não lança exceções (retorna `undefined` em erro)

#### Exemplo

```typescript
// Uso básico
const user = await cache.get<User>('user:123');
if (user) {
  console.log('Cache HIT:', user);
} else {
  console.log('Cache MISS');
  const user = await database.findUser(123);
  await cache.set('user:123', user, 600);
}
```

#### Padrão Cache-Aside

```typescript
async function getUser(id: string): Promise<User> {
  // 1. Tentar cache
  const cached = await cache.get<User>(`user:${id}`);
  if (cached) return cached;

  // 2. Buscar banco
  const user = await database.findUser(id);

  // 3. Armazenar no cache
  await cache.set(`user:${id}`, user, 600);

  return user;
}
```

#### Type Safety

```typescript
interface User {
  id: string;
  name: string;
}

// ✅ Type-safe
const user = await cache.get<User>('user:123');
console.log(user?.name); // TypeScript sabe que é User | undefined

// ❌ Sem type safety
const data = await cache.get('user:123'); // any
console.log(data.name); // Pode quebrar em runtime
```

---

### set<T>(key: string, value: T, ttl?: number)

Armazena valor no cache.

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| **key** | `string` | Sim | Chave única (ex: 'item:123') |
| **value** | `T` | Sim | Valor a armazenar |
| **ttl** | `number` | Não | Tempo de vida em **SEGUNDOS** |

#### Comportamento

- ✅ Sobrescreve valor existente
- ✅ TTL opcional (usa padrão se não fornecido)
- ✅ Serializa automaticamente objetos
- ✅ Retorna `true` em sucesso, `false` em falha

#### Exemplos

```typescript
// Com TTL específico
await cache.set('item:123', item, 600); // 10 minutos

// Com TTL padrão
await cache.set('temp:data', data); // Usa TTL do adapter

// Verificar sucesso
const success = await cache.set('key', value);
if (!success) {
  log.warn('Falha ao armazenar no cache');
}
```

#### TTL: Segundos vs Milissegundos

⚠️ **IMPORTANTE:** TTL é em **SEGUNDOS**, não milissegundos!

```typescript
// ✅ CORRETO: 10 minutos
await cache.set('key', value, 600);

// ❌ ERRADO: 10 milissegundos (expira imediatamente)
await cache.set('key', value, 10);
```

#### Serialização

```typescript
// Objetos são serializados automaticamente
const user = { id: 123, name: 'John' };
await cache.set('user:123', user);

// ❌ ERRO: Objetos circulares não funcionam
const circular: any = { name: 'Test' };
circular.self = circular;
await cache.set('circular', circular); // Erro: Converting circular structure
```

---

### delete(key: string)

Remove valor do cache.

#### Comportamento

- ✅ Remove chave especificada
- ✅ Retorna número de chaves removidas
- ✅ Retorna `0` se chave não existia
- ✅ Suporta wildcard em algumas implementações

#### Exemplos

```typescript
// Remover uma chave
const removed = await cache.delete('item:123');
console.log(`Removidas ${removed} chaves`); // 1

// Remover chave inexistente
const removed = await cache.delete('nao-existe');
console.log(`Removidas ${removed} chaves`); // 0

// Wildcard (Redis)
const removed = await cache.delete('item:*');
console.log(`Removidas ${removed} chaves`); // 50
```

#### Invalidação em Cascata

```typescript
// Invalidar item e dados relacionados
async function invalidateItem(itemId: string) {
  await cache.delete(`item:${itemId}`);
  await cache.delete(`item:${itemId}:details`);
  await cache.delete(`item:${itemId}:related`);
}

// Invalidar com wildcard
async function invalidateItemFamily(itemId: string) {
  await cache.delete(`item:${itemId}*`);
}
```

---

### flush()

Limpa todo o cache.

#### Comportamento

- ⚠️ Remove **TODAS** as chaves
- ⚠️ Operação destrutiva e irreversível
- ⚠️ Pode causar "cache stampede"

#### Quando Usar

```typescript
// ✅ Durante deploy/restart
await cache.flush();
log.info('Cache limpo para deploy');

// ✅ Em testes
afterEach(async () => {
  await cache.flush();
});

// ❌ EVITE em produção durante tráfego alto
// Causa cache stampede (todas queries vão ao banco)
```

#### Cache Stampede

**Problema:**
```
1. cache.flush() → Cache vazio
2. 1000 requests simultâneos → Todos fazem cache.get()
3. Todos retornam undefined (cache miss)
4. 1000 queries simultâneas ao banco
5. Banco sobrecarregado → Lentidão/crash
```

**Solução:**
```typescript
// Invalidação seletiva ao invés de flush
await cache.delete('item:*');

// Ou warm-up após flush
await cache.flush();
await warmUpCache(); // Pré-popula dados críticos
```

---

### keys(pattern?: string)

Lista chaves em cache.

#### Comportamento

- ✅ Sem pattern: retorna **todas** as chaves
- ✅ Com pattern: retorna chaves que correspondem
- ✅ Pattern suporta wildcard (`*`)

#### Exemplos

```typescript
// Listar todas chaves
const all = await cache.keys();
console.log(`Total: ${all.length} chaves`);

// Listar chaves específicas
const items = await cache.keys('item:*');
console.log(`Items em cache: ${items.length}`);

// Listar por namespace
const queries = await cache.keys('GET:*');
console.log(`Queries GET: ${queries.length}`);
```

#### Performance

⚠️ **CUIDADO:** Operação pode ser custosa com muitas chaves.

```typescript
// ❌ EVITE em produção de alta frequência
app.get('/api/cache/list', async (req, res) => {
  const keys = await cache.keys(); // Pode travar com 100k+ chaves
  res.json(keys);
});

// ✅ Use apenas para debug/admin
app.get('/admin/cache/debug', async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send();
  const keys = await cache.keys();
  res.json({ count: keys.length, sample: keys.slice(0, 100) });
});
```

#### Redis: SCAN vs KEYS

```typescript
// ❌ KEYS: Bloqueia Redis até completar
const keys = await redis.keys('*');

// ✅ SCAN: Iterativo, não bloqueia
const stream = redis.scanStream({ match: 'item:*' });
const keys: string[] = [];
stream.on('data', (batch) => keys.push(...batch));
```

---

### isReady()

Verifica se cache está disponível.

#### Comportamento

- ✅ `true`: Cache funcionando normalmente
- ✅ `false`: Cache indisponível

#### Exemplos

```typescript
// Verificar antes de usar
if (await cache.isReady()) {
  const data = await cache.get('key');
} else {
  log.warn('Cache indisponível, usando banco diretamente');
  const data = await database.query();
}

// Health check
app.get('/health', async (req, res) => {
  const cacheReady = await cache.isReady();
  res.json({
    status: cacheReady ? 'healthy' : 'degraded',
    cache: cacheReady ? 'ok' : 'down'
  });
});
```

#### Circuit Breaker

```typescript
let cacheAvailable = true;

async function getCached<T>(key: string): Promise<T | undefined> {
  if (!cacheAvailable) {
    return undefined; // Skip cache
  }

  try {
    return await cache.get<T>(key);
  } catch (error) {
    cacheAvailable = false;
    setTimeout(() => { cacheAvailable = true; }, 60000); // Retry após 1min
    return undefined;
  }
}
```

---

### close()

Fecha conexão com cache.

#### Comportamento

- ✅ Fecha conexões de rede (Redis)
- ✅ Libera recursos (timers, listeners)
- ⚠️ Após close, cache não pode ser usado

#### Exemplos

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('Recebido SIGTERM, iniciando shutdown...');

  // Parar de aceitar novas requisições
  server.close();

  // Fechar cache
  await cache.close();
  log.info('Cache fechado com sucesso');

  process.exit(0);
});

// Cleanup em testes
afterAll(async () => {
  await cache.close();
});
```

#### Ordem de Shutdown

```typescript
async function gracefulShutdown() {
  log.info('Iniciando graceful shutdown...');

  // 1. Parar de aceitar novas conexões
  await server.close();

  // 2. Aguardar requisições em andamento
  await waitForActiveRequests();

  // 3. Fechar conexões externas
  await cache.close();
  await database.close();

  // 4. Finalizar
  log.info('Shutdown completo');
  process.exit(0);
}
```

---

## 📊 Interface CacheStats

Estatísticas de cache (opcional).

### Interface

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memoryUsage?: number;
}
```

### Campos

#### hits

Número de cache hits (valor encontrado).

```typescript
// Cada get() bem-sucedido incrementa hits
const data = await cache.get('key'); // Hit
stats.hits++; // 1
```

#### misses

Número de cache misses (valor não encontrado).

```typescript
// Cada get() que retorna undefined incrementa misses
const data = await cache.get('nao-existe'); // Miss
stats.misses++; // 1
```

#### hitRate

Taxa de acerto em porcentagem.

**Cálculo:**
```typescript
hitRate = (hits / (hits + misses)) * 100
```

**Valores esperados:**

| Hit Rate | Classificação | Ação |
|----------|---------------|------|
| **> 80%** | 🟢 Excelente | Manter estratégia |
| **50-80%** | 🟡 Bom | Monitorar |
| **< 50%** | 🔴 Ruim | Revisar TTL/estratégia |

#### keys

Número total de chaves em cache.

**Alertas:**
- Crescimento descontrolado → memory leak
- Muitas chaves → impacto em performance

#### memoryUsage

Uso de memória em bytes (opcional).

**Disponibilidade:**
- ✅ MemoryCacheAdapter: Implementa
- ✅ RedisCacheAdapter: Pode implementar via `INFO`
- ✅ LayeredCacheAdapter: Soma L1 + L2

### Uso

```typescript
// Obter estatísticas
const stats: CacheStats = await cache.getStats();

console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`Total Keys: ${stats.keys}`);
console.log(`Memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

// Monitoramento
setInterval(async () => {
  const stats = await cache.getStats();

  if (stats.hitRate < 50) {
    log.warn('Cache hit rate baixo', stats);
  }

  if (stats.keys > 10000) {
    log.warn('Muitas chaves em cache', stats);
  }
}, 60000); // A cada minuto
```

---

## ✅ Boas Práticas

### 1. Namespacing de Chaves

Use prefixos consistentes para organizar chaves.

```typescript
// ✅ BOM: Namespace claro
'user:123'
'item:7530110'
'query:GET:/api/items'

// ❌ RUIM: Sem namespace
'123'
'7530110'
'api_items'
```

### 2. TTL Apropriado

Ajuste TTL baseado em volatilidade dos dados.

```typescript
// Dados estáticos: TTL longo
await cache.set('config:app', config, 3600); // 1 hora

// Dados dinâmicos: TTL curto
await cache.set('user:online', users, 60); // 1 minuto

// Dados voláteis: TTL muito curto
await cache.set('stock:live', stock, 5); // 5 segundos
```

### 3. Sempre Verificar undefined

```typescript
// ✅ CORRETO
const data = await cache.get<Item>('item:123');
if (data) {
  return data;
}

// ❌ ERRADO
const data = await cache.get<Item>('item:123');
return data.name; // Pode quebrar se undefined
```

### 4. Type Safety

```typescript
// ✅ CORRETO: Com type
const user = await cache.get<User>('user:123');

// ❌ ERRADO: Sem type
const user = await cache.get('user:123'); // any
```

### 5. Tratamento de Erros

```typescript
// ✅ CORRETO: Graceful degradation
async function getItem(id: string) {
  try {
    const cached = await cache.get<Item>(`item:${id}`);
    if (cached) return cached;
  } catch (error) {
    log.error('Cache error', error);
    // Continua sem cache
  }

  return await database.findItem(id);
}
```

### 6. Invalidação Seletiva

```typescript
// ✅ CORRETO: Invalidar apenas necessário
await cache.delete(`item:${itemId}`);

// ❌ ERRADO: Flush desnecessário
await cache.flush(); // Remove tudo
```

### 7. Warm-up em Startup

```typescript
// Pre-popular dados críticos
async function warmUpCache() {
  const criticalItems = await database.getCriticalItems();

  for (const item of criticalItems) {
    await cache.set(`item:${item.id}`, item, 3600);
  }

  log.info(`Cache warm-up: ${criticalItems.length} items`);
}

// Chamar durante startup
await warmUpCache();
```

---

## 💡 Exemplos de Uso

### Cache-Aside Pattern

```typescript
async function getUser(id: string): Promise<User> {
  const cacheKey = `user:${id}`;

  // 1. Tentar cache
  const cached = await cache.get<User>(cacheKey);
  if (cached) {
    log.debug('Cache HIT', { key: cacheKey });
    return cached;
  }

  log.debug('Cache MISS', { key: cacheKey });

  // 2. Buscar banco
  const user = await database.findUser(id);
  if (!user) throw new UserNotFoundError(id);

  // 3. Armazenar no cache
  await cache.set(cacheKey, user, 600); // 10 minutos

  return user;
}
```

### Write-Through Pattern

```typescript
async function updateUser(id: string, data: Partial<User>): Promise<User> {
  // 1. Atualizar banco
  const user = await database.updateUser(id, data);

  // 2. Atualizar cache
  const cacheKey = `user:${id}`;
  await cache.set(cacheKey, user, 600);

  return user;
}
```

### Cache Stampede Protection

```typescript
const inflightRequests = new Map<string, Promise<any>>();

async function getWithStampedeProtection<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // 1. Tentar cache
  const cached = await cache.get<T>(key);
  if (cached) return cached;

  // 2. Verificar se já tem request em andamento
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key)!;
  }

  // 3. Criar nova request
  const promise = fetcher().then(data => {
    cache.set(key, data, ttl);
    inflightRequests.delete(key);
    return data;
  });

  inflightRequests.set(key, promise);
  return promise;
}
```

### Batch Operations

```typescript
async function getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  const missing: string[] = [];

  // 1. Buscar do cache
  for (const key of keys) {
    const data = await cache.get<T>(key);
    if (data) {
      results.set(key, data);
    } else {
      missing.push(key);
    }
  }

  // 2. Buscar do banco (apenas missing)
  if (missing.length > 0) {
    const fromDB = await database.findMany(missing);

    for (const [key, data] of fromDB) {
      results.set(key, data);
      await cache.set(key, data, 600);
    }
  }

  return results;
}
```

---

## 🔄 Comparação de Implementações

### Performance

| Operação | Memory | Redis | Layered |
|----------|--------|-------|---------|
| **get** (hit) | < 1ms | 1-5ms | < 1ms (L1) |
| **get** (miss) | < 1ms | 1-5ms | 1-5ms (L2) |
| **set** | < 1ms | 1-5ms | 1-5ms |
| **delete** | < 1ms | 1-5ms | 2-10ms |
| **flush** | < 1ms | 5-50ms | 5-50ms |

### Características

| Característica | Memory | Redis | Layered |
|----------------|--------|-------|---------|
| **Compartilhado** | ❌ | ✅ | ✅ |
| **Persistente** | ❌ | ✅ (opt) | ✅ (opt) |
| **Escalável** | ❌ | ✅ | ✅ |
| **Latência** | Muito baixa | Baixa | Muito baixa |
| **Complexidade** | Baixa | Média | Alta |
| **Custo** | Grátis | $$ | $$ |

### Quando Usar Cada Um

#### Memory Cache

**Use quando:**
- ✅ Desenvolvimento local
- ✅ Single instance (não precisa compartilhar)
- ✅ Dados pequenos e frequentes
- ✅ Latência crítica (< 1ms)

**Não use quando:**
- ❌ Múltiplas instâncias
- ❌ Dados precisam persistir
- ❌ Dados grandes (> 100MB)

#### Redis Cache

**Use quando:**
- ✅ Produção multi-instância
- ✅ Dados compartilhados entre serviços
- ✅ Cache precisa persistir (opcional)
- ✅ Volume alto de dados

**Não use quando:**
- ❌ Latência crítica (< 1ms necessário)
- ❌ Orçamento muito limitado
- ❌ Não pode adicionar dependência externa

#### Layered Cache

**Use quando:**
- ✅ Alta performance + compartilhamento
- ✅ Dados muito acessados (hot data)
- ✅ Orçamento permite
- ✅ Equipe experiente

**Não use quando:**
- ❌ Simplicidade é prioridade
- ❌ Dados pouco acessados
- ❌ Equipe pequena/inexperiente

---

## 🔧 Troubleshooting

### Problema: Cache sempre retorna undefined

**Causas possíveis:**

1. **TTL muito curto**
```typescript
// ❌ Expira muito rápido
await cache.set('key', value, 1); // 1 segundo

// ✅ TTL adequado
await cache.set('key', value, 600); // 10 minutos
```

2. **Chave errada**
```typescript
// ❌ Inconsistência
await cache.set('user:123', user);
const data = await cache.get('user-123'); // undefined

// ✅ Chave consistente
const key = `user:${id}`;
await cache.set(key, user);
const data = await cache.get(key);
```

3. **Cache não está pronto**
```typescript
// ✅ Verificar isReady
if (!await cache.isReady()) {
  log.error('Cache não está pronto');
}
```

---

### Problema: Memory leak no cache

**Diagnóstico:**
```typescript
// Verificar crescimento de chaves
setInterval(async () => {
  const keys = await cache.keys();
  log.info(`Cache keys: ${keys.length}`);
}, 60000);
```

**Soluções:**

1. **Definir TTL em todas chaves**
```typescript
// ❌ Sem TTL (nunca expira)
await cache.set('key', value);

// ✅ Com TTL
await cache.set('key', value, 3600);
```

2. **Limitar tamanho do cache**
```typescript
// MemoryCacheAdapter com limite
const cache = new MemoryCacheAdapter(300, {
  maxKeys: 10000, // Máximo 10k chaves
  evictionPolicy: 'lru' // Remove least recently used
});
```

---

### Problema: Cache stampede após flush

**Problema:**
```typescript
await cache.flush();
// 1000 requests simultâneos → 1000 queries ao banco
```

**Solução 1: Warm-up**
```typescript
await cache.flush();
await warmUpCache(); // Pré-popula dados críticos
```

**Solução 2: Invalidação seletiva**
```typescript
// Ao invés de flush
await cache.delete('item:*');
await cache.delete('user:*');
```

**Solução 3: Stampede protection**
```typescript
const inflightRequests = new Map();

async function get(key: string) {
  const cached = await cache.get(key);
  if (cached) return cached;

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const promise = fetchFromDB(key);
  inflightRequests.set(key, promise);

  const data = await promise;
  inflightRequests.delete(key);

  return data;
}
```

---

**Última atualização:** 2025-10-07