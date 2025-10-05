// src/config/env.config.ts

import dotenv from 'dotenv';

dotenv.config();

/**
 * Parse de string de timeout para milissegundos
 * Aceita formatos: "30s", "5000ms", "5m", "5000"
 * 
 * IMPORTANTE: Esta função é usada em TODO o projeto.
 * Garante que timeouts sempre sejam números válidos em ms.
 * 
 * Formatos suportados:
 * - "30000" → 30000ms (número puro)
 * - "30s" → 30000ms (segundos)
 * - "30000ms" → 30000ms (milissegundos)
 * - "5m" → 300000ms (minutos)
 */
export function parseTimeout(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;

  // Se for número puro, retorna direto
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  // ✅ IMPORTANTE: Verificar 'ms' ANTES de 's' 
  // (porque 'ms' também termina com 's')
  if (value.endsWith('ms')) {
    return parseInt(value.slice(0, -2), 10);
  }

  // Se terminar com 's', converte segundos para ms
  if (value.endsWith('s')) {
    return parseInt(value.slice(0, -1), 10) * 1000;
  }

  // Se terminar com 'm', converte minutos para ms
  if (value.endsWith('m')) {
    return parseInt(value.slice(0, -1), 10) * 60000;
  }

  return defaultValue;
}

// ============================================
// CONFIGURAÇÃO CENTRALIZADA
// ============================================

export const config = {
  // ==================== SERVIDOR ====================
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    apiPrefix: process.env.API_PREFIX || '/api',
  },

  // ==================== BANCO DE DADOS ====================
  database: {
    // Tipo de conexão
    type: (process.env.DB_CONNECTION_TYPE || 'sqlserver') as 'sqlserver' | 'odbc',
    useMockData: process.env.USE_MOCK_DATA === 'true',

    // SQL Server (usado pelo DatabaseManager)
    sqlServer: {
      server: process.env.DB_SERVER || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433', 10),
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      
      // ✅ CORRETO: Usa DB_DATABASE_* (não DB_NAME_*)
      databaseEmp: process.env.DB_DATABASE_EMP || '',
      databaseMult: process.env.DB_DATABASE_MULT || '',
      
      // ✅ CORRETO: Usa parseTimeout para TODOS os timeouts
      connectionTimeout: parseTimeout(process.env.DB_CONNECTION_TIMEOUT, 15000),
      requestTimeout: parseTimeout(process.env.DB_REQUEST_TIMEOUT, 30000),
      
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },

    // ODBC
    odbc: {
      dsnEmp: process.env.ODBC_DSN_EMP || '',
      dsnMult: process.env.ODBC_DSN_MULT || '',
      connectionTimeout: parseTimeout(process.env.ODBC_CONNECTION_TIMEOUT, 15000),
    },

    // Retry
    retry: {
      maxAttempts: parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || '3', 10),
      initialDelay: parseTimeout(process.env.DB_RETRY_INITIAL_DELAY, 1000),
      maxDelay: parseTimeout(process.env.DB_RETRY_MAX_DELAY, 10000),
      backoffFactor: parseFloat(process.env.DB_RETRY_BACKOFF_FACTOR || '2'),
    },
  },

  // ==================== CORS ====================
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
  },

  // ==================== TIMEOUTS HTTP ====================
  timeout: {
    request: parseTimeout(process.env.HTTP_REQUEST_TIMEOUT, 30000),
    heavyOperation: parseTimeout(process.env.HTTP_HEAVY_TIMEOUT, 60000),
    healthCheck: parseTimeout(process.env.HTTP_HEALTH_TIMEOUT, 5000),
  },

  // ==================== CACHE (Redis) ====================
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    strategy: (process.env.CACHE_STRATEGY || 'memory') as 'memory' | 'redis' | 'layered',
    redis: {
      url: process.env.CACHE_REDIS_URL || 'redis://localhost:6379',
    },
    defaultTTL: parseTimeout(process.env.CACHE_DEFAULT_TTL, 300000), // 5min padrão
  },
};

// ============================================
// EXPORTS COMPATÍVEIS (não quebra código existente)
// ============================================

/**
 * @deprecated Use 'config' ao invés de 'envConfig'
 */
export const envConfig = config;

/**
 * @deprecated Use 'config.server' diretamente
 */
export const serverConfig = {
  port: config.server.port,
  nodeEnv: config.server.nodeEnv,
  apiPrefix: config.server.apiPrefix,
  corsOrigin: config.cors.allowedOrigins[0] || '*',
};