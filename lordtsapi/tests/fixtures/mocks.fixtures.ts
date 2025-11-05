// tests/fixtures/mocks.fixtures.ts

import type { IItemRepository } from '@application/interfaces/repositories/IItemRepository';
import type { ILogger, ICache, IMetrics } from '@application/interfaces/infrastructure';
import type { Item } from '@domain/entities/Item';

/**
 * Fixtures para Mocks
 *
 * Fornece mocks pré-configurados para interfaces, facilitando testes unitários.
 * Todos os métodos são jest.fn() que podem ser sobrescritos conforme necessário.
 *
 * @example
 * const mockRepo = MockRepositoryBuilder.buildItemRepository();
 * mockRepo.findByCodigo.mockResolvedValue(ItemBuilder.build());
 */

// ============================================================================
// REPOSITORY MOCKS
// ============================================================================

export class MockRepositoryBuilder {
  /**
   * Cria um mock completo de IItemRepository
   */
  static buildItemRepository(): jest.Mocked<IItemRepository> {
    return {
      findByCodigo: jest.fn(),
      findCompleto: jest.fn(),
      findManyCodigos: jest.fn(),
      findByFamilia: jest.fn(),
      findByGrupoEstoque: jest.fn(),
      findByGtin: jest.fn(),
      search: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    };
  }

  /**
   * Cria um mock de repositório que sempre retorna sucesso
   */
  static buildSuccessRepository(item: Item): jest.Mocked<IItemRepository> {
    const mock = this.buildItemRepository();

    mock.findByCodigo.mockResolvedValue(item);
    mock.findCompleto.mockResolvedValue({ item });
    mock.exists.mockResolvedValue(true);
    mock.count.mockResolvedValue(1);

    return mock;
  }

  /**
   * Cria um mock de repositório que sempre retorna null (não encontrado)
   */
  static buildEmptyRepository(): jest.Mocked<IItemRepository> {
    const mock = this.buildItemRepository();

    mock.findByCodigo.mockResolvedValue(null);
    mock.findCompleto.mockResolvedValue(null);
    mock.findByGtin.mockResolvedValue(null);
    mock.exists.mockResolvedValue(false);
    mock.count.mockResolvedValue(0);
    mock.search.mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    return mock;
  }

  /**
   * Cria um mock de repositório que sempre lança erro
   */
  static buildErrorRepository(error: Error = new Error('Repository error')): jest.Mocked<IItemRepository> {
    const mock = this.buildItemRepository();

    Object.keys(mock).forEach(key => {
      (mock as any)[key].mockRejectedValue(error);
    });

    return mock;
  }
}

// ============================================================================
// INFRASTRUCTURE MOCKS
// ============================================================================

export class MockInfrastructureBuilder {
  /**
   * Cria um mock completo de ILogger
   */
  static buildLogger(): jest.Mocked<ILogger> {
    return {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };
  }

  /**
   * Cria um mock de logger que armazena todas as mensagens
   */
  static buildCapturingLogger(): jest.Mocked<ILogger> & { messages: { level: string; message: string; meta?: any }[] } {
    const messages: { level: string; message: string; meta?: any }[] = [];

    const logger = this.buildLogger();

    logger.debug.mockImplementation((message: string, meta?: any) => {
      messages.push({ level: 'debug', message, meta });
    });

    logger.info.mockImplementation((message: string, meta?: any) => {
      messages.push({ level: 'info', message, meta });
    });

    logger.warn.mockImplementation((message: string, meta?: any) => {
      messages.push({ level: 'warn', message, meta });
    });

    logger.error.mockImplementation((message: string, meta?: any) => {
      messages.push({ level: 'error', message, meta });
    });

    return { ...logger, messages };
  }

