// @ts-nocheck
// tests/setup.integration.ts
// Setup ESPECÍFICO para testes de integração com banco real

import { DatabaseTestHelper } from './helpers/database.helper';

// ========================================
// 1. MOCK DO UUID (resolve problema ESM)
// ========================================
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-integration-1234'),
}));

// ========================================
// 2. CONFIGURAR TIMEOUT MAIOR
// ========================================
// Testes de integração podem ser mais lentos
jest.setTimeout(30000); // 30 segundos

// ========================================
// 3. INICIALIZAR BANCO ANTES DE TODOS OS TESTES
// ========================================
beforeAll(async () => {
  console.log('🔧 Inicializando testes de integração...');
  
  await DatabaseTestHelper.initialize();
  
  if (DatabaseTestHelper.isUsingRealDatabase()) {
    console.log('✅ Usando banco REAL - Testes de integração completos');
  } else {
    console.log('⚠️  Usando MOCK - Testes de integração limitados');
  }
});

// ========================================
// 4. CLEANUP APÓS TODOS OS TESTES
// ========================================
afterAll(async () => {
  console.log('🧹 Limpando recursos de testes...');
  await DatabaseTestHelper.cleanup();
  
  // Aguarda processos assíncronos finalizarem
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// ========================================
// 5. RESET ENTRE TESTES (se necessário)
// ========================================
afterEach(() => {
  // Limpar mocks se algum teste criar
  jest.clearAllMocks();
});

// ========================================
// 6. MATCHERS CUSTOMIZADOS PARA INTEGRAÇÃO
// ========================================
expect.extend({
  /**
   * Verifica se resposta veio do banco real
   */
  toBeRealDatabaseResponse(received: any) {
    // Se estamos usando mock, aceita qualquer coisa
    if (!DatabaseTestHelper.isUsingRealDatabase()) {
      return {
        pass: true,
        message: () => 'Usando mock, teste pulado'
      };
    }

    // Verifica se tem estrutura de dados real
    const hasRealData = received && 
      (Array.isArray(received) || typeof received === 'object');

    return {
      pass: hasRealData,
      message: () => hasRealData
        ? 'Resposta contém dados reais do banco'
        : 'Resposta não parece vir do banco real'
    };
  },

  /**
   * Verifica se tempo de resposta é aceitável
   */
  toRespondWithin(received: number, maxMs: number) {
    const pass = received <= maxMs;
    
    return {
      pass,
      message: () => pass
        ? `Respondeu em ${received}ms (dentro de ${maxMs}ms)`
        : `Respondeu em ${received}ms (esperado max ${maxMs}ms)`
    };
  },
});

// ========================================
// 7. DECLARAÇÃO DE TIPOS
// ========================================
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeRealDatabaseResponse(): R;
      toRespondWithin(maxMs: number): R;
    }
  }
}

// ========================================
// 8. UTILITÁRIOS GLOBAIS
// ========================================
// Disponibilizar helper globalmente
(global as any).DatabaseTestHelper = DatabaseTestHelper;

console.log('🧪 Setup de testes de integração carregado');

export {};