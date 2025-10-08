// src/shared/utils/cache/RedisCacheAdapter.ts

import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de Cache Redis (L2)
 *
 * @module shared/utils/cache/RedisCacheAdapter
 * @version 1.0.0
 * @see REDIS_CACHE_ADAPTER.md para documentação completa
 *
 * Implementa cache distribuído utilizando Redis.
 *
 * Características:
 * ✅ Compartilhado entre instâncias
 * ✅ Persistente (sobrevive restarts)
 * ✅ Escalável (milhões de chaves)
 * ❌ Latência de rede (~5-20ms)
 * ❌ Requer infraestrutura Redis
 *
 * Casos de uso:
 * - Aplicações multi-instância
 * - Cache persistente
 * - Dados compartilhados entre microserviços
 * - Cache L2 em arquitetura em camadas
 *
 * @see https://github.com/luin/ioredis
 * @example
 * const cache = new RedisCacheAdapter('redis://localhost:6379');
 *
 * await cache.set('item:123', item, 600);
 * const cached = await cache.get<Item>('item:123');
 */
export class RedisCacheAdapter implements CacheAdapter {
  private redis: Redis;
  private name: string;
  private ready: boolean = false;

  /**
   * @param urlOrOptions - URL de conexão ou objeto de opções
   * @param name - Nome para logging (padrão: 'L2-Redis')
   */
  constructor(urlOrOptions: string | RedisOptions, name: string = 'L2-Redis') {
    this.name = name;

    if (typeof urlOrOptions === 'string') {
      this.redis = new Redis(urlOrOptions, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          log.warn(`${this.name} reconectando...`, { attempt: times, delay });
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });
    } else {
      this.redis = new Redis(urlOrOptions);
    }

    this.setupEventHandlers();
  }

  /**
   * Configura listeners para eventos do Redis
   *
   * Eventos: connect, ready, error, close, reconnecting
   * @private
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      log.info(`${this.name} conectando...`);
    });

    this.redis.on('ready', () => {
      this.ready = true;
      log.info(`${this.name} pronto`, {
        host: this.redis.options.host,
        port: this.redis.options.port,
      });
    });

    this.redis.on('error', (error) => {
      log.error(`${this.name} erro`, { error: error.message });
    });

    this.redis.on('close', () => {
      this.ready = false;
      log.warn(`${this.name} conexão fechada`);
    });

    this.redis.on('reconnecting', () => {
      log.info(`${this.name} reconectando...`);
    });
  }

  /**
   * Busca valor no cache Redis
   *
   * @returns undefined se não encontrado ou Redis offline
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`, { key });
        return undefined;
      }

      const value = await this.redis.get(key);

      if (value) {
        log.debug(`${this.name} HIT`, { key });
        return JSON.parse(value) as T;
      }

      log.debug(`${this.name} MISS`, { key });
      return undefined;
    } catch (error) {
      log.error(`${this.name} GET error`, { key, error });
      return undefined;
    }
  }

  /**
   * Armazena valor no cache Redis
   *
   * @param ttl - Tempo de vida em SEGUNDOS (opcional)
   * @returns true se sucesso, false se falha
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`, { key });
        return false;
      }

      const serialized = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }

      log.debug(`${this.name} SET`, { key, ttl });
      return true;
    } catch (error) {
      log.error(`${this.name} SET error`, { key, error });
      return false;
    }
  }

  /**
   * Remove valor do cache Redis
   *
   * @returns Número de chaves removidas
   */
  async delete(key: string): Promise<number> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`, { key });
        return 0;
      }

      const deleted = await this.redis.del(key);
      log.debug(`${this.name} DELETE`, { key, deleted });
      return deleted;
    } catch (error) {
      log.error(`${this.name} DELETE error`, { key, error });
      return 0;
    }
  }

  /**
   * Limpa TODO o Redis (database atual)
   *
   * ⚠️ CUIDADO: Extremamente destrutivo
   */
  async flush(): Promise<void> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`);
        return;
      }

      await this.redis.flushall();
      log.info(`${this.name} FLUSH ALL`);
    } catch (error) {
      log.error(`${this.name} FLUSH error`, { error });
    }
  }

  /**
   * Lista chaves usando SCAN (seguro, não bloqueia)
   *
   * @param pattern - Padrão Redis (padrão: '*' = todas)
   * @returns Array de chaves
   */
  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`);
        return [];
      }

      const keys: string[] = [];
      let cursor = '0';

      do {
        const [nextCursor, foundKeys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );

        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');

      return keys;
    } catch (error) {
      log.error(`${this.name} KEYS error`, { pattern, error });
      return [];
    }
  }

  /**
   * Verifica se Redis está conectado e pronto
   *
   * @returns true se disponível, false se offline
   */
  async isReady(): Promise<boolean> {
    return this.ready;
  }

  /**
   * Fecha conexão com Redis graciosamente
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      this.ready = false;
      log.info(`${this.name} fechado`);
    } catch (error) {
      log.error(`${this.name} CLOSE error`, { error });
    }
  }

  /**
   * Executa PING no Redis
   *
   * @returns 'PONG' se conectado
   */
  async ping(): Promise<string> {
    return this.redis.ping();
  }

  /**
   * Retorna informações do servidor Redis
   *
   * @returns String INFO do Redis
   */
  async info(): Promise<string> {
    return this.redis.info();
  }

  /**
   * Retorna cliente Redis interno
   *
   * Para operações avançadas não cobertas pela interface.
   *
   * @returns Instância ioredis
   */
  getClient(): Redis {
    return this.redis;
  }
}