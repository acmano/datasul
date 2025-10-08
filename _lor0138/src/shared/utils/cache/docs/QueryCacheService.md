# Query Cache Service - Documentação Completa

> **Módulo:** `shared/utils/cache/QueryCacheService`
> **Versão:** 1.0.0
> **Arquivo:** `src/shared/utils/cache/QueryCacheService.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Cache-Aside Pattern](#cache-aside-pattern)
3. [Geração de Chaves](#geração-de-chaves)
4. [TTLs por Entidade](#ttls-por-entidade)
5. [Interface QueryCacheOptions](#interface-querycacheoptions)
6. [Métodos Principais](#métodos-principais)
7. [Wrappers Especializados](#wrappers-especializados)
8. [Invalidação](#invalidação)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Boas Práticas](#boas-práticas)
11. [Performance](#performance)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Serviço de cache transparente para queries SQL que implementa o padrão **cache-aside** com geração automática de chaves determinísticas baseadas em hash MD5 do SQL + parâmetros.

### Propósito

- ✅ **Cache transparente:** Envolve queries SQL sem alterar lógica de negócio
- ✅ **Chaves automáticas:** Gera chaves deterministicamente (mesmo SQL + params = mesma chave)
- ✅ **Type-safe:** Suporte completo a TypeScript generics
- ✅ **Configurável:** TTL e prefixos customizáveis
- ✅ **Especializado:** Wrappers otimizados por tipo de entidade
- ✅ **Rastreável:** Logs detalhados (HIT/MISS/SKIP)

### Características

| Característica | Descrição |
|----------------|-----------|
| **Pattern** | Cache-Aside (Lazy Loading) |
| **Chaves** | MD5 hash (determinístico e único) |
| **TTL** | Configurável por entidade |
| **Invalidação** | Por padrão (wildcards) |
| **Logging** | HIT/MISS/SKIP em debug |
| **Backend** | CacheManager (abstração L1+L2) |

---

## 🔄 Cache-Aside Pattern

### O Que É?

Pattern onde a aplicação gerencia o cache manualmente:

1. **READ:** Verifica cache → HIT: retorna | MISS: busca banco + cacheia
2. **WRITE:** Atualiza banco → invalida cache
3. **Cache carregado sob demanda** (lazy loading)

### Fluxo de Leitura

```
┌─────────────────────────────────────────┐
│         Application Request              │
└─────────────┬───────────────────────────┘
              ↓
      ┌───────────────┐
      │  QueryCache   │
      │   Service     │
      └───────┬───────┘
              ↓
        Generate Key
        (SQL + params)
              ↓
      ┌───────────────┐
      │  CacheManager │
      │  .get(key)    │
      └───────┬───────┘
              ↓
        ┌─────┴─────┐
        │   Found?  │
        └─────┬─────┘
       YES ↓  ↓ NO
          ↓    ↓
     ┌────┘    └────┐
     │              │
  Return        Execute
  Cached        Query
  Result           ↓
     ↑         Store in
     │         Cache
     │            ↓
     └────────────┘
