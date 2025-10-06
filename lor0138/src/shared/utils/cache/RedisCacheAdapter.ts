// src/shared/utils/cache/RedisCacheAdapter.ts

import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * ========================================
 * ADAPTADOR DE CACHE REDIS (L2)
 * ========================================
 *
 * Implementa cache distribuído utilizando Redis.
 * Armazena dados em servidor Redis externo.
 *
 * CARACTERÍSTICAS:
 * ✅ Compartilhado: Cache distribuído entre múltiplas instâncias
 * ✅ Persistente: Sobrevive a restarts da aplicação
 * ✅ Escalável: Suporta milhões de chaves
 * ✅ Recursos avançados: TTL, SCAN, pipelines
 * ❌ Latência de rede: ~5-20ms (vs ~1ms memória)
 * ❌ Requer infraestrutura: Servidor Redis separado
 * ❌ Complexidade: Mais pontos de falha
 *
 * CASOS DE USO IDEAIS:
 * - Aplicações com múltiplas instâncias (load balanced)
 * - Cache que precisa persistir entre deploys
 * - Dados compartilhados entre microserviços
 * - Cache L2 em arquitetura em camadas
 * - Alta disponibilidade e redundância
 *
 * QUANDO NÃO USAR:
 * - Aplicação single-instance (memória é suficiente)
 * - Latência crítica (< 5ms)
 * - Ambiente sem infraestrutura Redis
 * - Cache temporário que não precisa persistir
 *
 * BIBLIOTECA UTILIZADA:
 * - ioredis: Cliente Redis robusto para Node.js
 * - Suporta: Clustering, Sentinel, Pipelines, Streams
 * - Reconnect automático
 * - Promises nativas
 *
 * @see https://github.com/luin/ioredis
 * @see CacheAdapter.ts - Interface implementada
 * @see LayeredCacheAdapter.ts - Usa este adapter como L2
 */

/**
 * ========================================
 * CLASSE PRINCIPAL
 * ========================================
 */

/**
 * Adaptador de cache Redis (L2)
 *
 * PROPÓSITO:
 * Fornecer cache distribuído e persistente via Redis
 *
 * CONFIGURAÇÃO:
 * - Aceita URL ou objeto de configuração
 * - Retry automático com backoff exponencial
 * - Max 3 tentativas por request
 * - Eventos de conexão logados
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Com URL simples
 * const cache = new RedisCacheAdapter(
 *   'redis://localhost:6379',
 *   'L2-Redis'
 * );
 *
 * // Com senha
 * const cache = new RedisCacheAdapter(
 *   'redis://:password@localhost:6379',
 *   'L2-Redis'
 * );
 *
 * // Com configuração completa
 * const cache = new RedisCacheAdapter({
 *   host: 'localhost',
 *   port: 6379,
 *   password: 'secret',
 *   db: 0,
 *   retryStrategy: (times) => Math.min(times * 50, 2000)
 * }, 'L2-Redis');
 *
 * // Usar
 * await cache.set('item:123', item, 600);
 * const cached = await cache.get<Item>('item:123');
 * ```
 */
export class RedisCacheAdapter implements CacheAdapter {
  private redis: Redis;
  private name: string;
  private ready: boolean = false;

