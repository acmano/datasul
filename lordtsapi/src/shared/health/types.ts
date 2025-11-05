// src/shared/health/types.ts

/**
 * @fileoverview Type definitions for health check system
 *
 * Defines all TypeScript interfaces and types for the comprehensive
 * ODBC connection health check system.
 *
 * @module shared/health/types
 */

// ============================================================================
// HEALTH CHECK RESULT TYPES
// ============================================================================

/**
 * Result of a single connection health check
 *
 * @interface HealthCheckResult
 */
export interface HealthCheckResult {
  /** Data Source Name */
  dsn: string;
  /** Human-readable connection description */
  description: string;
  /** Whether connection is currently healthy */
  connected: boolean;
  /** Response time in milliseconds (undefined if not connected) */
  responseTime?: number;
  /** Last error message (if any) */
  lastError?: string;
  /** Timestamp of when this check was performed */
  lastChecked: Date;
  /** System type (datasul/informix) */
  systemType?: string;
  /** Environment (production/test/homologation/etc) */
  environment?: string;
  /** Database purpose (emp/mult/adt/etc) */
  purpose?: string;
}

/**
 * Summary statistics for health check results
 *
 * @interface HealthCheckSummary
 */
export interface HealthCheckSummary {
  /** Total number of connections checked */
  total: number;
  /** Number of healthy connections */
  healthy: number;
  /** Number of unhealthy connections */
  unhealthy: number;
  /** Percentage of healthy connections */
  healthPercentage: number;
}

/**
 * Complete health check response
 *
 * @interface HealthCheckResponse
 */
export interface HealthCheckResponse {
  /** Overall success status */
  success: boolean;
  /** Timestamp when check was performed */
  timestamp: Date;
  /** Array of individual connection results */
  connections: HealthCheckResult[];
  /** Summary statistics */
  summary: HealthCheckSummary;
  /** Correlation ID for request tracking */
  correlationId?: string;
}

// ============================================================================
// CONNECTION POOL INFO TYPES
// ============================================================================

/**
 * Information about an active connection in the pool
 *
 * @interface ActiveConnectionInfo
 */
export interface ActiveConnectionInfo {
  /** Data Source Name */
  dsn: string;
  /** Connection description */
  description: string;
  /** When connection was last used */
  lastUsed: Date;
  /** Number of active queries on this connection */
  activeQueries: number;
  /** System type (datasul/informix) */
  systemType: string;
  /** Environment */
  environment: string;
}

/**
 * Complete connection pool status
 *
 * @interface ConnectionPoolStatus
 */
export interface ConnectionPoolStatus {
  /** Total connections in pool */
  totalConnections: number;
  /** Active connections */
  activeConnections: ActiveConnectionInfo[];
  /** Timestamp */
  timestamp: Date;
}

// ============================================================================
// CACHE ENTRY TYPES
// ============================================================================

/**
 * Cached health check result
 *
 * @interface CachedHealthResult
 */
export interface CachedHealthResult {
  /** The actual health check result */
  result: HealthCheckResult;
  /** When this result was cached */
  cachedAt: Date;
  /** When this cache entry expires */
  expiresAt: Date;
}