```

### Implementação

```typescript
static async withCache<T>(
  sql: string,
  params: any[],
  queryFn: () => Promise<T>,
  options: QueryCacheOptions = {}
): Promise<T> {
  // 1. Skip se necessário
  if (skipCache) return queryFn();

  // 2. Gerar chave
  const key = generateCacheKey(sql, params, prefix);

  // 3. Tentar cache
  const cached = await CacheManager.get<T>(key);
  if (cached !== undefined) return cached; // HIT

  // 4. MISS: executar query
  const result = await queryFn();

  // 5. Armazenar
  await CacheManager.set(key, result, ttl);

  return result;
}
```

### Vantagens vs Desvantagens

#### ✅ Vantagens

- **Simples de implementar**
- **Cache sob demanda** (não precisa warm-up)
- **Aplicação controla cache** (fácil debugar)
- **Não afeta banco** (cache opcional)

#### ❌ Desvantagens

- **Cache Stampede** (muitos requests simultâneos em MISS)
- **Stale data** (cache pode ficar desatualizado)
- **Overhead** (sempre verifica cache primeiro)

---

## 🔑 Geração de Chaves

### Processo

```typescript
generateCacheKey(sql, params, prefix) {
  // 1. Normalizar SQL
  normalizedSql = sql.replace(/\s+/g, ' ').trim();

  // 2. Serializar params deterministicamente
  paramsStr = serializeDeterministic(params);

  // 3. Hash MD5
  hash = md5(`${normalizedSql}:${paramsStr}`).substring(0, 16);

  // 4. Retornar chave
  return `${prefix}:${hash}`;
}
```

### Por Que MD5?

| Aspecto | MD5 | SHA-256 | UUID |
|---------|-----|---------|------|
| **Velocidade** | ⚡ Muito rápido | 🟡 Médio | ⚡ Rápido |
| **Tamanho** | 32 chars (16 usado) | 64 chars | 36 chars |
| **Colisões** | Improvável neste contexto | Quase impossível | Impossível |
| **Determinístico** | ✅ Sim | ✅ Sim | ❌ Não |
| **Segurança** | ❌ Não criptográfico | ✅ Seguro | N/A |

**Escolha:** MD5 porque:
- ✅ Rápido para gerar
- ✅ Chave curta (16 chars suficiente)
- ✅ Determinístico (crucial!)
- ✅ Colisões improvável (milhões de queries diferentes)
- ⚠️ Segurança não importa (não é uso criptográfico)

### Determinismo Garantido

**Problema:** Ordem dos parâmetros pode variar

```typescript
// Estes devem gerar a MESMA chave:
params1 = [
  { name: 'p1', value: 'A' },
  { name: 'p2', value: 'B' }
];

params2 = [
  { name: 'p2', value: 'B' },
  { name: 'p1', value: 'A' }
];
```

**Solução:** Normalização

```typescript
// Ordena por 'name' antes de serializar
const sortedParams = params.sort((a, b) =>
  a.name.localeCompare(b.name)
);

// Agora params1 e params2 geram mesma chave
```

### Exemplos de Chaves

```typescript
// SQL simples
generateCacheKey('SELECT * FROM item', [], 'item')
// → 'item:a1b2c3d4e5f6g7h8'

// SQL com parâmetros
generateCacheKey(
  'SELECT * FROM item WHERE codigo = @p1',
  [{ name: 'p1', value: '7530110' }],
  'item'
)
// → 'item:x1y2z3w4v5u6t7s8'

// SQL normalizado (espaços extras removidos)
generateCacheKey('SELECT  *   FROM   item', [], 'query')
// Mesmo que: 'SELECT * FROM item'
// → 'query:a1b2c3d4e5f6g7h8'
```

---

## ⏱️ TTLs por Entidade

### Configurações

```typescript
const ENTITY_TTL = {
  ITEM: 600,              // 10 minutos
  FAMILIA: 3600,          // 1 hora
  ESTABELECIMENTO: 900,   // 15 minutos
  HEALTH: 30,             // 30 segundos
};
```

### Justificativa

| Entidade | TTL | Razão |
|----------|-----|-------|
| **ITEM** | 10min | Dados cadastrais, mudam pouco |
| **FAMILIA** | 1h | Hierarquia estável |
| **ESTABELECIMENTO** | 15min | Pode mudar (aberturas/fechamentos) |
| **HEALTH** | 30s | Deve refletir estado atual |

### Customização

```typescript
// Usar TTL padrão
await QueryCacheService.withItemCache(sql, params, queryFn);
// TTL = 600s

// Customizar TTL
await QueryCacheService.withItemCache(sql, params, queryFn, 1200);
// TTL = 1200s (20min)

// TTL muito curto para dados voláteis
await QueryCacheService.withItemCache(sql, params, queryFn, 60);
// TTL = 60s (1min)
```

---

## 🔧 Interface QueryCacheOptions

Define opções de cache para queries.

### Interface

```typescript
interface QueryCacheOptions {
  ttl?: number;
  prefix?: string;
  skipCache?: boolean;
  invalidatePattern?: string;
}
```

### Campos

#### ttl

**Tipo:** `number | undefined`
**Default:** `300` (5 minutos)
**Unidade:** Segundos

Tempo de vida do cache.

```typescript
// TTL padrão (5min)
await QueryCacheService.withCache(sql, params, queryFn);

// TTL customizado (10min)
await QueryCacheService.withCache(sql, params, queryFn, { ttl: 600 });

