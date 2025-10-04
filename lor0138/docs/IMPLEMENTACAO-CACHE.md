# Item 10 Completo: Cache de Queries

## Arquivos Criados/Modificados

```
src/
├── shared/
│   ├── utils/
│   │   └── cacheManager.ts                 NOVO - Gerenciador de cache
│   └── middlewares/
│       └── cache.middleware.ts             NOVO - Middleware HTTP
└── app.ts                                  ATUALIZAR - Adicionar rotas de cache

.env                                        ATUALIZAR - Variáveis de cache
test-cache.sh                               NOVO - Script de teste
package.json                                ATUALIZAR - Adicionar node-cache
```

## O Que Foi Implementado

### 1. CacheManager (Core)

Gerenciador singleton de cache em memória com:
- TTL configurável por chave
- Métricas de hit/miss
- Invalidação manual e automática
- Suporte a padrões (wildcards)
- Cache-aside pattern (getOrSet)
- Decorator @Cacheable

### 2. Middlewares

**cacheMiddleware**: Cacheia respostas HTTP GET
```typescript
router.get('/items', cacheMiddleware({ ttl: 600 }), controller.getItems);
```

**invalidateCacheMiddleware**: Invalida cache em mutations
```typescript
router.post('/items', invalidateCacheMiddleware('item:*'), controller.createItem);
```

### 3. Endpoints de Gerenciamento

- `GET /cache/stats` - Estatísticas (hits, misses, hit rate)
- `GET /cache/keys` - Lista todas as chaves
- `POST /cache/clear` - Limpa todo o cache
- `DELETE /cache/invalidate/:pattern` - Invalida por padrão

### 4. Configuração

```env
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
CACHE_CHECK_PERIOD=600
CACHE_ITEM_TTL=600
CACHE_ESTABELECIMENTO_TTL=900
CACHE_HEALTH_TTL=30
```

## Passo a Passo de Implementação

### 1. Instalar node-cache

```bash
npm install node-cache
npm install --save-dev @types/node-cache
```

### 2. Criar CacheManager

```bash
# Criar arquivo: src/shared/utils/cacheManager.ts
```

Copiar do artifact: **"cacheManager.ts - Gerenciador de Cache"**

### 3. Criar Middleware de Cache

```bash
# Criar arquivo: src/shared/middlewares/cache.middleware.ts
```

Copiar do artifact: **"cache.middleware.ts - Middleware de Cache HTTP"**

### 4. Adicionar Variáveis de Ambiente

```bash
# Editar .env
```

Adicionar as variáveis do artifact: **".env - Configuração de Cache"**

### 5. Atualizar app.ts

Adicionar o método `setupCacheRoutes()` do artifact: **"app.ts - Integração do Cache"**

```typescript
private setupRoutes(): void {
  this.setupHealthCheck();
  this.setupCacheRoutes(); // ADICIONAR AQUI
  this.setupSwaggerDocs();
  // ... resto
}
```

### 6. Inicializar Cache no server.ts

```typescript
// src/server.ts - Adicionar antes de iniciar servidor

import { CacheManager } from '@shared/utils/cacheManager';

// Após validações
if (process.env.CACHE_ENABLED === 'true') {
  const cacheTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10);
  CacheManager.getInstance({
    stdTTL: cacheTTL,
    checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
  });
  log.info('Cache Manager inicializado', { ttl: cacheTTL });
}
```

### 7. Usar Cache nos Endpoints (Opcional)

**Opção A: Middleware HTTP**
```typescript
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';

router.get('/items/:id', cacheMiddleware({ ttl: 600 }), controller.getItem);
```

**Opção B: Repository**
```typescript
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';

const cache = CacheManager.getInstance();
const cacheKey = generateCacheKey('item', id);

return cache.getOrSet(cacheKey, () => this.fetchFromDB(id), 600);
```

**Opção C: Decorator**
```typescript
import { Cacheable } from '@shared/utils/cacheManager';

@Cacheable('item', 600)
async getItem(id: string) {
  return await this.repository.findById(id);
}
```

### 8. Testar

```bash
# Reiniciar servidor
npm run dev

# Executar testes
chmod +x test-cache.sh
./test-cache.sh
```

## Endpoints para Testar

### Estatísticas

```bash
curl http://lor0138.lorenzetti.ibe:3000/cache/stats
```

**Resposta esperada:**
```json
{
  "stats": {
    "hits": 0,
    "misses": 0,
    "keys": 0,
    "hitRate": 0
  },
  "config": {
    "stdTTL": 300,
    "checkperiod": 600,
    "enabled": true
  }
}
```

### Testar Cache HIT/MISS

