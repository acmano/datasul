# Cache Manager

> **Sistema de cache unificado e flexível com múltiplas estratégias**

Sistema de cache para aplicações Node.js/TypeScript que suporta diferentes estratégias de armazenamento (memória, Redis, camadas) com interface unificada.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estratégias de Cache](#estratégias-de-cache)
- [Arquitetura](#arquitetura)
- [API](#api)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Exemplos de Uso](#exemplos-de-uso)
- [Padrões de Cache](#padrões-de-cache)
- [Performance](#performance)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é?

**CacheManager** é um gerenciador de cache singleton que fornece interface unificada para diferentes estratégias de armazenamento, permitindo flexibilidade de deployment sem mudança de código.

### Características Principais

- ✅ **Múltiplas Estratégias** - Memory, Redis, Layered
- ✅ **Interface Unificada** - API consistente independente da estratégia
- ✅ **Singleton Pattern** - Única instância, configuração centralizada
- ✅ **TTL Configurável** - Time-to-live por chave ou global
- ✅ **Invalidação por Padrão** - Wildcards para limpeza em massa
- ✅ **Estatísticas** - Hits, misses, hit rate
- ✅ **Graceful Shutdown** - Fechamento limpo de conexões
- ✅ **Fallback Automático** - Memory em caso de erro
- ✅ **TypeScript First** - Tipagem completa
- ✅ **Decorators** - `@Cacheable()` para métodos

### Quando Usar?

| Cenário | Estratégia Recomendada |
|---------|------------------------|
| **Desenvolvimento** | `memory` |
| **Produção (single instance)** | `memory` ou `redis` |
| **Produção (múltiplas instâncias)** | `redis` ou `layered` |
| **Alta performance + distribuído** | `layered` |
| **Dados voláteis** | `memory` |
| **Dados compartilhados** | `redis` |

---

## Estratégias de Cache

### 1. Memory (Padrão)

Cache em memória do processo Node.js usando Node-Cache.

**Características:**
- ✅ Rápido (< 1ms)
- ✅ Simples (sem dependências externas)
- ❌ Não distribuído
- ❌ Perde dados ao reiniciar

**Quando usar:**
- Desenvolvimento local
- Aplicação single-instance
- Dados não críticos
- Cálculos caros repetitivos

**Exemplo:**
```typescript
// .env
CACHE_STRATEGY=memory
CACHE_DEFAULT_TTL=300

// Startup
CacheManager.initialize('memory');
```

---

### 2. Redis

Cache distribuído usando Redis.

**Características:**
- ✅ Distribuído (compartilhado entre instâncias)
- ✅ Persistente (opcional)
- ✅ Escalável
- ❌ Requer infraestrutura Redis
- ❌ Latência de rede (1-10ms)

**Quando usar:**
- Produção com múltiplas instâncias
- Dados compartilhados entre servidores
- Load balancer / Kubernetes
- Cache crítico que deve persistir

**Exemplo:**
```typescript
// .env
CACHE_STRATEGY=redis
CACHE_REDIS_URL=redis://localhost:6379

// Startup
CacheManager.initialize('redis');
```

---

### 3. Layered (Híbrido)

Cache em duas camadas: L1 (Memory) + L2 (Redis).

**Características:**
- ✅ Performance de memória (L1)
- ✅ Distribuição do Redis (L2)
- ✅ Melhor de dois mundos
- ❌ Mais complexo
- ❌ Requer Redis

**Como funciona:**
```
GET request
    ↓
┌─ L1 (Memory) ←─ Hit? Return ✅
│       ↓
│   Miss ❌
│       ↓
└─ L2 (Redis) ←─ Hit? Return + Update L1 ✅
        ↓
    Miss ❌
        ↓
   Execute fetchFn()
        ↓
   Store in L1 + L2
```

**Quando usar:**
- Produção com alta carga
- Dados frequentemente acessados
- Necessita distribuição + performance
- Budget para Redis

**Exemplo:**
```typescript
// .env
CACHE_STRATEGY=layered
CACHE_REDIS_URL=redis://localhost:6379
CACHE_DEFAULT_TTL=300

// Startup
CacheManager.initialize('layered');
```

---

## Arquitetura

### Diagrama de Classes

```
┌─────────────────────┐
│   CacheManager      │  (Singleton)
│  ─────────────────  │
│  - adapter          │ ──┐
│  - enabled          │   │
│  - strategy         │   │
│                     │   │
│  + initialize()     │   │
│  + get()            │   │
│  + set()            │   │
│  + delete()         │   │
│  + invalidate()     │   │
│  + getOrSet()       │   │
└─────────────────────┘   │
                          │ uses
    ┌─────────────────────┘
    │
    ▼
┌────────────────────┐
│  <<interface>>     │
│   CacheAdapter     │
├────────────────────┤
│  + get()           │
│  + set()           │
│  + delete()        │
│  + flush()         │
│  + keys()          │
│  + close()         │
└────────────────────┘
         △
         │ implements
    ┌────┴────┬────────────┐
    │         │            │
┌───────┐ ┌────────┐ ┌──────────┐
│Memory │ │ Redis  │ │ Layered  │
│Adapter│ │Adapter │ │ Adapter  │
└───────┘ └────────┘ └──────────┘
```

### Padrões de Projeto

**1. Singleton**
- Única instância do CacheManager
- Estado compartilhado
- Configuração centralizada

**2. Strategy**
- Múltiplas estratégias (Memory, Redis, Layered)
- Interface unificada (CacheAdapter)
- Troca de estratégia em runtime

**3. Adapter**
- Adapta diferentes bibliotecas (node-cache, ioredis)
- Interface consistente
- Desacoplamento

---

## API

### Inicialização

#### `initialize(strategy?)`

Inicializa o sistema de cache.

**Parâmetros:**
- `strategy?: CacheStrategy` - Estratégia a usar (sobrescreve env)
  - `'memory'` - Cache em memória (padrão)
  - `'redis'` - Cache no Redis
  - `'layered'` - Cache em camadas (L1 + L2)

**Retorno:** `void`

**Exemplo:**
```typescript
// Usar estratégia do .env
CacheManager.initialize();

// Forçar estratégia específica
CacheManager.initialize('layered');
```

**Comportamento:**
- Lê variáveis de ambiente
- Inicializa adaptador apropriado
- Faz fallback para memória em caso de erro
- Nunca lança exceção (apenas loga)

---

### Operações Básicas

#### `get<T>(key)`

Busca valor do cache.

**Parâmetros:**
- `key: string` - Chave do cache

**Retorno:** `Promise<T | undefined>`
- Valor tipado se encontrado
- `undefined` se não encontrado, expirado ou erro

**Exemplo:**
```typescript
const user = await CacheManager.get<User>('user:123');

if (user) {
  console.log('Cache hit:', user);
} else {
  console.log('Cache miss');
}
```

**Performance:**
- Memory: < 1ms
- Redis: 1-10ms
- Layered: < 1ms (L1 hit), 1-10ms (L1 miss)

---

#### `set<T>(key, value, ttl?)`

Armazena valor no cache.

**Parâmetros:**
- `key: string` - Chave do cache
- `value: T` - Valor a armazenar
- `ttl?: number` - TTL customizado em segundos (opcional)

**Retorno:** `Promise<boolean>`
- `true` se sucesso
- `false` se erro ou cache desabilitado

**Exemplo:**
```typescript
// TTL padrão (do env)
await CacheManager.set('user:123', userData);

// TTL customizado (10 minutos)
await CacheManager.set('user:123', userData, 600);

// TTL customizado (1 hora)
await CacheManager.set('session:abc', session, 3600);
```

**Notas:**
- Valor é serializado automaticamente (JSON.stringify)
- Sobrescreve valor existente
- TTL customizado sobrescreve TTL padrão

---

#### `delete(key)`

Remove chave do cache.

**Parâmetros:**
- `key: string` - Chave a remover

**Retorno:** `Promise<number>`
- `1` se chave foi removida
- `0` se chave não existia

**Exemplo:**
```typescript
const removed = await CacheManager.delete('user:123');

if (removed) {
  console.log('Chave removida');
} else {
  console.log('Chave não existia');
}
```

---

#### `flush()`

Limpa todo o cache.

**Parâmetros:** Nenhum

**Retorno:** `Promise<void>`

**Exemplo:**
```typescript
await CacheManager.flush();
console.log('Cache completamente limpo');
```

**⚠️ Atenção:**
- Operação destrutiva
- Remove TODAS as chaves
- Use com cuidado em produção
- Em cache layered, limpa L1 e L2

---

#### `keys(pattern?)`

Lista chaves no cache.

**Parâmetros:**
- `pattern?: string` - Padrão de busca (wildcards `*` e `?`)

**Retorno:** `Promise<string[]>`
- Array de chaves encontradas
- Array vazio se nenhuma encontrada

**Exemplo:**
```typescript
// Todas as chaves
const all = await CacheManager.keys();

// Chaves de usuários
const users = await CacheManager.keys('user:*');

// Padrão específico
const sessions = await CacheManager.keys('session:*');
```

**⚠️ Performance:**
- Operação custosa em grandes caches
- Use com moderação
- Considere impacto em produção

---

### Operações Avançadas

#### `invalidate(pattern)`

Invalida chaves por padrão (wildcards).

Busca todas as chaves que correspondem ao padrão e as remove em paralelo.

**Parâmetros:**
- `pattern: string` - Padrão de chaves (suporta `*` e `?`)

**Retorno:** `Promise<number>`
- Número de chaves removidas

**Exemplo:**
```typescript
// Invalidar todos os usuários
const count = await CacheManager.invalidate('user:*');
console.log(`${count} usuários removidos`);

// Invalidar cache de um usuário específico
await CacheManager.invalidate('user:123:*');

// Invalidar todas as queries GET
await CacheManager.invalidate('GET:/api/*');

// Invalidar por data
await CacheManager.invalidate('*:2024-01-*');
```

**Processo:**
1. Lista todas as chaves com `keys(pattern)`
2. Remove em paralelo com `Promise.all()`
3. Retorna total de chaves removidas

**Performance:**
- Operação em duas etapas
- Listagem pode ser custosa
- Remoção é paralela (rápida)

---

#### `getOrSet<T>(key, fetchFn, ttl?)`

Implementa padrão Cache-Aside.

**Parâmetros:**
- `key: string` - Chave do cache
- `fetchFn: () => Promise<T>` - Função para buscar dados
- `ttl?: number` - TTL customizado em segundos

**Retorno:** `Promise<T>`
- Valor do cache ou resultado de `fetchFn()`

**Exemplo:**
```typescript
const user = await CacheManager.getOrSet(
  'user:123',
  async () => {
    // Só executa se cache miss
    return await database.getUser(123);
  },
  600 // 10 minutos
);
```

**Comportamento:**
```
1. Tenta buscar do cache
   ├─ Hit? ✅ Retorna valor
   └─ Miss? ❌
      ├─ Executa fetchFn()
      ├─ Armazena resultado no cache
      └─ Retorna resultado
```

**Notas:**
- Thread-safe (não executa múltiplas vezes em paralelo)
- `fetchFn` só executa se cache miss
- Resultado é cacheado automaticamente
- Transparente para o caller

---

### Status e Estatísticas

#### `isReady()`

Verifica se cache está pronto para uso.

**Parâmetros:** Nenhum

**Retorno:** `Promise<boolean>`
- `true` se cache está operacional
- `false` se desabilitado ou com erro

**Exemplo:**
```typescript
if (await CacheManager.isReady()) {
  console.log('✅ Cache operacional');
} else {
  console.warn('❌ Cache não disponível');
}
```

**Uso:**
- Health checks
- Inicialização da aplicação
- Diagnóstico de problemas

---

#### `getStats()`

Retorna estatísticas do cache.

**Parâmetros:** Nenhum

**Retorno:** `Object`

**Estatísticas (Memory/Layered):**
```typescript
{
  enabled: boolean,
  strategy: 'memory' | 'redis' | 'layered',
  hits: number,        // Total de cache hits
  misses: number,      // Total de cache misses
  keys: number,        // Número de chaves
  hitRate: number      // Taxa de acerto (%)
}
```

**Exemplo:**
```typescript
const stats = CacheManager.getStats();

console.log(`Strategy: ${stats.strategy}`);
console.log(`Hit rate: ${stats.hitRate}%`);
console.log(`Total keys: ${stats.keys}`);
console.log(`Hits: ${stats.hits} | Misses: ${stats.misses}`);
```

**Uso:**
- Monitoramento de performance
- Otimização de cache
- Debugging
- Dashboards

---

### Graceful Shutdown

#### `close()`

Fecha conexões (Redis) de forma limpa.

**Parâmetros:** Nenhum

**Retorno:** `Promise<void>`

**Exemplo:**
```typescript
// No graceful shutdown do servidor
process.on('SIGTERM', async () => {
  await CacheManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await CacheManager.close();
  process.exit(0);
});
```

**Importante:**
- Fecha conexões Redis
- Persiste dados pendentes
- Previne warnings
- Deve ser chamado antes de `process.exit()`

---

## Variáveis de Ambiente

### Configuração

```bash
# Habilitar/desabilitar cache
CACHE_ENABLED=true              # default: true

# Estratégia de cache
CACHE_STRATEGY=layered          # memory | redis | layered (default: memory)

# TTL padrão (segundos)
CACHE_DEFAULT_TTL=300           # default: 300 (5 minutos)

# URL do Redis (se strategy=redis ou layered)
CACHE_REDIS_URL=redis://localhost:6379
```

### Exemplos por Ambiente

**Desenvolvimento:**
```bash
CACHE_ENABLED=true
CACHE_STRATEGY=memory
CACHE_DEFAULT_TTL=300
```

**Produção (Single Instance):**
```bash
CACHE_ENABLED=true
CACHE_STRATEGY=memory
CACHE_DEFAULT_TTL=600
```

**Produção (Múltiplas Instâncias):**
```bash
CACHE_ENABLED=true
CACHE_STRATEGY=redis
CACHE_REDIS_URL=redis://redis-cluster:6379
CACHE_DEFAULT_TTL=600
```

**Produção (Alta Performance):**
```bash
CACHE_ENABLED=true
CACHE_STRATEGY=layered
CACHE_REDIS_URL=redis://redis-cluster:6379
CACHE_DEFAULT_TTL=600
```

---

## Exemplos de Uso

### 1. Cache de Consulta ao Banco

```typescript
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';

class UserRepository {
  static async findById(id: string): Promise<User | null> {
    const cacheKey = generateCacheKey('user', id);

    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        // Só executa se cache miss
        return await db.query('SELECT * FROM users WHERE id = ?', [id]);
      },
      600 // 10 minutos
    );
  }
}
```

---

### 2. Cache com Invalidação

```typescript
class UserService {
  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    // Atualiza no banco
    const user = await db.updateUser(id, data);

    // Invalida cache relacionado
    await CacheManager.invalidate(`user:${id}:*`);

    return user;
  }

  static async deleteUser(id: string): Promise<void> {
    await db.deleteUser(id);

    // Invalida todos os caches do usuário
    await CacheManager.invalidate(`user:${id}:*`);
  }
}
```

---

### 3. Cache de API Externa

```typescript
class WeatherService {
  static async getWeather(city: string): Promise<Weather> {
    const cacheKey = generateCacheKey('weather', city);

    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        const response = await axios.get(`https://api.weather.com/${city}`);
        return response.data;
      },
      1800 // 30 minutos (dados mudam devagar)
    );
  }
}
```

---

### 4. Cache com Decorator

```typescript
import { Cacheable } from '@shared/utils/cacheManager';

class ProductService {
  // Cache automático com TTL padrão
  @Cacheable()
  static async getProduct(id: string): Promise<Product> {
    return await db.query('SELECT * FROM products WHERE id = ?', [id]);
  }

  // Cache com TTL customizado
  @Cacheable({ ttl: 3600 })
  static async getProductDetails(id: string): Promise<ProductDetails> {
    return await db.query('SELECT * FROM product_details WHERE id = ?', [id]);
  }

  // Cache com prefixo customizado
  @Cacheable({ ttl: 600, keyPrefix: 'catalog' })
  static async getCatalogProducts(): Promise<Product[]> {
    return await db.query('SELECT * FROM products WHERE active = true');
  }
}
```

---

### 5. Cache Hierárquico

```typescript
class CacheService {
  // Cache de lista (TTL curto)
  static async getProducts(): Promise<Product[]> {
    return CacheManager.getOrSet(
      'products:list',
      async () => await db.getAllProducts(),
      300 // 5 minutos
    );
  }

  // Cache de item específico (TTL longo)
  static async getProduct(id: string): Promise<Product> {
    return CacheManager.getOrSet(
      generateCacheKey('product', id),
      async () => await db.getProduct(id),
      3600 // 1 hora
    );
  }

  // Invalidação hierárquica
  static async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await db.updateProduct(id, data);

    // Invalida cache específico
    await CacheManager.delete(generateCacheKey('product', id));

    // Invalida lista
    await CacheManager.delete('products:list');
  }
}
```

---

### 6. Cache Condicional

```typescript
class ItemService {
  static async getItem(codigo: string, useCache = true): Promise<Item> {
    if (!useCache) {
      return await db.getItem(codigo);
    }

    const cacheKey = generateCacheKey('item', codigo);

    return CacheManager.getOrSet(
      cacheKey,
      async () => await db.getItem(codigo),
      600
    );
  }
}
```

---

## Padrões de Cache

### 1. Cache-Aside (Lazy Loading)

Busca do cache primeiro, se não encontrar busca da fonte.

**Quando usar:**
- Dados lidos com frequência
- Cálculos caros
- APIs externas

**Implementação:**
```typescript
const data = await CacheManager.getOrSet(
  cacheKey,
  async () => await fetchFromDatabase(),
  ttl
);
```

---

### 2. Write-Through

Escreve no cache e na fonte simultaneamente.

**Quando usar:**
- Dados frequentemente lidos após escrita
- Consistência importante

**Implementação:**
```typescript
async function updateUser(id: string, data: User): Promise<void> {
  // 1. Atualiza no banco
  await db.updateUser(id, data);

  // 2. Atualiza no cache
  await CacheManager.set(`user:${id}`, data);
}
```

---

### 3. Write-Behind (Write-Back)

Escreve no cache primeiro, persiste depois (async).

**Quando usar:**
- Alta taxa de escrita
- Latência crítica
- Dados tolerantes a perda

**Implementação:**
```typescript
async function updateCounter(key: string): Promise<void> {
  // 1. Incrementa no cache
  const current = await CacheManager.get<number>(key) || 0;
  await CacheManager.set(key, current + 1);

  // 2. Persiste async (background)
  setImmediate(() => db.updateCounter(key, current + 1));
}
```

---

### 4. Cache-Invalidation

Remove cache quando dados mudam.

**Quando usar:**
- Dados alteráveis
- Precisão importante
- Relacionamentos complexos

**Implementação:**
```typescript
async function updateProduct(id: string, data: Product): Promise<void> {
  await db.updateProduct(id, data);

  // Invalida caches relacionados
  await CacheManager.invalidate(`product:${id}:*`);
  await CacheManager.delete('products:list');
  await CacheManager.invalidate(`category:${data.categoryId}:*`);
}
```

---

## Performance

### Benchmarks

| Operação | Memory | Redis (local) | Redis (rede) | Layered (L1) | Layered (L2) |
|----------|--------|---------------|--------------|--------------|--------------|
| **GET** | < 1ms | 1-2ms | 5-10ms | < 1ms | 1-2ms |
| **SET** | < 1ms | 1-2ms | 5-10ms | < 1ms | 1-2ms |
| **DELETE** | < 1ms | 1-2ms | 5-10ms | < 1ms | 1-2ms |
| **KEYS** | 1-10ms | 5-20ms | 10-50ms | 1-10ms | 5-20ms |

### Otimizações

**1. Use TTL apropriado**
```typescript
// ❌ TTL muito longo (dados desatualizados)
await CacheManager.set(key, data, 86400); // 24 horas

