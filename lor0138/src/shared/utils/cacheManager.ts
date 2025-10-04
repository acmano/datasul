// src/shared/utils/cacheManager.ts
// ✅ VERSÃO ATUALIZADA: Suporta Memory, Redis e Layered (L1+L2)

import { CacheAdapter } from './cache/CacheAdapter';
import { MemoryCacheAdapter } from './cache/MemoryCacheAdapter';
import { RedisCacheAdapter } from './cache/RedisCacheAdapter';
import { LayeredCacheAdapter } from './cache/LayeredCacheAdapter';
import { log } from './logger';

/**
 * Gerenciador de cache com suporte a múltiplos backends
 * - Memory: Cache local (padrão)
 * - Redis: Cache compartilhado
 * - Layered: L1 (memory) + L2 (Redis)
 */
export class CacheManager {
  private static adapter: CacheAdapter;
  private static strategy: string = 'memory';
  private static enabled: boolean = true;

  /**
   * Inicializa o cache com a estratégia escolhida
   */
  static initialize(strategy?: string): void {
    this.enabled = process.env.CACHE_ENABLED !== 'false';
    this.strategy = strategy || process.env.CACHE_STRATEGY || 'memory';

    if (!this.enabled) {
      log.warn('❌ Cache desabilitado (CACHE_ENABLED=false)');
      return;
    }

    const ttl = parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10);

    try {
      switch (this.strategy) {
        case 'layered':
          this.initializeLayered(ttl);
          break;

        case 'redis':
          this.initializeRedis(ttl);
          break;

        case 'memory':
        default:
          this.initializeMemory(ttl);
          break;
      }

      log.info('✅ Cache inicializado', { 
        strategy: this.strategy, 
        enabled: this.enabled,
        ttl 
      });
    } catch (error) {
      log.error('❌ Erro ao inicializar cache', { strategy: this.strategy, error });
      // Fallback para memória em caso de erro
      this.initializeMemory(ttl);
    }
  }

  private static initializeMemory(ttl: number): void {
    this.adapter = new MemoryCacheAdapter(ttl, 'Cache-Memory');
    this.strategy = 'memory';
  }

  private static initializeRedis(ttl: number): void {
    const redisUrl = process.env.CACHE_REDIS_URL || 'redis://localhost:6379';
    this.adapter = new RedisCacheAdapter(redisUrl, 'Cache-Redis');
    this.strategy = 'redis';
  }

  private static initializeLayered(ttl: number): void {
    const redisUrl = process.env.CACHE_REDIS_URL || 'redis://localhost:6379';
    
    const l1 = new MemoryCacheAdapter(ttl, 'L1-Memory');
    const l2 = new RedisCacheAdapter(redisUrl, 'L2-Redis');
    
    this.adapter = new LayeredCacheAdapter(l1, l2, 'Cache-Layered');
    this.strategy = 'layered';
  }

  /**
   * Retorna instância singleton (compatibilidade)
   */
  static getInstance(): CacheManager {
    if (!this.adapter) {
      this.initialize();
    }
    return this;
  }

  /**
   * Busca valor no cache
   */
  static async get<T>(key: string): Promise<T | undefined> {
    if (!this.enabled || !this.adapter) {
      return undefined;
    }

    try {
      return await this.adapter.get<T>(key);
    } catch (error) {
      log.error('Cache GET error', { key, error });
      return undefined;
    }
  }

  /**
   * Armazena valor no cache
   */
  static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.enabled || !this.adapter) {
      return false;
    }

    try {
      return await this.adapter.set(key, value, ttl);
    } catch (error) {
      log.error('Cache SET error', { key, error });
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  static async delete(key: string): Promise<number> {
    if (!this.enabled || !this.adapter) {
      return 0;
    }

    try {
      return await this.adapter.delete(key);
    } catch (error) {
      log.error('Cache DELETE error', { key, error });
      return 0;
    }
  }

  /**
   * Limpa todo o cache
   */
  static async flush(): Promise<void> {
    if (!this.enabled || !this.adapter) {
      return;
    }

    try {
      await this.adapter.flush();
      log.info('Cache limpo completamente');
    } catch (error) {
      log.error('Cache FLUSH error', { error });
    }
  }

  /**
   * Lista chaves em cache
   */
  static async keys(pattern?: string): Promise<string[]> {
    if (!this.enabled || !this.adapter) {
      return [];
    }

    try {
      return await this.adapter.keys(pattern);
    } catch (error) {
      log.error('Cache KEYS error', { pattern, error });
      return [];
    }
  }

  /**
   * Invalida chaves por padrão (wildcards)
   */
  static async invalidate(pattern: string): Promise<number> {
    if (!this.enabled || !this.adapter) {
      return 0;
    }

    try {
      const keys = await this.adapter.keys(pattern);
      
      if (keys.length === 0) {
        log.debug('Nenhuma chave encontrada para invalidar', { pattern });
        return 0;
      }

      const deletePromises = keys.map(key => this.adapter.delete(key));
      const results = await Promise.all(deletePromises);
      const total = results.reduce((sum, count) => sum + count, 0);

      log.info('Cache invalidado', { pattern, keys: total });
      return total;
    } catch (error) {
      log.error('Cache INVALIDATE error', { pattern, error });
      return 0;
    }
  }

  /**
   * Cache-aside pattern: busca ou executa função
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Tenta buscar do cache
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Executa função para buscar dados
    const value = await fetchFn();

    // Armazena no cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Verifica se cache está pronto
   */
  static async isReady(): Promise<boolean> {
    if (!this.enabled || !this.adapter) {
      return false;
    }

    try {
      return await this.adapter.isReady();
    } catch (error) {
      log.error('Cache isReady error', { error });
      return false;
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  static getStats(): any {
    if (!this.enabled || !this.adapter) {
      return {
        enabled: false,
        strategy: 'none'
      };
    }

    // LayeredCacheAdapter tem método getStats()
    if (this.adapter instanceof LayeredCacheAdapter) {
      return {
        enabled: true,
        strategy: this.strategy,
        ...this.adapter.getStats()
      };
    }

    // MemoryCacheAdapter tem método getStats()
    if (this.adapter instanceof MemoryCacheAdapter) {
      return {
        enabled: true,
        strategy: this.strategy,
        ...this.adapter.getStats()
      };
    }

    return {
      enabled: true,
      strategy: this.strategy
    };
  }

  /**
   * Fecha conexões (chamado no graceful shutdown)
   */
  static async close(): Promise<void> {
    if (!this.adapter) {
      return;
    }

    try {
      await this.adapter.close();
      log.info('Cache fechado');
    } catch (error) {
      log.error('Cache CLOSE error', { error });
    }
  }
}

/**
 * Gera chave de cache consistente
 */
export function generateCacheKey(...parts: (string | number)[]): string {
  return parts.filter(p => p !== undefined && p !== null).join(':');
}

/**
 * Decorator para cachear métodos de classe
 * @example
 * class MyService {
 *   @Cacheable({ ttl: 600, keyPrefix: 'service' })
 *   async getData(id: string) { ... }
 * }
 */
export function Cacheable(options: { ttl?: number; keyPrefix?: string } = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const keyPrefix = options.keyPrefix || target.constructor.name;
      const cacheKey = generateCacheKey(keyPrefix, propertyKey, ...args);

      return CacheManager.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        options.ttl
      );
    };

    return descriptor;
  };
}