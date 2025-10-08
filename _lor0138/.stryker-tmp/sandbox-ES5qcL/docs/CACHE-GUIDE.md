# Cache de Queries - Guia Completo

## O Que É Cache de Queries?

Cache de queries armazena resultados de consultas ao banco de dados em memória, reduzindo:
- Carga no banco de dados
- Tempo de resposta das requisições
- Custos de processamento

## Implementação

### 1. Instalação de Dependências

```bash
npm install node-cache
npm install --save-dev @types/node-cache
```

### 2. Arquitetura

```
CacheManager (Singleton)
├── node-cache (motor de cache)
├── Estatísticas (hits/misses)
├── Invalidação automática (TTL)
└── Invalidação manual (padrões)

Middlewares
├── cacheMiddleware - Cacheia respostas HTTP
└── invalidateCacheMiddleware - Invalida ao mutar dados

Decorators
└── @Cacheable - Cacheia métodos automaticamente
```

### 3. Variáveis de Ambiente

```env
# Cache
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
CACHE_CHECK_PERIOD=600

# TTLs específicos
CACHE_ITEM_TTL=600
CACHE_ESTABELECIMENTO_TTL=900
CACHE_HEALTH_TTL=30
```

## Como Usar

### Opção 1: Cache HTTP (Middleware)

Cacheia respostas de endpoints GET automaticamente.

```typescript
// routes/item.routes.ts
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';

// Cache padrão (5 minutos)
router.get('/items', cacheMiddleware(), controller.getItems);

// Cache customizado
router.get('/items/:id', cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `item:${req.params.id}`,
  condition: (req, res) => res.statusCode === 200
}), controller.getItem);
```

### Opção 2: Cache no Repository (Manual)

Controle total sobre o cache.

```typescript
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';

export class ItemRepository {
  private cache = CacheManager.getInstance();

  async getItem(id: string) {
    const cacheKey = generateCacheKey('item', id);

    // Cache-aside pattern
    return this.cache.getOrSet(
      cacheKey,
      () => this.fetchFromDatabase(id),
      600 // 10 minutos
    );
  }

  private async fetchFromDatabase(id: string) {
    return await DatabaseManager.query('...');
  }
}
```

### Opção 3: Decorator (Mais Limpo)

Cache automático em métodos.

```typescript
import { Cacheable } from '@shared/utils/cacheManager';

export class ItemService {
  @Cacheable('item', 600) // namespace + TTL
  async getItem(id: string) {
    return await this.repository.findById(id);
  }
}
```

## Invalidação de Cache

### Invalidação Automática (TTL)

Cache expira automaticamente após TTL.

```typescript
// Expira em 5 minutos
cache.set('key', value, 300);
```

### Invalidação Manual

```typescript
// Chave específica
cache.delete('item:7530110');

// Padrão (wildcard)
cache.invalidate('item:*');           // Todos os itens
cache.invalidate('item:7530110:*');   // Item específico
cache.invalidate('GET:/api/*');       // Todas as requisições GET
```

### Invalidação em Mutations

```typescript
import { invalidateCacheMiddleware } from '@shared/middlewares/cache.middleware';

// POST/PUT/DELETE invalidam cache automaticamente
router.post('/items', 
  invalidateCacheMiddleware('item:*'), 
  controller.createItem
);

router.put('/items/:id', 
  invalidateCacheMiddleware((req) => `item:${req.params.id}:*`),
  controller.updateItem
);
```

## Endpoints de Gerenciamento

### GET /cache/stats

Estatísticas de uso do cache.

```bash
curl http://lor0138.lorenzetti.ibe:3000/cache/stats
```

**Resposta:**
```json
{
  "stats": {
    "hits": 150,
    "misses": 30,
    "keys": 45,
    "hitRate": 83.33
  },
  "config": {
    "stdTTL": 300,
    "checkperiod": 600,
    "enabled": true
  }
}
```

### GET /cache/keys

Lista todas as chaves em cache.

```bash
curl http://lor0138.lorenzetti.ibe:3000/cache/keys
```

### POST /cache/clear

Limpa todo o cache.

```bash
curl -X POST http://lor0138.lorenzetti.ibe:3000/cache/clear
```

### DELETE /cache/invalidate/:pattern

Invalida cache por padrão.

```bash
# Todos os itens
curl -X DELETE http://lor0138.lorenzetti.ibe:3000/cache/invalidate/item:*

# Item específico
curl -X DELETE http://lor0138.lorenzetti.ibe:3000/cache/invalidate/item:7530110:*
```

## Estratégias de Cache

### 1. Cache-Aside (Lazy Loading)

Carrega no cache apenas quando necessário.

```typescript
async getData(key: string) {
  return cache.getOrSet(key, () => fetchFromDB(key), 300);
}
```