// ✅ TTL balanceado
await CacheManager.set(key, data, 600); // 10 minutos
```

**2. Evite keys() em produção**
```typescript
// ❌ Custoso
const allKeys = await CacheManager.keys('*');

// ✅ Use padrões específicos
const userKeys = await CacheManager.keys('user:123:*');
```

**3. Use layered para dados populares**
```typescript
// Dados muito acessados = L1 (memory)
// Dados menos acessados = L2 (redis)
CacheManager.initialize('layered');
```

**4. Invalide cirurgicamente**
```typescript
// ❌ Invalida tudo
await CacheManager.flush();

// ✅ Invalida específico
await CacheManager.invalidate(`user:${id}:*`);
```

---

## Boas Práticas

### ✅ DO

**1. Use chaves consistentes**
```typescript
// ✅ Padrão claro
generateCacheKey('user', userId);
generateCacheKey('item', itemId, 'details');
```

**2. Defina TTL apropriado**
```typescript
// Dados voláteis
await CacheManager.set(key, data, 60); // 1 minuto

// Dados estáveis
await CacheManager.set(key, data, 3600); // 1 hora
```

**3. Invalide ao atualizar**
```typescript
async function updateUser(id: string, data: User) {
  await db.updateUser(id, data);
  await CacheManager.invalidate(`user:${id}:*`);
}
```

**4. Use getOrSet() para simplicidade**
```typescript
// ✅ Simples e limpo
const user = await CacheManager.getOrSet(
  `user:${id}`,
  () => db.getUser(id),
  600
);
```

**5. Monitore estatísticas**
```typescript
setInterval(() => {
  const stats = CacheManager.getStats();
  log.info('Cache stats', stats);
}, 60000);
```

---

### ❌ DON'T

**1. Não cache dados sensíveis sem criptografia**
```typescript
// ❌ Senha em texto plano
await CacheManager.set('user:password', plainPassword);

