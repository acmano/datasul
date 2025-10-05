// src/shared/utils/cache/QueryCacheService.ts

import crypto from 'crypto';
import { CacheManager } from '../cacheManager';
import { log } from '../logger';

export interface QueryCacheOptions {
  ttl?: number; // TTL específico em segundos
  prefix?: string; // Prefixo da chave de cache
  skipCache?: boolean; // Pular cache para esta query
  invalidatePattern?: string; // Pattern para invalidar
}

/**
 * Serviço de cache para queries de banco de dados
 * Gera keys automáticas baseadas em hash(SQL + params)
 */
export class QueryCacheService {
  private static readonly DEFAULT_TTL = 300; // 5 minutos
  private static readonly DEFAULT_PREFIX = 'query';

  /**
   * Executa query com cache
   * 
   * @example
   * ```typescript
   * const result = await QueryCacheService.withCache(
   *   'SELECT * FROM item WHERE codigo = @p1',
   *   [{ name: 'p1', value: '7530110' }],
   *   async () => DatabaseManager.queryEmpWithParams(sql, params),
   *   { ttl: 600, prefix: 'item' }
   * );
   * ```
   */
  static async withCache<T>(
    sql: string,
    params: any[] = [],
    queryFn: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL, prefix = this.DEFAULT_PREFIX, skipCache = false } = options;

    // Se skip explícito, executa direto
    if (skipCache) {
      log.debug('Query cache: SKIP', { prefix });
      return queryFn();
    }

    // Gerar chave de cache
    const cacheKey = this.generateCacheKey(sql, params, prefix);

    // Tentar buscar do cache
    const cached = await CacheManager.get<T>(cacheKey);
    if (cached !== undefined) {
      log.debug('Query cache: HIT', { key: cacheKey, prefix });
      return cached;
    }

    // MISS: executar query
    log.debug('Query cache: MISS', { key: cacheKey, prefix });
    const result = await queryFn();

    // Armazenar no cache
    await CacheManager.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Gera chave de cache determinística
   * Hash MD5 de: prefix:sql:params_json
   * 
   * ✅ CORRIGIDO: Serializa params corretamente (array ou objeto)
   */
  private static generateCacheKey(sql: string, params: any[], prefix: string): string {
    // Normalizar SQL (remover espaços extras)
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // ✅ CORREÇÃO: Serializar params de forma determinística
    // Se for array, mapeia para extrair valores relevantes
    let paramsStr: string;
    
    if (Array.isArray(params)) {
      // Para array de QueryParameter: [{name, type, value}, ...]
      const sortedParams = params
        .map(p => {
          if (typeof p === 'object' && p !== null) {
            // Extrai apenas name e value, ordena as chaves
            return { name: p.name, value: p.value };
          }
          return p;
        })
        .sort((a, b) => {
          // Ordena por name se existir
          const nameA = a?.name || '';
          const nameB = b?.name || '';
          return nameA.localeCompare(nameB);
        });
      
      paramsStr = JSON.stringify(sortedParams);
    } else {
      // Para objeto simples
      paramsStr = JSON.stringify(params, Object.keys(params).sort());
    }

    // Gerar hash
    const hash = crypto
      .createHash('md5')
      .update(`${normalizedSql}:${paramsStr}`)
      .digest('hex')
      .substring(0, 16); // 16 chars é suficiente

    return `${prefix}:${hash}`;
  }

  /**
   * Invalida cache por pattern
   * 
   * @example
   * ```typescript
   * // Invalidar todos os caches de item
   * await QueryCacheService.invalidate('item:*');
   * 
   * // Invalidar cache específico
   * await QueryCacheService.invalidate('item:abc123def456');
   * ```
   */
  static async invalidate(pattern: string): Promise<number> {
    log.info('Query cache: INVALIDATE', { pattern });
    return CacheManager.delete(pattern);
  }

  /**
   * Invalida múltiplos patterns
   */
  static async invalidateMultiple(patterns: string[]): Promise<number> {
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidate(pattern);
    }
    return total;
  }

  /**
   * Wrapper para queries de itens
   */
  static async withItemCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: ttl || 600, // 10 minutos para itens
      prefix: 'item',
    });
  }

  /**
   * Wrapper para queries de estabelecimentos
   */
  static async withEstabelecimentoCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: ttl || 900, // 15 minutos para estabelecimentos
      prefix: 'estabelecimento',
    });
  }

  /**
   * Wrapper para queries de health check (TTL curto)
   */
  static async withHealthCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: 30, // 30 segundos
      prefix: 'health',
    });
  }
}