// src/shared/middlewares/cachePresets.ts

/**
 * @fileoverview Presets de cache HTTP para diferentes tipos de recursos
 *
 * @description
 * Define middlewares de cache pré-configurados com TTLs específicos
 * para diferentes tipos de recursos da aplicação. Facilita aplicação
 * consistente de políticas de cache em toda a API.
 *
 * PRESETS DISPONÍVEIS:
 * - healthCache: Cache curto para health checks (30s)
 * - itemCache: Cache médio para dados de itens (10min)
 * - estabelecimentoCache: Cache longo para estabelecimentos (15min)
 *
 * CONFIGURAÇÃO:
 * - TTLs configuráveis via variáveis de ambiente
 * - Valores padrão adequados para cada tipo de recurso
 * - Fácil adição de novos presets
 *
 * @module shared/middlewares/cachePresets
 *
 * @requires ./cache.middleware
 */

import { cacheMiddleware } from './cache.middleware';

// ====================================================================
// PRESETS DE CACHE
// ====================================================================

/**
 * Cache para endpoints de health check
 *
 * @description
 * Preset de cache com TTL curto para health checks. Health checks
 * precisam refletir estado atual do sistema, portanto não devem
 * ser cacheados por muito tempo.
 *
 * @constant
 * @type {Function}
 *
 * @example
 * ```typescript
 * // Em health check routes
 * import { healthCache } from '@shared/middlewares/cachePresets';
 *
 * router.get('/health', healthCache, healthCheckController.check);
 * router.get('/health/database', healthCache, healthCheckController.database);
 * ```
 *
 * CONFIGURAÇÃO:
 * - TTL: 30 segundos (padrão)
 * - Variável de ambiente: CACHE_HEALTH_TTL
 * - Formato: segundos em número inteiro
 *
 * CARACTERÍSTICAS:
 * - TTL muito curto (30s)
 * - Reduz carga em verificações frequentes
 * - Mantém informações atualizadas
 * - Útil para dashboards de monitoramento
 *
 * QUANDO USAR:
 * - Endpoints /health
 * - Endpoints /status
 * - Verificações de conectividade
 * - Métricas de sistema em tempo quase real
 *
 * @remarks
 * ⚠️ IMPORTANTE:
 * - Não use para checks críticos de saúde
 * - 30s pode ocultar problemas intermitentes
 * - Para alertas críticos, desabilite cache (noCache)
 */
export const healthCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_HEALTH_TTL || '30', 10)
});

/**
 * Cache para dados de itens
 *
 * @description
 * Preset de cache com TTL médio para dados cadastrais de itens.
 * Itens mudam com frequência moderada (descrições, preços, estoques),
 * portanto o TTL equilibra atualização e performance.
 *
 * @constant
 * @type {Function}
 *
 * @example
 * ```typescript
 * // Em rotas de itens
 * import { itemCache } from '@shared/middlewares/cachePresets';
 *
 * router.get('/items/:id', itemCache, itemController.getItem);
 * router.get('/items/:id/informacoesGerais', itemCache, controller.getInfo);
 * router.get('/items', itemCache, itemController.listItems);
 * ```
 *
 * CONFIGURAÇÃO:
 * - TTL: 600 segundos (10 minutos, padrão)
 * - Variável de ambiente: CACHE_ITEM_TTL
 * - Formato: segundos em número inteiro
 *
 * CARACTERÍSTICAS:
 * - TTL médio (10min)
 * - Boa redução de carga no banco
 * - Balanceamento entre atualização e performance
 * - Adequado para dados que mudam algumas vezes por dia
 *
 * QUANDO USAR:
 * - Consultas de itens por código
 * - Listagens de itens (com paginação)
 * - Informações gerais de produtos
 * - Dados cadastrais que mudam pouco
 *
 * QUANDO NÃO USAR:
 * - Preços em tempo real
 * - Estoque em tempo real (crítico)
 * - Dados de disponibilidade urgentes
 * - Informações de pedidos em andamento
 *
 * @remarks
 * IMPORTANTE:
 * - Invalide cache ao atualizar item (invalidateCacheMiddleware)
 * - Para estoque em tempo real, use TTL menor ou sem cache
 * - Combine com versionamento de dados quando possível
 * - Monitore hit rate para ajustar TTL
 *
 * INVALIDAÇÃO:
 * ```typescript
 * router.put('/items/:id',
 *   invalidateCacheMiddleware((req) => `item:${req.params.id}:*`),
 *   itemController.updateItem
 * );
 * ```
 */
export const itemCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ITEM_TTL || '600', 10)
});

