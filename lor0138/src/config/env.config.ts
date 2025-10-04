// src/config/env.config.ts

import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  // Servidor
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  apiPrefix: string;

  // Banco de Dados
  database: {
    // SQL Server
    sqlServer: {
      server: string;
      port: number;
      user: string;
      password: string;
      databaseEmp: string;
      databaseMult: string;
      connectionTimeout: number; // Timeout para conectar (ms)
      requestTimeout: number; // Timeout para queries (ms)
      encrypt: boolean;
      trustServerCertificate: boolean;
    };
    // ODBC
    odbc: {
      dsnEmp: string;
      dsnMult: string;
      connectionTimeout: number; // Timeout para conectar (ms)
    };
    // Configuração geral
    connectionType: 'sqlserver' | 'odbc';
    useMockData: boolean;
  };

  // CORS
  cors: {
    allowedOrigins: string[];
  };

  // Timeouts HTTP
  timeout: {
    request: number; // Timeout padrão de requisição (ms)
    heavyOperation: number; // Timeout para operações pesadas (ms)
    healthCheck: number; // Timeout para health check (ms)
  };
}

/**
 * Parse de string de timeout para milissegundos
 * Aceita formatos: "30s", "5000ms", "5000"
 */
function parseTimeout(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;

  // Se for número puro, retorna direto
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  // Se terminar com 's', converte segundos para ms
  if (value.endsWith('s')) {
    return parseInt(value.slice(0, -1), 10) * 1000;
  }

  // Se terminar com 'ms', remove e converte
  if (value.endsWith('ms')) {
    return parseInt(value.slice(0, -2), 10);
  }

  return defaultValue;
}

export const envConfig: EnvConfig = {
  // Servidor
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  apiPrefix: process.env.API_PREFIX || '/api',

  // Banco de Dados
  database: {
    sqlServer: {
      server: process.env.DB_SERVER || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433', 10),
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      databaseEmp: process.env.DB_NAME_EMP || 'emp',
      databaseMult: process.env.DB_NAME_MULT || 'mult',
      connectionTimeout: parseTimeout(process.env.DB_CONNECTION_TIMEOUT, 15000), // 15s padrão
      requestTimeout: parseTimeout(process.env.DB_REQUEST_TIMEOUT, 30000), // 30s padrão
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
    },
    odbc: {
      dsnEmp: process.env.ODBC_DSN_EMP || '',
      dsnMult: process.env.ODBC_DSN_MULT || '',
      connectionTimeout: parseTimeout(process.env.ODBC_CONNECTION_TIMEOUT, 15000), // 15s padrão
    },
    connectionType:
      (process.env.DB_CONNECTION_TYPE as 'sqlserver' | 'odbc') || 'sqlserver',
    useMockData: process.env.USE_MOCK_DATA === 'true',
  },

  // CORS
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
  },

  // Timeouts HTTP
  timeout: {
    request: parseTimeout(process.env.HTTP_REQUEST_TIMEOUT, 30000), // 30s padrão
    heavyOperation: parseTimeout(process.env.HTTP_HEAVY_TIMEOUT, 60000), // 60s padrão
    healthCheck: parseTimeout(process.env.HTTP_HEALTH_TIMEOUT, 5000), // 5s padrão
  },
};