// ✅ Não cachear ou criptografar
await CacheManager.set('user:hash', bcrypt.hash(password));
```

**2. Não use TTL muito longo**
```typescript
// ❌ Dados podem ficar desatualizados
await CacheManager.set(key, data, 604800); // 7 dias
```

**3. Não esqueça de invalidar**
```typescript
// ❌ Cache nunca é atualizado
async function updateUser(id, data) {
  await db.updateUser(id, data);
  // Esqueceu de invalidar!
}

// ✅ Sempre invalide
async function updateUser(id, data) {
  await db.updateUser(id, data);
  await CacheManager.invalidate(`user:${id}:*`);
}
```

**4. Não cache objetos grandes**
```typescript
// ❌ 50MB de JSON
await CacheManager.set('huge', gigantObject);

// ✅ Cache referência ou resumo
await CacheManager.set('summary', { id, size, updatedAt });
```

**5. Não ignore erros silenciosamente**
```typescript
// ❌ Pode perder dados importantes
await CacheManager.set(key, data).catch(() => {});

// ✅ Trate ou logue
const success = await CacheManager.set(key, data);
if (!success) {
  log.warn('Falha ao cachear', { key });
}
```

---

## Troubleshooting

### Cache não está funcionando

**Sintomas:**
- Sempre cache miss
- Dados não são armazenados

**Verificar:**
```typescript
// 1. Cache está habilitado?
console.log(process.env.CACHE_ENABLED);

