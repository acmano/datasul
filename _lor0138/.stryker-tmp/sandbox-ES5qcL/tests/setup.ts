// @ts-nocheck
// tests/setup.ts
// Setup global para todos os testes

// ========================================
// 1. VARIÁVEIS DE AMBIENTE PARA TESTES
// ========================================
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Porta diferente para não conflitar

// Database (Mock será usado automaticamente)
process.env.DB_CONNECTION_TYPE = 'sqlserver';
process.env.DB_SERVER = 'test-server';
process.env.DB_PORT = '1433';
process.env.DB_USER = 'test-user';
process.env.DB_PASSWORD = 'test-password';
process.env.DB_DATABASE_EMP = '';
process.env.DB_DATABASE_MULT = '';
process.env.DB_CONNECTION_TIMEOUT = '5000';
process.env.DB_REQUEST_TIMEOUT = '5000';
process.env.DB_ENCRYPT = 'false';
process.env.DB_TRUST_SERVER_CERTIFICATE = 'true';

// Cache (desabilitado para testes por padrão)
process.env.CACHE_ENABLED = 'false';
process.env.CACHE_STRATEGY = 'memory';

// CORS
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3001';

// Timeouts
process.env.HTTP_REQUEST_TIMEOUT = '5000';
process.env.HTTP_HEALTH_TIMEOUT = '2000';

// Shutdown
process.env.SHUTDOWN_TIMEOUT = '1000';

// ========================================
// 2. MOCK DO LOGGER (evita poluir console)
// ========================================
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

// ========================================
// 2.1 MOCK DO UUID (resolve problema ESM)
// ========================================
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-9012'),
}));

// ========================================
// 3. MOCKS GLOBAIS DE CONSOLE (opcional)
// ========================================
// Silencia console.log/error durante testes (descomente se quiser)
// global.console.log = jest.fn();
// global.console.error = jest.fn();
// global.console.warn = jest.fn();

// ========================================
// 4. TIMEOUT GLOBAL (aumenta se testes forem lentos)
// ========================================
jest.setTimeout(10000); // 10 segundos

// ========================================
// 5. EXTEND EXPECT (matchers customizados)
// ========================================
expect.extend({
  // Matcher customizado para validar erro customizado
  toBeCustomError(received: any, expectedClass: any) {
    const pass = received instanceof expectedClass;
    
    if (pass) {
      return {
        message: () => `Expected error NOT to be instance of ${expectedClass.name}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected error to be instance of ${expectedClass.name}, but got ${received?.constructor?.name}`,
        pass: false,
      };
    }
  },

  // Matcher para validar estrutura de API response
  toBeApiResponse(received: any) {
    const hasSuccess = 'success' in received;
    const hasData = 'data' in received || 'error' in received;
    const pass = hasSuccess && hasData;

    if (pass) {
      return {
        message: () => 'Expected NOT to be a valid API response',
        pass: true,
      };
    } else {
      return {
        message: () => `Expected to be a valid API response with 'success' and 'data'/'error' fields`,
        pass: false,
      };
    }
  },
});

// ========================================
// 6. DECLARAÇÃO DE TIPOS PARA MATCHERS CUSTOMIZADOS
// ========================================
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCustomError(expectedClass: any): R;
      toBeApiResponse(): R;
    }
  }
}

// ========================================
// 7. CLEANUP APÓS CADA TESTE
// ========================================
afterEach(() => {
  jest.clearAllMocks(); // Limpa histórico de calls de mocks
});

// ========================================
// 8. CLEANUP APÓS TODOS OS TESTES
// ========================================
afterAll(async () => {
  // Aguarda promises pendentes
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Fecha conexões abertas (se houver)
  // await DatabaseManager.close();
  // await CacheManager.close();
});

// ========================================
// 9. ERRO DE PROMISES NÃO TRATADAS
// ========================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection during test:', reason);
  throw reason;
});

console.log('🧪 Ambiente de testes configurado');

// ========================================
// 10. EXPORT PARA TORNAR ESTE ARQUIVO UM MÓDULO
// ========================================
// Necessário para o 'declare global' funcionar
export {};