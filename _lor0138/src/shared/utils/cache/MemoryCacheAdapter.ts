// src/shared/utils/cache/MemoryCacheAdapter.ts

import NodeCache from 'node-cache';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de Cache em Memória (L1)
 *
 * @module shared/utils/cache/MemoryCacheAdapter
 * @version 1.0.0
 * @see MEMORY_CACHE_ADAPTER.md para documentação completa
 *
 * Implementa cache local utilizando node-cache.
 * Armazena dados na memória RAM do processo Node.js.
 *
 * Características:
 * ✅ Ultra rápido: ~1ms por operação
 * ✅ Zero latência de rede
 * ❌ Volátil: perde dados ao reiniciar
 * ❌ Não compartilhado entre instâncias
 * ❌ Limitado pela RAM disponível
 *
 * Casos de uso:
 * - Single-instance
 * - Cache L1 em arquitetura em camadas
 * - Desenvolvimento e testes
 * - Hot data em produção
 *
 * @see https://www.npmjs.com/package/node-cache
 * @example
 * const cache = new MemoryCacheAdapter(300, 'L1-Memory');
 *
 * await cache.set('item:123', { name: 'Product' }, 600);
 * const item = await cache.get<Item>('item:123');
 * await cache.delete('item:123');
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: NodeCache;
  private name: string;

  /**
   * @param stdTTL - TTL padrão em segundos (padrão: 300 = 5min)
   * @param name - Nome para logging (padrão: 'L1-Memory')
   */
  constructor(stdTTL: number = 300, name: string = 'L1-Memory') {
    this.cache = new NodeCache({
      stdTTL,
      checkperiod: 120, // Verifica expiração a cada 2min
      useClones: false, // Performance: não clona objetos
    });
    this.name = name;

    log.info(`${this.name} cache inicializado`, {
      ttl: stdTTL,
      checkPeriod: 120,
    });
  }

  /**
   * Busca valor no cache de memória
   *
   * @returns undefined se não encontrado ou expirado
   */
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

  /**
   * Armazena valor no cache de memória
   *
   * @param ttl - Tempo de vida em SEGUNDOS (opcional, usa padrão se não fornecido)
   * @returns true se sucesso, false se falha
   */
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

  /**
   * Remove valor do cache de memória
   *
   * @returns 0 ou 1 (número de chaves removidas)
   */
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

  /**
   * Limpa todo o cache de memória
   */
  async flush(): Promise<void> {
    try {
      this.cache.flushAll();
      log.info(`${this.name} FLUSH ALL`);
    } catch (error) {
      log.error(`${this.name} FLUSH error`, { error });
    }
  }

  /**
   * Lista todas as chaves no cache
   *
   * @param pattern - Padrão de busca opcional (suporta wildcard *)
   * @returns Array de chaves
   */
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

      const filteredKeys = allKeys.filter((key) => regex.test(key));

      log.debug(`${this.name} KEYS`, {
        pattern,
        total: filteredKeys.length,
      });

      return filteredKeys;
    } catch (error) {
      log.error(`${this.name} KEYS error`, { pattern, error });
      return [];
    }
  }

  /**
   * Verifica se cache está disponível
   *
   * @returns Sempre true (memória sempre disponível)
   */
  async isReady(): Promise<boolean> {
    return true;
  }

  /**
   * Fecha cache (cleanup)
   *
   * Para timer de verificação de expiração e libera memória.
   */
  async close(): Promise<void> {
    try {
      this.cache.close();
      log.info(`${this.name} fechado`);
    } catch (error) {
      log.error(`${this.name} CLOSE error`, { error });
    }
  }

  /**
   * Retorna estatísticas do cache
   *
   * @returns Objeto com hits, misses, keys, hitRate
   */
  getStats() {
    const stats = this.cache.getStats();
    const keys = this.cache.keys().length;

    const hitRate =
      stats.hits > 0
        ? (stats.hits / (stats.hits + stats.misses)) * 100
        : 0;

    return {
      hits: stats.hits,
      misses: stats.misses,
      keys,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
}