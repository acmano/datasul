// src/config/env.config.ts

import dotenv from 'dotenv';
import { appConfig } from './app.config';

/**
 * Carrega variáveis de ambiente do arquivo .env
 */
dotenv.config();

/**
 * Parse de string de timeout para milissegundos
 *
 * @description
 * Função utilitária que converte strings de timeout em diversos formatos
 * para milissegundos (número). Usada em TODO o projeto para garantir
 * que timeouts sejam sempre números válidos em ms.
 *
 * Formatos suportados:
 * - Número puro: "30000" → 30000ms
 * - Segundos: "30s" → 30000ms
 * - Milissegundos: "30000ms" → 30000ms
 * - Minutos: "5m" → 300000ms
 *
 * Ordem de verificação (IMPORTANTE):
 * 1. Número puro (regex: ^\d+$)
 * 2. Milissegundos (termina com 'ms')
 * 3. Segundos (termina com 's')
 * 4. Minutos (termina com 'm')
 *
 * @param value - String do .env com timeout
 * @param defaultValue - Valor padrão se parsing falhar
 * @returns {number} Timeout em milissegundos
 *
 * @example
 * parseTimeout('30000', 15000); // → 30000
 * parseTimeout('30s', 15000);   // → 30000
 * parseTimeout('30000ms', 15000); // → 30000
 * parseTimeout('5m', 15000);    // → 300000
 * parseTimeout(undefined, 15000); // → 15000
 * parseTimeout('invalid', 15000); // → 15000
 *
 * @critical
 * - Verificar 'ms' ANTES de 's' (porque 'ms' também termina com 's')
 * - Ordem das verificações importa!
 * - Sempre retornar número (nunca undefined ou NaN)
 * - Valor padrão deve ser sensato (ex: 15000 para connection)
 */
export function parseTimeout(value: string | undefined, defaultValue: number): number {
  // Se não fornecido, usar default
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

  // Fallback para default se formato inválido
  return defaultValue;
}

/**
 * Configuração centralizada da aplicação
 *
 * @description
 * Objeto único que consolida TODAS as configurações da aplicação
 * carregadas das variáveis de ambiente. Fornece valores padrão sensatos
 * e type-safety através do TypeScript.
 *
 * Estrutura:
 * - server: configurações do servidor Express
 * - database: configurações de banco de dados (SQL Server, ODBC, Retry)
 * - cors: configurações de CORS
 * - timeout: timeouts HTTP
 * - cache: configurações de cache (Redis, memória)
 *
 * Benefícios:
 * - Single Source of Truth para configs
 * - Type-safe (TypeScript)
 * - Valores padrão sensatos
 * - Fácil manutenção
 * - Melhor para testes
 *
 * @example
 * // Importar e usar
 * import { config } from '@config/env.config';
 * const port = config.server.port;
 * const dbTimeout = config.database.sqlServer.connectionTimeout;
 *
 * @critical
 * - NUNCA modificar config em runtime (somente leitura)
 * - Validar configs no startup (configValidator.ts)
 * - Não expor secrets em logs
 * - Usar valores padrão sensatos
 *
 * @see {@link ConfigValidator} - Validação de configs
 */
