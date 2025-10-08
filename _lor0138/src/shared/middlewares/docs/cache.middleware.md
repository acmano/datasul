# Middleware de Cache HTTP

**Arquivo:** `src/shared/middlewares/cache.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Cache de respostas HTTP em memória

---

## Visão Geral

Middleware que implementa cache de respostas HTTP em memória para reduzir carga no banco de dados e melhorar performance.

### Funcionalidades

- ✅ Cache automático de respostas GET
- ✅ TTL (Time To Live) configurável por rota
- ✅ Geração de chave de cache customizável
- ✅ Condições de cache flexíveis
- ✅ Invalidação automática por mutação
- ✅ Headers de debug (X-Cache: HIT/MISS)
- ✅ Integração com CacheManager
- ✅ Presets pré-configurados

### Benefícios

| Métrica | Melhoria |
|---------|----------|
| Carga no banco | ↓ 70-90% |
| Tempo de resposta | ↓ 80-95% |
| Custo computacional | ↓ 60-80% |
| Escalabilidade | ↑ Significativo |

---

## Middleware Principal

### cacheMiddleware()

Cacheia respostas de requisições GET automaticamente.

**Assinatura:**
```typescript
function cacheMiddleware(options?: CacheOptions): Middleware
```

**Parâmetros:**

```typescript
interface CacheOptions {
  ttl?: number;                                    // TTL em segundos (padrão: 300)
  keyGenerator?: (req: Request) => string;         // Gerador de chave customizado
  condition?: (req: Request, res: Response) => boolean; // Condição para cachear
}
```

**Retorna:**
- Middleware configurado do Express

---

## Fluxo de Execução

### Cache HIT (Resposta encontrada)

```
Request GET
    ↓
Gerar chave de cache
    ↓
Buscar no cache
    ↓
✅ Encontrado (HIT)
    ↓
Adicionar header X-Cache: HIT
    ↓
Retornar resposta cacheada
    ↓
⚡ Response (1-2ms)
```

### Cache MISS (Resposta não encontrada)

```
Request GET
    ↓
Gerar chave de cache
    ↓
Buscar no cache
    ↓
❌ Não encontrado (MISS)
    ↓
Interceptar res.json()
    ↓
Executar handler
    ↓
Verificar condição de cache
    ↓
Armazenar resposta com TTL
    ↓
Adicionar header X-Cache: MISS
    ↓
Response (50-500ms)
```

---

## Exemplos de Uso

### Exemplo 1: Cache Básico (Padrão)

```typescript
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';

// Cache padrão: 5 minutos
router.get('/items', cacheMiddleware(), controller.getItems);
```

**Comportamento:**
- TTL: 300 segundos (5 minutos)
- Chave: `GET:/items` (padrão)
- Cacheia apenas status 200

---

### Exemplo 2: TTL Customizado

```typescript
// Cache curto: 1 minuto
router.get('/stats', cacheMiddleware({
  ttl: 60
}), controller.getStats);

// Cache longo: 15 minutos
router.get('/config', cacheMiddleware({
  ttl: 900
}), controller.getConfig);
```

---

### Exemplo 3: Gerador de Chave Customizado

```typescript
// Cache por item específico
router.get('/items/:id', cacheMiddleware({
  ttl: 600,
  keyGenerator: (req) => `item:${req.params.id}`
}), controller.getItem);

// Cache por usuário
router.get('/profile', cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => `user:${req.user?.id}:profile`
}), controller.getProfile);

// Cache com query parameters
router.get('/search', cacheMiddleware({
  ttl: 180,
  keyGenerator: (req) => {
    const { q, page = 1 } = req.query;
    return `search:${q}:page:${page}`;
  }
}), controller.search);
```

---

### Exemplo 4: Condição de Cache

```typescript
// Só cacheia se tem query de busca
router.get('/search', cacheMiddleware({
  ttl: 300,
  condition: (req) => !!req.query.q
}), controller.search);

