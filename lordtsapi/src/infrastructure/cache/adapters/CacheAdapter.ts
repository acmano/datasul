// src/shared/utils/cache/CacheAdapter.ts

/**
 * Interface Base para Adaptadores de Cache
 *
 * @module shared/utils/cache/CacheAdapter
 * @version 1.0.0
 * @see CACHE_ADAPTER.md para documentação completa
 *
 * Define contrato padrão para implementações de cache (memória, Redis, etc).
 *
 * Padrões de projeto:
 * - Strategy Pattern: diferentes implementações de cache
 * - Adapter Pattern: adapta diferentes backends para interface única
 *
 * Implementações disponíveis:
 * - MemoryCacheAdapter: cache local em memória (L1)
 * - RedisCacheAdapter: cache distribuído via Redis (L2)
 * - LayeredCacheAdapter: cache em camadas (L1 + L2)
 *
 * @example
 * const cache: CacheAdapter = new MemoryCacheAdapter(300);
 *
 * await cache.set('item:123', { name: 'Product' }, 600);
 * const data = await cache.get<Item>('item:123');
 * await cache.delete('item:123');
 */

/**
 * Interface base para adaptadores de cache
 *
 * @interface CacheAdapter
 */
export interface CacheAdapter {
  /**
   * Busca valor no cache
   *
   * @param key - Chave do cache (ex: 'item:7530110')
   * @returns Promise com valor tipado ou undefined se não encontrado
   * @template T - Tipo do valor armazenado
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Armazena valor no cache
   *
   * @param key - Chave do cache (ex: 'item:7530110')
   * @param value - Valor a armazenar (será serializado se objeto)
   * @param ttl - Tempo de vida em SEGUNDOS (opcional)
   * @returns Promise<true> se sucesso, Promise<false> se falha
   * @template T - Tipo do valor a ser armazenado
   */
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;

  /**
   * Remove valor do cache
   *
   * @param key - Chave a remover (pode suportar wildcard)
   * @returns Promise com número de chaves removidas
   */
  delete(key: string): Promise<number>;

  /**
   * Limpa todo o cache
   *
   * @returns Promise que resolve quando cache limpo
   */
  flush(): Promise<void>;

  /**
   * Lista todas as chaves em cache
   *
   * @param pattern - Padrão de busca opcional (ex: 'item:*')
   * @returns Promise com array de chaves
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Verifica se o cache está disponível
   *
   * @returns Promise<true> se disponível, Promise<false> se não
   */
  isReady(): Promise<boolean>;

  /**
   * Fecha conexão com cache
   *
   * @returns Promise que resolve quando fechado
   */
  close(): Promise<void>;
}

/**
 * Estatísticas de cache (opcional)
 *
 * @interface CacheStats
 */
export interface CacheStats {
  /** Número de cache hits (encontrado) */
  hits: number;

  /** Número de cache misses (não encontrado) */
  misses: number;

  /** Taxa de acerto do cache em porcentagem (hits / (hits + misses) * 100) */
  hitRate: number;

  /** Número total de chaves em cache */
  keys: number;

  /** Uso de memória em bytes (opcional) */
  memoryUsage?: number;
}
