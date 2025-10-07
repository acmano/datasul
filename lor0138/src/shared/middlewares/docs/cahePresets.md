# Presets de Cache HTTP

**Arquivo:** `src/shared/middlewares/cachePresets.ts`
**Tipo:** Presets de Middleware
**Propósito:** Middlewares de cache pré-configurados por tipo de recurso

---

## Visão Geral

Define middlewares de cache pré-configurados com TTLs específicos para diferentes tipos de recursos da aplicação. Facilita aplicação consistente de políticas de cache em toda a API.

### Benefícios

- ✅ Configuração consistente de cache
- ✅ TTLs apropriados por tipo de recurso
- ✅ Configurável via variáveis de ambiente
- ✅ Fácil de usar (import e aplique)
- ✅ Manutenção centralizada
- ✅ Fácil adição de novos presets

---

## Presets Disponíveis

| Preset | TTL Padrão | Uso | Env Var |
|--------|-----------|-----|---------|
| `healthCache` | 30s | Health checks | `CACHE_HEALTH_TTL` |
| `itemCache` | 600s (10min) | Dados de itens | `CACHE_ITEM_TTL` |
| `estabelecimentoCache` | 900s (15min) | Estabelecimentos | `CACHE_ESTABELECIMENTO_TTL` |

---

## healthCache

Cache para endpoints de health check.

### Configuração

```typescript
export const healthCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_HEALTH_TTL || '30', 10)
});
```

**TTL Padrão:** 30 segundos
**Variável de Ambiente:** `CACHE_HEALTH_TTL`
**Formato:** Número inteiro em segundos

### Características

- **TTL muito curto** (30s)
- Reduz carga em verificações frequentes
- Mantém informações atualizadas
- Útil para dashboards de monitoramento

### Quando Usar

✅ **Casos ideais:**

```typescript
import { healthCache } from '@shared/middlewares/cachePresets';

// Health checks gerais
router.get('/health', healthCache, healthController.check);

// Health checks específicos
router.get('/health/database', healthCache, healthController.database);
router.get('/health/redis', healthCache, healthController.redis);

// Status do sistema
router.get('/status', healthCache, statusController.get);

// Métricas básicas
router.get('/metrics/basic', healthCache, metricsController.basic);
```

### Quando NÃO Usar

❌ **Evite em:**

```typescript
// Checks críticos de saúde (sem cache)
router.get('/health/critical', noCache, healthController.critical);

// Alertas em tempo real (sem cache)
router.get('/alerts', noCache, alertsController.get);

// Monitoramento crítico (sem cache)
router.get('/monitoring/critical', noCache, monitoringController.critical);
```

### Recomendações

**TTL Recomendado:**
- Mínimo: 10s
- Padrão: 30s
- Máximo: 60s

**Observações:**
- ⚠️ 30s pode ocultar problemas intermitentes
- ⚠️ Para alertas críticos, desabilite cache completamente
- ✅ Ideal para dashboards que consultam a cada 30s+

---

## itemCache

Cache para dados cadastrais de itens.

### Configuração

```typescript
export const itemCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ITEM_TTL || '600', 10)
});
```

**TTL Padrão:** 600 segundos (10 minutos)
**Variável de Ambiente:** `CACHE_ITEM_TTL`
**Formato:** Número inteiro em segundos

### Características

- **TTL médio** (10min)
- Boa redução de carga no banco
- Balanceamento entre atualização e performance
- Adequado para dados que mudam algumas vezes por dia

### Quando Usar

✅ **Casos ideais:**

```typescript
import { itemCache } from '@shared/middlewares/cachePresets';

// Consultas por código
router.get('/items/:id', itemCache, itemController.getItem);

// Informações gerais
router.get('/items/:id/informacoesGerais',
  itemCache,
  controller.getInformacoesGerais
);

// Dados cadastrais
router.get('/items/:id/dadosCadastrais',
  itemCache,
  controller.getDadosCadastrais
);

// Listagens (com paginação)
router.get('/items', itemCache, itemController.list);

// Especificações técnicas
router.get('/items/:id/especificacoes',
  itemCache,
  controller.getEspecificacoes
);
```