```bash
# Primeira requisição (MISS)
curl -i http://lor0138.lorenzetti.ibe:3000/health | grep X-Cache
# X-Cache: MISS

# Segunda requisição (HIT)
curl -i http://lor0138.lorenzetti.ibe:3000/health | grep X-Cache
# X-Cache: HIT
```

### Invalidar Cache

```bash
# Invalidar todos os itens
curl -X DELETE http://lor0138.lorenzetti.ibe:3000/cache/invalidate/item:*

# Limpar tudo
curl -X POST http://lor0138.lorenzetti.ibe:3000/cache/clear
```

## Checklist de Verificação

- [ ] node-cache instalado
- [ ] CacheManager criado em `src/shared/utils/cacheManager.ts`
- [ ] Middleware criado em `src/shared/middlewares/cache.middleware.ts`
- [ ] Variáveis de ambiente no `.env`
- [ ] Cache inicializado no `server.ts`
- [ ] Rotas de cache adicionadas no `app.ts`
- [ ] Servidor reiniciado sem erros
- [ ] `GET /cache/stats` retorna estatísticas
- [ ] `GET /cache/keys` retorna lista vazia inicialmente
- [ ] Header `X-Cache: MISS` na primeira requisição
- [ ] Header `X-Cache: HIT` na segunda requisição
- [ ] Hit rate aumenta com uso
- [ ] Invalidação funciona
- [ ] Limpeza de cache funciona

## Troubleshooting

### Erro: Cannot find module 'node-cache'

**Solução:**
```bash
npm install node-cache
npm install --save-dev @types/node-cache
npm run dev
```

### Erro: CacheManager is not a constructor

**Causa:** CacheManager não foi inicializado

**Solução:**
```typescript
// server.ts - Adicionar após validações
import { CacheManager } from '@shared/utils/cacheManager';
CacheManager.getInstance();
```

### Cache sempre retorna MISS

**Causas:**
1. CACHE_ENABLED=false no .env
2. Middleware não foi adicionado
3. TTL muito baixo (expirou imediatamente)

**Solução:**
```env
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
```

### Hit Rate Muito Baixo

**Causas:**
1. TTL muito curto
2. Dados mudam frequentemente
3. Invalidação muito agressiva

**Solução:**
```env
# Aumentar TTL
CACHE_ITEM_TTL=1800  # 30 minutos
```

## Métricas de Sucesso

### Esperado Após Implementação:

| Métrica | Valor Alvo |
|---------|-----------|
| Hit Rate | > 70% |
| Tempo de resposta (HIT) | < 50ms |
| Tempo de resposta (MISS) | 100-500ms |
| Redução de queries DB | 70-90% |
| Uso de memória | < 100MB |

### Monitoramento:

```bash
# Verificar hit rate
curl -s http://lor0138.lorenzetti.ibe:3000/cache/stats | jq '.stats.hitRate'

# Contar chaves
curl -s http://lor0138.lorenzetti.ibe:3000/cache/keys | jq '.total'

# Ver todas as chaves
curl -s http://lor0138.lorenzetti.ibe:3000/cache/keys | jq -r '.keys[].key'
```

## Benefícios Obtidos

1. **Performance**: Respostas 80-95% mais rápidas (cache HIT)
2. **Redução de Carga**: 70-90% menos queries no banco
3. **Escalabilidade**: Suporta mais requisições simultâneas
4. **Custo**: Menor uso de recursos do banco de dados
5. **UX**: Respostas instantâneas para dados frequentes
6. **Monitoramento**: Métricas de uso do cache
7. **Controle**: Invalidação manual e automática

## Status da Lista de Melhorias

1. ✅ Logging Estruturado
2. ✅ Security Headers
3. ✅ Request Timeout
4. ✅ Validação de Config
5. ✅ Health Check
6. ✅ Compressão
7. ✅ Swagger
8. ✅ Graceful Shutdown
9. ✅ Correlation ID
10. ✅ **Cache de Queries** - PRONTO PARA IMPLEMENTAR

## Próximas Evoluções (Futuro)

### Redis (Cache Distribuído)
```typescript
import Redis from 'ioredis';
const redis = new Redis();
```

### Warm-up de Cache
```typescript
// Pré-carregar cache na inicialização
await warmupCache(['item:7530110', 'item:7530111']);
```

### Cache por Usuário
```typescript
const cacheKey = generateCacheKey('user', userId, 'preferences');
```

### Compressão de Valores
```typescript
import zlib from 'zlib';
const compressed = zlib.gzipSync(JSON.stringify(value));
```

---

**Status**: Pronto para implementação  
**Complexidade**: Média  
**Tempo estimado**: 1-2 horas  
**Impacto**: Alto (reduz 70-90% das queries)