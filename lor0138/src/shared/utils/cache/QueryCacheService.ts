// src/shared/utils/cache/QueryCacheService.ts

import crypto from 'crypto';
import { CacheManager } from '../cacheManager';
import { log } from '../logger';

/**
 * @fileoverview Serviço de Cache para Queries de Banco de Dados
 *
 * Fornece cache transparente para queries SQL, gerando chaves automáticas
 * baseadas em hash(SQL + params). Suporta:
 * - Cache-aside pattern automático
 * - TTL configurável por tipo de query
 * - Invalidação por padrão
 * - Wrappers especializados (item, estabelecimento, health)
 *
 * O serviço gera chaves determinísticas garantindo que a mesma query
 * com os mesmos parâmetros sempre resulte na mesma chave de cache.
 *
 * @module QueryCacheService
 * @category Utils/Cache
 */

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

/**
 * Opções para cache de queries
 *
 * @interface QueryCacheOptions
 * @property {number} [ttl] - Time To Live em segundos (padrão: 300s)
 * @property {string} [prefix] - Prefixo da chave de cache (padrão: 'query')
 * @property {boolean} [skipCache] - Se true, não usa cache e executa query direto
 * @property {string} [invalidatePattern] - Padrão para invalidar cache relacionado
 */
export interface QueryCacheOptions {
  ttl?: number;
  prefix?: string;
  skipCache?: boolean;
  invalidatePattern?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * TTL padrão para queries (5 minutos)
 * @constant
 * @private
 */
const DEFAULT_TTL = 300;

/**
 * Prefixo padrão para chaves de cache de queries
 * @constant
 * @private
 */
const DEFAULT_PREFIX = 'query';

/**
 * TTLs específicos por tipo de entidade
 * @constant
 * @private
 */
const ENTITY_TTL = {
  /** TTL para queries de itens (10 minutos) */
  ITEM: 600,
  /** TTL para queries de famílias (1 hora) */
  FAMILIA: 3600,
  /** TTL para queries de estabelecimentos (15 minutos) */
  ESTABELECIMENTO: 900,
  /** TTL para health checks (30 segundos) */
  HEALTH: 30,
} as const;

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

/**
 * Serviço de Cache para Queries de Banco de Dados
 *
 * Implementa cache transparente para queries SQL usando o padrão cache-aside.
 * A chave de cache é gerada automaticamente baseada em hash MD5 do SQL + parâmetros,
 * garantindo consistência e determinismo.
 *
 * **Características:**
 * - Chaves automáticas e determinísticas
 * - Suporte a queries parametrizadas
 * - TTL configurável
 * - Invalidação por padrão (wildcards)
 * - Wrappers especializados para entidades comuns
 * - Logs detalhados (HIT/MISS/SKIP)
 *
 * **Fluxo de Cache:**
 * 1. Gera chave baseada em SQL + params
 * 2. Tenta buscar do cache (HIT → retorna)
 * 3. Se MISS, executa query
 * 4. Armazena resultado no cache
 * 5. Retorna resultado
 *
 * @class QueryCacheService
 * @example
 * ```typescript
 * // Cache simples
 * const result = await QueryCacheService.withCache(
 *   'SELECT * FROM item WHERE codigo = @p1',
 *   [{ name: 'p1', value: '7530110' }],
 *   async () => DatabaseManager.queryEmpWithParams(sql, params)
 * );
 *
 * // Cache com TTL customizado
 * const result = await QueryCacheService.withItemCache(
 *   sql,
 *   params,
 *   async () => DatabaseManager.queryEmpWithParams(sql, params),
 *   1200 // 20 minutos
 * );
 * ```
 */
export class QueryCacheService {
  /**
   * TTL padrão para queries (5 minutos)
   * @readonly
   * @static
   */
  private static readonly DEFAULT_TTL = DEFAULT_TTL;

  /**
   * Prefixo padrão para chaves de cache
   * @readonly
   * @static
   */
  private static readonly DEFAULT_PREFIX = DEFAULT_PREFIX;

  // ==========================================================================
  // MÉTODO PRINCIPAL
  // ==========================================================================

