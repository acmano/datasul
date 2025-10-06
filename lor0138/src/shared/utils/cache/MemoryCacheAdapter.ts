// src/shared/utils/cache/MemoryCacheAdapter.ts

import NodeCache from 'node-cache';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * ========================================
 * ADAPTADOR DE CACHE EM MEMÓRIA (L1)
 * ========================================
 *
 * Implementa cache local utilizando a biblioteca node-cache.
 * Armazena dados na memória RAM do processo Node.js.
 *
 * CARACTERÍSTICAS:
 * ✅ Ultra rápido: ~1ms por operação (acesso local)
 * ✅ Simples: Não requer infraestrutura adicional
 * ✅ Zero latência de rede
 * ❌ Volátil: Perde dados ao reiniciar processo
 * ❌ Não compartilhado: Cada instância tem cache próprio
 * ❌ Limitado: Usa memória RAM do servidor
 *
 * CASOS DE USO IDEAIS:
 * - Aplicação single-instance
 * - Cache L1 em arquitetura em camadas
 * - Desenvolvimento e testes
 * - Dados que podem ser perdidos (não críticos)
 * - Queries frequentes com baixa mudança
 *
 * QUANDO NÃO USAR:
 * - Aplicações com múltiplas instâncias (load balanced)
 * - Dados que precisam persistir entre restarts
 * - Cache precisa ser compartilhado entre servidores
 * - Dados críticos que não podem ser perdidos
 *
 * BIBLIOTECA UTILIZADA:
 * - node-cache: Cache simples e eficiente para Node.js
 * - Suporta TTL automático
 * - Limpeza automática de chaves expiradas
 * - API síncrona envolvida em Promises para compatibilidade
 *
 * @see https://www.npmjs.com/package/node-cache
 * @see CacheAdapter.ts - Interface implementada
 * @see LayeredCacheAdapter.ts - Usa este adapter como L1
 */

/**
 * ========================================
 * CLASSE PRINCIPAL
 * ========================================
 */

