// @ts-nocheck
// tests/mocks/DatabaseManager.mock.ts

import { QueryParameter } from '@infrastructure/database/types';

/**
 * Mock do DatabaseManager para testes
 * Simula comportamento real sem conectar ao banco
 */

export const mockQueryResult = {
  // Resultado padrão de item master
  itemMaster: [
    {
      itemCodigo: '7530110',
      itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
      itemUnidade: 'UN',
    },
  ],

  // Resultado padrão de estabelecimentos
  estabelecimentos: [
    {
      itemCodigo: '7530110',
      estabCodigo: '01.01',
      estabNome: 'CD São Paulo',
      codObsoleto: 0,
    },
    {
      itemCodigo: '7530110',
      estabCodigo: '02.01',
      estabNome: 'Fábrica Joinville',
      codObsoleto: 1,
    },
  ],

  // Item não encontrado
  empty: [],
};

/**
 * Mock das funções do DatabaseManager
 */
export const mockDatabaseManager = {
  // Query simples EMP
  queryEmp: jest.fn().mockResolvedValue(mockQueryResult.itemMaster),

  // Query simples MULT
  queryMult: jest.fn().mockResolvedValue([]),

  // Query parametrizada EMP (RECOMENDADO - usa por padrão)
  queryEmpWithParams: jest.fn().mockResolvedValue(mockQueryResult.itemMaster),

  // Query parametrizada MULT
  queryMultWithParams: jest.fn().mockResolvedValue([]),

  // Métodos de controle
  initialize: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  isReady: jest.fn().mockReturnValue(true),
  
  getConnectionStatus: jest.fn().mockReturnValue({
    type: 'sqlserver',
    mode: 'REAL_DATABASE',
    error: undefined,
  }),

  getConnection: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue(mockQueryResult.itemMaster),
    queryWithParams: jest.fn().mockResolvedValue(mockQueryResult.itemMaster),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
};

/**
 * Função helper para configurar respostas customizadas
 */
export function setupDatabaseManagerMock(config: {
  itemMaster?: any[];
  estabelecimentos?: any[];
  shouldThrowError?: boolean;
  errorMessage?: string;
}) {
  if (config.shouldThrowError) {
    const error = new Error(config.errorMessage || 'Database error');
    mockDatabaseManager.queryEmpWithParams.mockRejectedValue(error);
    mockDatabaseManager.queryMultWithParams.mockRejectedValue(error);
    return;
  }

  if (config.itemMaster !== undefined) {
    mockDatabaseManager.queryEmpWithParams.mockResolvedValue(config.itemMaster);
  }

  if (config.estabelecimentos !== undefined) {
    mockDatabaseManager.queryMultWithParams.mockResolvedValue(config.estabelecimentos);
  }
}

/**
 * Reset mocks (chamar em beforeEach)
 */
export function resetDatabaseManagerMock() {
  jest.clearAllMocks();
  
  // Restaura comportamento padrão
  mockDatabaseManager.queryEmpWithParams.mockResolvedValue(mockQueryResult.itemMaster);
  mockDatabaseManager.queryMultWithParams.mockResolvedValue([]);
}

/**
 * Mock automático do módulo DatabaseManager
 * Use este em seu teste:
 * 
 * jest.mock('@infrastructure/database/DatabaseManager', () => ({
 *   DatabaseManager: mockDatabaseManager
 * }));
 */
export default mockDatabaseManager;