export const config = {
  // ==================== SERVIDOR ====================

  /**
   * Configurações do servidor Express
   */
  server: {
    /**
     * Porta onde o servidor escutará
     * @default 3000
     * @env PORT
     */
    port: parseInt(process.env.PORT || '3000', 10),

    /**
     * Ambiente de execução
     * @default 'development'
     * @env NODE_ENV
     */
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',

    /**
     * Prefixo para todas as rotas da API
     * @default '/api'
     * @env API_PREFIX
     */
    apiPrefix: process.env.API_PREFIX || '/api',
  },

  // ==================== BANCO DE DADOS ====================

  /**
   * Configurações de banco de dados
   */
  database: {
    /**
     * Tipo de conexão com o banco
     * @default 'sqlserver'
     * @env DB_CONNECTION_TYPE
     */
    type: (process.env.DB_CONNECTION_TYPE || 'sqlserver') as 'sqlserver' | 'odbc',

    /**
     * Usar dados mockados (desenvolvimento/testes)
     * @default false
     * @env USE_MOCK_DATA
     */
    useMockData: process.env.USE_MOCK_DATA === 'true',

    /**
     * Configurações SQL Server
     * Usado quando type === 'sqlserver'
     */
    sqlServer: {
      /**
       * Endereço do servidor SQL Server
       * @env DB_SERVER
       * @example '10.105.0.4\LOREN'
       */
      server: process.env.DB_SERVER || appConfig.host,

      /**
       * Porta do SQL Server
       * @default 1433
       * @env DB_PORT
       */
      port: parseInt(process.env.DB_PORT || '1433', 10),

      /**
       * Usuário do SQL Server
       * @env DB_USER
       */
      user: process.env.DB_USER || '',

      /**
       * Senha do SQL Server
       * @env DB_PASSWORD
       * @critical Use aspas simples se senha contém #
       * @example DB_PASSWORD='#senha#'
       */
      password: process.env.DB_PASSWORD || '',

      /**
       * Database EMP (empresa)
       * @env DB_DATABASE_EMP
       * @default '' (usa database padrão do usuário)
       * @critical Deixar vazio usa default, mais seguro
       */
      databaseEmp: process.env.DB_DATABASE_EMP || '',

      /**
       * Database MULT (múltiplas empresas)
       * @env DB_DATABASE_MULT
       * @default '' (usa database padrão do usuário)
       */
      databaseMult: process.env.DB_DATABASE_MULT || '',

      /**
       * Timeout de conexão em milissegundos
       * @default 15000 (15 segundos)
       * @env DB_CONNECTION_TIMEOUT
       * @example '15000' ou '15s' ou '15000ms'
       */
      connectionTimeout: parseTimeout(process.env.DB_CONNECTION_TIMEOUT, 15000),

      /**
       * Timeout de requisição em milissegundos
       * @default 30000 (30 segundos)
       * @env DB_REQUEST_TIMEOUT
       * @example '30000' ou '30s' ou '30000ms'
       */
      requestTimeout: parseTimeout(process.env.DB_REQUEST_TIMEOUT, 30000),

      /**
       * Usar criptografia na conexão
       * @default false
       * @env DB_ENCRYPT
       */
      encrypt: process.env.DB_ENCRYPT === 'true',

      /**
       * Confiar em certificado auto-assinado
       * @default true (desenvolvimento)
       * @env DB_TRUST_SERVER_CERTIFICATE
       */
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },

    /**
     * Configurações ODBC
     * Usado quando type === 'odbc'
     */
    odbc: {
      /**
       * DSN para database EMP
       * @env ODBC_DSN_EMP
       * @example 'PRD_EMS2EMP'
       */
      dsnEmp: process.env.ODBC_DSN_EMP || '',

      /**
       * DSN para database MULT
       * @env ODBC_DSN_MULT
       * @example 'PRD_EMS2MULT'
       */
      dsnMult: process.env.ODBC_DSN_MULT || '',

      /**
       * Timeout de conexão ODBC em milissegundos
       * @default 15000 (15 segundos)
       * @env ODBC_CONNECTION_TIMEOUT
       */
      connectionTimeout: parseTimeout(process.env.ODBC_CONNECTION_TIMEOUT, 15000),
    },

    /**
     * Configurações de retry para conexões
     */
    retry: {
      /**
       * Número máximo de tentativas
       * @default 3
       * @env DB_RETRY_MAX_ATTEMPTS
       */
      maxAttempts: parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || '3', 10),

      /**
       * Delay inicial entre tentativas em ms
       * @default 1000 (1 segundo)
       * @env DB_RETRY_INITIAL_DELAY
       */
      initialDelay: parseTimeout(process.env.DB_RETRY_INITIAL_DELAY, 1000),

      /**
       * Delay máximo entre tentativas em ms
       * @default 10000 (10 segundos)
       * @env DB_RETRY_MAX_DELAY
       */
      maxDelay: parseTimeout(process.env.DB_RETRY_MAX_DELAY, 10000),

      /**
       * Fator de multiplicação do delay (backoff exponencial)
       * @default 2
       * @env DB_RETRY_BACKOFF_FACTOR
       */
      backoffFactor: parseFloat(process.env.DB_RETRY_BACKOFF_FACTOR || '2'),
    },
  },

  // ==================== CORS ====================

  /**
   * Configurações de CORS
   */
  cors: {
    /**
     * Origens permitidas para CORS
     * @env CORS_ALLOWED_ORIGINS
     * @default [appConfig.baseUrl]
     * @example 'http://localhost:3000,https://app.example.com'
     */
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : [appConfig.baseUrl],
  },

  // ==================== TIMEOUTS HTTP ====================

  /**
   * Timeouts para requisições HTTP
   */
  timeout: {
    /**
     * Timeout padrão para requisições
     * @default 30000 (30 segundos)
     * @env HTTP_REQUEST_TIMEOUT
     */
    request: parseTimeout(process.env.HTTP_REQUEST_TIMEOUT, 30000),

    /**
     * Timeout para operações pesadas
     * @default 60000 (60 segundos)
     * @env HTTP_HEAVY_TIMEOUT
     */
    heavyOperation: parseTimeout(process.env.HTTP_HEAVY_TIMEOUT, 60000),

    /**
     * Timeout para health checks
     * @default 5000 (5 segundos)
     * @env HTTP_HEALTH_TIMEOUT
     */
    healthCheck: parseTimeout(process.env.HTTP_HEALTH_TIMEOUT, 5000),
  },

  // ==================== CACHE ====================

  /**
   * Configurações de cache
   */
  cache: {
    /**
     * Cache habilitado
     * @default true
     * @env CACHE_ENABLED
     */
    enabled: process.env.CACHE_ENABLED === 'true',

    /**
     * Estratégia de cache
     * - memory: apenas L1 (memória local)
     * - redis: apenas L2 (Redis compartilhado)
     * - layered: L1 + L2 (recomendado produção)
     * @default 'memory'
     * @env CACHE_STRATEGY
     */
    strategy: (process.env.CACHE_STRATEGY || 'memory') as 'memory' | 'redis' | 'layered',

    /**
     * Configurações Redis
     */
    redis: {
      /**
       * URL de conexão Redis
       * @default 'redis://lor0138.lorenzetti.ibe:6379'
       * @env CACHE_REDIS_URL
       */
      url: process.env.CACHE_REDIS_URL || 'redis://lor0138.lorenzetti.ibe:6379',
    },

    /**
     * TTL padrão do cache em milissegundos
     * @default 300000 (5 minutos)
     * @env CACHE_DEFAULT_TTL
     */
    defaultTTL: parseTimeout(process.env.CACHE_DEFAULT_TTL, 300000),
  },
};

// ============================================
// EXPORTS COMPATÍVEIS (compatibilidade retroativa)
// ============================================

/**
 * Export do config como envConfig
 * @deprecated Use 'config' ao invés de 'envConfig'
 */
export const envConfig = config;

/**
 * Export simplificado das configs de servidor
 * @deprecated Use 'config.server' diretamente
 */
export const serverConfig = {
  port: config.server.port,
  nodeEnv: config.server.nodeEnv,
  apiPrefix: config.server.apiPrefix,
  corsOrigin: config.cors.allowedOrigins[0] || '*',
};