// Só cacheia status 200 e 304
router.get('/data', cacheMiddleware({
  ttl: 600,
  condition: (req, res) => [200, 304].includes(res.statusCode)
}), controller.getData);

// Só cacheia para usuários autenticados
router.get('/premium', cacheMiddleware({
  ttl: 300,
  condition: (req) => !!req.user
}), controller.getPremiumData);
```

---

### Exemplo 5: Cache com Invalidação

```typescript
import {
  cacheMiddleware,
  invalidateCacheMiddleware
} from '@shared/middlewares/cache.middleware';

// GET: Cacheia respostas
router.get('/items',
  cacheMiddleware({ ttl: 300 }),
  controller.getItems
);

router.get('/items/:id',
  cacheMiddleware({
    ttl: 600,
    keyGenerator: (req) => `item:${req.params.id}`
  }),
  controller.getItem
);

// POST: Invalida cache ao criar
router.post('/items',
  invalidateCacheMiddleware('item:*'),
  controller.createItem
);

// PUT: Invalida item específico
router.put('/items/:id',
  invalidateCacheMiddleware((req) => `item:${req.params.id}`),
  invalidateCacheMiddleware('GET:/items*'), // Invalida listagens
  controller.updateItem
);

// DELETE: Invalida item e listagens
router.delete('/items/:id',
  invalidateCacheMiddleware((req) => `item:${req.params.id}`),
  invalidateCacheMiddleware('GET:/items*'),
  controller.deleteItem
);
```

---

## Middleware de Invalidação

### invalidateCacheMiddleware()

Invalida cache automaticamente quando dados são modificados.

**Assinatura:**
```typescript
function invalidateCacheMiddleware(
  pattern: string | ((req: Request) => string)
): Middleware
```

**Parâmetros:**
- `pattern` - Padrão de chaves a invalidar ou função que retorna padrão

**Quando usar:**
- POST: Ao criar novos registros
- PUT/PATCH: Ao atualizar registros
- DELETE: Ao remover registros

**Padrões suportados:**
```typescript
'item:*'           // Todas as chaves que começam com 'item:'
'item:123:*'       // Todas as chaves do item 123
'*:list'           // Todas as listas
'GET:/items*'      // Todas as rotas de items
```

**Exemplos:**

```typescript
// Padrão fixo
invalidateCacheMiddleware('item:*')

// Padrão dinâmico
invalidateCacheMiddleware((req) => `item:${req.params.id}:*`)

// Múltiplos padrões
router.post('/items',
  invalidateCacheMiddleware('item:*'),
  invalidateCacheMiddleware('GET:/items*'),
  invalidateCacheMiddleware('stats:*'),
  controller.createItem
);
```

---

## Presets de Cache

### createCachePreset()

Factory function para criar middlewares com presets pré-configurados.

**Assinatura:**
```typescript
function createCachePreset(
  preset: 'short' | 'medium' | 'long'
): Middleware
```

**Presets disponíveis:**

| Preset | TTL | Uso recomendado |
|--------|-----|-----------------|
| `short` | 60s (1 min) | Dados voláteis, stats em tempo real |
| `medium` | 300s (5 min) | Dados normais, listagens |
| `long` | 900s (15 min) | Dados estáveis, configurações |

**Exemplos:**

```typescript
import { createCachePreset } from '@shared/middlewares/cache.middleware';

// Cache curto para stats
const shortCache = createCachePreset('short');
router.get('/stats', shortCache, controller.getStats);

// Cache médio para listagens
const mediumCache = createCachePreset('medium');
router.get('/items', mediumCache, controller.getItems);

// Cache longo para configurações
const longCache = createCachePreset('long');
router.get('/config', longCache, controller.getConfig);
```

---

## Desabilitar Cache

### noCache()

Middleware que desabilita cache completamente (navegador + proxy).

**Assinatura:**
```typescript
function noCache(req: Request, res: Response, next: NextFunction): void
```

**Headers adicionados:**
```http
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
```

**Quando usar:**
- Dados sensíveis (saldos, senhas)
- Dados em tempo real (cotações, live data)
- Endpoints de autenticação
- Dados únicos por usuário

**Exemplos:**

```typescript
import { noCache } from '@shared/middlewares/cache.middleware';