// 2. Cache está pronto?
const ready = await CacheManager.isReady();
console.log('Cache ready:', ready);

// 3. Estratégia correta?
const stats = CacheManager.getStats();
console.log('Strategy:', stats.strategy);

// 4. TTL muito baixo?
console.log(process.env.CACHE_DEFAULT_TTL);
```

---

### Redis não conecta

**Sintomas:**
- Erro: `ECONNREFUSED`
- Cache fazendo fallback para memory

**Soluções:**
```bash
# 1. Verificar se Redis está rodando
redis-cli ping

# 2. Verificar URL
echo $CACHE_REDIS_URL

# 3. Testar conexão
redis-cli -u $CACHE_REDIS_URL ping

# 4. Verificar firewall/rede
telnet redis-host 6379
```

---

### Cache muito cheio

**Sintomas:**
- Memória alta
- Performance degradada

**Soluções:**
```typescript
// 1. Ver estatísticas
const stats = CacheManager.getStats();
console.log('Keys:', stats.keys);

// 2. Reduzir TTL
CACHE_DEFAULT_TTL=180  // 3 minutos

// 3. Limpar cache antigo
await CacheManager.invalidate('*:2024-01-*');

// 4. Limpar tudo (última opção)
await CacheManager.flush();
```

---

### Hit rate baixo

**Sintomas:**
- hit rate < 50%
- Muitos cache misses

**Otimizações:**
```typescript
// 1. TTL muito baixo?
// Aumentar TTL
await CacheManager.set(key, data, 600); // 10 min