### Quando NÃO Usar

❌ **Evite em:**

```typescript
// Preços em tempo real (use TTL curto ou sem cache)
router.get('/items/:id/preco', noCache, itemController.getPreco);

// Estoque crítico (sem cache)
router.get('/items/:id/estoque', noCache, itemController.getEstoque);

// Disponibilidade urgente
router.get('/items/:id/disponibilidade',
  noCache,
  itemController.getDisponibilidade
);

// Dados de pedidos em andamento
router.get('/items/:id/pedidos/ativos',
  noCache,
  itemController.getPedidosAtivos
);
```

### Invalidação

**IMPORTANTE:** Sempre invalide o cache ao atualizar itens:

```typescript
import {
  itemCache,
  invalidateCacheMiddleware
} from '@shared/middlewares';

// GET: Usa cache
router.get('/items/:id', itemCache, itemController.getItem);

// PUT: Invalida cache
router.put('/items/:id',
  invalidateCacheMiddleware((req) => `item:${req.params.id}:*`),
  invalidateCacheMiddleware('GET:/items*'), // Invalida listagens
  itemController.updateItem
);

// POST: Invalida listagens
router.post('/items',
  invalidateCacheMiddleware('GET:/items*'),
  itemController.createItem
);

// DELETE: Invalida tudo relacionado
router.delete('/items/:id',
  invalidateCacheMiddleware((req) => `item:${req.params.id}:*`),
  invalidateCacheMiddleware('GET:/items*'),
  itemController.deleteItem
);
```

### Recomendações

**TTL Recomendado:**
- Mínimo: 60s (1 minuto)
- Padrão: 600s (10 minutos)
- Máximo: 1800s (30 minutos)

**Observações:**
- ✅ Monitore hit rate (objetivo: 70%+)
- ✅ Combine com versionamento quando possível
- ✅ Ajuste TTL baseado em padrão de atualizações
- ⚠️ Para estoque em tempo real, use TTL menor ou sem cache

---

## estabelecimentoCache

Cache para dados de estabelecimentos.

### Configuração

```typescript
export const estabelecimentoCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ESTABELECIMENTO_TTL || '900', 10)
});
```

**TTL Padrão:** 900 segundos (15 minutos)
**Variável de Ambiente:** `CACHE_ESTABELECIMENTO_TTL`
**Formato:** Número inteiro em segundos

### Características

- **TTL longo** (15min)
- Máxima redução de carga no banco
- Dados muito estáveis
- Adequado para dados que mudam raramente

### Quando Usar

✅ **Casos ideais:**

```typescript
import { estabelecimentoCache } from '@shared/middlewares/cachePresets';

// Listagem de estabelecimentos
router.get('/estabelecimentos',
  estabelecimentoCache,
  controller.list
);

// Consulta por código
router.get('/estabelecimentos/:codigo',
  estabelecimentoCache,
  controller.get
);

// Estabelecimentos de um item
router.get('/items/:id/estabelecimentos',
  estabelecimentoCache,
  controller.getByItem
);

// Hierarquia organizacional
router.get('/estabelecimentos/hierarquia',
  estabelecimentoCache,
  controller.getHierarquia
);

// Mapeamento código → nome
router.get('/estabelecimentos/mapping',
  estabelecimentoCache,
  controller.getMapping
);

// Configurações por estabelecimento
router.get('/estabelecimentos/:codigo/config',
  estabelecimentoCache,
  controller.getConfig
);
```

### Quando NÃO Usar

❌ **Evite em:**

```typescript
// Status operacional em tempo real
router.get('/estabelecimentos/:codigo/status',
  noCache,
  controller.getStatus
);

// Dados de integração que mudam frequentemente
router.get('/estabelecimentos/:codigo/integracao',
  noCache,
  controller.getIntegracao
);

// Informações críticas que precisam estar atualizadas
router.get('/estabelecimentos/:codigo/critical',
  noCache,
  controller.getCritical
);
```

### Invalidação

**IMPORTANTE:** TTL longo requer invalidação manual em atualizações:

