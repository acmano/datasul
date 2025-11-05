/**
 * Helper para acessar variáveis de ambiente
 * Compatível com Vite (VITE_*)
 */

export const env = {
  API_URL: import.meta.env.VITE_API_URL || '/api',

  APP_NAME: import.meta.env.VITE_APP_NAME || 'LOR0138',

  VERSION: import.meta.env.VITE_VERSION || '2.0.0',

  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'warn',

  LOG_ENABLED: import.meta.env.VITE_LOG_ENABLED === 'true',

  NODE_ENV: import.meta.env.MODE || 'development',

  IS_DEV: import.meta.env.MODE === 'development',

  IS_PROD: import.meta.env.MODE === 'production',
};