  /**
   * Executa query com cache (cache-aside pattern)
   *
   * Implementa o padrão cache-aside completo:
   * 1. Verifica se deve pular cache (skipCache=true)
   * 2. Gera chave determinística baseada em SQL + params
   * 3. Busca no cache (HIT → retorna imediato)
   * 4. Se MISS, executa a query
   * 5. Armazena resultado no cache
   * 6. Retorna resultado
   *
   * **Geração de Chave:**
   * - Formato: `${prefix}:${md5(sql+params)}`
   * - SQL é normalizado (espaços extras removidos)
   * - Params são serializados deterministicamente
   * - Hash MD5 garante chave curta e única
   *
   * @template T - Tipo do resultado da query
   * @param {string} sql - Query SQL (pode conter espaços extras)
   * @param {any[]} [params=[]] - Parâmetros da query
   * @param {Function} queryFn - Função que executa a query real
   * @param {QueryCacheOptions} [options={}] - Opções de cache
   * @returns {Promise<T>} Resultado da query (cache ou banco)
   *
   * @example
   * ```typescript
   * // Query simples
   * const items = await QueryCacheService.withCache(
   *   'SELECT * FROM item',
   *   [],
   *   async () => await db.query('SELECT * FROM item')
   * );
   *
   * // Query parametrizada
   * const item = await QueryCacheService.withCache(
   *   'SELECT * FROM item WHERE codigo = @p1',
   *   [{ name: 'p1', value: '7530110' }],
   *   async () => await db.queryWithParams(sql, params),
   *   { ttl: 600, prefix: 'item' }
   * );
   *
   * // Pular cache explicitamente
   * const fresh = await QueryCacheService.withCache(
   *   sql,
   *   params,
   *   async () => await db.query(sql),
   *   { skipCache: true }
   * );
   * ```
   *
   * @performance
   * - Cache HIT: < 1ms (memória) ou 1-10ms (redis)
   * - Cache MISS: Tempo da query + ~1ms para armazenar
   *
   * @note
   * Logs incluem HIT/MISS/SKIP para facilitar debug e otimização
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

    // Se skip explícito, executa direto sem cache
    if (skipCache) {
      log.debug('Query cache: SKIP', { prefix });
      return queryFn();
    }

    // Gerar chave de cache determinística
    const cacheKey = this.generateCacheKey(sql, params, prefix);

    // Tentar buscar do cache
    const cached = await CacheManager.get<T>(cacheKey);
    if (cached !== undefined) {
      log.debug('Query cache: HIT', { key: cacheKey, prefix });
      return cached;
    }

    // MISS: executar query real
    log.debug('Query cache: MISS', { key: cacheKey, prefix });
    const result = await queryFn();

    // Armazenar resultado no cache
    await CacheManager.set(cacheKey, result, ttl);

    return result;
  }

  // ==========================================================================
  // GERAÇÃO DE CHAVE DE CACHE
  // ==========================================================================

  /**
   * Gera chave de cache determinística
   *
   * Cria uma chave única e consistente baseada em:
   * - Prefixo (identifica tipo de query)
   * - SQL normalizado (espaços extras removidos)
   * - Parâmetros serializados deterministicamente
   *
   * **Processo:**
   * 1. Normaliza SQL (remove espaços extras)
   * 2. Serializa params de forma determinística:
   *    - Arrays: ordena por 'name' e extrai apenas name+value
   *    - Objetos: ordena chaves alfabeticamente
   * 3. Gera hash MD5 de: `sql:params`
   * 4. Retorna: `${prefix}:${hash16chars}`
   *
   * **Por que MD5?**
   * - Rápido (não precisa ser criptograficamente seguro)
   * - Chave curta (16 chars suficientes)
   * - Colisões extremamente improváveis neste contexto
   *
   * @param {string} sql - Query SQL
   * @param {any[]} params - Parâmetros da query
   * @param {string} prefix - Prefixo da chave
   * @returns {string} Chave de cache no formato: `prefix:hash`
   * @private
   *
   * @example
   * ```typescript
   * // SQL simples
   * generateCacheKey('SELECT * FROM item', [], 'item')
   * // → 'item:a1b2c3d4e5f6g7h8'
   *
   * // SQL com parâmetros
   * generateCacheKey(
   *   'SELECT * FROM item WHERE codigo = @p1',
   *   [{ name: 'p1', value: '7530110' }],
   *   'item'
   * )
   * // → 'item:x1y2z3w4v5u6t7s8'
   * ```
   *
   * @critical
   * A ordem dos parâmetros é normalizada para garantir determinismo:
   * - [{ name: 'p1', value: 'A' }, { name: 'p2', value: 'B' }]
   * - [{ name: 'p2', value: 'B' }, { name: 'p1', value: 'A' }]
   * → Geram a MESMA chave
   */
  private static generateCacheKey(
    sql: string,
    params: any[],
    prefix: string
  ): string {
    // Normalizar SQL (remover espaços extras)
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // Serializar params de forma determinística
    let paramsStr: string;

    if (Array.isArray(params)) {
      // Para array de QueryParameter: [{ name, type, value }, ...]
      const sortedParams = params
        .map((p) => {
          if (typeof p === 'object' && p !== null) {
            // Extrai apenas name e value, ignora type (irrelevante para cache)
            return { name: p.name, value: p.value };
          }
          return p;
        })
        .sort((a, b) => {
          // Ordena por name para garantir determinismo
          const nameA = a?.name || '';
          const nameB = b?.name || '';
          return nameA.localeCompare(nameB);
        });

      paramsStr = JSON.stringify(sortedParams);
    } else {
      // Para objeto simples: { key: value }
      paramsStr = JSON.stringify(params, Object.keys(params).sort());
    }

    // Gerar hash MD5 de: sql:params
    const hash = crypto
      .createHash('md5')
      .update(`${normalizedSql}:${paramsStr}`)
      .digest('hex')
      .substring(0, 16); // 16 chars são suficientes para evitar colisões

    return `${prefix}:${hash}`;
  }

  // ==========================================================================
  // INVALIDAÇÃO DE CACHE
  // ==========================================================================

