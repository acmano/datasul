// src/shared/utils/cacheManager.ts

import NodeCache from 'node-cache';
import { log } from './logger';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
}

interface CacheConfig {
  /**
   * TTL padrão em segundos
   * @default 300 (5 minutos)
   */
  stdTTL?: number;

  /**
   * Intervalo de verificação de chaves expiradas (em segundos)
   * @default 600 (10 minutos)
   */
  checkperiod?: number;

  /**
   * Usar clones ao retornar valores (evita mutação)
   * @default true
   */
  useClones?: boolean;

  /**
   * Delete on expire
   * @default true
   */
  deleteOnExpire?: boolean;
}

/**
 * Gerenciador de Cache em Memória
 * 
 * Usa node-cache para armazenar resultados de queries e reduzir carga no banco.
 * 
 * Features:
 * - TTL configurável por chave
 * - Métricas de hit/miss
 * - Invalidação manual e automática
 * - Suporte a namespaces
 * - Clonagem de objetos (evita mutação)
 * 
 * @example
 * const cache = CacheManager.getInstance();
 * 
 * // Set
 * cache.set('user:123', userData, 300); // 5 minutos
 * 
 * // Get
 * const user = cache.get('user:123');
 * 
 * // Invalidar
 * cache.invalidate('user:*'); // Todas as chaves que começam com 'user:'
 */
export class CacheManager {
  private static instance: CacheManager | null = null;
  private cache: NodeCache;
  private stats = {
    hits: 0,
    misses: 0,
  };

  private constructor(config: CacheConfig = {}) {
    this.cache = new NodeCache({
      stdTTL: config.stdTTL || 300, // 5 minutos padrão
      checkperiod: config.checkperiod || 600, // Verifica a cada 10 minutos
      useClones: config.useClones !== false, // true por padrão
      deleteOnExpire: config.deleteOnExpire !== false, // true por padrão
    });

    // Eventos de cache
    this.cache.on('set', (key, value) => {
      log.debug('Cache SET', { key, ttl: this.cache.getTtl(key) });
    });

    this.cache.on('del', (key, value) => {
      log.debug('Cache DEL', { key });
    });

    this.cache.on('expired', (key, value) => {
      log.debug('Cache EXPIRED', { key });
    });

    log.info('Cache Manager inicializado', {
      stdTTL: config.stdTTL || 300,
      checkperiod: config.checkperiod || 600,
    });
  }

  /**
   * Singleton instance
   */
  public static getInstance(config?: CacheConfig): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager(config);
    }
    return this.instance;
  }

  /**
   * Armazena valor no cache
   * 
   * @param key Chave única
   * @param value Valor a ser armazenado
   * @param ttl TTL em segundos (opcional, usa padrão se não informado)
   */
  public set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const success = ttl 
        ? this.cache.set(key, value, ttl)
        : this.cache.set(key, value);

      if (success) {
        log.debug('Cache armazenado', { 
          key, 
          ttl: ttl || this.cache.options.stdTTL,
          size: JSON.stringify(value).length 
        });
      }

      return success;
    } catch (error) {
      log.error('Erro ao armazenar no cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      return false;
    }
  }

  /**
   * Recupera valor do cache
   * 
   * @param key Chave
   * @returns Valor ou undefined se não existir/expirado
   */
  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);

    if (value !== undefined) {
      this.stats.hits++;
      log.debug('Cache HIT', { key, hitRate: this.getHitRate() });
    } else {
      this.stats.misses++;
      log.debug('Cache MISS', { key, hitRate: this.getHitRate() });
    }

    return value;
  }

  /**
   * Recupera ou computa valor (cache-aside pattern)
   * 
   * @param key Chave
   * @param fetchFn Função para buscar valor se não estiver em cache
   * @param ttl TTL em segundos
   * @returns Valor do cache ou resultado de fetchFn
   */
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Tenta pegar do cache
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - busca valor
    log.debug('Cache MISS - Buscando valor', { key });
    const value = await fetchFn();

    // Armazena no cache
    this.set(key, value, ttl);

    return value;
  }

  /**
   * Remove valor do cache
   * 
   * @param key Chave
   */
  public delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Invalida cache por padrão (suporta wildcard *)
   * 
   * @param pattern Padrão de chave (ex: 'user:*', 'item:*')
   * @returns Número de chaves removidas
   */
  public invalidate(pattern: string): number {
    const keys = this.cache.keys();
    
    // Converte padrão para regex
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    const keysToDelete = keys.filter(key => regex.test(key));
    
    if (keysToDelete.length > 0) {
      this.cache.del(keysToDelete);
      log.info('Cache invalidado', { pattern, keysRemoved: keysToDelete.length });
    }

    return keysToDelete.length;
  }

  /**
   * Limpa todo o cache
   */
  public flush(): void {
    this.cache.flushAll();
    this.stats = { hits: 0, misses: 0 };
    log.info('Cache limpo completamente');
  }

  /**
   * Verifica se chave existe
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Retorna todas as chaves
   */
  public keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Retorna estatísticas do cache
   */
  public getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.cache.keys().length,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * Calcula taxa de acerto (hit rate)
   */
  private getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return Math.round((this.stats.hits / total) * 100 * 100) / 100; // 2 decimais
  }

  /**
   * Reseta estatísticas
   */
  public resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
    log.info('Estatísticas do cache resetadas');
  }

  /**
   * Retorna informações detalhadas
   */
  public getInfo(): {
    stats: CacheStats;
    config: {
      stdTTL: number;
      checkperiod: number;
      useClones: boolean;
    };
    keys: Array<{ key: string; ttl: number | undefined }>;
  } {
    const keys = this.cache.keys().map(key => ({
      key,
      ttl: this.cache.getTtl(key),
    }));

    return {
      stats: this.getStats(),
      config: {
        stdTTL: this.cache.options.stdTTL || 0,
        checkperiod: this.cache.options.checkperiod || 0,
        useClones: this.cache.options.useClones || false,
      },
      keys,
    };
  }
}

/**
 * Helper: Gera chave de cache consistente
 * 
 * @example
 * generateCacheKey('item', '7530110', 'informacoesGerais')
 * // Retorna: 'item:7530110:informacoesGerais'
 */
export function generateCacheKey(...parts: Array<string | number>): string {
  return parts.map(part => String(part).trim()).join(':');
}

/**
 * Decorator para cachear métodos automaticamente
 * 
 * @example
 * class ItemService {
 *   @Cacheable('item', 300) // TTL de 5 minutos
 *   async getItem(id: string) {
 *     return await this.repository.findById(id);
 *   }
 * }
 */
export function Cacheable(namespace: string, ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = CacheManager.getInstance();
      const cacheKey = generateCacheKey(namespace, ...args);

      // Tenta pegar do cache
      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Cache miss - executa método original
      const result = await originalMethod.apply(this, args);

      // Armazena no cache
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}