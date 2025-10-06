// src/shared/utils/cache/LayeredCacheAdapter.ts

import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * ========================================
 * ADAPTADOR DE CACHE EM CAMADAS (L1 + L2)
 * ========================================
 *
 * Implementa estratégia de cache em duas camadas para máxima performance
 * e disponibilidade.
 *
 * ARQUITETURA:
 * - L1 (Layer 1): Cache local em memória - Ultra rápido, local
 * - L2 (Layer 2): Cache Redis distribuído - Compartilhado, persistente
 *
 * ESTRATÉGIA DE LEITURA (GET):
 * 1. Busca L1 (memória) → Se encontrar: retorna imediatamente (HIT L1)
 * 2. Busca L2 (Redis) → Se encontrar: retorna e promove para L1 (HIT L2)
 * 3. Se não encontrar em nenhum: retorna undefined (MISS)
 *
 * ESTRATÉGIA DE ESCRITA (SET):
 * - Armazena SIMULTANEAMENTE em L1 + L2
 * - Se uma falhar, continua com a outra (resiliente)
 *
 * ESTRATÉGIA DE REMOÇÃO (DELETE):
 * - Remove de AMBAS as camadas
 * - Garante consistência
 *
 * BENEFÍCIOS:
 * ✅ Performance máxima (L1 memória ~1ms)
 * ✅ Compartilhamento entre servidores (L2 Redis)
 * ✅ Redundância (fallback L1↔L2)
 * ✅ Alta disponibilidade (L1 funciona se Redis cair)
 *
 * CASOS DE USO:
 * - Aplicações multi-instância (load balanced)
 * - Dados compartilhados entre servidores
 * - Alta demanda de performance
 * - Necessidade de resiliência
 *
 * @see MemoryCacheAdapter.ts - Implementação L1
 * @see RedisCacheAdapter.ts - Implementação L2
 * @see CacheManager.ts - Gerenciador que usa este adapter
 */

/**
 * ========================================
 * ESTATÍSTICAS DO CACHE EM CAMADAS
 * ========================================
 */

/**
 * Estrutura de estatísticas internas
 *
 * PROPÓSITO:
 * Rastrear performance e uso de cada camada separadamente
 */
interface LayeredStats {
  /**
   * Número de hits em L1 (memória)
   */
  l1Hits: number;

  /**
   * Número de misses em L1
   */
  l1Misses: number;

  /**
   * Número de hits em L2 (Redis)
   */
  l2Hits: number;

  /**
   * Número de misses em L2
   */
  l2Misses: number;

  /**
   * Total de hits (L1 + L2)
   */
  totalHits: number;

  /**
   * Total de misses (ambas camadas)
   */
  totalMisses: number;
}

/**
 * ========================================
 * CLASSE PRINCIPAL
 * ========================================
 */

/**
 * Adaptador de cache em camadas (L1 + L2)
 *
 * PROPÓSITO:
 * Combinar velocidade da memória com persistência do Redis
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const l1 = new MemoryCacheAdapter(300, 'L1-Memory');
 * const l2 = new RedisCacheAdapter('redis://localhost:6379', 'L2-Redis');
 * const layered = new LayeredCacheAdapter(l1, l2, 'Cache-Layered');
 *
 * // Primeira leitura: MISS em ambas camadas
 * const data1 = await layered.get('item:123'); // undefined
 *
 * // Armazenar: vai para L1 + L2
 * await layered.set('item:123', item);
 *
 * // Segunda leitura: HIT em L1 (super rápido)
 * const data2 = await layered.get('item:123'); // ~1ms
 *
 * // Se L1 expirar, HIT em L2 e promove para L1
 * const data3 = await layered.get('item:123'); // ~10ms, depois ~1ms
 * ```
 */
export class LayeredCacheAdapter implements CacheAdapter {
  private l1: CacheAdapter;
  private l2: CacheAdapter;
  private name: string;

