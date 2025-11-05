// src/shared/utils/cache/LayeredCacheAdapter.ts

import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de Cache em Camadas (L1 + L2)
 *
 * @module shared/utils/cache/LayeredCacheAdapter
 * @version 1.0.0
 * @see LAYERED_CACHE_ADAPTER.md para documentação completa
 *
 * Implementa estratégia de cache em duas camadas:
 * - L1: Cache local em memória (ultra rápido, local)
 * - L2: Cache Redis distribuído (compartilhado, persistente)
 *
 * Estratégias:
 * - Leitura: L1 → L2 → undefined (com promoção L2→L1)
 * - Escrita: L1 + L2 simultaneamente
 * - Remoção: L1 + L2 simultaneamente
 *
 * @example
 * const l1 = new MemoryCacheAdapter(300);
 * const l2 = new RedisCacheAdapter();
 * const cache = new LayeredCacheAdapter(l1, l2);
 *
 * await cache.set('item:123', item);
 * const data = await cache.get('item:123'); // HIT L1 (~1ms)
 */

interface LayeredStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  totalHits: number;
  totalMisses: number;
}

/**
 * Adaptador de cache em camadas (L1 + L2)
 *
 * @class LayeredCacheAdapter
 * @implements {CacheAdapter}
 */
export class LayeredCacheAdapter implements CacheAdapter {
  private l1: CacheAdapter;
  private l2: CacheAdapter;
  private name: string;