// TTL longo (1 hora)
await QueryCacheService.withCache(sql, params, queryFn, { ttl: 3600 });
```

#### prefix

**Tipo:** `string | undefined`
**Default:** `'query'`

Prefixo da chave de cache (identifica tipo).

```typescript
// Prefixo padrão
await QueryCacheService.withCache(sql, params, queryFn);
// Chave: 'query:abc123...'

// Prefixo customizado
await QueryCacheService.withCache(sql, params, queryFn, {
  prefix: 'report'
});
// Chave: 'report:abc123...'
```

#### skipCache

**Tipo:** `boolean | undefined`
**Default:** `false`

Se `true`, pula cache e executa query direto.

```typescript
// Com cache (normal)
await QueryCacheService.withCache(sql, params, queryFn);

// Sem cache (fresh data)
await QueryCacheService.withCache(sql, params, queryFn, {
  skipCache: true
});

// Condicional
const useCache = !req.query.refresh;
await QueryCacheService.withCache(sql, params, queryFn, {
  skipCache: !useCache
});
```

#### invalidatePattern

**Tipo:** `string | undefined`
**Opcional:** Sim

Padrão para invalidar cache relacionado (feature futura).

```typescript
// Atualmente não implementado
// Ideia: após update, invalidar automaticamente
await QueryCacheService.withCache(sql, params, queryFn, {
  invalidatePattern: 'item:*'
});
```

---

## 📚 Métodos Principais

### withCache<T>()

Método principal que implementa cache-aside pattern.

#### Assinatura

```typescript
static async withCache<T>(
  sql: string,
  params: any[] = [],
  queryFn: () => Promise<T>,
  options: QueryCacheOptions = {}
): Promise<T>
```

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| **sql** | `string` | Sim | Query SQL |
| **params** | `any[]` | Não | Parâmetros da query |
| **queryFn** | `() => Promise<T>` | Sim | Função que executa query |
| **options** | `QueryCacheOptions` | Não | Opções de cache |

#### Retorno

```typescript
Promise<T>
```

#### Comportamento

1. Se `skipCache=true`: executa query direto
2. Gera chave determinística
3. Busca cache → HIT: retorna
4. MISS: executa query
5. Armazena no cache
6. Retorna resultado

#### Exemplos

```typescript
// Query simples
const items = await QueryCacheService.withCache(
  'SELECT * FROM item',
  [],
  async () => await db.query('SELECT * FROM item')
);

// Query parametrizada
const item = await QueryCacheService.withCache(
  'SELECT * FROM item WHERE codigo = @p1',
  [{ name: 'p1', value: '7530110' }],
  async () => await db.queryWithParams(sql, params),
  { ttl: 600, prefix: 'item' }
);

// Pular cache
const fresh = await QueryCacheService.withCache(
  sql,
  params,
  async () => await db.query(sql),
  { skipCache: true }
);
```

---

### invalidate()

Invalida cache por padrão.

#### Assinatura

```typescript
static async invalidate(pattern: string): Promise<number>
```

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| **pattern** | `string` | Padrão de chaves (suporta wildcards) |

#### Retorno

```typescript
Promise<number> // Número de chaves removidas
```

#### Exemplos

```typescript
// Invalidar todos items
await QueryCacheService.invalidate('item:*');

// Invalidar chave específica
await QueryCacheService.invalidate('item:abc123def456');

// Invalidar estabelecimentos
await QueryCacheService.invalidate('estabelecimento:*');

// Invalidar health checks
await QueryCacheService.invalidate('health:*');
```

---

### invalidateMultiple()

Invalida múltiplos padrões de uma vez.

#### Assinatura

```typescript
static async invalidateMultiple(patterns: string[]): Promise<number>
```

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| **patterns** | `string[]` | Lista de padrões |

#### Retorno

```typescript
Promise<number> // Total de chaves removidas
```

#### Exemplos

```typescript
// Invalidar item e estabelecimentos
await QueryCacheService.invalidateMultiple([
  'item:*',
  'estabelecimento:*'
]);