/**
 * Cache para dados de estabelecimentos
 *
 * @description
 * Preset de cache com TTL longo para dados de estabelecimentos.
 * Estabelecimentos são dados cadastrais que mudam raramente
 * (endereços, nomes, configurações), portanto podem ter cache longo.
 *
 * @constant
 * @type {Function}
 *
 * @example
 * ```typescript
 * // Em rotas de estabelecimentos
 * import { estabelecimentoCache } from '@shared/middlewares/cachePresets';
 *
 * router.get('/estabelecimentos', estabelecimentoCache, controller.list);
 * router.get('/estabelecimentos/:codigo', estabelecimentoCache, controller.get);
 * router.get('/items/:id/estabelecimentos', estabelecimentoCache, controller.getByItem);
 * ```
 *
 * CONFIGURAÇÃO:
 * - TTL: 900 segundos (15 minutos, padrão)
 * - Variável de ambiente: CACHE_ESTABELECIMENTO_TTL
 * - Formato: segundos em número inteiro
 *
 * CARACTERÍSTICAS:
 * - TTL longo (15min)
 * - Máxima redução de carga no banco
 * - Dados muito estáveis
 * - Adequado para dados que mudam raramente
 *
 * QUANDO USAR:
 * - Listagem de estabelecimentos
 * - Dados cadastrais de filiais/CDs
 * - Hierarquia organizacional
 * - Configurações por estabelecimento
 * - Mapeamento código → nome
 *
 * QUANDO NÃO USAR:
 * - Status operacional em tempo real
 * - Dados de integração que mudam frequentemente
 * - Informações críticas que precisam estar atualizadas
 *
 * @remarks
 * IMPORTANTE:
 * - TTL longo requer invalidação manual em atualizações
 * - Ideal para lookups e mapeamentos
 * - Considere cache infinito + invalidação para dados quase imutáveis
 * - Monitore se TTL é adequado para seu caso de uso
 *
 * INVALIDAÇÃO:
 * ```typescript
 * router.put('/estabelecimentos/:codigo',
 *   invalidateCacheMiddleware('estabelecimento:*'),
 *   controller.updateEstabelecimento
 * );
 * ```
 */
export const estabelecimentoCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ESTABELECIMENTO_TTL || '900', 10)
});

// ====================================================================
// UTILITÁRIOS PARA CRIAR NOVOS PRESETS
// ====================================================================

/**
 * Cria preset de cache customizado
 *
 * @description
 * Factory function para criar novos presets de cache com configuração
 * customizada. Útil para adicionar novos tipos de recursos.
 *
 * @param {object} config - Configuração do preset
 * @param {string} config.envVar - Nome da variável de ambiente para TTL
 * @param {number} config.defaultTtl - TTL padrão em segundos
 * @param {string} [config.description] - Descrição do preset
 *
 * @returns {Function} Middleware de cache configurado
 *
 * @public
 *
 * @example
 * ```typescript
 * // Criar preset para clientes
 * export const clienteCache = createCachePreset({
 *   envVar: 'CACHE_CLIENTE_TTL',
 *   defaultTtl: 1800, // 30 minutos
 *   description: 'Cache para dados de clientes'
 * });
 *
 * // Usar em rotas
 * router.get('/clientes/:id', clienteCache, controller.getCliente);
 * ```
 *
 * @remarks
 * BOAS PRÁTICAS:
 * - Documente o novo preset com JSDoc completo
 * - Adicione exemplos de uso
 * - Defina quando usar e quando não usar
 * - Configure variável de ambiente no .env.example
 */
export function createCachePreset(config: {
  envVar: string;
  defaultTtl: number;
  description?: string;
}) {
  const ttl = parseInt(process.env[config.envVar] || String(config.defaultTtl), 10);
  return cacheMiddleware({ ttl });
}

// ====================================================================
// PRESETS ADICIONAIS (EXEMPLOS COMENTADOS)
// ====================================================================

/**
 * Exemplos de presets adicionais que podem ser criados conforme necessário
 */

/*
// Cache muito curto para dados voláteis (1 minuto)
export const volatileCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_VOLATILE_TTL || '60', 10)
});

// Cache muito longo para dados quase imutáveis (1 hora)
export const staticCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_STATIC_TTL || '3600', 10)
});

// Cache para listagens paginadas
export const listCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_LIST_TTL || '300', 10) // 5 minutos
});

// Cache para relatórios
export const reportCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_REPORT_TTL || '1800', 10) // 30 minutos
});

// Cache para configurações do sistema
export const configCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_CONFIG_TTL || '3600', 10) // 1 hora
});

// Cache para dados de usuário
export const userCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_USER_TTL || '600', 10) // 10 minutos
});
*/

// ====================================================================
// DOCUMENTAÇÃO DE VARIÁVEIS DE AMBIENTE
// ====================================================================

/**
 * Variáveis de ambiente suportadas:
 *
 * CACHE_HEALTH_TTL
 * - Descrição: TTL para cache de health checks
 * - Padrão: 30 (segundos)
 * - Mínimo recomendado: 10
 * - Máximo recomendado: 60
 *
 * CACHE_ITEM_TTL
 * - Descrição: TTL para cache de itens
 * - Padrão: 600 (10 minutos)
 * - Mínimo recomendado: 60
 * - Máximo recomendado: 1800
 *
 * CACHE_ESTABELECIMENTO_TTL
 * - Descrição: TTL para cache de estabelecimentos
 * - Padrão: 900 (15 minutos)
 * - Mínimo recomendado: 300
 * - Máximo recomendado: 3600
 *
 * EXEMPLO NO .env:
 * ```env
 * CACHE_HEALTH_TTL=30
 * CACHE_ITEM_TTL=600
 * CACHE_ESTABELECIMENTO_TTL=900
 * ```
 */