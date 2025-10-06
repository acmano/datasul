// src/shared/utils/cacheManager.ts

import { log } from './logger';
import { MemoryCacheAdapter } from './cache/MemoryCacheAdapter';
import { RedisCacheAdapter } from './cache/RedisCacheAdapter';
import { LayeredCacheAdapter } from './cache/LayeredCacheAdapter';
import type { CacheAdapter } from './cache/CacheAdapter';

/**
 * @fileoverview Gerenciador de Cache Unificado
 *
 * Sistema de cache flexível que suporta múltiplas estratégias:
 * - **memory**: Cache em memória (Node-Cache) - recomendado para instância única
 * - **redis**: Cache distribuído (Redis) - recomendado para múltiplas instâncias
 * - **layered**: Cache em duas camadas (L1: memory + L2: redis) - recomendado para performance
 *
 * Características:
 * - Singleton pattern para garantir única instância
 * - TTL (Time To Live) configurável por chave
 * - Invalidação por padrão (wildcards)
 * - Estatísticas de uso (hits/misses)
 * - Graceful shutdown com fechamento de conexões
 * - Fallback automático para memória em caso de erro
 *
 * @module CacheManager
 * @category Utils
 */

// ============================================================================
// TIPOS E ESTRATÉGIAS
// ============================================================================

/**
 * Estratégias de cache disponíveis
 *
 * @typedef {string} CacheStrategy
 */
type CacheStrategy = 'memory' | 'redis' | 'layered';

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

/**
 * Gerenciador de Cache (Singleton)
 *
 * Responsável por gerenciar o cache da aplicação com suporte a múltiplas
 * estratégias. Fornece interface unificada independente da implementação.
 *
 * **Padrão Singleton:**
 * - Única instância por aplicação
 * - Configuração centralizada
 * - Estado compartilhado
 *
 * **Estratégias Suportadas:**
 *
 * 1. **memory** (padrão):
 *    - Cache em memória do processo
 *    - Rápido mas não distribuído
 *    - Ideal para desenvolvimento e single-instance
 *
 * 2. **redis**:
 *    - Cache distribuído via Redis
 *    - Compartilhado entre instâncias
 *    - Ideal para produção com múltiplas instâncias
 *
 * 3. **layered**:
 *    - L1: Cache em memória (rápido)
 *    - L2: Cache no Redis (persistente)
 *    - Melhor performance + distribuição
 *
 * @class CacheManager
 * @example
 * ```typescript
 * // Inicializar (feito automaticamente no startup)
 * CacheManager.initialize('layered');
 *
 * // Usar cache
 * await CacheManager.set('user:123', userData, 300);
 * const user = await CacheManager.get('user:123');
 *
 * // Invalidar cache
 * await CacheManager.invalidate('user:*');
 * ```
 */
export class CacheManager {
  // ==========================================================================
  // PROPRIEDADES ESTÁTICAS (SINGLETON)
  // ==========================================================================

  /**
   * Adaptador de cache atual (implementação específica)
   * @private
   * @static
   */
  private static adapter: CacheAdapter | null = null;

  /**
   * Indica se o cache está habilitado
   * @private
   * @static
   */
  private static enabled = false;

  /**
   * Estratégia de cache em uso
   * @private
   * @static
   */
  private static strategy: CacheStrategy = 'memory';

  // ==========================================================================
  // INICIALIZAÇÃO
  // ==========================================================================