// Invalidar dados relacionados
const itemId = '7530110';
await QueryCacheService.invalidateMultiple([
  `item:*${itemId}*`,
  `estabelecimento:*${itemId}*`
]);
```

---

## 🎯 Wrappers Especializados

Métodos otimizados para entidades específicas com TTL e prefixo pré-configurados.

### withItemCache()

Cache para queries de **itens**.

**Configurações:**
- TTL: 600s (10 minutos)
- Prefixo: `'item'`

**Uso:**
```typescript
const item = await QueryCacheService.withItemCache(
  'SELECT * FROM item WHERE codigo = @p1',
  [{ name: 'p1', value: '7530110' }],
  async () => await ItemRepository.query(sql, params)
);

// TTL customizado
const item = await QueryCacheService.withItemCache(
  sql,
  params,
  queryFn,
  1200 // 20 minutos
);
```

---

### withFamiliaCache()

Cache para queries de **famílias**.

**Configurações:**
- TTL: 3600s (1 hora)
- Prefixo: `'familia'`

**Uso:**
```typescript
const familias = await QueryCacheService.withFamiliaCache(
  'SELECT * FROM familia WHERE codigo = @p1',
  [{ name: 'p1', value: '450000' }],
  async () => await FamiliaRepository.query(sql, params)
);
```

---

### withEstabelecimentoCache()

Cache para queries de **estabelecimentos**.

**Configurações:**
- TTL: 900s (15 minutos)
- Prefixo: `'estabelecimento'`

**Uso:**
```typescript
const estabelecimentos = await QueryCacheService.withEstabelecimentoCache(
  'SELECT * FROM estabelecimento WHERE item = @p1',
  [{ name: 'p1', value: '7530110' }],
  async () => await EstabRepository.query(sql, params)
);
```

---

### withHealthCache()

Cache para **health checks**.

**Configurações:**
- TTL: 30s (30 segundos)
- Prefixo: `'health'`

**Uso:**
```typescript
const health = await QueryCacheService.withHealthCache(
  'SELECT 1 as test',
  [],
  async () => await DatabaseManager.query('SELECT 1')
);
```

**Por que TTL curto?**
- Health checks devem refletir estado atual
- Cache stale pode ocultar problemas
- 30s é bom equilíbrio: reduz carga sem comprometer detecção

---

## ❌ Invalidação

### Estratégias

#### 1. Invalidação por Update

Após atualizar dados, invalidar cache relacionado.

```typescript
// Update item
async function updateItem(codigo: string, data: Partial<Item>) {
  // 1. Atualizar banco
  const item = await db.items.update(codigo, data);

  // 2. Invalidar cache
  await QueryCacheService.invalidate(`item:*${codigo}*`);

  return item;
}
```

#### 2. Invalidação em Cascata

Invalidar dados relacionados.

```typescript
// Update item invalida item + estabelecimentos
async function updateItem(codigo: string, data: Partial<Item>) {
  const item = await db.items.update(codigo, data);

  await QueryCacheService.invalidateMultiple([
    `item:*${codigo}*`,
    `estabelecimento:*${codigo}*`
  ]);

  return item;
}
```

#### 3. Invalidação Total (Flush)

Limpar todo cache de uma entidade.

```typescript
// Após import em massa
await importItems(csvData);

// Limpar todo cache de items
await QueryCacheService.invalidate('item:*');
```

### Quando Invalidar

| Operação | Invalidação |
|----------|-------------|
| **CREATE** | Opcional (próximo GET vai cachear) |
| **READ** | Não (cache-aside cuida) |
| **UPDATE** | **Obrigatório** (evita stale data) |
| **DELETE** | **Obrigatório** (evita retornar deletado) |

---

## 💡 Exemplos Práticos

### Repository com Cache

```typescript
class ItemRepository {
  static async findByCodigo(codigo: string): Promise<Item | null> {
    const sql = 'SELECT * FROM item WHERE codigo = @p1';
    const params = [{ name: 'p1', value: codigo }];

    const results = await QueryCacheService.withItemCache(
      sql,
      params,
      async () => await DatabaseManager.queryEmpWithParams(sql, params)
    );

    return results[0] || null;
  }