  /**
   * Estatísticas de uso do cache
   *
   * PROPÓSITO:
   * Monitorar efetividade de cada camada
   */
  private stats: LayeredStats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalHits: 0,
    totalMisses: 0,
  };

  /**
   * Construtor do adaptador em camadas
   *
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
   * ========================================
   * MÉTODO GET - BUSCA EM CAMADAS
   * ========================================
   */

  /**
   * Busca valor no cache com estratégia em camadas
   *
   * ALGORITMO:
   * 1. Tenta L1 (memória) primeiro
   *    - Se encontrar: incrementa l1Hits e retorna
   *    - Se não: incrementa l1Misses e continua
   *
   * 2. Tenta L2 (Redis)
   *    - Se encontrar: incrementa l2Hits, promove para L1, retorna
   *    - Se não: incrementa l2Misses e retorna undefined
   *
   * PROMOÇÃO L2→L1:
   * Quando encontrado em L2, copia para L1 automaticamente.
   * Próxima leitura será instantânea (L1 hit).
   *
   * EXEMPLO DE FLUXO:
   * ```typescript
   * // Request 1: MISS em L1 e L2
   * await cache.get('item:123'); // undefined
   * // stats: l1Misses=1, l2Misses=1
   *
   * await cache.set('item:123', data);
   *
   * // Request 2: HIT em L1
   * await cache.get('item:123'); // data (1ms)
   * // stats: l1Hits=1
   *
   * // L1 expira, mas L2 ainda tem
   *
   * // Request 3: MISS L1, HIT L2, promove para L1
   * await cache.get('item:123'); // data (10ms)
   * // stats: l1Misses=2, l2Hits=1
   *
   * // Request 4: HIT em L1 novamente
   * await cache.get('item:123'); // data (1ms)
   * // stats: l1Hits=2
   * ```
   *
   * PONTOS CRÍTICOS:
   * - L1 sempre verificado primeiro (performance)
   * - Promoção L2→L1 pode falhar, mas não afeta retorno
   * - Erros são logados mas não propagados
   *
   * @param key - Chave do cache
   * @returns Promise com valor tipado ou undefined
   *
   * @template T - Tipo do valor armazenado
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      // ========================================
      // 1️⃣ TENTATIVA L1 (MEMÓRIA)
      // ========================================
      const l1Value = await this.l1.get<T>(key);

      if (l1Value !== undefined) {
        this.stats.l1Hits++;
        this.stats.totalHits++;
        log.debug(`${this.name} L1 HIT`, { key });
        return l1Value;
      }

      this.stats.l1Misses++;

      // ========================================
      // 2️⃣ TENTATIVA L2 (REDIS)
      // ========================================
      const l2Value = await this.l2.get<T>(key);

      if (l2Value !== undefined) {
        this.stats.l2Hits++;
        this.stats.totalHits++;
        log.debug(`${this.name} L2 HIT`, { key });

        // ========================================
        // 🔼 PROMOÇÃO L2 → L1
        // ========================================
        // Armazena em L1 para próxima leitura ser instantânea
        await this.l1.set(key, l2Value).catch((err) => {
          log.warn(`${this.name} falha ao promover para L1`, {
            key,
            error: err,
          });
        });

        return l2Value;
      }

      // ========================================
      // ❌ MISS EM AMBAS CAMADAS
      // ========================================
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
   * ========================================
   * MÉTODO SET - ESCRITA EM CAMADAS
   * ========================================
   */

  /**
   * Armazena valor em AMBAS as camadas simultaneamente
   *
   * ALGORITMO:
   * 1. Executa set em L1 e L2 em paralelo (Promise.allSettled)
   * 2. Não falha se uma camada falhar (resiliente)
   * 3. Loga warnings se alguma camada falhar
   * 4. Retorna true se PELO MENOS UMA camada teve sucesso
   *
   * EXEMPLO:
   * ```typescript
   * // Sucesso em ambas
   * await cache.set('key', value, 300);
   * // L1: OK, L2: OK
   *
   * // Redis offline, mas L1 funciona
   * await cache.set('key', value);
   * // L1: OK, L2: FAIL (warning logado)
   * // Retorna true, cache L1 funciona
   *
   * // Ambas falham
   * // L1: FAIL, L2: FAIL
   * // Retorna false
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Promise.allSettled = não cancela se uma falhar
   * - Falha em L2 não impede uso do cache (L1 continua)
   * - TTL aplicado em ambas camadas igualmente
   * - Serialização feita por cada adapter individualmente
   *
   * @param key - Chave do cache
   * @param value - Valor a armazenar
   * @param ttl - Tempo de vida em segundos (opcional)
   * @returns Promise<true> se pelo menos uma camada teve sucesso
   *
   * @template T - Tipo do valor a ser armazenado
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      // ========================================
      // ARMAZENA EM AMBAS CAMADAS SIMULTANEAMENTE
      // ========================================
      const [l1Success, l2Success] = await Promise.allSettled([
        this.l1.set(key, value, ttl),
        this.l2.set(key, value, ttl),
      ]);

      const l1Ok = l1Success.status === 'fulfilled' && l1Success.value;
      const l2Ok = l2Success.status === 'fulfilled' && l2Success.value;

      // ========================================
      // LOGGING DE FALHAS
      // ========================================
      if (!l1Ok) {
        log.warn(`${this.name} falha L1 SET`, { key });
      }
      if (!l2Ok) {
        log.warn(`${this.name} falha L2 SET`, { key });
      }

      // ========================================
      // LOG DE SUCESSO
      // ========================================
      log.debug(`${this.name} SET`, {
        key,
        ttl,
        l1: l1Ok ? 'OK' : 'FAIL',
        l2: l2Ok ? 'OK' : 'FAIL',
      });

      // ========================================
      // RETORNO
      // ========================================
      // Sucesso se PELO MENOS UMA camada funcionou
      return l1Ok || l2Ok;
    } catch (error) {
      log.error(`${this.name} SET error`, { key, error });
      return false;
    }
  }

  /**
   * ========================================
   * MÉTODO DELETE - REMOÇÃO EM CAMADAS
   * ========================================
   */

  /**
   * Remove valor de AMBAS as camadas
   *
   * ALGORITMO:
   * 1. Remove de L1 e L2 em paralelo
   * 2. Soma total de chaves removidas
   * 3. Não falha se uma camada falhar
   *
   * EXEMPLO:
   * ```typescript
   * // Remove de ambas
   * await cache.delete('item:123');
   * // Retorna: 2 (removido de L1 e L2)
   *
   * // Só em L1 (L2 não tinha)
   * // Retorna: 1
   *
   * // Em nenhuma (não existia)
   * // Retorna: 0
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Sempre tenta remover de ambas
   * - Não falha se chave não existir
   * - Retorno indica sucesso em quantas camadas
   *
   * @param key - Chave a remover
   * @returns Promise com total de chaves removidas (0-2)
   */
  async delete(key: string): Promise<number> {
    try {
      const [l1Deleted, l2Deleted] = await Promise.allSettled([
        this.l1.delete(key),
        this.l2.delete(key),
      ]);

      const l1Count =
        l1Deleted.status === 'fulfilled' ? l1Deleted.value : 0;
      const l2Count =
        l2Deleted.status === 'fulfilled' ? l2Deleted.value : 0;

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
   * ========================================
   * MÉTODO FLUSH - LIMPAR AMBAS CAMADAS
   * ========================================
   */

  /**
   * Limpa AMBAS as camadas completamente
   *
   * PROPÓSITO:
   * Remove todas as chaves de L1 e L2
   *
   * PONTOS CRÍTICOS:
   * - Operação destrutiva e irreversível
   * - Executa em paralelo para ambas camadas
   * - Não falha se uma camada falhar
   * - USE COM CUIDADO em produção
   *
   * @returns Promise que resolve quando ambas limpas
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
   * ========================================
   * MÉTODO KEYS - LISTAR CHAVES
   * ========================================
   */

  /**
   * Lista chaves de AMBAS as camadas (união)
   *
   * ALGORITMO:
   * 1. Lista chaves de L1 e L2
   * 2. Combina em Set (remove duplicatas)
   * 3. Retorna array único
   *
   * EXEMPLO:
   * ```typescript
   * // L1 tem: ['a', 'b', 'c']
   * // L2 tem: ['b', 'c', 'd']
   * // Retorna: ['a', 'b', 'c', 'd']
   *
   * const keys = await cache.keys('item:*');
   * console.log(`Total: ${keys.length} chaves`);
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Operação pode ser custosa com muitas chaves
   * - Retorna união de ambas camadas
   * - Não usar em hot path de produção
   *
   * @param pattern - Padrão de busca opcional
   * @returns Promise com array único de chaves
   */
  async keys(pattern?: string): Promise<string[]> {
    try {
      const [l1Keys, l2Keys] = await Promise.allSettled([
        this.l1.keys(pattern),
        this.l2.keys(pattern),
      ]);

      const l1Array = l1Keys.status === 'fulfilled' ? l1Keys.value : [];
      const l2Array = l2Keys.status === 'fulfilled' ? l2Keys.value : [];

      // União: remove duplicatas
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
   * ========================================
   * MÉTODO ISREADY - VERIFICAR DISPONIBILIDADE
   * ========================================
   */

  /**
   * Verifica se pelo menos uma camada está disponível
   *
   * COMPORTAMENTO:
   * - true: Se L1 OU L2 disponível (cache funcional)
   * - false: Se AMBAS indisponíveis (cache totalmente offline)
   *
   * EXEMPLO:
   * ```typescript
   * // L1 OK, L2 OK → true
   * // L1 OK, L2 DOWN → true (L1 funciona)
   * // L1 DOWN, L2 OK → true (L2 funciona)
   * // L1 DOWN, L2 DOWN → false (sem cache)
   * ```
   *
   * @returns Promise<true> se qualquer camada disponível
   */
  async isReady(): Promise<boolean> {
    try {
      const [l1Ready, l2Ready] = await Promise.all([
        this.l1.isReady(),
        this.l2.isReady(),
      ]);

      // Cache funcional se QUALQUER camada disponível
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
   * ========================================
   * MÉTODO CLOSE - FECHAR CONEXÕES
   * ========================================
   */

  /**
   * Fecha ambas as camadas
   *
   * PROPÓSITO:
   * Libera recursos de L1 e L2 (graceful shutdown)
   *
   * @returns Promise que resolve quando ambas fechadas
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
   * ========================================
   * MÉTODO GETSTATS - ESTATÍSTICAS
   * ========================================
   */

  /**
   * Retorna estatísticas detalhadas de uso
   *
   * PROPÓSITO:
   * Monitorar efetividade de cada camada
   *
   * EXEMPLO:
   * ```typescript
   * const stats = cache.getStats();
   *
   * console.log('L1 Hit Rate:', stats.l1HitRate);
   * console.log('L2 Hit Rate:', stats.l2HitRate);
   * console.log('Overall Hit Rate:', stats.overallHitRate);
   *
   * // Verificar se L1 está efetivo
   * if (stats.l1HitRate < 50) {
   *   log.warn('L1 pouco efetivo, considerar aumentar TTL');
   * }
   * ```
   *
   * @returns Objeto com estatísticas detalhadas
   */
  getStats() {
    const l1HitRate =
      this.stats.l1Hits > 0
        ? (this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)) *
        100
        : 0;

    const l2HitRate =
      this.stats.l2Hits > 0
        ? (this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)) *
        100
        : 0;

    const overallHitRate =
      this.stats.totalHits > 0
        ? (this.stats.totalHits /
          (this.stats.totalHits + this.stats.totalMisses)) *
        100
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