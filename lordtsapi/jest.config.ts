// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/src', '<rootDir>/tests'],
  modulePaths: ['<rootDir>/src'],

  // Deve estar sincronizado com tsconfig.json paths
  moduleNameMapper: {
    // Raiz genérica
    '^@/(.*)$': '<rootDir>/src/$1',

    // Arquitetura Clean Architecture
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',

    // Infraestrutura e configuração
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',

    // Módulos compartilhados (mais usado)
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',

    // Módulos de domínio/entidades
    '^@engenharia/(.*)$': '<rootDir>/src/engenharia/$1',
    '^@item/(.*)$': '<rootDir>/src/item/$1',
    '^@familia/(.*)$': '<rootDir>/src/familia/$1',
    '^@grupoDeEstoque/(.*)$': '<rootDir>/src/grupoDeEstoque/$1',
    '^@familiaComercial/(.*)$': '<rootDir>/src/familiaComercial/$1',
    '^@estabelecimento/(.*)$': '<rootDir>/src/estabelecimento/$1',

    // Testes
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],

  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.types.ts',
    '!src/**/index.ts',
    '!src/server.ts',
    '!src/app.ts',
  ],

  coverageDirectory: 'coverage',

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // ❌ REMOVIDO: globalTeardown (causava problemas com path aliases)
  // O cleanup agora é feito no afterAll de cada arquivo de teste

  testTimeout: 15000,

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  verbose: true,

  // ✅ forceExit garante que processo termina mesmo com handles abertos
  forceExit: true,

  // ⚠️ detectOpenHandles: só use para debug (deixe false normalmente)
  detectOpenHandles: false,

  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  clearMocks: true,
  restoreMocks: true,

  maxWorkers: '50%',
};

export default config;
