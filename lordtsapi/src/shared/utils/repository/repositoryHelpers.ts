/**
 * Helpers para Repositories
 */

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { log } from '@shared/utils/logger';

/**
 * Executa query com cache automático
 */
export async function executeWithCache<T>(
  query: string,
  params: QueryParameter[],
  cacheStrategy: (
    query: string,
    params: QueryParameter[],
    fetcher: () => Promise<T[]>
  ) => Promise<T[]>
): Promise<T[]> {
  return cacheStrategy(query, params, async () =>
    DatabaseManager.queryEmpWithParams(query, params)
  );
}

/**
 * Executa query e retorna primeiro resultado ou null
 */
export async function executeAndGetFirst<T>(
  query: string,
  params: QueryParameter[],
  cacheStrategy: (
    query: string,
    params: QueryParameter[],
    fetcher: () => Promise<T[]>
  ) => Promise<T[]>
): Promise<T | null> {
  try {
    const result = await executeWithCache(query, params, cacheStrategy);
    return result && result.length > 0 ? (result[0] ?? null) : null;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

/**
 * Invalida cache com padrões múltiplos
 */
export async function invalidateCachePatterns(patterns: string[]): Promise<void> {
  await QueryCacheService.invalidateMultiple(patterns);
  log.debug('Cache invalidado para padrões:', { patterns, count: patterns.length });
}