// Dados sensíveis
router.get('/user/balance', noCache, controller.getBalance);

// Dados em tempo real
router.get('/live-data', noCache, controller.getLiveData);

// Autenticação
router.post('/login', noCache, controller.login);

// Checkout
router.post('/checkout', noCache, controller.checkout);
```

---

## Chaves de Cache

### Chave Padrão

Formato: `METHOD:PATH:SORTED_QUERY`

**Exemplos:**
```typescript
GET /items
→ 'GET:/items'

GET /items?sort=name&limit=10
→ 'GET:/items:limit=10&sort=name'

GET /items/123
→ 'GET:/items/123'

GET /search?q=test&page=2
→ 'GET:/search:page=2&q=test'
```

**Observações:**
- Query parameters são ordenados alfabeticamente
- Garante consistência na geração de chaves
- Usa `generateCacheKey()` do CacheManager

---

### Chave Customizada

Use `keyGenerator` para chaves específicas:

```typescript
// Por ID do recurso
keyGenerator: (req) => `item:${req.params.id}`

// Por usuário
keyGenerator: (req) => `user:${req.user.id}:profile`

// Por tenant
keyGenerator: (req) => `tenant:${req.tenant.id}:data`

// Combinado
keyGenerator: (req) => {
  const { id } = req.params;
  const { expand } = req.query;
  return expand ? `item:${id}:full` : `item:${id}:basic`;
}
```

---

## Headers de Debug

O middleware adiciona headers para facilitar debugging:

### X-Cache

Indica se resposta veio do cache.

```http
X-Cache: HIT    # Resposta cacheada
X-Cache: MISS   # Resposta do banco
```

### X-Cache-Key

Mostra a chave usada no cache.

```http
X-Cache-Key: GET:/items:limit=10&sort=name
```

**Uso em desenvolvimento:**
```bash
# Verificar headers
curl -v http://localhost:3000/api/items

# Primeira requisição (MISS)
< X-Cache: MISS
< X-Cache-Key: GET:/items

# Segunda requisição (HIT)
< X-Cache: HIT
< X-Cache-Key: GET:/items
```

---

## Quando Cachear

### ✅ Cenários Ideais

**1. Dados que mudam pouco**
```typescript
// Configurações do sistema
router.get('/settings', cacheMiddleware({ ttl: 900 }), controller);

// Categorias de produtos
router.get('/categories', cacheMiddleware({ ttl: 600 }), controller);
```

**2. Queries pesadas**
```typescript
// Relatórios complexos
router.get('/reports/sales', cacheMiddleware({ ttl: 300 }), controller);

// Agregações
router.get('/analytics/summary', cacheMiddleware({ ttl: 180 }), controller);
```

**3. Dados muito consultados (hot data)**
```typescript
// Top 10 produtos
router.get('/products/top', cacheMiddleware({ ttl: 300 }), controller);

// Featured items
router.get('/featured', cacheMiddleware({ ttl: 600 }), controller);
```

**4. Leituras frequentes**
```typescript
// Detalhes de item popular
router.get('/items/:id', cacheMiddleware({
  ttl: 600,
  keyGenerator: (req) => `item:${req.params.id}`
}), controller);
```

---

### ❌ Quando NÃO Cachear

**1. Dados em tempo real**
```typescript
// Stats ao vivo
router.get('/live-stats', noCache, controller);

// Cotações
router.get('/quotes/current', noCache, controller);
```

**2. Dados sensíveis por usuário**
```typescript
// Saldo da conta
router.get('/user/balance', noCache, controller);

// Histórico de transações
router.get('/user/transactions', noCache, controller);
```

**3. Respostas de erro**
```typescript
// Já é comportamento padrão (condition: status === 200)
// Erros 4xx e 5xx não são cacheados
```

**4. Dados únicos por sessão**
```typescript
// Carrinho de compras
router.get('/cart', noCache, controller);