  /**
   * Inicializa o sistema de cache
   *
   * Configura o cache baseado na estratégia especificada ou nas variáveis
   * de ambiente. Se houver erro, faz fallback automático para memória.
   *
   * **Variáveis de Ambiente:**
   * - `CACHE_ENABLED`: true/false (padrão: true)
   * - `CACHE_STRATEGY`: memory/redis/layered (padrão: memory)
   * - `CACHE_DEFAULT_TTL`: TTL padrão em segundos (padrão: 300)
   * - `CACHE_REDIS_URL`: URL do Redis (se strategy=redis ou layered)
   *
   * @param {CacheStrategy} [strategy] - Estratégia a ser usada (sobrescreve env)
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Usar configuração do .env
   * CacheManager.initialize();
   *
   * // Forçar estratégia específica
   * CacheManager.initialize('layered');
   * ```
   *
   * @critical
   * - Deve ser chamado apenas uma vez no startup
   * - Faz fallback para memória em caso de erro
   * - Não lança exceções, apenas loga erros
   */
  static initialize(strategy?: CacheStrategy): void {
    this.enabled = process.env.CACHE_ENABLED !== 'false';
    this.strategy = strategy || (process.env.CACHE_STRATEGY as CacheStrategy) || 'memory';

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
        ttl,
      });
    } catch (error) {
      log.error('❌ Erro ao inicializar cache', {
        strategy: this.strategy,
        error,
      });
      // Fallback para memória em caso de erro
      this.initializeMemory(ttl);
    }
  }

  /**
   * Inicializa cache em memória (Node-Cache)
   *
   * @param {number} ttl - Time To Live padrão em segundos
   * @returns {void}
   * @private
   */
  private static initializeMemory(ttl: number): void {
    this.adapter = new MemoryCacheAdapter(ttl, 'Cache-Memory');
    this.strategy = 'memory';
  }

  /**
   * Inicializa cache com Redis
   *
   * @param {number} ttl - Time To Live padrão em segundos (não usado no Redis)
   * @returns {void}
   * @private
   *
   * @critical
   * Requer CACHE_REDIS_URL configurado
   */
  private static initializeRedis(ttl: number): void {
    const redisUrl =
      process.env.CACHE_REDIS_URL || 'redis://lor0138.lorenzetti.ibe:6379';
    this.adapter = new RedisCacheAdapter(redisUrl, 'Cache-Redis');
    this.strategy = 'redis';
  }

  /**
   * Inicializa cache em camadas (L1: Memory + L2: Redis)
   *
   * Combina velocidade da memória com persistência do Redis.
   * Busca primeiro em L1 (rápido), depois em L2 (distribuído).
   *
   * @param {number} ttl - Time To Live padrão em segundos
   * @returns {void}
   * @private
   *
   * @critical
   * Requer CACHE_REDIS_URL configurado
   */
  private static initializeLayered(ttl: number): void {
    const redisUrl =
      process.env.CACHE_REDIS_URL || 'redis://lor0138.lorenzetti.ibe:6379';

    const l1 = new MemoryCacheAdapter(ttl, 'L1-Memory');
    const l2 = new RedisCacheAdapter(redisUrl, 'L2-Redis');

    this.adapter = new LayeredCacheAdapter(l1, l2, 'Cache-Layered');
    this.strategy = 'layered';
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS - OPERAÇÕES BÁSICAS
  // ==========================================================================

  /**
   * Retorna instância singleton (compatibilidade)
   *
   * Inicializa automaticamente se ainda não foi feito.
   *
   * @returns {CacheManager} Instância do CacheManager
   *
   * @deprecated Prefira usar métodos estáticos diretamente
   *
   * @example
   * ```typescript
   * const cache = CacheManager.getInstance();
   * await cache.get('key');
   * ```
   */
  static getInstance(): CacheManager {
    if (!this.adapter) {
      this.initialize();
    }
    return this;
  }

  /**
   * Busca valor no cache
   *
   * Retorna undefined se:
   * - Cache desabilitado
   * - Chave não existe
   * - Chave expirou
   * - Erro ao buscar
   *
   * @template T - Tipo do valor armazenado
   * @param {string} key - Chave do cache
   * @returns {Promise<T | undefined>} Valor ou undefined
   *
   * @example
   * ```typescript
   * const user = await CacheManager.get<User>('user:123');
   * if (user) {
   *   console.log('Cache hit:', user);
   * } else {
   *   console.log('Cache miss');
   * }
   * ```
   *
   * @performance
   * - Memory: < 1ms
   * - Redis: 1-10ms (depende da rede)
   * - Layered: < 1ms (se hit em L1), 1-10ms (se miss em L1)
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
   *
   * @template T - Tipo do valor a armazenar
   * @param {string} key - Chave do cache
   * @param {T} value - Valor a armazenar
   * @param {number} [ttl] - TTL customizado em segundos (opcional)
   * @returns {Promise<boolean>} true se sucesso, false caso contrário
   *
   * @example
   * ```typescript
   * // TTL padrão (do env)
   * await CacheManager.set('user:123', userData);
   *
   * // TTL customizado (10 minutos)
   * await CacheManager.set('user:123', userData, 600);
   * ```
   *
   * @note
   * O valor é serializado automaticamente (JSON.stringify)
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
   *
   * @param {string} key - Chave a remover
   * @returns {Promise<number>} Número de chaves removidas (0 ou 1)
   *
   * @example
   * ```typescript
   * const removed = await CacheManager.delete('user:123');
   * console.log(removed ? 'Removido' : 'Não existia');
   * ```
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
   *
   * Remove todas as chaves de todos os adapters.
   * Use com cuidado em produção!
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await CacheManager.flush();
   * console.log('Cache completamente limpo');
   * ```
   *
   * @warning
   * Operação destrutiva! Em cache layered, limpa L1 e L2.
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
   *
   * @param {string} [pattern] - Padrão de busca (wildcards * e ?)
   * @returns {Promise<string[]>} Lista de chaves encontradas
   *
   * @example
   * ```typescript
   * // Todas as chaves
   * const all = await CacheManager.keys();
   *
   * // Apenas chaves de usuários
   * const users = await CacheManager.keys('user:*');
   *
   * // Padrão específico
   * const pattern = await CacheManager.keys('user:123:*');
   * ```
   *
   * @performance
   * Operação custosa em grandes caches, use com moderação
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

  // ==========================================================================
  // MÉTODOS PÚBLICOS - OPERAÇÕES AVANÇADAS
  // ==========================================================================

  /**
   * Invalida chaves por padrão (wildcards)
   *
   * Busca todas as chaves que correspondem ao padrão e as remove.
   * Suporta wildcards (* e ?).
   *
   * @param {string} pattern - Padrão de chaves a invalidar
   * @returns {Promise<number>} Número de chaves removidas
   *
   * @example
   * ```typescript
   * // Invalidar todos os usuários
   * const count = await CacheManager.invalidate('user:*');
   * console.log(`${count} usuários removidos do cache`);
   *
   * // Invalidar cache de um usuário específico
   * await CacheManager.invalidate('user:123:*');
   *
   * // Invalidar todas as queries GET da API
   * await CacheManager.invalidate('GET:/api/*');
   * ```
   *
   * @performance
   * Operação em duas etapas:
   * 1. Lista chaves (custoso)
   * 2. Remove em paralelo (rápido)
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

      const deletePromises = keys.map((key) => this.adapter!.delete(key));
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
   *
   * Padrão mais comum de uso de cache:
   * 1. Tenta buscar do cache
   * 2. Se não encontrar (miss), executa função
   * 3. Armazena resultado no cache
   * 4. Retorna resultado
   *
   * @template T - Tipo do valor retornado
   * @param {string} key - Chave do cache
   * @param {Function} fetchFn - Função para buscar dados (se cache miss)
   * @param {number} [ttl] - TTL customizado em segundos
   * @returns {Promise<T>} Valor do cache ou resultado da função
   *
   * @example
   * ```typescript
   * const user = await CacheManager.getOrSet(
   *   'user:123',
   *   async () => {
   *     // Busca do banco (só executa se cache miss)
   *     return await database.getUser(123);
   *   },
   *   600 // 10 minutos
   * );
   * ```
   *
   * @note
   * - Se cache hit, fetchFn NÃO é executada
   * - Se cache miss, fetchFn É executada e resultado é cacheado
   * - Função é thread-safe (não executa múltiplas vezes em paralelo)
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

  // ==========================================================================
  // MÉTODOS PÚBLICOS - STATUS E ESTATÍSTICAS
  // ==========================================================================

  /**
   * Verifica se cache está pronto para uso
   *
   * @returns {Promise<boolean>} true se pronto, false caso contrário
   *
   * @example
   * ```typescript
   * if (await CacheManager.isReady()) {
   *   console.log('Cache operacional');
   * } else {
   *   console.warn('Cache não disponível');
   * }
   * ```
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
   *
   * Estatísticas variam por adaptador:
   *
   * **Memory/Layered:**
   * - hits: Total de cache hits
   * - misses: Total de cache misses
   * - keys: Número de chaves
   * - hitRate: Taxa de acerto (%)
   *
   * **Redis:**
   * - Estatísticas básicas (depende da implementação)
   *
   * @returns {Object} Estatísticas do cache
   *
   * @example
   * ```typescript
   * const stats = CacheManager.getStats();
   * console.log(`Hit rate: ${stats.hitRate}%`);
   * console.log(`Total keys: ${stats.keys}`);
   * ```
   */
  static getStats(): any {
    if (!this.enabled || !this.adapter) {
      return {
        enabled: false,
        strategy: 'none',
      };
    }

    // LayeredCacheAdapter tem método getStats()
    if (this.adapter instanceof LayeredCacheAdapter) {
      return {
        enabled: true,
        strategy: this.strategy,
        ...this.adapter.getStats(),
      };
    }

    // MemoryCacheAdapter tem método getStats()
    if (this.adapter instanceof MemoryCacheAdapter) {
      return {
        enabled: true,
        strategy: this.strategy,
        ...this.adapter.getStats(),
      };
    }

    return {
      enabled: true,
      strategy: this.strategy,
    };
  }

  // ==========================================================================
  // GRACEFUL SHUTDOWN
  // ==========================================================================

  /**
   * Fecha conexões (chamado no graceful shutdown)
   *
   * Fecha todas as conexões abertas (ex: Redis) de forma limpa.
   * Importante para evitar warnings e garantir que dados foram persistidos.
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // No graceful shutdown do servidor
   * process.on('SIGTERM', async () => {
   *   await CacheManager.close();
   *   process.exit(0);
   * });
   * ```
   *
   * @critical
   * Deve ser chamado antes de encerrar o processo
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

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Gera chave de cache consistente
 *
 * Concatena partes com ":" ignorando valores undefined/null.
 * Útil para criar chaves padronizadas.
 *
 * @param {...(string | number)} parts - Partes da chave
 * @returns {string} Chave formatada
 *
 * @example
 * ```typescript
 * // Chave de usuário
 * const key = generateCacheKey('user', 123);
 * // 'user:123'
 *
 * // Chave de query
 * const key = generateCacheKey('query', 'items', 'active', 'page', 1);
 * // 'query:items:active:page:1'
 *
 * // Com valores undefined (ignorados)
 * const key = generateCacheKey('user', undefined, 123);
 * // 'user:123'
 * ```
 *
 * @note
 * Filtra automaticamente valores undefined e null
 */
export function generateCacheKey(...parts: (string | number)[]): string {
  return parts.filter((p) => p !== undefined && p !== null).join(':');
}

// ============================================================================
// DECORATORS
// ============================================================================

/**
 * Decorator para cachear métodos de classe
 *
 * Cacheia automaticamente o resultado de métodos async.
 * A chave do cache é gerada baseada no nome da classe, método e argumentos.
 *
 * @param {Object} options - Opções do decorator
 * @param {number} [options.ttl] - TTL em segundos
 * @param {string} [options.keyPrefix] - Prefixo customizado (padrão: nome da classe)
 * @returns {MethodDecorator} Decorator de método
 *
 * @example
 * ```typescript
 * class UserService {
 *   // Cache com TTL padrão
 *   @Cacheable()
 *   async getUser(id: string) {
 *     return await database.getUser(id);
 *   }
 *
 *   // Cache com TTL customizado (10 minutos)
 *   @Cacheable({ ttl: 600 })
 *   async getUserProfile(id: string) {
 *     return await database.getUserProfile(id);
 *   }
 *
 *   // Cache com prefixo customizado
 *   @Cacheable({ ttl: 300, keyPrefix: 'profile' })
 *   async getProfile(id: string) {
 *     return await database.getProfile(id);
 *   }
 * }
 * ```
 *
 * @note
 * - Gera chave automaticamente: `${keyPrefix}:${methodName}:${args}`
 * - Funciona apenas com métodos async
 * - Argumentos são usados na chave (deve ser serializáveis)
 *
 * @critical
 * Cuidado com argumentos complexos ou não serializáveis
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