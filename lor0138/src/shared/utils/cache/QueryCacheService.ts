// src/shared/utils/cache/QueryCacheService.ts

import crypto from 'crypto';
import { CacheManager } from '../cacheManager';
import { log } from '../logger';

/**
 * Serviço de Cache para Queries de Banco de Dados
 *
 * @module shared/utils/cache/QueryCacheService
 * @version 1.0.0
 * @see QUERY_CACHE_SERVICE.md para documentação completa
 *
 * Fornece cache transparente para queries SQL com:
 * - Cache-aside pattern automático
 * - Chaves determinísticas (hash MD5)
 * - TTL configurável por tipo de query
 * - Invalidação por padrão
 * - Wrappers especializados por entidade
 *
 * @example
 * const result = await QueryCacheService.withCache(
 *   'SELECT * FROM item WHERE codigo = @p1',
 *   [{ name: 'p1', value: '7530110' }],
 *   async () => db.queryWithParams(sql, params)
 * );
 */

/**
 * Opções para cache de queries
 */
export interface QueryCacheOptions {
  /** Time To Live em segundos (padrão: 300s) */
  ttl?: number;
  /** Prefixo da chave de cache (padrão: 'query') */
  prefix?: string;
  /** Se true, não usa cache e executa query direto */
  skipCache?: boolean;
  /** Padrão para invalidar cache relacionado */
  invalidatePattern?: string;
}

/** TTL padrão para queries (5 minutos) */
const DEFAULT_TTL = 300;

/** Prefixo padrão para chaves de cache */
const DEFAULT_PREFIX = 'query';

/** TTLs específicos por tipo de entidade */
const ENTITY_TTL = {
  ITEM: 600,              // 10 minutos
  FAMILIA: 3600,          // 1 hora
  ESTABELECIMENTO: 900,   // 15 minutos
  HEALTH: 30,             // 30 segundos
} as const;

/**
 * Serviço de Cache para Queries SQL
 *
 * Implementa cache-aside pattern com chaves determinísticas.
 *
 * @class QueryCacheService
 */
export class QueryCacheService {
  private static readonly DEFAULT_TTL = DEFAULT_TTL;
  private static readonly DEFAULT_PREFIX = DEFAULT_PREFIX;

  /**
   * Executa query com cache (cache-aside pattern)
   *
   * Fluxo:
   * 1. Verifica skipCache
   * 2. Gera chave determinística (SQL + params)
   * 3. Busca cache → HIT: retorna
   * 4. MISS: executa query
   * 5. Armazena no cache
   * 6. Retorna resultado
   *
   * @template T - Tipo do resultado
   * @param sql - Query SQL
   * @param params - Parâmetros da query
   * @param queryFn - Função que executa a query real
   * @param options - Opções de cache
   * @returns Resultado da query (cache ou banco)
   */
  static async withCache<T>(
    sql: string,
    params: any[] = [],
    queryFn: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.DEFAULT_TTL,
      prefix = this.DEFAULT_PREFIX,
      skipCache = false,
    } = options;

    // Skip explícito
    if (skipCache) {
      log.debug('Query cache: SKIP', { prefix });
      return queryFn();
    }

    // Gerar chave determinística
    const cacheKey = this.generateCacheKey(sql, params, prefix);

    // Tentar cache
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
   *
   * Formato: `${prefix}:${md5(sql+params)}`
   *
   * Processo:
   * 1. Normaliza SQL (remove espaços extras)
   * 2. Serializa params deterministicamente
   * 3. Gera hash MD5 de: sql:params
   * 4. Retorna: prefix:hash16chars
   *
   * @param sql - Query SQL
   * @param params - Parâmetros da query
   * @param prefix - Prefixo da chave
   * @returns Chave de cache: prefix:hash
   * @private
   */
  private static generateCacheKey(
    sql: string,
    params: any[],
    prefix: string
  ): string {
    // Normalizar SQL
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // Serializar params deterministicamente
    let paramsStr: string;

    if (Array.isArray(params)) {
      // Array de QueryParameter: [{ name, type, value }, ...]
      const sortedParams = params
        .map((p) => {
          if (typeof p === 'object' && p !== null) {
            return { name: p.name, value: p.value };
          }
          return p;
        })
        .sort((a, b) => {
          const nameA = a?.name || '';
          const nameB = b?.name || '';
          return nameA.localeCompare(nameB);
        });

      paramsStr = JSON.stringify(sortedParams);
    } else {
      // Objeto simples: { key: value }
      paramsStr = JSON.stringify(params, Object.keys(params).sort());
    }

    // Hash MD5
    const hash = crypto
      .createHash('md5')
      .update(`${normalizedSql}:${paramsStr}`)
      .digest('hex')
      .substring(0, 16); // 16 chars suficientes

    return `${prefix}:${hash}`;
  }

  /**
   * Invalida cache por padrão
   *
   * @param pattern - Padrão de chaves a invalidar (suporta wildcards)
   * @returns Número de chaves removidas
   */
  static async invalidate(pattern: string): Promise<number> {
    log.info('Query cache: INVALIDATE', { pattern });
    return CacheManager.invalidate(pattern);
  }

  /**
   * Invalida múltiplos padrões de uma vez
   *
   * @param patterns - Lista de padrões a invalidar
   * @returns Total de chaves removidas
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
   *
   * TTL padrão: 10 minutos
   * Prefixo: 'item'
   */
  static async withItemCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: ttl || ENTITY_TTL.ITEM,
      prefix: 'item',
    });
  }

  /**
   * Wrapper para queries de familias
   *
   * TTL padrão: 1 hora
   * Prefixo: 'familia'
   */
  static async withFamiliaCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: ttl || ENTITY_TTL.FAMILIA,
      prefix: 'familia',
    });
  }

  /**
   * Wrapper para queries de estabelecimentos
   *
   * TTL padrão: 15 minutos
   * Prefixo: 'estabelecimento'
   */
  static async withEstabelecimentoCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: ttl || ENTITY_TTL.ESTABELECIMENTO,
      prefix: 'estabelecimento',
    });
  }

  /**
   * Wrapper para queries de health check
   *
   * TTL padrão: 30 segundos
   * Prefixo: 'health'
   */
  static async withHealthCache<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>
  ): Promise<T> {
    return this.withCache(sql, params, queryFn, {
      ttl: ENTITY_TTL.HEALTH,
      prefix: 'health',
    });
  }
}