# Guia de Correção - Eliminar 'any'

## 📋 Objetivo

Substituir todos os usos de `any` por tipos fortes (interfaces/types).

## ✅ Progresso

- **Arquivos corrigidos**: 12/38 (31.6%)
- **Arquivos identificados**: 38
- **Padrão estabelecido**: ✅
- **FASE 3 (Repositories)**: ✅ COMPLETA
- **FASE 4 (Services)**: ✅ COMPLETA

## 🎯 Arquivos Corrigidos

### ✅ Completos - Repositories (9/9)
1. `src/item/dadosCadastrais/informacoesGerais/repository.ts` - 3 métodos
2. `src/item/dadosCadastrais/fiscal/repository.ts` - 1 método
3. `src/item/dadosCadastrais/manufatura/repository.ts` - 1 método
4. `src/item/dadosCadastrais/planejamento/repository.ts` - 1 método
5. `src/item/empresas/repository.ts` - 1 método + tipo criado
6. `src/item/search/repository.ts` - 1 método + tipo criado
7. `src/familia/listar/repository.ts` - 1 método
8. `src/familiaComercial/listar/repository.ts` - 1 método
9. `src/grupoDeEstoque/listar/repository.ts` - 1 método

### ✅ Completos - Services (3/3)
1. `src/familia/listar/service.ts` - 2 usos de 'any'
2. `src/familiaComercial/listar/service.ts` - 2 usos de 'any'
3. `src/grupoDeEstoque/listar/service.ts` - 2 usos de 'any'

## 📝 Padrão de Correção

### Repositories

**ANTES (❌):**
```typescript
static async getItemMaster(codigo: string): Promise<any | null> {
  const result = await DatabaseManager.queryEmp(query);
  return result[0];
}
```

**DEPOIS (✅):**
```typescript
// 1. Importar tipo do arquivo types.ts
import type { ItemMasterQueryResult } from './types';

// 2. Usar tipo no retorno
static async getItemMaster(codigo: string): Promise<ItemMasterQueryResult | null> {
  const result = await DatabaseManager.queryEmp<ItemMasterQueryResult>(query);
  return result[0];
}
```

### Services

**ANTES (❌):**
```typescript
static async listar(filters: any): Promise<any> {
  const result = await Repository.list(filters);
  return result;
}
```

**DEPOIS (✅):**
```typescript
// 1. Criar/importar tipos
import type { ListFilters, ListResult } from './types';

// 2. Usar tipos
static async listar(filters: ListFilters): Promise<ListResult> {
  const result = await Repository.list(filters);
  return result;
}
```

### Validators (Joi)

**ACEITO (✅):**
```typescript
// Joi schemas podem ter 'any' - é o tipo correto do Joi
export const schema: Joi.ObjectSchema<any> = Joi.object({
  codigo: Joi.string().required(),
});
```

## 📂 Arquivos Pendentes por Categoria

### ✅ REPOSITORIES - TODOS COMPLETOS (9/9)

1. ✅ `src/item/dadosCadastrais/fiscal/repository.ts` - CONCLUÍDO
2. ✅ `src/item/dadosCadastrais/manufatura/repository.ts` - CONCLUÍDO
3. ✅ `src/item/dadosCadastrais/planejamento/repository.ts` - CONCLUÍDO
4. ✅ `src/item/empresas/repository.ts` - CONCLUÍDO
5. ✅ `src/item/search/repository.ts` - CONCLUÍDO
6. ✅ `src/familia/listar/repository.ts` - CONCLUÍDO
7. ✅ `src/familiaComercial/listar/repository.ts` - CONCLUÍDO
8. ✅ `src/grupoDeEstoque/listar/repository.ts` - CONCLUÍDO
9. ✅ `src/item/dadosCadastrais/informacoesGerais/repository.ts` - CONCLUÍDO
8. ⏳ `src/grupoDeEstoque/listar/repository.ts`

**Padrão:**
- Verificar se existe `types.ts` no módulo
- Se não existir, criar com tipos apropriados
- Importar tipos no repository
- Atualizar assinaturas dos métodos

### ✅ SERVICES - TODOS COMPLETOS (3/3)

1. ✅ `src/familia/listar/service.ts` - CONCLUÍDO
2. ✅ `src/familiaComercial/listar/service.ts` - CONCLUÍDO
3. ✅ `src/grupoDeEstoque/listar/service.ts` - CONCLUÍDO

### 🟢 BAIXOS - Validators (5 arquivos)