  private stats: LayeredStats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalHits: 0,
    totalMisses: 0,
  };

  /**
   * @param l1 - Adaptador L1 (memória, local, rápido)
   * @param l2 - Adaptador L2 (Redis, distribuído, persistente)
   * @param name - Nome para logging (padrão: 'Layered')
   */
  constructor(l1: CacheAdapter, l2: CacheAdapter, name: string = 'Layered') {
    this.l1 = l1;
    this.l2 = l2;
    this.name = name;

    log.info(`${this.name} cache inicializado (L1 + L2)`);
  }

  /**
   * Busca valor com estratégia em camadas
   *
   * Algoritmo:
   * 1. Tenta L1 → se encontrar: retorna (HIT L1)
   * 2. Tenta L2 → se encontrar: promove para L1 e retorna (HIT L2)
   * 3. Se não encontrar: retorna undefined (MISS)
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      // 1️⃣ Tentativa L1 (memória)
      const l1Value = await this.l1.get<T>(key);

      if (l1Value !== undefined) {
        this.stats.l1Hits++;
        this.stats.totalHits++;
        log.debug(`${this.name} L1 HIT`, { key });
        return l1Value;
      }

      this.stats.l1Misses++;

      // 2️⃣ Tentativa L2 (Redis)
      const l2Value = await this.l2.get<T>(key);

      if (l2Value !== undefined) {
        this.stats.l2Hits++;
        this.stats.totalHits++;
        log.debug(`${this.name} L2 HIT`, { key });

        // Promoção L2 → L1
        await this.l1.set(key, l2Value).catch((err) => {
          log.warn(`${this.name} falha ao promover para L1`, {
            key,
            error: err,
          });
        });

        return l2Value;
      }

      // ❌ Miss em ambas camadas
      this.stats.l2Misses++;
      this.stats.totalMisses++;
      log.debug(`${this.name} MISS (L1 e L2)`, { key });

      return undefined;
    } catch (error) {
      log.error(`${this.name} GET error`, { key, error });
      return undefined;
    }
  }

  /**
   * Armazena valor em AMBAS as camadas simultaneamente
   *
   * @returns true se pelo menos uma camada teve sucesso
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const [l1Success, l2Success] = await Promise.allSettled([
        this.l1.set(key, value, ttl),
        this.l2.set(key, value, ttl),
      ]);

      const l1Ok = l1Success.status === 'fulfilled' && l1Success.value;
      const l2Ok = l2Success.status === 'fulfilled' && l2Success.value;

      if (!l1Ok) {
        log.warn(`${this.name} falha L1 SET`, { key });
      }
      if (!l2Ok) {
        log.warn(`${this.name} falha L2 SET`, { key });
      }

      log.debug(`${this.name} SET`, {
        key,
        ttl,
        l1: l1Ok ? 'OK' : 'FAIL',
        l2: l2Ok ? 'OK' : 'FAIL',
      });

      return l1Ok || l2Ok;
    } catch (error) {
      log.error(`${this.name} SET error`, { key, error });
      return false;
    }
  }

  /**
   * Remove valor de AMBAS as camadas
   *
   * @returns Total de chaves removidas (0-2)
   */
  async delete(key: string): Promise<number> {
    try {
      const [l1Deleted, l2Deleted] = await Promise.allSettled([
        this.l1.delete(key),
        this.l2.delete(key),
      ]);

      const l1Count = l1Deleted.status === 'fulfilled' ? l1Deleted.value : 0;
      const l2Count = l2Deleted.status === 'fulfilled' ? l2Deleted.value : 0;

      const totalDeleted = l1Count + l2Count;

      log.debug(`${this.name} DELETE`, {
        key,
        deleted: totalDeleted,
        l1: l1Count,
        l2: l2Count,
      });

      return totalDeleted;
    } catch (error) {
      log.error(`${this.name} DELETE error`, { key, error });
      return 0;
    }
  }

  /**
   * Limpa AMBAS as camadas completamente
   */
  async flush(): Promise<void> {
    try {
      await Promise.allSettled([this.l1.flush(), this.l2.flush()]);

      log.info(`${this.name} FLUSH ALL (L1 + L2)`);
    } catch (error) {
      log.error(`${this.name} FLUSH error`, { error });
    }
  }

  /**
   * Lista chaves de AMBAS as camadas (união, sem duplicatas)
   */
  async keys(pattern?: string): Promise<string[]> {
    try {
      const [l1Keys, l2Keys] = await Promise.allSettled([
        this.l1.keys(pattern),
        this.l2.keys(pattern),
      ]);

      const l1Array = l1Keys.status === 'fulfilled' ? l1Keys.value : [];
      const l2Array = l2Keys.status === 'fulfilled' ? l2Keys.value : [];

      const uniqueKeys = Array.from(new Set([...l1Array, ...l2Array]));

      log.debug(`${this.name} KEYS`, {
        pattern,
        total: uniqueKeys.length,
        l1: l1Array.length,
        l2: l2Array.length,
      });

      return uniqueKeys;
    } catch (error) {
      log.error(`${this.name} KEYS error`, { pattern, error });
      return [];
    }
  }

  /**
   * Verifica se pelo menos uma camada está disponível
   *
   * @returns true se L1 OU L2 disponível
   */
  async isReady(): Promise<boolean> {
    try {
      const [l1Ready, l2Ready] = await Promise.all([this.l1.isReady(), this.l2.isReady()]);

      const ready = l1Ready || l2Ready;

      if (!ready) {
        log.warn(`${this.name} AMBAS camadas indisponíveis`);
      }

      return ready;
    } catch (error) {
      log.error(`${this.name} isReady error`, { error });
      return false;
    }
  }

  /**
   * Fecha ambas as camadas
   */
  async close(): Promise<void> {
    try {
      await Promise.allSettled([this.l1.close(), this.l2.close()]);

      log.info(`${this.name} fechado (L1 + L2)`);
    } catch (error) {
      log.error(`${this.name} CLOSE error`, { error });
    }
  }

  /**
   * Retorna estatísticas detalhadas de uso
   *
   * @returns Estatísticas de L1, L2 e overall
   */
  getStats() {
    const l1HitRate =
      this.stats.l1Hits > 0
        ? (this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)) * 100
        : 0;

    const l2HitRate =
      this.stats.l2Hits > 0
        ? (this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)) * 100
        : 0;

    const overallHitRate =
      this.stats.totalHits > 0
        ? (this.stats.totalHits / (this.stats.totalHits + this.stats.totalMisses)) * 100
        : 0;

    return {
      l1: {
        hits: this.stats.l1Hits,
        misses: this.stats.l1Misses,
        hitRate: Math.round(l1HitRate * 100) / 100,
      },
      l2: {
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses,
        hitRate: Math.round(l2HitRate * 100) / 100,
      },
      overall: {
        hits: this.stats.totalHits,
        misses: this.stats.totalMisses,
        hitRate: Math.round(overallHitRate * 100) / 100,
      },
    };
  }
}