  static async update(codigo: string, data: Partial<Item>): Promise<Item> {
    const sql = 'UPDATE item SET nome = @p1 WHERE codigo = @p2';
    const params = [
      { name: 'p1', value: data.nome },
      { name: 'p2', value: codigo }
    ];

    // Executar update SEM cache
    await DatabaseManager.queryEmpWithParams(sql, params);

    // Invalidar cache
    await QueryCacheService.invalidate(`item:*${codigo}*`);

    // Retornar item atualizado (vai cachear novamente)
    return this.findByCodigo(codigo);
  }
}
```

### Controller com Cache

```typescript
class ItemController {
  static getItem = asyncHandler(async (req, res) => {
    const { codigo } = req.params;

    // Cache automático
    const item = await ItemRepository.findByCodigo(codigo);

    if (!item) {
      throw new ItemNotFoundError(codigo);
    }

    res.json({ success: true, data: item });
  });

  static updateItem = asyncHandler(async (req, res) => {
    const { codigo } = req.params;

    // Update com invalidação
    const item = await ItemRepository.update(codigo, req.body);

    res.json({ success: true, data: item });
  });
}
```

### Query Complexa com Cache

```typescript
async function getItemsWithEstabelecimentos(filter: any) {
  const sql = `
    SELECT
      i.*,
      e.codigo as estab_codigo,
      e.nome as estab_nome
    FROM item i
    LEFT JOIN estabelecimento e ON e.item = i.codigo
    WHERE i.ativo = 1
      AND (@p1 IS NULL OR i.familia = @p1)
  `;

  const params = [
    { name: 'p1', value: filter.familia || null }
  ];

  return QueryCacheService.withCache(
    sql,
    params,
    async () => await DatabaseManager.queryEmpWithParams(sql, params),
    { ttl: 300, prefix: 'item_estab' }
  );
}
```

### Refresh Endpoint

```typescript
// Endpoint para forçar refresh
app.post('/api/cache/refresh/:entity', async (req, res) => {
  const { entity } = req.params;

  const removed = await QueryCacheService.invalidate(`${entity}:*`);

  res.json({
    success: true,
    message: `Cache refreshed for ${entity}`,
    keysRemoved: removed
  });
});
```

---

## ✅ Boas Práticas

### 1. Use Wrappers Especializados

```typescript
// ✅ BOM: Wrapper específico
await QueryCacheService.withItemCache(sql, params, queryFn);

// ❌ RUIM: withCache genérico
await QueryCacheService.withCache(sql, params, queryFn, {
  ttl: 600,
  prefix: 'item'
});
```

### 2. Invalidação Consistente

```typescript
// ✅ BOM: Sempre invalida após update
async function updateItem(id: string, data: any) {
  await db.update(id, data);
  await QueryCacheService.invalidate(`item:*${id}*`);
}

// ❌ RUIM: Esquece de invalidar
async function updateItem(id: string, data: any) {
  await db.update(id, data);
  // Cache fica stale!
}
```

### 3. TTL Apropriado

```typescript
// ✅ BOM: TTL baseado em volatilidade
await QueryCacheService.withItemCache(sql, params, queryFn, 600);
// Items mudam pouco → 10min OK

// ❌ RUIM: TTL muito longo para dados voláteis
await QueryCacheService.withHealthCache(sql, params, queryFn);
// Health check com 1 hora → muito tempo!
```

### 4. Prefixos Consistentes

```typescript
// ✅ BOM: Prefixos padronizados
'item:*'
'familia:*'
'estabelecimento:*'

// ❌ RUIM: Prefixos inconsistentes
'items:*'
'item_*'
'Item:*'
```

### 5. Logging Adequado

```typescript
// Logs já incluídos pelo serviço
// HIT, MISS, SKIP são logados em debug

// Se precisar de métricas customizadas:
const start = Date.now();
const result = await QueryCacheService.withCache(...);
const duration = Date.now() - start;

log.info('Query executed', { duration, cached: duration < 10 });
```

---

## ⚡ Performance

### Latência por Cenário

| Cenário | Latência | Descrição |
|---------|----------|-----------|
| **Cache HIT (L1)** | < 1ms | Memória local |
| **Cache HIT (L2)** | 1-10ms | Redis |
| **Cache MISS** | Query time + 1ms | Executa + cacheia |
| **Skip Cache** | Query time | Direto ao banco |

### Throughput

```
Sem cache:       100 req/s  (limitado pelo banco)
Cache HIT (L1):  10.000 req/s
Cache HIT (L2):  1.000 req/s
```

### Economia de Recursos

**Exemplo:** Query que demora 50ms

```
Sem cache:
100 req/s × 50ms = 5.000ms de CPU banco/s