```typescript
import {
  estabelecimentoCache,
  invalidateCacheMiddleware
} from '@shared/middlewares';

// GET: Usa cache
router.get('/estabelecimentos/:codigo',
  estabelecimentoCache,
  controller.get
);

// PUT: Invalida cache
router.put('/estabelecimentos/:codigo',
  invalidateCacheMiddleware('estabelecimento:*'),
  controller.update
);

// POST: Invalida listagens
router.post('/estabelecimentos',
  invalidateCacheMiddleware('GET:/estabelecimentos*'),
  controller.create
);

// DELETE: Invalida tudo
router.delete('/estabelecimentos/:codigo',
  invalidateCacheMiddleware('estabelecimento:*'),
  invalidateCacheMiddleware('GET:/estabelecimentos*'),
  controller.delete
);
```

### Recomendações

**TTL Recomendado:**
- Mínimo: 300s (5 minutos)
- Padrão: 900s (15 minutos)
- Máximo: 3600s (1 hora)

**Observações:**
- ✅ Ideal para lookups e mapeamentos
- ✅ Considere cache infinito + invalidação para dados quase imutáveis
- ✅ Monitore se TTL é adequado ao seu caso
- ⚠️ TTL longo requer disciplina em invalidação

---

## Criar Novos Presets

### Factory Function

Use `createCachePreset()` para criar novos presets customizados:

```typescript
export function createCachePreset(config: {
  envVar: string;
  defaultTtl: number;
  description?: string;
})
```

### Exemplo: Preset para Clientes

```typescript
import { createCachePreset } from '@shared/middlewares/cachePresets';

/**
 * Cache para dados de clientes (30min padrão)
 * Configurável via CACHE_CLIENTE_TTL
 */
export const clienteCache = createCachePreset({
  envVar: 'CACHE_CLIENTE_TTL',
  defaultTtl: 1800, // 30 minutos
  description: 'Cache para dados de clientes'
});

// Usar em rotas
router.get('/clientes/:id', clienteCache, controller.getCliente);
```

### Exemplo: Preset para Relatórios

```typescript
/**
 * Cache para relatórios pesados (30min padrão)
 * Configurável via CACHE_REPORT_TTL
 */
export const reportCache = createCachePreset({
  envVar: 'CACHE_REPORT_TTL',
  defaultTtl: 1800,
  description: 'Cache para relatórios complexos'
});

// Usar em rotas
router.get('/reports/sales', reportCache, controller.getSalesReport);
```

### Exemplo: Preset para Configurações

```typescript
/**
 * Cache para configurações do sistema (1h padrão)
 * Configurável via CACHE_CONFIG_TTL
 */
export const configCache = createCachePreset({
  envVar: 'CACHE_CONFIG_TTL',
  defaultTtl: 3600, // 1 hora
  description: 'Cache para configurações do sistema'
});

// Usar em rotas
router.get('/config/app', configCache, controller.getAppConfig);
```

---

## Presets Adicionais Sugeridos

### Preset Volatile (Dados Voláteis)

Para dados que mudam frequentemente mas ainda podem ter cache curto:

```typescript
export const volatileCache = createCachePreset({
  envVar: 'CACHE_VOLATILE_TTL',
  defaultTtl: 60, // 1 minuto
  description: 'Cache para dados voláteis'
});

// Uso
router.get('/stats/live', volatileCache, controller.getLiveStats);
```

### Preset Static (Dados Quase Imutáveis)

Para dados que raramente mudam:

```typescript
export const staticCache = createCachePreset({
  envVar: 'CACHE_STATIC_TTL',
  defaultTtl: 3600, // 1 hora
  description: 'Cache para dados quase imutáveis'
});

// Uso
router.get('/countries', staticCache, controller.getCountries);
router.get('/currencies', staticCache, controller.getCurrencies);
```

### Preset List (Listagens Paginadas)

Para listagens com paginação:

```typescript
export const listCache = createCachePreset({
  envVar: 'CACHE_LIST_TTL',
  defaultTtl: 300, // 5 minutos
  description: 'Cache para listagens paginadas'
});

// Uso
router.get('/products', listCache, controller.listProducts);
router.get('/orders', listCache, controller.listOrders);
```