// Estado de checkout
router.get('/checkout/status', noCache, controller);
```

---

## Estratégias de Cache

### Estratégia 1: Cache por Camada

```typescript
// Camada 1: Listagens (cache curto)
router.get('/items',
  cacheMiddleware({ ttl: 60 }),
  controller.getItems
);

// Camada 2: Detalhes (cache médio)
router.get('/items/:id',
  cacheMiddleware({ ttl: 300 }),
  controller.getItem
);

// Camada 3: Configurações (cache longo)
router.get('/categories',
  cacheMiddleware({ ttl: 900 }),
  controller.getCategories
);
```

---

### Estratégia 2: Cache por Volatilidade

```typescript
// Dados estáveis: cache longo
router.get('/countries', cacheMiddleware({ ttl: 3600 }), controller);

// Dados moderados: cache médio
router.get('/products', cacheMiddleware({ ttl: 300 }), controller);

// Dados voláteis: cache curto
router.get('/prices', cacheMiddleware({ ttl: 30 }), controller);
```

---

### Estratégia 3: Cache Seletivo

```typescript
// Só cacheia se tem filtros
router.get('/items', cacheMiddleware({
  ttl: 300,
  condition: (req) => {
    const { category, brand } = req.query;
    return !!(category || brand); // Só cacheia buscas filtradas
  }
}), controller);
```

---

### Estratégia 4: Cache por Tenant

```typescript
// Cache isolado por tenant
router.get('/data', cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => {
    const tenantId = req.tenant.id;
    const path = req.path;
    return `tenant:${tenantId}:${path}`;
  }
}), controller);
```

---

## Performance

### Métricas Típicas

| Cenário | Sem Cache | Com Cache | Melhoria |
|---------|-----------|-----------|----------|
| Query simples | 50ms | 1-2ms | **96%** |
| Query complexa | 500ms | 1-2ms | **99.6%** |
| Join pesado | 2000ms | 1-2ms | **99.9%** |
| Agregação | 1000ms | 1-2ms | **99.8%** |

### Hit Rate Esperado

```typescript
// Bom: 70-80% hit rate
// Ótimo: 80-90% hit rate
// Excelente: 90%+ hit rate

// Monitorar com:
GET /cache/stats
```

---

## Monitoramento

### Verificar Status do Cache

```typescript
import { CacheManager } from '@shared/utils/cacheManager';

// Endpoint de stats
router.get('/cache/stats', async (req, res) => {
  const stats = await CacheManager.getStats();
  res.json({
    size: stats.size,        // Número de chaves
    hits: stats.hits,        // Número de HITs
    misses: stats.misses,    // Número de MISSEs
    hitRate: stats.hitRate,  // Taxa de acerto (%)
    memory: stats.memory     // Uso de memória
  });
});
```

### Limpar Cache Manualmente

```typescript
// Limpar tudo
router.post('/cache/clear', async (req, res) => {
  await CacheManager.clear();
  res.json({ message: 'Cache limpo' });
});

// Limpar por padrão
router.post('/cache/invalidate', async (req, res) => {
  const { pattern } = req.body;
  const removed = await CacheManager.invalidate(pattern);
  res.json({ removed });
});
```

---

## Boas Práticas

### ✅ DO

**1. Use TTL apropriado**
```typescript
// Dados estáveis: TTL longo
cacheMiddleware({ ttl: 900 })

// Dados voláteis: TTL curto
cacheMiddleware({ ttl: 60 })
```

**2. Invalide cache ao mutar**
```typescript
router.put('/items/:id',
  invalidateCacheMiddleware((req) => `item:${req.params.id}`),
  controller.updateItem
);
```

**3. Use chaves descritivas**
```typescript
keyGenerator: (req) => `item:${req.params.id}:full`
// ✅ Claro e específico
```

**4. Monitore hit rate**
```typescript
// Objetivo: 70%+ hit rate
// Se < 70%: revisar estratégia de cache
```

**5. Cache apenas GET**
```typescript
// Já é comportamento padrão
// POST/PUT/DELETE não são cacheados
```

---

### ❌ DON'T

**1. Não cacheia dados sensíveis**
```typescript
// ❌ NÃO faça
router.get('/user/password', cacheMiddleware(), controller);