Com cache (80% hit rate L1):
20 req/s × 50ms = 1.000ms (banco)
80 req/s × 1ms = 80ms (cache)
Total: 1.080ms → 78% redução
```

### Benchmarks

```typescript
// Teste: 1000 requests
const results = [];

// Primeira request (MISS)
let start = Date.now();
await QueryCacheService.withItemCache(sql, params, queryFn);
results.push(Date.now() - start); // ~50ms

// Próximas 999 requests (HIT)
for (let i = 0; i < 999; i++) {
  start = Date.now();
  await QueryCacheService.withItemCache(sql, params, queryFn);
  results.push(Date.now() - start); // ~1ms cada
}

// Resultado:
// Primeira: 50ms
// Média das demais: 1ms
// Speedup: 50x
```

---

## 🔧 Troubleshooting

### Problema: Cache não está funcionando (sempre MISS)

**Diagnóstico:**

```typescript
// Verificar logs
// Deve ver: "Query cache: MISS" seguido de "Query cache: HIT"
// Se sempre MISS, chave pode estar mudando
```

**Causas:**

1. **Parâmetros não deterministicos**
   ```typescript
   // ❌ ERRADO: Timestamp sempre diferente
   const params = [
     { name: 'p1', value: codigo },
     { name: 'p2', value: new Date() } // Muda sempre!
   ];

   // ✅ CORRETO: Parâmetros estáveis
   const params = [
     { name: 'p1', value: codigo }
   ];
   ```

2. **SQL com variações**
   ```typescript
   // ❌ ERRADO: Espaços variáveis
   const sql1 = 'SELECT * FROM item';
   const sql2 = 'SELECT  *  FROM  item'; // Normalizado para mesmo

   // Ambos geram mesma chave (normalização funciona)
   ```

**Solução:** Verificar params e SQL são consistentes.

---

### Problema: Cache fica stale (dados desatualizados)

**Sintoma:**
```typescript
// Update item
await db.updateItem(codigo, newData);

// GET retorna dados antigos
const item = await ItemRepository.findByCodigo(codigo);
// item ainda tem dados antigos!
```

**Causa:** Falta invalidação após update.

**Solução:**
```typescript
async function updateItem(codigo: string, data: any) {
  await db.updateItem(codigo, data);

  // ✅ Invalidar cache
  await QueryCacheService.invalidate(`item:*${codigo}*`);
}
```

---

### Problema: Memory leak (cache crescendo indefinidamente)

**Diagnóstico:**
```typescript
// Verificar quantidade de chaves
const keys = await CacheManager.keys('item:*');
console.log(`Items em cache: ${keys.length}`);

// Se crescendo muito (> 10k), pode ser leak
```

**Causas:**

1. **Queries únicas (sem reuso)**
   ```typescript
   // ❌ ERRADO: Cada request gera chave nova
   const sql = `SELECT * FROM item WHERE timestamp > ${Date.now()}`;

   // ✅ CORRETO: Query reutilizável
   const sql = 'SELECT * FROM item WHERE timestamp > @p1';
   const params = [{ name: 'p1', value: startTime }];
   ```

2. **TTL muito longo**
   ```typescript
   // ❌ Muitos dados acumulam
   await QueryCacheService.withItemCache(sql, params, queryFn, 86400);
   // 24 horas!

   // ✅ TTL razoável
   await QueryCacheService.withItemCache(sql, params, queryFn, 600);
   // 10 minutos
   ```

**Solução:** Revisar queries e TTLs.

---

### Problema: Performance não melhorou

**Diagnóstico:**
```typescript
// Verificar hit rate
// Calcular: hits / (hits + misses)

// Se < 50%, cache não está efetivo
```

**Causas:**

1. **Queries não repetidas**
   ```typescript
   // Cada query é diferente → sem reuso
   // Cache não ajuda
   ```

2. **TTL muito curto**
   ```typescript
   // Cache expira antes de ser reutilizado
   await QueryCacheService.withItemCache(sql, params, queryFn, 10);
   // 10 segundos muito curto!
   ```

**Solução:** Aumentar TTL ou revisar se caching faz sentido.

---

**Última atualização:** 2025-10-07