✅ **DECISÃO**: Manter `any` em Joi schemas (é correto)

### 🔵 Infrastructure (8 arquivos)

1. ⏳ `src/infrastructure/database/connections/SqlServerConnection.ts`
2. ⏳ `src/infrastructure/cache/CacheManager.ts`
3. ⏳ `src/infrastructure/cache/QueryCacheService.ts`
4. ⏳ `src/infrastructure/logging/logger.ts`
5. ⏳ `src/infrastructure/process/gracefulShutdown.ts`
6. ⏳ `src/infrastructure/metrics/helpers/databaseMetrics.ts`
7. ⏳ `src/infrastructure/database/databaseConfig.ts`
8. ⏳ `src/infrastructure/database/types/index.ts`

**Nota:** Alguns podem ser legítimos (ex: logger aceita any para flexibilidade)

### 🟣 Middlewares (3 arquivos)

1. ⏳ `src/shared/middlewares/errorHandler.middleware.ts`
2. ⏳ `src/shared/middlewares/requestLogger.middleware.ts`
3. ⏳ `src/shared/middlewares/cache.middleware.ts`

**Nota:** Alguns `any` podem ser `unknown` em vez de tipos específicos

### ⚪ Outros (9 arquivos)

Incluindo:
- `src/shared/utils/UserRateLimiter.ts`
- `src/shared/services/apiKey.service.ts`
- `src/app.ts`
- `src/presentation/test/test-timeout.routes.ts`
- Arquivos legados em `src/shared/utils/` (backward compat)

## 🚀 Como Continuar

### 1. Corrigir Próximo Repository

```bash
# Escolha um repository da lista
# Exemplo: fiscal

# 1. Verifique se existe types.ts
ls src/item/dadosCadastrais/fiscal/types.ts

# 2. Se não existir, crie
# 3. Adicione interfaces para os resultados das queries
# 4. Importe no repository.ts
# 5. Atualize assinaturas dos métodos
```

### 2. Validar Mudanças

```bash
# Sempre validar após mudanças
npx tsc --noEmit

# Verificar erros de tipo
# Corrigir se necessário
```

### 3. Testar

```bash
# Rodar testes relacionados
npm test -- src/item/dadosCadastrais/fiscal
```

## 📊 Template para types.ts

```typescript
// src/[modulo]/types.ts

/**
 * Tipos específicos do módulo [Nome]
 */

/**
 * Resultado da query principal
 */
export interface [Modulo]MasterQueryResult {
  codigo: string;
  descricao: string;
  ativo: number;
  // ... outros campos
}

/**
 * Estrutura completa de resposta
 */
export interface [Modulo]Data {
  codigo: string;
  descricao: string;
  ativo: boolean; // convertido de number
  // ... outros campos
}

/**
 * Filtros de listagem
 */
export interface [Modulo]ListFilters {
  ativo?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Resultado de listagem paginada
 */
export interface [Modulo]ListResult {
  items: [Modulo]Data[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

## ✅ Checklist por Arquivo

### Para cada repository:
- [ ] Verificar se existe types.ts
- [ ] Criar types.ts se necessário
- [ ] Identificar todos os métodos com 'any'
- [ ] Criar interfaces para cada tipo de retorno
- [ ] Importar tipos no repository
- [ ] Atualizar assinaturas dos métodos
- [ ] Adicionar generics nas chamadas DatabaseManager
- [ ] Validar com `tsc --noEmit`
- [ ] Rodar testes do módulo
- [ ] Marcar como concluído

## 📈 Estimativa

- **Por arquivo**: ~15-30 minutos
- **Total estimado**: ~10-15 horas para todos os 38 arquivos
- **Prioridade**: Repositories primeiro (maior impacto)

## 🎯 Próximos Passos Recomendados

1. **Fase 1**: Corrigir todos os repositories (9 arquivos) - ~4h
2. **Fase 2**: Corrigir services (3 arquivos) - ~1h
3. **Fase 3**: Avaliar infrastructure (8 arquivos) - ~2h
4. **Fase 4**: Avaliar middlewares (3 arquivos) - ~1h
5. **Fase 5**: Validar e testar tudo - ~2h

**Total**: ~10h de trabalho focado

---

**Última Atualização:** 2025-10-20
**Status:** Em andamento, 12/38 completo (31.6%) - ✅ FASE 3 + FASE 4 COMPLETAS
**Próximo:** Avaliar Infrastructure (FASE 5)
