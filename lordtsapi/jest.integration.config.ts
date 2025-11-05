// jest.integration.config.ts

import type { Config } from 'jest';
import baseConfig from './jest.config';

/**
 * Configuração Jest para Testes de Integração
 *
 * Diferenças do config base:
 * - Usa test containers
 * - Timeout maior (30s)
 * - Global setup/teardown
 * - Executa serialmente (--runInBand)
 */
const config: Config = {
  ...baseConfig,

  // Display name
  displayName: 'integration',

  // Pattern para testes de integração
  testMatch: ['**/tests/integration/**/*.test.ts'],

  // Timeout maior para testes de integração
  testTimeout: 30000,

  // Setup global - Inicia containers
  globalSetup: '<rootDir>/tests/setup/testcontainers.setup.ts',

  // Teardown global - Para containers
  globalTeardown: '<rootDir>/tests/setup/testcontainers.setup.ts',

  // Máximo de workers (integração deve rodar serial)
  maxWorkers: 1,

  // Detectar vazamentos de memória
  detectLeaks: true,

  // Detectar handles abertos
  detectOpenHandles: true,

  // Force exit após testes
  forceExit: true,
};

export default config;
