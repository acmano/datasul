// tests/fixtures/index.ts

/**
 * Central de Fixtures para Testes
 *
 * Este módulo exporta todos os fixtures, builders e helpers de teste.
 * Facilita a importação em testes sem precisar conhecer a estrutura interna.
 *
 * @example
 * // Importação única de tudo que você precisa
 * import {
 *   ItemBuilder,
 *   ItemDTOBuilder,
 *   MockRepositoryBuilder,
 *   DatabaseItemBuilder,
 *   PaginatedResponseBuilder,
 * } from '@tests/fixtures';
 *
 * // Criar objetos de teste rapidamente
 * const item = ItemBuilder.build();
 * const mockRepo = MockRepositoryBuilder.buildItemRepository();
 * const response = PaginatedResponseBuilder.buildItemsResponse(10);
 */

// ============================================================================
// DOMAIN ENTITIES FIXTURES
// ============================================================================

export {
  ItemBuilder,
  FamiliaBuilder,
  FamiliaComercialBuilder,
  GrupoEstoqueBuilder,
  EstabelecimentoBuilder,
  EntityScenarios,
} from './entities.fixtures';

// ============================================================================
// DTOs FIXTURES
// ============================================================================

export {
  ItemDTOBuilder,
  CreateItemDTOBuilder,
  ItemDetailDTOBuilder,
  PaginationDTOBuilder,
  PaginatedResponseBuilder,
  SearchItemsRequestBuilder,
  ValidationErrorBuilder,
  ApiResponseBuilder,
} from './dtos.fixtures';

export type {
  PaginationDTO,
  PaginatedResponse,
  SearchItemsRequest,
  ValidationError,
  ApiResponse,
} from './dtos.fixtures';

// ============================================================================
// MOCKS FIXTURES
// ============================================================================

export {
  MockRepositoryBuilder,
  MockInfrastructureBuilder,
  UseCaseDependenciesBuilder,
  clearAllMocks,
  resetAllMocks,
  expectMockCalledWith,
  expectMockCalledTimes,
  expectMocksCalled,
  expectMocksNotCalled,
} from './mocks.fixtures';

export type {
  UseCaseDependencies,
} from './mocks.fixtures';

// ============================================================================
// DATABASE FIXTURES
// ============================================================================

export {
  DatabaseItemBuilder,
  DatabaseFamiliaBuilder,
  DatabaseGrupoEstoqueBuilder,
  DatabaseEstabelecimentoBuilder,
  QueryResultBuilder,
  DatabaseScenarios,
  SqlParameterBuilder,
  MockDatabaseConnectionBuilder,
} from './database.fixtures';

export type {
  RawItemRow,
  RawFamiliaRow,
  RawGrupoEstoqueRow,
  RawEstabelecimentoRow,
  QueryResult,
  SqlParameter,
} from './database.fixtures';

// ============================================================================
// QUICK ACCESS BUNDLES
// ============================================================================

/**
 * Bundle completo para testes de Use Cases
 */
export const UseCaseTestBundle = {
  // Entities
  item: ItemBuilder,
  familia: FamiliaBuilder,
  grupoEstoque: GrupoEstoqueBuilder,

  // DTOs
  itemDTO: ItemDTOBuilder,
  pagination: PaginationDTOBuilder,
  paginatedResponse: PaginatedResponseBuilder,

  // Mocks
  repository: MockRepositoryBuilder,
  infrastructure: MockInfrastructureBuilder,
  dependencies: UseCaseDependenciesBuilder,

  // Scenarios
  scenarios: EntityScenarios,
};

/**
 * Bundle completo para testes de Repositories
 */
export const RepositoryTestBundle = {
  // Database
  dbItem: DatabaseItemBuilder,
  dbFamilia: DatabaseFamiliaBuilder,
  dbGrupoEstoque: DatabaseGrupoEstoqueBuilder,
  dbEstabelecimento: DatabaseEstabelecimentoBuilder,
  queryResult: QueryResultBuilder,
  parameters: SqlParameterBuilder,
  connection: MockDatabaseConnectionBuilder,

  // Database Scenarios
  scenarios: DatabaseScenarios,

  // Infrastructure
  logger: MockInfrastructureBuilder.buildLogger,
};

/**
 * Bundle completo para testes de Controllers
 */
export const ControllerTestBundle = {
  // DTOs
  itemDTO: ItemDTOBuilder,
  createDTO: CreateItemDTOBuilder,
  detailDTO: ItemDetailDTOBuilder,
  pagination: PaginationDTOBuilder,
  searchRequest: SearchItemsRequestBuilder,
  apiResponse: ApiResponseBuilder,
  validationError: ValidationErrorBuilder,

  // Infrastructure
  logger: MockInfrastructureBuilder.buildLogger,
  metrics: MockInfrastructureBuilder.buildMetrics,
};

// ============================================================================
// COMMON TEST UTILITIES
// ============================================================================

/**
 * Aguarda próximo tick do event loop (útil para promises)
 */
export const nextTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

/**
 * Aguarda um tempo específico
 */
export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gera um ID único para testes
 */
export const generateTestId = (): string => {
  return `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

/**
 * Gera um correlation ID para testes
 */
export const generateCorrelationId = (): string => {
  return `corr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

/**
 * Cria um spy console para capturar logs
 */
export const spyConsole = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  const logSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
    logs.push(args.join(' '));
  });

  const errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args.join(' '));
  });

  const warnSpy = jest.spyOn(console, 'warn').mockImplementation((...args) => {
    warns.push(args.join(' '));
  });

  return {
    logs,
    errors,
    warns,
    restore: () => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    },
  };
};

/**
 * Asserts customizados para testes
 */
export const customAsserts = {
  /**
   * Verifica se um objeto tem todas as propriedades especificadas
   */
  toHaveProperties: (obj: any, properties: string[]) => {
    properties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  },

  /**
   * Verifica se um array contém objetos com propriedades específicas
   */
  arrayToContainObjectsWithProperties: (arr: any[], properties: string[]) => {
    expect(arr.length).toBeGreaterThan(0);
    arr.forEach(item => {
      properties.forEach(prop => {
        expect(item).toHaveProperty(prop);
      });
    });
  },

  /**
   * Verifica se uma função assíncrona lança erro específico
   */
  toThrowErrorWithMessage: async (fn: () => Promise<any>, message: string) => {
    await expect(fn()).rejects.toThrow(message);
  },

  /**
   * Verifica se uma função assíncrona lança erro de tipo específico
   */
  toThrowErrorOfType: async (fn: () => Promise<any>, errorType: new (...args: any[]) => Error) => {
    await expect(fn()).rejects.toThrow(errorType);
  },
};

/**
 * Helpers para dates em testes
 */
export const dateHelpers = {
  /**
   * Congela o tempo em uma data específica
   */
  freezeTime: (date: Date = new Date('2024-01-01T00:00:00Z')) => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
    return () => jest.useRealTimers();
  },

  /**
   * Avança o tempo em X milissegundos
   */
  advanceTime: (ms: number) => {
    jest.advanceTimersByTime(ms);
  },

  /**
   * Executa todos os timers pendentes
   */
  runAllTimers: () => {
    jest.runAllTimers();
  },
};

// ============================================================================
// RE-EXPORTS DE TIPOS COMUNS
// ============================================================================

export type { Item } from '@domain/entities/Item';
export type { Familia } from '@domain/entities/Familia';
export type { IItemRepository } from '@application/interfaces/repositories/IItemRepository';
export type { ILogger, ICache, IMetrics } from '@application/interfaces/infrastructure';
