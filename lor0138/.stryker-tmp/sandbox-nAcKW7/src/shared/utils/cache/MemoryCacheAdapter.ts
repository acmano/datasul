// @ts-nocheck
// src/shared/utils/cache/MemoryCacheAdapter.ts

import NodeCache from 'node-cache';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de cache em memória (L1)
 * - Ultra rápido (acesso local)
 * - Volátil (perde dados ao reiniciar)
 * - Não compartilhado entre instâncias
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: NodeCache;
  private name: string;

  constructor(stdTTL: number = 300, name: string = 'L1-Memory') {
    this.cache = new NodeCache({ 
      stdTTL,
      checkperiod: 120, // Verifica expiração a cada 2min
      useClones: false  // Performance: não clona objetos
    });
    this.name = name;

    log.info(`${this.name} cache inicializado`, { 
      ttl: stdTTL,
      checkPeriod: 120 
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = this.cache.get<T>(key);
      
      if (value !== undefined) {
        log.debug(`${this.name} HIT`, { key });
      } else {
        log.debug(`${this.name} MISS`, { key });
      }

      return value;
    } catch (error) {
      log.error(`${this.name} GET error`, { key, error });
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const success = ttl 
        ? this.cache.set(key, value, ttl)
        : this.cache.set(key, value);

      if (success) {
        log.debug(`${this.name} SET`, { key, ttl });
      }

      return success;
    } catch (error) {
      log.error(`${this.name} SET error`, { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      const deleted = this.cache.del(key);
      log.debug(`${this.name} DELETE`, { key, deleted });
      return deleted;
    } catch (error) {
      log.error(`${this.name} DELETE error`, { key, error });
      return 0;
    }
  }

  async flush(): Promise<void> {
    try {
      this.cache.flushAll();
      log.info(`${this.name} FLUSH ALL`);
    } catch (error) {
      log.error(`${this.name} FLUSH error`, { error });
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      const allKeys = this.cache.keys();

      if (!pattern) {
        return allKeys;
      }

      // Converte pattern com * para regex
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*') + '$'
      );

      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      log.error(`${this.name} KEYS error`, { pattern, error });
      return [];
    }
  }

  async isReady(): Promise<boolean> {
    return true; // Memória sempre está pronta
  }

  async close(): Promise<void> {
    try {
      this.cache.close();
      log.info(`${this.name} fechado`);
    } catch (error) {
      log.error(`${this.name} CLOSE error`, { error });
    }
  }

  /**
   * Métodos extras específicos do NodeCache
   */
  getStats() {
    return this.cache.getStats();
  }

  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }
}