**Vantagens:**
- Apenas dados acessados são cacheados
- Menor uso de memória

**Desvantagens:**
- Primeiro acesso é lento (cache miss)

### 2. Write-Through

Atualiza cache ao escrever no banco.

```typescript
async updateData(key: string, value: any) {
  await database.update(key, value);
  cache.set(key, value, 300);
}
```

**Vantagens:**
- Cache sempre atualizado

**Desvantagens:**
- Mais operações de escrita

### 3. Write-Behind (Write-Back)

Escreve no cache, salva no banco depois.

```typescript
async updateData(key: string, value: any) {
  cache.set(key, value, 300);
  // Salva no banco em background
  queueDatabaseWrite(key, value);
}
```

**Vantagens:**
- Escrita muito rápida

**Desvantagens:**
- Risco de perda de dados

## Headers HTTP de Cache

O middleware adiciona headers para debug:

```http
# Cache HIT
X-Cache: HIT
X-Cache-Key: GET:/api/items/7530110

# Cache MISS
X-Cache: MISS
X-Cache-Key: GET:/api/items/7530110
```

## Monitoramento

### Métricas Importantes

1. **Hit Rate**: Taxa de acerto do cache
   - **Bom**: > 80%
   - **Aceitável**: 60-80%
   - **Ruim**: < 60%

2. **Número de Chaves**: Chaves em cache
   - Muitas chaves = muito uso de memória

3. **Hits/Misses**: Acessos ao cache
   - Muitos misses = TTL muito baixo ou dados pouco acessados

### Logging

```typescript
log.debug('Cache HIT', { key, hitRate: 85.5 });
log.debug('Cache MISS', { key, hitRate: 85.5 });
log.info('Cache invalidado', { pattern: 'item:*', removed: 12 });
```

## Troubleshooting

### Problema: Hit Rate Baixo

**Causas:**
- TTL muito baixo
- Dados pouco acessados
- Padrões de invalidação muito agressivos

**Solução:**
```env
# Aumentar TTL
CACHE_ITEM_TTL=1800  # 30 minutos
```

### Problema: Uso Alto de Memória

**Causas:**
- Muitas chaves em cache
- TTL muito alto
- Valores muito grandes

**Solução:**
```env
# Reduzir TTL
CACHE_DEFAULT_TTL=120  # 2 minutos

# Limpar cache periodicamente
curl -X POST http://lor0138.lorenzetti.ibe:3000/cache/clear
```

### Problema: Dados Desatualizados

**Causas:**
- Cache não invalida ao mutar dados
- TTL muito alto

**Solução:**
```typescript
// Invalidar ao atualizar
router.put('/items/:id', 
  invalidateCacheMiddleware((req) => `item:${req.params.id}:*`),
  controller.updateItem
);
```

## Boas Práticas

### DO's

1. **Use TTL apropriado** para cada tipo de dado
2. **Invalide cache** ao mutar dados
3. **Monitore hit rate** regularmente
4. **Use namespaces** para organizar chaves
5. **Documente** padrões de chave

### DON'Ts

1. **Não cachear** dados sensíveis sem encriptação
2. **Não usar TTL** muito alto (> 1 hora)
3. **Não cachear** dados que mudam frequentemente
4. **Não esquecer** de invalidar em mutations
5. **Não cachear** respostas de erro

## Padrões de Chave Recomendados

```
# Recursos individuais
<tipo>:<id>:<operação>
item:7530110:informacoesGerais
item:7530110:estoque
estabelecimento:01.01:dados

# Listas
<tipo>:list:<filtros>
item:list:ativos
item:list:categoria:eletronica

# Requisições HTTP
<método>:<path>:<query>
GET:/api/items/7530110
GET:/api/items:page=1&limit=10
```

## Integração com Ferramentas

### Redis (Futuro)

Para distribuir cache entre múltiplos servidores:

```typescript
// Trocar node-cache por redis
import Redis from 'ioredis';
const redis = new Redis();

cache.set = (key, value, ttl) => redis.setex(key, ttl, JSON.stringify(value));
cache.get = async (key) => JSON.parse(await redis.get(key));
```

### Prometheus (Métricas)

```typescript
// Exportar métricas para Prometheus
const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total de cache hits'
});

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total de cache misses'
});
```

## Checklist de Implementação

- [ ] node-cache instalado
- [ ] CacheManager criado
- [ ] Variáveis de ambiente configuradas
- [ ] Middleware de cache implementado
- [ ] Endpoints de gerenciamento criados
- [ ] Repository atualizado com cache
- [ ] Invalidação em mutations
- [ ] Documentação Swagger
- [ ] Testes criados
- [ ] Monitoramento ativo

---

**Status**: Pronto para implementação  
**Complexidade**: Média  
**Impacto**: Alto (reduz carga do banco em 70-90%)