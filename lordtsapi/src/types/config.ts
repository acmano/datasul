// src/types/config.ts

/**
 * Tipos para Configurações da Aplicação
 *
 * @module types/config
 * @version 1.0.0
 *
 * @description
 * Define tipos type-safe para todas as configurações da aplicação.
 * Garante que configurações sejam válidas em compile-time.
 */

// ============================================================================
// DATABASE CONFIG
// ============================================================================

export type ConnectionType = 'sqlserver' | 'odbc';

export interface DatabaseConfig {
  connectionType: ConnectionType;
  server?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  dsn?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  retry?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
}

// ============================================================================
// CACHE CONFIG
// ============================================================================

export type CacheStrategy = 'memory' | 'redis' | 'layered';

export interface CacheConfig {
  enabled: boolean;
  strategy: CacheStrategy;
  defaultTTL: number;
  redis?: {
    url: string;
    keyPrefix?: string;
    maxRetries?: number;
  };
  memory?: {
    maxSize?: number;
    checkPeriod?: number;
  };
}

// ============================================================================
// SERVER CONFIG
// ============================================================================

export interface ServerConfig {
  port: number;
  host?: string;
  env: 'development' | 'test' | 'production';
  cors?: {
    enabled: boolean;
    allowedOrigins: string[];
    credentials?: boolean;
  };
  timeout?: number;
  bodyLimit?: string;
}

// ============================================================================
// LOGGING CONFIG
// ============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

export interface LoggingConfig {
  level: LogLevel;
  dir?: string;
  maxSize?: string;
  maxFiles?: string;
  format?: 'json' | 'simple';
}

// ============================================================================
// RATE LIMIT CONFIG
// ============================================================================

export interface RateLimitConfig {
  enabled: boolean;
  windowMs?: number;
  max?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// ============================================================================
// APP CONFIG (ROOT)
// ============================================================================

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  rateLimit?: RateLimitConfig;
}
