// @ts-nocheck
// src/shared/utils/cache/LayeredCacheAdapter.ts

import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de cache em camadas (L1 + L2)
 * 
 * Estratégia:
 * 1. GET: Busca L1 → L2 → Banco (promove L2→L1 em hit)
 * 2. SET: Armazena L1 + L2 simultaneamente
 * 3. DELETE: Remove de L1 + L2
 * 
 * Benefícios:
 * - Performance máxima (L1 memória)
 * - Compartilhamento entre servidores (L2 Redis)
 * - Redundância (fallback L1↔L2)
 */
export class LayeredCacheAdapter implements CacheAdapter {
  private l1: CacheAdapter; // Memória (rápido, local)
  private l2: CacheAdapter; // Redis (compartilhado, persistente)
  private name: string;

  // Estatísticas
  private stats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalHits: 0,
    totalMisses: 0
  };

  constructor(l1: CacheAdapter, l2: CacheAdapter, name: string = 'Layered') {
    this.l1 = l1;
    this.l2 = l2;
    this.name = name;

    log.info(`${this.name} cache inicializado (L1 + L2)`);
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      // 1️⃣ Tenta L1 (memória)
      const l1Value = await this.l1.get<T>(key);
      
      if (l1Value !== undefined) {
        this.stats.l1Hits++;
        this.stats.totalHits++;
        log.debug(`${this.name} L1 HIT`, { key });
        return l1Value;
      }

      this.stats.l1Misses++;

      // 2️⃣ Tenta L2 (Redis)
      const l2Value = await this.l2.get<T>(key);

      if (l2Value !== undefined) {
        this.stats.l2Hits++;
        this.stats.totalHits++;
        log.debug(`${this.name} L2 HIT`, { key });

        // 🔼 PROMOVE para L1 (próxima leitura será mais rápida)
        await this.l1.set(key, l2Value).catch(err => {
          log.warn(`${this.name} falha ao promover para L1`, { key, error: err });
        });

        return l2Value;
      }

      this.stats.l2Misses++;
      this.stats.totalMisses++;
      log.debug(`${this.name} MISS (L1 e L2)`, { key });

      return undefined;
    } catch (error) {
      log.error(`${this.name} GET error`, { key, error });
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      // Armazena em AMBAS as camadas simultaneamente
      const [l1Success, l2Success] = await Promise.allSettled([
        this.l1.set(key, value, ttl),
        this.l2.set(key, value, ttl)
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
        l2: l2Ok ? 'OK' : 'FAIL' 
      });

      // Considera sucesso se pelo menos uma camada funcionou
      return l1Ok || l2Ok;
    } catch (error) {
      log.error(`${this.name} SET error`, { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      // Remove de AMBAS as camadas
      const [l1Deleted, l2Deleted] = await Promise.allSettled([
        this.l1.delete(key),
        this.l2.delete(key)
      ]);

      const l1Count = l1Deleted.status === 'fulfilled' ? l1Deleted.value : 0;
      const l2Count = l2Deleted.status === 'fulfilled' ? l2Deleted.value : 0;

      const total = l1Count + l2Count;

      log.debug(`${this.name} DELETE`, { 
        key, 
        l1: l1Count, 
        l2: l2Count, 
        total 
      });

      return total;
    } catch (error) {
      log.error(`${this.name} DELETE error`, { key, error });
      return 0;
    }
  }

  async flush(): Promise<void> {
    try {
      // Limpa AMBAS as camadas
      await Promise.allSettled([
        this.l1.flush(),
        this.l2.flush()
      ]);

      log.info(`${this.name} FLUSH ALL (L1 + L2)`);

      // Reseta estatísticas
      this.stats = {
        l1Hits: 0,
        l1Misses: 0,
        l2Hits: 0,
        l2Misses: 0,
        totalHits: 0,
        totalMisses: 0
      };
    } catch (error) {
      log.error(`${this.name} FLUSH error`, { error });
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      // Retorna UNIÃO de L1 + L2 (sem duplicatas)
      const [l1Keys, l2Keys] = await Promise.allSettled([
        this.l1.keys(pattern),
        this.l2.keys(pattern)
      ]);

      const l1List = l1Keys.status === 'fulfilled' ? l1Keys.value : [];
      const l2List = l2Keys.status === 'fulfilled' ? l2Keys.value : [];

      // Remove duplicatas
      const uniqueKeys = [...new Set([...l1List, ...l2List])];

      log.debug(`${this.name} KEYS`, { 
        pattern, 
        l1: l1List.length, 
        l2: l2List.length, 
        total: uniqueKeys.length 
      });

      return uniqueKeys;
    } catch (error) {
      log.error(`${this.name} KEYS error`, { pattern, error });
      return [];
    }
  }

  async isReady(): Promise<boolean> {
    try {
      const [l1Ready, l2Ready] = await Promise.all([
        this.l1.isReady(),
        this.l2.isReady()
      ]);

      // Considera pronto se pelo menos L1 estiver OK
      return l1Ready;
    } catch (error) {
      log.error(`${this.name} isReady error`, { error });
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await Promise.allSettled([
        this.l1.close(),
        this.l2.close()
      ]);

      log.info(`${this.name} fechado (L1 + L2)`);
    } catch (error) {
      log.error(`${this.name} CLOSE error`, { error });
    }
  }

  /**
   * Retorna estatísticas do cache em camadas
   */
  getStats() {
    const l1HitRate = this.stats.l1Hits + this.stats.l1Misses > 0
      ? (this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)) * 100
      : 0;

    const l2HitRate = this.stats.l2Hits + this.stats.l2Misses > 0
      ? (this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)) * 100
      : 0;

    const totalHitRate = this.stats.totalHits + this.stats.totalMisses > 0
      ? (this.stats.totalHits / (this.stats.totalHits + this.stats.totalMisses)) * 100
      : 0;

    return {
      l1: {
        hits: this.stats.l1Hits,
        misses: this.stats.l1Misses,
        hitRate: l1HitRate.toFixed(2) + '%'
      },
      l2: {
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses,
        hitRate: l2HitRate.toFixed(2) + '%'
      },
      total: {
        hits: this.stats.totalHits,
        misses: this.stats.totalMisses,
        hitRate: totalHitRate.toFixed(2) + '%'
      }
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      totalHits: 0,
      totalMisses: 0
    };

    log.info(`${this.name} estatísticas resetadas`);
  }
}