  /**
   * Invalida cache por padrão
   *
   * Remove todas as chaves que correspondem ao padrão fornecido.
   * Suporta wildcards (* e ?).
   *
   * @param {string} pattern - Padrão de chaves a invalidar
   * @returns {Promise<number>} Número de chaves removidas
   *
   * @example
   * ```typescript
   * // Invalidar todos os caches de item
   * await QueryCacheService.invalidate('item:*');
   *
   * // Invalidar cache específico
   * await QueryCacheService.invalidate('item:abc123def456');
   *
   * // Invalidar queries de estabelecimento
   * await QueryCacheService.invalidate('estabelecimento:*');
   * ```
   *
   * @performance
   * Operação custosa em grandes caches (lista todas as chaves primeiro)
   */
  static async invalidate(pattern: string): Promise<number> {
    log.info('Query cache: INVALIDATE', { pattern });
    return CacheManager.invalidate(pattern);
  }

  /**
   * Invalida múltiplos padrões de uma vez
   *
   * Útil quando uma operação afeta múltiplos tipos de cache.
   *
   * @param {string[]} patterns - Lista de padrões a invalidar
   * @returns {Promise<number>} Total de chaves removidas
   *
   * @example
   * ```typescript
   * // Invalidar item e seus estabelecimentos
   * await QueryCacheService.invalidateMultiple([
   *   'item:abc123*',
   *   'estabelecimento:abc123*'
   * ]);
   * ```
   */
  static async invalidateMultiple(patterns: string[]): Promise<number> {
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidate(pattern);
    }
    return total;
  }

  // ==========================================================================
  // WRAPPERS ESPECIALIZADOS
  // ==========================================================================

  /**
   * Wrapper para queries de itens
   *
   * Usa TTL otimizado para itens (10 minutos) e prefixo 'item'.
   * Recomendado para queries de dados mestres de itens.
   *
   * @template T - Tipo do resultado
   * @param {string} sql - Query SQL
   * @param {any[]} params - Parâmetros da query
   * @param {Function} queryFn - Função que executa a query
   * @param {number} [ttl] - TTL customizado (padrão: 600s)
   * @returns {Promise<T>} Resultado da query
   *
   * @example
   * ```typescript
   * const item = await QueryCacheService.withItemCache(
   *   'SELECT * FROM item WHERE codigo = @p1',
   *   [{ name: 'p1', value: '7530110' }],
   *   async () => await ItemRepository.query(sql, params)
   * );
   * ```
   *
   * @note
   * TTL padrão (10 min) é adequado para dados cadastrais que mudam pouco
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
   * Usa TTL otimizado para familias (10 minutos) e prefixo 'familia'.
   * Recomendado para queries de dados mestres de familias.
   *
   * @template T - Tipo do resultado
   * @param {string} sql - Query SQL
   * @param {any[]} params - Parâmetros da query
   * @param {Function} queryFn - Função que executa a query
   * @param {number} [ttl] - TTL customizado (padrão: 600s)
   * @returns {Promise<T>} Resultado da query
   *
   * @example
   * ```typescript
   * const familias = await QueryCacheService.withFamiliaCache(
   *   'SELECT * FROM familia WHERE codigo = @p1',
   *   [{ name: 'p1', value: '450000' }],
   *   async () => await FamiliaRepository.query(sql, params)
   * );
   * ```
   *
   * @note
   * TTL padrão (10 min) é adequado para dados cadastrais que mudam pouco
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
   * Usa TTL otimizado para estabelecimentos (15 minutos) e prefixo 'estabelecimento'.
   * Recomendado para queries de dados de estabelecimentos/filiais.
   *
   * @template T - Tipo do resultado
   * @param {string} sql - Query SQL
   * @param {any[]} params - Parâmetros da query
   * @param {Function} queryFn - Função que executa a query
   * @param {number} [ttl] - TTL customizado (padrão: 900s)
   * @returns {Promise<T>} Resultado da query
   *
   * @example
   * ```typescript
   * const estabelecimentos = await QueryCacheService.withEstabelecimentoCache(
   *   'SELECT * FROM estabelecimento WHERE item = @p1',
   *   [{ name: 'p1', value: '7530110' }],
   *   async () => await EstabRepository.query(sql, params)
   * );
   * ```
   *
   * @note
   * TTL maior (15 min) pois estabelecimentos mudam menos frequentemente
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
   * Usa TTL muito curto (30 segundos) para health checks.
   * Health checks devem refletir estado atual do sistema rapidamente.
   *
   * @template T - Tipo do resultado
   * @param {string} sql - Query SQL
   * @param {any[]} params - Parâmetros da query
   * @param {Function} queryFn - Função que executa a query
   * @returns {Promise<T>} Resultado da query
   *
   * @example
   * ```typescript
   * const healthData = await QueryCacheService.withHealthCache(
   *   'SELECT 1 as test',
   *   [],
   *   async () => await DatabaseManager.query('SELECT 1 as test')
   * );
   * ```
   *
   * @note
   * TTL curto (30s) garante que health check não fica "preso" em cache stale
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