// ✅ Use noCache
router.get('/user/password', noCache, controller);
```

**2. Não use TTL muito longo**
```typescript
// ❌ NÃO faça (1 hora)
cacheMiddleware({ ttl: 3600 })

// ✅ Máximo recomendado: 15 minutos
cacheMiddleware({ ttl: 900 })
```

**3. Não cacheia erros**
```typescript
// Já é comportamento padrão
// condition: (req, res) => res.statusCode === 200
```

**4. Não ignore invalidação**
```typescript
// ❌ NÃO faça
router.put('/items/:id', controller.updateItem);

// ✅ Invalide o cache
router.put('/items/:id',
  invalidateCacheMiddleware('item:*'),
  controller.updateItem
);
```

---

## Limitações

### Cache em Memória

⚠️ **Limitações:**
- Cache é perdido ao reiniciar servidor
- Não compartilhado entre instâncias
- Limitado pela RAM disponível
- Não persiste após deploy

**Solução para produção:**
```typescript
// Use Redis para cache distribuído
import { RedisCache } from '@shared/utils/redisCache';
// Implementação em outro módulo
```

---

### Apenas GET

⚠️ **Por que:**
- POST/PUT/DELETE modificam dados
- Não faz sentido cachear mutações
- Apenas leituras são idempotentes

---

## Troubleshooting

### Cache não está funcionando

**Verificar:**
1. Método é GET? (apenas GET é cacheado)
2. Status é 200? (padrão: só 200 é cacheado)
3. TTL está correto? (não expirado)
4. CacheManager está inicializado?

**Debug:**
```bash
# Verificar headers
curl -v http://localhost:3000/api/items
# Deve ter X-Cache: HIT ou MISS
```

---

### Hit rate muito baixo

**Causas comuns:**
1. TTL muito curto
2. Cache sendo invalidado demais
3. Queries com parâmetros diferentes
4. Dados mudando muito

**Soluções:**
```typescript
// Aumentar TTL
cacheMiddleware({ ttl: 600 })

// Normalizar query params
keyGenerator: (req) => {
  const { sort = 'name', page = 1 } = req.query;
  return `items:sort:${sort}:page:${page}`;
}
```

---

### Dados desatualizados

**Causa:**
- Cache não está sendo invalidado

**Solução:**
```typescript
// Adicionar invalidação nos endpoints de mutação
router.put('/items/:id',
  invalidateCacheMiddleware('item:*'),
  controller.updateItem
);
```

---

## Referências

### Arquivos Relacionados

- `cacheManager.ts` - Gerenciador de cache
- `logger.ts` - Sistema de logs
- `CacheManager.md` - Documentação do cache manager

### Conceitos

- **TTL (Time To Live)** - Tempo de vida do cache
- **Hit Rate** - Taxa de acerto do cache
- **Cache Key** - Chave única do cache
- **Cache Invalidation** - Limpeza de cache desatualizado

---

## Resumo

### O que é

Middleware Express para cache de respostas HTTP em memória.

### Exports

- **cacheMiddleware** - Cache principal
- **invalidateCacheMiddleware** - Invalidação por mutação
- **createCachePreset** - Factory de presets
- **noCache** - Desabilitar cache

### Quando usar

- ✅ Dados estáveis ou semi-estáveis
- ✅ Queries pesadas
- ✅ Dados muito consultados
- ✅ Leituras frequentes

### Vantagens

- ✅ Reduz carga no banco em 70-90%
- ✅ Melhora resposta em 80-95%
- ✅ TTL configurável
- ✅ Invalidação automática
- ✅ Headers de debug
- ✅ Fácil de usar