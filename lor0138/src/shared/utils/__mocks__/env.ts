/**
 * Mock do env.ts para testes Jest
 * Jest não entende import.meta.env (Vite), então criamos um mock manual
 */

export const env = {
  API_URL: process.env.VITE_API_URL || 'http://localhost:3002',
  APP_NAME: process.env.VITE_APP_NAME || 'LOR0138',
  VERSION: process.env.VITE_VERSION || '3.0.0',
  LOG_LEVEL: process.env.VITE_LOG_LEVEL || 'warn',
  LOG_ENABLED: process.env.VITE_LOG_ENABLED === 'true',
  NODE_ENV: process.env.NODE_ENV || 'test',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
};
