// src/shared/middlewares/cachePresets.ts

/**
 * Presets de cache HTTP para diferentes tipos de recursos
 *
 * @module shared/middlewares/cachePresets
 * @see cachePresets.md para documentação completa
 *
 * Presets disponíveis:
 * - healthCache: Health checks (30s)
 * - itemCache: Dados de itens (10min)
 * - estabelecimentoCache: Estabelecimentos (15min)
 *
 * Configurável via variáveis de ambiente:
 * - CACHE_HEALTH_TTL
 * - CACHE_ITEM_TTL
 * - CACHE_ESTABELECIMENTO_TTL
 */

import { cacheMiddleware } from './cache.middleware';

// ====================================================================
// PRESETS
// ====================================================================

/**
 * Cache para health checks (30s padrão)
 * Configurável via CACHE_HEALTH_TTL
 */
export const healthCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_HEALTH_TTL || '30', 10)
});

/**
 * Cache para dados de itens (10min padrão)
 * Configurável via CACHE_ITEM_TTL
 */
export const itemCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ITEM_TTL || '600', 10)
});

/**
 * Cache para estabelecimentos (15min padrão)
 * Configurável via CACHE_ESTABELECIMENTO_TTL
 */
export const estabelecimentoCache = cacheMiddleware({
  ttl: parseInt(process.env.CACHE_ESTABELECIMENTO_TTL || '900', 10)
});

// ====================================================================
// FACTORY
// ====================================================================

/**
 * Cria preset de cache customizado
 * @param config - Configuração com envVar, defaultTtl, description
 */
export function createCachePreset(config: {
  envVar: string;
  defaultTtl: number;
  description?: string;
}) {
  const ttl = parseInt(
    process.env[config.envVar] || String(config.defaultTtl),
    10
  );
  return cacheMiddleware({ ttl });
}