/**
 * Adaptador de cache em memória (L1)
 *
 * PROPÓSITO:
 * Fornecer cache ultra rápido local para cada instância da aplicação
 *
 * CONFIGURAÇÃO PADRÃO:
 * - TTL: 300 segundos (5 minutos)
 * - Check Period: 120 segundos (verifica expiração a cada 2min)
 * - Use Clones: false (não clona objetos - melhor performance)
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Criar com TTL padrão de 5 minutos
 * const cache = new MemoryCacheAdapter(300, 'L1-Memory');
 *
 * // Armazenar dados
 * await cache.set('item:123', { name: 'Product' }, 600); // 10min
 *
 * // Buscar dados
 * const item = await cache.get<Item>('item:123');
 * if (item) {
 *   console.log('Cache HIT:', item.name);
 * } else {
 *   console.log('Cache MISS');
 * }
 *
 * // Remover
 * await cache.delete('item:123');
 *
 * // Limpar tudo
 * await cache.flush();
 * ```
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: NodeCache;
  private name: string;

  /**
   * Construtor do adaptador de memória
   *
   * PARÂMETROS:
   * @param stdTTL - TTL padrão em segundos (padrão: 300 = 5min)
   * @param name - Nome para logging (padrão: 'L1-Memory')
   *
   * CONFIGURAÇÕES APLICADAS:
   * - stdTTL: Tempo de vida padrão para chaves
   * - checkperiod: Intervalo de verificação de expiração (120s)
   * - useClones: false (não clona objetos - melhor performance)
   *
   * PONTOS CRÍTICOS:
   * - useClones: false = Retorna referência direta ao objeto
   *   - Vantagem: Performance (sem clonagem)
   *   - Desvantagem: Modificar objeto retornado afeta cache
   *   - Solução: Sempre tratar objetos como read-only
   * - checkperiod: Quanto menor, mais preciso, mas mais CPU usa
   *
   * EXEMPLO:
   * ```typescript
   * // Cache com TTL de 10 minutos
   * const cache = new MemoryCacheAdapter(600, 'Items-Cache');
   *
   * // Cache com TTL de 1 hora
   * const longCache = new MemoryCacheAdapter(3600, 'Long-Cache');
   * ```
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
   * ========================================
   * MÉTODO GET - BUSCAR DO CACHE
   * ========================================
   */

  /**
   * Busca valor no cache de memória
   *
   * COMPORTAMENTO:
   * 1. Busca chave no node-cache
   * 2. Se encontrado e não expirado: retorna valor (HIT)
   * 3. Se não encontrado ou expirado: retorna undefined (MISS)
   * 4. Loga resultado (HIT/MISS) em nível debug
   *
   * PERFORMANCE:
   * - Operação O(1) - tempo constante
   * - ~1ms típico
   * - Síncrona internamente, mas retorna Promise para compatibilidade
   *
   * EXEMPLO:
   * ```typescript
   * // Buscar item
   * const item = await cache.get<Item>('item:123');
   *
   * if (item) {
   *   // Cache HIT - usar dados
   *   console.log('Found in cache:', item);
   * } else {
   *   // Cache MISS - buscar do banco
   *   const item = await db.findItem('123');
   *   await cache.set('item:123', item);
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Retorna referência direta (useClones: false)
   * - NÃO modificar objeto retornado (trata como read-only)
   * - Undefined pode significar: não existe OU expirou
   * - Erros são capturados e retornam undefined
   *
   * @param key - Chave do cache
   * @returns Promise com valor ou undefined se não encontrado
   *
   * @template T - Tipo do valor armazenado
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
   * ========================================
   * MÉTODO SET - ARMAZENAR NO CACHE
   * ========================================
   */

  /**
   * Armazena valor no cache de memória
   *
   * COMPORTAMENTO:
   * 1. Se TTL fornecido: usa TTL específico
   * 2. Se não: usa TTL padrão do construtor
   * 3. Sobrescreve valor se chave já existe
   * 4. Retorna true em sucesso, false em falha
   *
   * EXPIRAÇÃO:
   * - TTL em SEGUNDOS (não milissegundos)
   * - TTL = 0 ou undefined: usa padrão
   * - Após TTL: chave é removida automaticamente
   *
   * EXEMPLO:
   * ```typescript
   * // TTL específico de 10 minutos
   * await cache.set('item:123', item, 600);
   *
   * // TTL padrão (do construtor)
   * await cache.set('temp:data', data);
   *
   * // TTL de 1 hora
   * await cache.set('config:app', config, 3600);
   *
   * // Verificar sucesso
   * const ok = await cache.set('key', value);
   * if (!ok) {
   *   log.error('Failed to cache');
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - TTL em segundos (converter ms se necessário: ms / 1000)
   * - Objetos são armazenados por referência (useClones: false)
   * - Não serializa (JSON.stringify) - objetos mantêm prototypes
   * - Limite de memória do processo Node.js
   * - Sem compressão - objetos grandes consomem muita RAM
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
   * ========================================
   * MÉTODO DELETE - REMOVER DO CACHE
   * ========================================
   */

  /**
   * Remove valor do cache de memória
   *
   * COMPORTAMENTO:
   * 1. Remove chave do cache
   * 2. Retorna 1 se removido, 0 se não existia
   * 3. Operação é idempotente (pode chamar múltiplas vezes)
   *
   * EXEMPLO:
   * ```typescript
   * // Remover item
   * const removed = await cache.delete('item:123');
   * console.log(`Removed: ${removed} keys`);
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
   * - Não suporta wildcard (diferente do Redis)
   * - Para remover múltiplas chaves: usar loop ou flush
   * - Operação síncrona, mas retorna Promise para compatibilidade
   *
   * @param key - Chave a remover
   * @returns Promise com número de chaves removidas (0 ou 1)
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
   * ========================================
   * MÉTODO FLUSH - LIMPAR TODO CACHE
   * ========================================
   */

  /**
   * Limpa todo o cache de memória
   *
   * PROPÓSITO:
   * Remove TODAS as chaves do cache instantaneamente
   *
   * COMPORTAMENTO:
   * - Operação destrutiva e irreversível
   * - Remove todas chaves independente de TTL
   * - Libera memória ocupada pelo cache
   * - Reseta estatísticas internas
   *
   * EXEMPLO:
   * ```typescript
   * // Limpar em testes
   * beforeEach(async () => {
   *   await cache.flush();
   * });
   *
   * // Limpar em deploy/restart
   * await cache.flush();
   * log.info('Cache limpo');
   *
   * // Limpar cache de configuração ao recarregar
   * await reloadConfig();
   * await cache.flush();
   * ```
   *
   * PONTOS CRÍTICOS:
   * - USE COM CUIDADO em produção
   * - Pode causar "cache stampede" (muitas queries ao banco)
   * - Considere invalidação seletiva ao invés de flush total
   * - Em cache L1, afeta apenas instância local
   *
   * @returns Promise que resolve quando cache limpo
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
   * ========================================
   * MÉTODO KEYS - LISTAR CHAVES
   * ========================================
   */

  /**
   * Lista todas as chaves no cache
   *
   * PROPÓSITO:
   * Retorna array com todas chaves para inspeção/debug
   *
   * COMPORTAMENTO:
   * 1. Sem pattern: retorna TODAS chaves
   * 2. Com pattern: filtra usando regex
   * 3. Suporta wildcard * (convertido para regex)
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
   * // Listar chaves GET
   * const gets = await cache.keys('GET:*');
   * console.log('Cached GET requests:', gets);
   *
   * // Padrão mais complexo
   * const users = await cache.keys('user:*:profile');
   * ```
   *
   * PATTERN MATCHING:
   * - '*' = qualquer sequência de caracteres
   * - Convertido para regex: item:* → /^item:.*$/
   * - Case sensitive
   *
   * PONTOS CRÍTICOS:
   * - Operação O(n) - varre todas chaves
   * - Pode ser lenta com muitas chaves (> 10k)
   * - Não usar em hot path de produção
   * - Para produção com muitas chaves: considerar Redis SCAN
   * - Útil para debug e admin endpoints
   *
   * @param pattern - Padrão de busca opcional (suporta *)
   * @returns Promise com array de chaves
   */
  async keys(pattern?: string): Promise<string[]> {
    try {
      const allKeys = this.cache.keys();

      if (!pattern) {
        return allKeys;
      }

      // Converte pattern com * para regex
      // item:* → /^item:.*$/
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
   * ========================================
   * MÉTODO ISREADY - VERIFICAR DISPONIBILIDADE
   * ========================================
   */

  /**
   * Verifica se cache está disponível
   *
   * COMPORTAMENTO:
   * - Cache em memória sempre está disponível
   * - Retorna sempre true (enquanto processo está rodando)
   * - Implementado para compatibilidade com interface
   *
   * EXEMPLO:
   * ```typescript
   * // Sempre true para memory cache
   * const ready = await cache.isReady(); // true
   *
   * // Útil em cache híbrido
   * if (await l1Cache.isReady() && await l2Cache.isReady()) {
   *   // Ambas camadas disponíveis
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Sempre retorna true (memória sempre disponível)
   * - Diferente de Redis que pode estar offline
   * - Usado em health checks e monitoramento
   *
   * @returns Promise<true> sempre
   */
  async isReady(): Promise<boolean> {
    return true;
  }

  /**
   * ========================================
   * MÉTODO CLOSE - FECHAR CACHE
   * ========================================
   */

  /**
   * Fecha cache (cleanup)
   *
   * PROPÓSITO:
   * Libera recursos e limpa timers internos
   *
   * COMPORTAMENTO:
   * - Para timer de verificação de expiração
   * - Limpa todos dados do cache
   * - Libera memória
   * - Usado em graceful shutdown
   *
   * EXEMPLO:
   * ```typescript
   * // Graceful shutdown
   * process.on('SIGTERM', async () => {
   *   await cache.close();
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
   * - Operação é irreversível
   * - Não usar cache após close
   * - Importante para evitar memory leaks em testes
   * - Para memória, principalmente limpa timers internos
   *
   * @returns Promise que resolve quando fechado
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
   * ========================================
   * MÉTODO GETSTATS - ESTATÍSTICAS
   * ========================================
   */

  /**
   * Retorna estatísticas do cache
   *
   * PROPÓSITO:
   * Fornecer métricas de uso e performance do cache
   *
   * MÉTRICAS INCLUÍDAS:
   * - hits: Número de cache hits
   * - misses: Número de cache misses
   * - keys: Número total de chaves
   * - hitRate: Taxa de acerto em porcentagem
   *
   * EXEMPLO:
   * ```typescript
   * const stats = cache.getStats();
   *
   * console.log(`Hit Rate: ${stats.hitRate}%`);
   * console.log(`Total Keys: ${stats.keys}`);
   * console.log(`Hits: ${stats.hits}`);
   * console.log(`Misses: ${stats.misses}`);
   *
   * // Alertar se hit rate baixo
   * if (stats.hitRate < 50) {
   *   log.warn('Cache hit rate baixo, revisar estratégia');
   * }
   *
   * // Monitorar tamanho
   * if (stats.keys > 10000) {
   *   log.warn('Muitas chaves em cache, considerar limpeza');
   * }
   * ```
   *
   * CÁLCULO DO HIT RATE:
   * ```typescript
   * hitRate = (hits / (hits + misses)) * 100
   * ```
   *
   * VALORES ESPERADOS:
   * - Hit Rate > 80%: Excelente
   * - Hit Rate 50-80%: Bom
   * - Hit Rate < 50%: Revisar estratégia
   *
   * @returns Objeto com estatísticas do cache
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