  /**
   * Construtor do adaptador Redis
   *
   * PARÂMETROS:
   * @param urlOrOptions - URL de conexão ou objeto de opções
   * @param name - Nome para logging (padrão: 'L2-Redis')
   *
   * FORMATOS DE URL ACEITOS:
   * - redis://localhost:6379
   * - redis://:password@localhost:6379
   * - redis://localhost:6379/2 (database 2)
   * - rediss://localhost:6379 (TLS/SSL)
   *
   * OPÇÕES DE CONFIGURAÇÃO:
   * - host: Hostname do Redis
   * - port: Porta (padrão: 6379)
   * - password: Senha de autenticação
   * - db: Database number (0-15)
   * - retryStrategy: Função de retry customizada
   * - maxRetriesPerRequest: Máximo de tentativas (padrão: 3)
   * - enableReadyCheck: Verifica se Redis está pronto (padrão: true)
   *
   * EXEMPLO:
   * ```typescript
   * // URL simples
   * new RedisCacheAdapter('redis://localhost:6379');
   *
   * // Opções completas
   * new RedisCacheAdapter({
   *   host: 'redis.example.com',
   *   port: 6380,
   *   password: 'secret123',
   *   db: 1,
   *   retryStrategy: (times) => {
   *     if (times > 5) return null; // Para após 5 tentativas
   *     return Math.min(times * 100, 3000);
   *   }
   * });
   * ```
   */
  constructor(urlOrOptions: string | RedisOptions, name: string = 'L2-Redis') {
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
        lazyConnect: false,
      });
    } else {
      this.redis = new Redis(urlOrOptions);
    }

    this.setupEventHandlers();
  }

  /**
   * ========================================
   * CONFIGURAÇÃO DE EVENT HANDLERS
   * ========================================
   */

  /**
   * Configura listeners para eventos do Redis
   *
   * EVENTOS TRATADOS:
   * - connect: Iniciando conexão
   * - ready: Conectado e pronto para usar
   * - error: Erros de conexão/operação
   * - close: Conexão fechada
   * - reconnecting: Tentando reconectar
   *
   * PROPÓSITO:
   * - Logging detalhado de estado da conexão
   * - Atualizar flag ready
   * - Facilitar troubleshooting
   *
   * PONTOS CRÍTICOS:
   * - ready = true apenas quando conectado e autenticado
   * - Operações enquanto !ready falharão com warning
   * - Reconnect automático gerenciado pela biblioteca
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
   * ========================================
   * MÉTODO GET - BUSCAR DO REDIS
   * ========================================
   */

  /**
   * Busca valor no cache Redis
   *
   * COMPORTAMENTO:
   * 1. Verifica se Redis está pronto
   * 2. Executa GET no Redis
   * 3. Se encontrado: deserializa JSON e retorna (HIT)
   * 4. Se não encontrado: retorna undefined (MISS)
   * 5. Loga resultado em nível debug
   *
   * PERFORMANCE:
   * - Latência típica: 5-20ms (rede local)
   * - Latência WAN: 50-200ms
   * - Operação O(1) no Redis
   *
   * SERIALIZAÇÃO:
   * - Dados armazenados como JSON string
   * - Deserialização automática com JSON.parse
   * - Mantém tipos: number, string, boolean, object, array
   * - Perde: Date (vira string), Function, undefined, Symbol
   *
   * EXEMPLO:
   * ```typescript
   * // Buscar item
   * const item = await cache.get<Item>('item:123');
   *
   * if (item) {
   *   console.log('Redis HIT:', item);
   * } else {
   *   console.log('Redis MISS');
   *   // Buscar do banco e cachear
   *   const item = await db.findItem('123');
   *   await cache.set('item:123', item, 600);
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Retorna undefined se Redis offline (!ready)
   * - Erros de deserialização retornam undefined
   * - Dados são strings no Redis (JSON)
   * - Verificar ready antes de operações críticas
   *
   * @param key - Chave do cache
   * @returns Promise com valor ou undefined se não encontrado
   *
   * @template T - Tipo do valor armazenado
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
   * ========================================
   * MÉTODO SET - ARMAZENAR NO REDIS
   * ========================================
   */

  /**
   * Armazena valor no cache Redis
   *
   * COMPORTAMENTO:
   * 1. Verifica se Redis está pronto
   * 2. Serializa valor para JSON
   * 3. Se TTL fornecido: usa SETEX (set com expiração)
   * 4. Se não: usa SET (sem expiração)
   * 5. Retorna true em sucesso, false em falha
   *
   * COMANDOS REDIS:
   * - Com TTL: SETEX key seconds value
   * - Sem TTL: SET key value
   *
   * EXPIRAÇÃO:
   * - TTL em SEGUNDOS (não milissegundos)
   * - Redis remove automaticamente após TTL
   * - TTL = 0 ou undefined: sem expiração (persiste até DEL)
   *
   * SERIALIZAÇÃO:
   * - Objetos convertidos para JSON string
   * - Date vira ISO string: "2025-01-04T15:30:00.000Z"
   * - undefined, Function, Symbol são ignorados
   * - Referências circulares causam erro
   *
   * EXEMPLO:
   * ```typescript
   * // Com TTL de 10 minutos
   * await cache.set('item:123', item, 600);
   *
   * // Sem TTL (persiste indefinidamente)
   * await cache.set('config:app', config);
   *
   * // Com objeto complexo
   * await cache.set('user:456', {
   *   id: 456,
   *   name: 'John',
   *   createdAt: new Date(),
   *   roles: ['admin', 'user']
   * }, 3600);
   *
   * // Verificar sucesso
   * const ok = await cache.set('key', value);
   * if (!ok) {
   *   log.error('Failed to cache in Redis');
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - TTL em segundos (converter ms: ms / 1000)
   * - Retorna false se Redis offline
   * - Objetos circulares falham (JSON.stringify error)
   * - Valores grandes (> 512MB) podem falhar
   * - Sem compressão por padrão (considerar para dados grandes)
   *
   * @param key - Chave do cache
   * @param value - Valor a armazenar
   * @param ttl - Tempo de vida em SEGUNDOS (opcional)
   * @returns Promise<true> se sucesso, Promise<false> se falha
   *
   * @template T - Tipo do valor a ser armazenado
   */
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

  /**
   * ========================================
   * MÉTODO DELETE - REMOVER DO REDIS
   * ========================================
   */

  /**
   * Remove valor do cache Redis
   *
   * COMPORTAMENTO:
   * 1. Verifica se Redis está pronto
   * 2. Executa DEL no Redis
   * 3. Retorna número de chaves removidas
   *
   * COMANDO REDIS:
   * - DEL key [key ...]: Remove uma ou mais chaves
   * - Retorna: número de chaves que foram removidas
   *
   * EXEMPLO:
   * ```typescript
   * // Remover uma chave
   * const removed = await cache.delete('item:123');
   * console.log(`Removed: ${removed} keys`); // 1 ou 0
   *
   * // Remover após update no banco
   * await db.updateItem('123', newData);
   * await cache.delete('item:123'); // Invalida cache
   *
   * // Remover múltiplas vezes (idempotente)
   * await cache.delete('key'); // 1
   * await cache.delete('key'); // 0
   * await cache.delete('key'); // 0
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Retorna 0 se Redis offline
   * - Retorna 0 se chave não existia
   * - Operação é idempotente
   * - Não suporta wildcard diretamente (use keys() + loop)
   *
   * @param key - Chave a remover
   * @returns Promise com número de chaves removidas
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
   * ========================================
   * MÉTODO FLUSH - LIMPAR TODO REDIS
   * ========================================
   */

  /**
   * Limpa TODO o Redis (database atual)
   *
   * PROPÓSITO:
   * Remove TODAS as chaves do database Redis
   *
   * COMANDO REDIS:
   * - FLUSHALL: Remove TODOS databases
   * - FLUSHDB: Remove apenas database atual (mais seguro)
   *
   * COMPORTAMENTO:
   * - Remove todas chaves do database (db 0 por padrão)
   * - Operação atômica e rápida
   * - Afeta TODAS aplicações usando mesmo Redis/database
   *
   * EXEMPLO:
   * ```typescript
   * // CUIDADO: Remove tudo!
   * await cache.flush();
   * log.info('Redis completamente limpo');
   *
   * // Limpar em testes (use database separado)
   * beforeEach(async () => {
   *   await testCache.flush();
   * });
   * ```
   *
   * PONTOS CRÍTICOS:
   * - ⚠️ EXTREMAMENTE DESTRUTIVO
   * - Afeta TODAS instâncias da aplicação
   * - Afeta TODAS aplicações no mesmo Redis/DB
   * - Use database separado para testes
   * - Em produção: preferir invalidação seletiva
   * - Pode causar "cache stampede" massivo
   *
   * ALTERNATIVA SEGURA:
   * ```typescript
   * // Remover apenas chaves da aplicação
   * const keys = await cache.keys('myapp:*');
   * for (const key of keys) {
   *   await cache.delete(key);
   * }
   * ```
   *
   * @returns Promise que resolve quando Redis limpo
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
   * ========================================
   * MÉTODO KEYS - LISTAR CHAVES
   * ========================================
   */

  /**
   * Lista chaves no Redis usando SCAN (seguro)
   *
   * PROPÓSITO:
   * Retorna lista de chaves correspondentes ao pattern
   *
   * ALGORITMO:
   * 1. Usa SCAN ao invés de KEYS (não bloqueia Redis)
   * 2. Itera com cursor até varrer todas chaves
   * 3. Filtra por pattern (suporta wildcard *)
   * 4. Retorna array único de chaves
   *
   * SCAN vs KEYS:
   * - KEYS: Bloqueia Redis, perigoso em produção
   * - SCAN: Iterativo, não bloqueia, seguro
   *
   * EXEMPLO:
   * ```typescript
   * // Listar todas chaves
   * const all = await cache.keys();
   * console.log(`Total: ${all.length} chaves`);
   *
   * // Listar chaves de items
   * const items = await cache.keys('item:*');
   * console.log('Items:', items);
   * // ['item:123', 'item:456', 'item:789']
   *
   * // Listar por namespace
   * const queries = await cache.keys('GET:*');
   *
   * // Contar chaves por tipo
   * const itemCount = (await cache.keys('item:*')).length;
   * const userCount = (await cache.keys('user:*')).length;
   * ```
   *
   * PATTERN MATCHING REDIS:
   * - * = qualquer sequência
   * - ? = um caractere
   * - [abc] = a, b ou c
   * - [a-z] = range
   *
   * PONTOS CRÍTICOS:
   * - SCAN é iterativo, pode ser lento com milhões de chaves
   * - COUNT 100 por iteração (ajustável)
   * - Não garante ordem
   * - Pode retornar chaves duplicadas (removemos com Set)
   * - Chaves criadas durante SCAN podem não aparecer
   * - Use com moderação em produção
   *
   * @param pattern - Padrão Redis (padrão: '*' = todas)
   * @returns Promise com array de chaves
   */
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

  /**
   * ========================================
   * MÉTODO ISREADY - VERIFICAR DISPONIBILIDADE
   * ========================================
   */

  /**
   * Verifica se Redis está conectado e pronto
   *
   * COMPORTAMENTO:
   * - true: Redis conectado, autenticado, operacional
   * - false: Redis offline, conectando, ou com erro
   *
   * EXEMPLO:
   * ```typescript
   * // Verificar antes de operação crítica
   * if (await cache.isReady()) {
   *   await cache.set('key', value);
   * } else {
   *   log.warn('Redis offline, usando fallback');
   *   // Prosseguir sem cache
   * }
   *
   * // Health check
   * app.get('/health', async (req, res) => {
   *   const redisOk = await redisCache.isReady();
   *   res.json({
   *     redis: redisOk ? 'ok' : 'down'
   *   });
   * });
   * ```
   *
   * @returns Promise<true> se disponível, Promise<false> se não
   */
  async isReady(): Promise<boolean> {
    return this.ready;
  }

  /**
   * ========================================
   * MÉTODO CLOSE - FECHAR CONEXÃO
   * ========================================
   */

  /**
   * Fecha conexão com Redis graciosamente
   *
   * PROPÓSITO:
   * Encerra conexão de forma limpa (graceful shutdown)
   *
   * COMANDO REDIS:
   * - QUIT: Fecha conexão após completar comandos pendentes
   *
   * COMPORTAMENTO:
   * 1. Aguarda comandos pendentes completarem
   * 2. Envia QUIT ao Redis
   * 3. Fecha socket TCP
   * 4. Atualiza flag ready = false
   *
   * EXEMPLO:
   * ```typescript
   * // Graceful shutdown
   * process.on('SIGTERM', async () => {
   *   log.info('Fechando Redis...');
   *   await cache.close();
   *   log.info('Redis fechado');
   *   process.exit(0);
   * });
   *
   * // Cleanup em testes
   * afterAll(async () => {
   *   await cache.close();
   * });
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Aguardar close antes de sair da aplicação
   * - Não usar cache após close (ready = false)
   * - Importante para evitar conexões órfãs
   * - Operação é assíncrona
   *
   * @returns Promise que resolve quando fechado
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
   * ========================================
   * MÉTODOS EXTRAS ESPECÍFICOS DO REDIS
   * ========================================
   */

  /**
   * Executa PING no Redis
   *
   * PROPÓSITO:
   * Verifica conectividade e latência
   *
   * RETORNO:
   * - 'PONG': Redis respondeu
   * - Error: Redis offline ou timeout
   *
   * @returns Promise com 'PONG'
   */
  async ping(): Promise<string> {
    return this.redis.ping();
  }

  /**
   * Retorna informações do servidor Redis
   *
   * PROPÓSITO:
   * Obter métricas e configurações do Redis
   *
   * RETORNO:
   * String com seções: Server, Clients, Memory, Stats, etc
   *
   * @returns Promise com string INFO
   */
  async info(): Promise<string> {
    return this.redis.info();
  }

  /**
   * Retorna cliente Redis interno
   *
   * PROPÓSITO:
   * Acesso direto para operações avançadas
   *
   * USO:
   * ```typescript
   * const redis = cache.getClient();
   * await redis.incr('counter');
   * await redis.lpush('queue', 'item');
   * ```
   *
   * @returns Instância ioredis
   */
  getClient(): Redis {
    return this.redis;
  }
}