---

## Configuração via Ambiente

### Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Cache TTLs (em segundos)

# Health checks (30s padrão)
CACHE_HEALTH_TTL=30

# Dados de itens (10min padrão)
CACHE_ITEM_TTL=600

# Estabelecimentos (15min padrão)
CACHE_ESTABELECIMENTO_TTL=900

# Novos presets (se criados)
# CACHE_CLIENTE_TTL=1800
# CACHE_REPORT_TTL=1800
# CACHE_CONFIG_TTL=3600
```

### Exemplo: `.env.example`

```env
# ====================================================================
# CACHE CONFIGURATION
# ====================================================================

# Cache TTLs (em segundos)
# Valores padrão são aplicados se não especificados

# Health checks: 30s (recomendado: 10-60)
CACHE_HEALTH_TTL=30

# Dados de itens: 10min (recomendado: 60-1800)
CACHE_ITEM_TTL=600

# Estabelecimentos: 15min (recomendado: 300-3600)
CACHE_ESTABELECIMENTO_TTL=900
```

### Validação de Configuração

Crie utilitário para validar TTLs:

```typescript
// src/shared/config/cacheConfig.ts

export function validateCacheTTL(
  envVar: string,
  defaultValue: number,
  min: number,
  max: number
): number {
  const ttl = parseInt(process.env[envVar] || String(defaultValue), 10);

  if (isNaN(ttl)) {
    console.warn(`Invalid ${envVar}, using default: ${defaultValue}s`);
    return defaultValue;
  }

  if (ttl < min || ttl > max) {
    console.warn(
      `${envVar}=${ttl}s fora do recomendado (${min}-${max}s), usando: ${defaultValue}s`
    );
    return defaultValue;
  }

  return ttl;
}

// Uso
export const itemCache = cacheMiddleware({
  ttl: validateCacheTTL('CACHE_ITEM_TTL', 600, 60, 1800)
});
```

---

## Boas Práticas

### ✅ DO

**1. Use presets consistentemente**
```typescript
// ✅ Todos os endpoints de item usam o mesmo preset
router.get('/items/:id', itemCache, controller.get);
router.get('/items/:id/info', itemCache, controller.getInfo);
```

**2. Configure via ambiente**
```typescript
// ✅ Permite ajuste sem alterar código
export const itemCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ITEM_TTL || '600', 10)
});
```

**3. Documente novos presets**
```typescript
/**
 * Cache para dados de clientes
 * TTL: 30 minutos (padrão)
 * Env: CACHE_CLIENTE_TTL
 * @example
 * router.get('/clientes/:id', clienteCache, controller.get);
 */
export const clienteCache = createCachePreset({...});
```

**4. Invalide ao mutar**
```typescript
// ✅ Sempre invalide cache ao modificar dados
router.put('/items/:id',
  invalidateCacheMiddleware('item:*'),
  controller.update
);
```

**5. Agrupe presets relacionados**
```typescript
// ✅ Mantenha presets organizados por domínio
export const itemCache = ...;
export const itemPriceCache = ...;  // TTL mais curto
export const itemStockCache = ...; // Talvez sem cache
```

---

### ❌ DON'T

**1. Não hardcode TTLs em múltiplos lugares**
```typescript
// ❌ NÃO faça
router.get('/items/:id', cacheMiddleware({ ttl: 600 }), controller);
router.get('/items/:id/info', cacheMiddleware({ ttl: 600 }), controller);

// ✅ Use preset
router.get('/items/:id', itemCache, controller);
router.get('/items/:id/info', itemCache, controller);
```

**2. Não use TTL muito longo sem invalidação**
```typescript
// ❌ Perigoso: 1 hora sem invalidação
export const itemCache = cacheMiddleware({ ttl: 3600 });

// ✅ Use TTL moderado OU adicione invalidação
export const itemCache = cacheMiddleware({ ttl: 600 });
router.put('/items/:id', invalidateCacheMiddleware(...), controller);
```

**3. Não ignore variáveis de ambiente**
```typescript
// ❌ Não permite configuração
export const itemCache = cacheMiddleware({ ttl: 600 });

