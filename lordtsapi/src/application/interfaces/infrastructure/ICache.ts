// src/application/interfaces/infrastructure/ICache.ts

/**
 * Interface de Cache (Port)
 *
 * @description
 * Define o contrato para serviços de cache.
 * Permite trocar implementação (Redis, Memory, etc) sem afetar Use Cases.
 *
 * @example
 * ```typescript
 * class GetItemUseCase {
 *   constructor(
 *     private cache: ICache,
 *     private itemRepository: IItemRepository
 *   ) {}
 *
 *   async execute(codigo: string): Promise<ItemDTO> {
 *     const cacheKey = `item:${codigo}`;
 *
 *     // Tenta buscar do cache
 *     const cached = await this.cache.get<ItemDTO>(cacheKey);
 *     if (cached) return cached;
 *
 *     // Busca do repositório
 *     const item = await this.itemRepository.findByCodigo(codigo);
 *
 *     // Salva no cache
 *     await this.cache.set(cacheKey, item, 300);
 *
 *     return item;
 *   }
 * }
 * ```
 */
export interface ICache {
  /**
   * Busca valor do cache
   *
   * @param key - Chave
   * @returns Valor ou null se não encontrado
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Salva valor no cache
   *
   * @param key - Chave
   * @param value - Valor
   * @param ttl - Tempo de vida em segundos (opcional)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Remove valor do cache
   *
   * @param key - Chave
   */
  del(key: string): Promise<void>;

  /**
   * Remove múltiplas chaves
   *
   * @param keys - Array de chaves
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Verifica se chave existe
   *
   * @param key - Chave
   * @returns true se existe
   */
  has(key: string): Promise<boolean>;

  /**
   * Limpa todo o cache
   */
  clear(): Promise<void>;

  /**
   * Busca ou calcula valor (cache pattern)
   *
   * @param key - Chave
   * @param factory - Função para calcular valor se não estiver no cache
   * @param ttl - Tempo de vida em segundos
   * @returns Valor (do cache ou calculado)
   *
   * @example
   * ```typescript
   * const item = await cache.getOrSet(
   *   `item:${codigo}`,
   *   () => repository.findByCodigo(codigo),
   *   300
   * );
   * ```
   */
  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T>;

  /**
   * Invalida cache por padrão
   *
   * @param pattern - Padrão de chave (ex: 'item:*')
   */
  invalidatePattern(pattern: string): Promise<void>;

  /**
   * Retorna estatísticas do cache
   *
   * @returns Estatísticas
   */
  getStats(): Promise<CacheStats>;
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
  memoryUsage?: number;
}

/**
 * Opções de cache
 */
export interface CacheOptions {
  ttl?: number;
  strategy?: 'memory' | 'redis' | 'layered';
}