// 2. Chaves inconsistentes?
// Padronizar chaves
generateCacheKey('user', id);

// 3. Dados diferentes para mesma chave?
// Incluir variação na chave
generateCacheKey('items', filter, sort, page);

// 4. Usar layered
CacheManager.initialize('layered');
```

---

### Dados desatualizados

**Sintomas:**
- Cache retorna dados antigos
- Mudanças não aparecem

**Soluções:**
```typescript
// 1. Reduzir TTL
await CacheManager.set(key, data, 60); // 1 minuto

// 2. Invalidar ao atualizar
async function updateData(id, data) {
  await db.update(id, data);
  await CacheManager.delete(`data:${id}`);
}

// 3. Invalidar relacionados
await CacheManager.invalidate(`user:${id}:*`);
await CacheManager.delete('users:list');

// 4. Forçar bypass
const data = await db.getData(id); // Sem cache
```

---

## Referências

### Arquivos Relacionados

- `cache/CacheAdapter.ts` - Interface base
- `cache/MemoryCacheAdapter.ts` - Implementação memory
- `cache/RedisCacheAdapter.ts` - Implementação redis
- `cache/LayeredCacheAdapter.ts` - Implementação layered
- `logger.ts` - Sistema de logs

### Bibliotecas

- [node-cache](https://www.npmjs.com/package/node-cache) - Cache em memória
- [ioredis](https://www.npmjs.com/package/ioredis) - Cliente Redis
- [Redis](https://redis.io/) - Servidor Redis

### Conceitos

- **TTL** (Time To Live) - Tempo de vida do cache
- **Cache Hit** - Dado encontrado no cache
- **Cache Miss** - Dado não encontrado (busca da fonte)
- **Hit Rate** - Taxa de acerto (hits / total)
- **Cache Invalidation** - Remoção de dados desatualizados
- **Cache-Aside** - Padrão de busca do cache primeiro
- **Write-Through** - Escreve cache e fonte juntos
- **Layered Cache** - Cache em múltiplas camadas

---

**Última atualização:** 2025-10-07