  /**
   * Cria um mock completo de ICache
   */
  static buildCache(): jest.Mocked<ICache> {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delMany: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      getOrSet: jest.fn(),
      invalidatePattern: jest.fn(),
      getStats: jest.fn(),
    };
  }

  /**
   * Cria um mock de cache que sempre retorna hit
   */
  static buildHitCache<T>(value: T): jest.Mocked<ICache> {
    const cache = this.buildCache();
    cache.get.mockResolvedValue(value);
    cache.has.mockResolvedValue(true);
    cache.getStats.mockResolvedValue({
      hits: 100,
      misses: 0,
      hitRate: 1.0,
      keys: 1,
    });

    return cache;
  }

  /**
   * Cria um mock de cache que sempre retorna miss
   */
  static buildMissCache(): jest.Mocked<ICache> {
    const cache = this.buildCache();
    cache.get.mockResolvedValue(null);
    cache.has.mockResolvedValue(false);
    cache.getStats.mockResolvedValue({
      hits: 0,
      misses: 100,
      hitRate: 0.0,
      keys: 0,
    });

    return cache;
  }

  /**
   * Cria um mock de cache que simula comportamento real
   */
  static buildRealisticCache(): jest.Mocked<ICache> & { store: Map<string, any> } {
    const store = new Map<string, any>();
    const cache = this.buildCache();

    cache.get.mockImplementation(async (key: string) => {
      return store.get(key) || null;
    });

    cache.set.mockImplementation(async (key: string, value: any) => {
      store.set(key, value);
    });

    cache.has.mockImplementation(async (key: string) => {
      return store.has(key);
    });

    cache.del.mockImplementation(async (key: string) => {
      store.delete(key);
    });

    cache.clear.mockImplementation(async () => {
      store.clear();
    });

    return { ...cache, store };
  }

  /**
   * Cria um mock completo de IMetrics
   */
  static buildMetrics(): jest.Mocked<IMetrics> {
    return {
      incrementCounter: jest.fn(),
      recordHistogram: jest.fn(),
      setGauge: jest.fn(),
      startTimer: jest.fn().mockReturnValue(jest.fn()),
    };
  }

  /**
   * Cria um mock de métricas que captura todas as chamadas
   */
  static buildCapturingMetrics(): jest.Mocked<IMetrics> & {
    counters: Map<string, number>;
    histograms: Map<string, number[]>;
    gauges: Map<string, number>;
  } {
    const counters = new Map<string, number>();
    const histograms = new Map<string, number[]>();
    const gauges = new Map<string, number>();

    const metrics = this.buildMetrics();

    metrics.incrementCounter.mockImplementation((name: string, value: number = 1) => {
      counters.set(name, (counters.get(name) || 0) + value);
    });

    metrics.recordHistogram.mockImplementation((name: string, value: number) => {
      if (!histograms.has(name)) {
        histograms.set(name, []);
      }
      histograms.get(name)!.push(value);
    });

    metrics.setGauge.mockImplementation((name: string, value: number) => {
      gauges.set(name, value);
    });

    return { ...metrics, counters, histograms, gauges };
  }
}

// ============================================================================
// USE CASE DEPENDENCIES BUILDER
// ============================================================================

/**
 * Builder para todas as dependências de um Use Case
 */
export interface UseCaseDependencies {
  repository: jest.Mocked<IItemRepository>;
  logger: jest.Mocked<ILogger>;
  cache: jest.Mocked<ICache>;
  metrics?: jest.Mocked<IMetrics>;
}

export class UseCaseDependenciesBuilder {
  /**
   * Cria todas as dependências padrão para um Use Case
   */
  static build(overrides?: Partial<UseCaseDependencies>): UseCaseDependencies {
    return {
      repository: MockRepositoryBuilder.buildItemRepository(),
      logger: MockInfrastructureBuilder.buildLogger(),
      cache: MockInfrastructureBuilder.buildCache(),
      metrics: MockInfrastructureBuilder.buildMetrics(),
      ...overrides,
    };
  }

  /**
   * Cria dependências com cache miss
   */
  static buildWithCacheMiss(overrides?: Partial<UseCaseDependencies>): UseCaseDependencies {
    return this.build({
      cache: MockInfrastructureBuilder.buildMissCache(),
      ...overrides,
    });
  }

  /**
   * Cria dependências com cache hit
   */
  static buildWithCacheHit<T>(cachedValue: T, overrides?: Partial<UseCaseDependencies>): UseCaseDependencies {
    return this.build({
      cache: MockInfrastructureBuilder.buildHitCache(cachedValue),
      ...overrides,
    });
  }

  /**
   * Cria dependências que simulam erro
   */
  static buildWithError(error: Error, overrides?: Partial<UseCaseDependencies>): UseCaseDependencies {
    return this.build({
      repository: MockRepositoryBuilder.buildErrorRepository(error),
      ...overrides,
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Limpa todos os mocks em um objeto
 */
export function clearAllMocks(mocks: Record<string, jest.Mock>): void {
  Object.values(mocks).forEach(mock => {
    if (typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
}

/**
 * Reseta todos os mocks em um objeto
 */
export function resetAllMocks(mocks: Record<string, jest.Mock>): void {
  Object.values(mocks).forEach(mock => {
    if (typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });
}

/**
 * Verifica se um mock foi chamado com argumentos específicos
 */
export function expectMockCalledWith(
  mock: jest.Mock,
  ...args: any[]
): void {
  expect(mock).toHaveBeenCalledWith(...args);
}

/**
 * Verifica se um mock foi chamado exatamente N vezes
 */
export function expectMockCalledTimes(
  mock: jest.Mock,
  times: number
): void {
  expect(mock).toHaveBeenCalledTimes(times);
}

/**
 * Verifica se múltiplos mocks foram chamados
 */
export function expectMocksCalled(...mocks: jest.Mock[]): void {
  mocks.forEach(mock => {
    expect(mock).toHaveBeenCalled();
  });
}

/**
 * Verifica se múltiplos mocks NÃO foram chamados
 */
export function expectMocksNotCalled(...mocks: jest.Mock[]): void {
  mocks.forEach(mock => {
    expect(mock).not.toHaveBeenCalled();
  });
}
