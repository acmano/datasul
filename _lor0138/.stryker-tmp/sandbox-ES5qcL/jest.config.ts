// @ts-nocheck
// jest.config.ts
import type { Config } from 'jest'; // ✅ CORRETO: importar de 'jest', não '@jest/types'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/src', '<rootDir>/tests'],
  modulePaths: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },

  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

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

  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
  ],

  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  testTimeout: 10000,

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      isolatedModules: true,
    }],
  },

  verbose: true,
  forceExit: true,

  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  clearMocks: true,
  restoreMocks: true,

  maxWorkers: '50%',
};

export default config;