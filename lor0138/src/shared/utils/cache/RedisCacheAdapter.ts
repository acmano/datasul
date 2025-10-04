// src/shared/utils/cache/RedisCacheAdapter.ts

import Redis from 'ioredis';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de cache Redis (L2)
 * - Compartilhado entre múltiplas instâncias
 * - Persistente (sobrevive a restarts)
 * - Um pouco mais lento que memória (rede)
 */
export class RedisCacheAdapter implements CacheAdapter {
  private redis: Redis;
  private name: string;
  private ready: boolean = false;

  constructor(urlOrOptions: string | Redis.RedisOptions, name: string = 'L2-Redis') {
    this.name = name;

    // Aceita URL ou objeto de configuração
    if (typeof urlOrOptions === 'string') {
      this.redis = new Redis(urlOrOptions, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          log.warn(`${this.name} reconectando...`, { attempt: times, delay });
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false
      });
    } else {
      this.redis = new Redis(urlOrOptions);
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      log.info(`${this.name} conectando...`);
    });

    this.redis.on('ready', () => {
      this.ready = true;
      log.info(`${this.name} pronto`, {
        host: this.redis.options.host,
        port: this.redis.options.port
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

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`, { key });
        return false;
      }

      const serialized = JSON.stringify(value);

      if (ttl && ttl > 0) {
        // SETEX: Set com expiração
        await this.redis.setex(key, ttl, serialized);
      } else {
        // SET: Sem expiração
        await this.redis.set(key, serialized);
      }

      log.debug(`${this.name} SET`, { key, ttl });
      return true;
    } catch (error) {
      log.error(`${this.name} SET error`, { key, error });
      return false;
    }
  }

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

  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      if (!this.ready) {
        log.warn(`${this.name} não está pronto`);
        return [];
      }

      // SCAN é mais seguro que KEYS em produção
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

  async isReady(): Promise<boolean> {
    return this.ready;
  }

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
   * Métodos extras específicos do Redis
   */
  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async info(): Promise<string> {
    return this.redis.info();
  }

  getClient(): Redis {
    return this.redis;
  }
}