// ✅ Configurável
export const itemCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ITEM_TTL || '600', 10)
});
```

**4. Não reutilize presets inadequados**
```typescript
// ❌ Preset errado para o caso
router.get('/items/:id/estoque', estabelecimentoCache, controller);

// ✅ Use preset adequado ou crie novo
router.get('/items/:id/estoque', noCache, controller); // Sem cache
```

---

## Guia de TTLs

### Tabela de Referência

| Tipo de Dado | TTL Recomendado | Preset Sugerido |
|--------------|----------------|-----------------|
| Health checks | 10-60s | `healthCache` |
| Stats em tempo real | 30-120s | `volatileCache` (criar) |
| Dados cadastrais | 5-30min | `itemCache` |
| Configurações | 15-60min | `estabelecimentoCache` |
| Dados quase imutáveis | 1h+ | `staticCache` (criar) |
| Listagens paginadas | 1-10min | `listCache` (criar) |
| Relatórios pesados | 15-60min | `reportCache` (criar) |

### Decisão de TTL

**Perguntas para decidir TTL:**

1. **Com que frequência os dados mudam?**
   - Raramente (1x/dia+) → TTL longo (15-60min)
   - Moderado (várias vezes/dia) → TTL médio (5-15min)
   - Frequente (várias vezes/hora) → TTL curto (1-5min)
   - Muito frequente (minutos) → Sem cache ou <1min

2. **Qual o impacto de dados desatualizados?**
   - Crítico → Sem cache ou TTL muito curto
   - Alto → TTL curto com invalidação agressiva
   - Médio → TTL médio com invalidação
   - Baixo → TTL longo

3. **Qual a carga da query no banco?**
   - Muito pesada → TTL mais longo
   - Pesada → TTL médio
   - Leve → TTL curto ou sem cache

4. **Qual a frequência de consulta?**
   - Muito alta → TTL mais importante
   - Alta → TTL médio
   - Baixa → Cache pode não valer a pena

---

## Monitoramento

### Verificar TTLs Efetivos

```typescript
// Endpoint para debug de presets
router.get('/cache/presets', (req, res) => {
  res.json({
    health: process.env.CACHE_HEALTH_TTL || '30 (default)',
    item: process.env.CACHE_ITEM_TTL || '600 (default)',
    estabelecimento: process.env.CACHE_ESTABELECIMENTO_TTL || '900 (default)',
  });
});
```

### Logs de TTL

```typescript
// Log na inicialização
import { log } from '@shared/utils/logger';

log.info('Cache presets configurados', {
  healthTTL: process.env.CACHE_HEALTH_TTL || '30 (default)',
  itemTTL: process.env.CACHE_ITEM_TTL || '600 (default)',
  estabelecimentoTTL: process.env.CACHE_ESTABELECIMENTO_TTL || '900 (default)',
});
```

---

## Referências

### Arquivos Relacionados

- `cache.middleware.ts` - Middleware de cache base
- `cache.middleware.md` - Documentação do cache middleware
- `cacheManager.ts` - Gerenciador de cache
- `.env.example` - Exemplo de configuração

### Conceitos

- **TTL (Time To Live)** - Tempo de vida do cache
- **Preset** - Configuração pré-definida
- **Cache Invalidation** - Limpeza de cache desatualizado

---

## Resumo

### O que é

Middlewares de cache pré-configurados com TTLs específicos para diferentes tipos de recursos.

### Presets Disponíveis

- **healthCache** - 30s para health checks
- **itemCache** - 10min para dados de itens
- **estabelecimentoCache** - 15min para estabelecimentos

### Criar Novo Preset

```typescript
export const meuPreset = createCachePreset({
  envVar: 'CACHE_MEU_TTL',
  defaultTtl: 300,
  description: 'Meu preset customizado'
});
```

### Vantagens

- ✅ Configuração consistente
- ✅ TTLs apropriados por recurso
- ✅ Configurável via env
- ✅ Fácil de usar e manter
- ✅ Centralizado