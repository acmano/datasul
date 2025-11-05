// src/shared/health/service.ts

/**
 * @fileoverview Comprehensive Health Check Service for ODBC Connections
 *
 * This service provides health checking capabilities for all configured
 * ODBC connections (22+ connections across Datasul and Informix systems).
 *
 * Features:
 * - Check individual connections by DSN
 * - Check multiple connections in parallel
 * - Filter by environment (prod/test/hml)
 * - Filter by system (datasul/informix)
 * - Brief caching (5-10s) to prevent overload
 * - Detailed metrics (response time, errors)
 *
 * @module shared/health/service
 */

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import {
  AVAILABLE_CONNECTIONS,
  ConnectionConfig,
  findConnectionByDSN,
  getAllDSNs,
  getConnectionsByEnvironment,
  EnvironmentType,
} from '@config/connections.config';
import { log } from '@shared/utils/logger';
import {
  HealthCheckResult,
  HealthCheckResponse,
  HealthCheckSummary,
  CachedHealthResult,
  ActiveConnectionInfo,
  ConnectionPoolStatus,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Cache duration for health check results (in milliseconds)
 * Set to 10 seconds to prevent hammering connections while still being fresh
 */
const HEALTH_CHECK_CACHE_TTL = 10 * 1000; // 10 seconds

/**
 * Timeout for individual connection health checks (in milliseconds)
 */
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

/**
 * Simple in-memory cache for health check results
 * Map<DSN, CachedHealthResult>
 */
const healthCheckCache = new Map<string, CachedHealthResult>();

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Health Check Service for ODBC Connections
 *
 * @class ConnectionHealthService
 * @static
 *
 * @example Check single connection
 * ```typescript
 * const result = await ConnectionHealthService.checkConnection('DtsPrdEmp');
 * log.info(result.connected); // true/false
 * log.info(result.responseTime); // 45ms
 * ```
 *
 * @example Check all production connections
 * ```typescript
 * const results = await ConnectionHealthService.checkConnectionsByEnvironment('production');
 * log.info(`${results.summary.healthy}/${results.summary.total} healthy`);
 * ```
 */
export class ConnectionHealthService {
  // ==========================================================================
  // SINGLE CONNECTION HEALTH CHECK
  // ==========================================================================

  /**
   * Check health of a single connection by DSN
   *
   * @description
   * Performs a health check on a specific connection:
   * 1. Checks cache first (TTL: 10s)
   * 2. If cache miss, performs actual health check
   * 3. Caches result for future requests
   * 4. Returns detailed health information
   *
   * @param {string} dsn - Data Source Name to check
   * @param {string} [correlationId] - Request correlation ID for logging
   * @returns {Promise<HealthCheckResult>} Health check result
   *
   * @example
   * ```typescript
   * const result = await ConnectionHealthService.checkConnection('DtsPrdEmp', 'req-123');
   * if (result.connected) {
   *   log.info(`${result.dsn} is healthy (${result.responseTime}ms)`);
   * } else {
   *   log.error(`${result.dsn} failed: ${result.lastError}`);
   * }
   * ```
   */
  static async checkConnection(dsn: string, correlationId?: string): Promise<HealthCheckResult> {
    // Check cache first
    const cached = this.getCachedResult(dsn);
    if (cached) {
      log.debug('Health check cache hit', { dsn, correlationId });
      return cached.result;
    }

    // Find connection config
    const config = findConnectionByDSN(dsn);
    if (!config) {
      return {
        dsn,
        description: 'Unknown DSN',
        connected: false,
        lastError: `DSN '${dsn}' not found in configuration`,
        lastChecked: new Date(),
      };
    }

    // Perform actual health check
    log.debug('Performing health check', { dsn, correlationId });
    const result = await this.performHealthCheck(config, correlationId);

    // Cache result
    this.cacheResult(dsn, result);

    return result;
  }

  // ==========================================================================
  // MULTIPLE CONNECTION HEALTH CHECKS
  // ==========================================================================

  /**
   * Check health of multiple connections in parallel
   *
   * @description
   * Executes health checks on multiple connections simultaneously for
   * better performance. Includes summary statistics.
   *
   * @param {string[]} dsns - Array of DSNs to check
   * @param {string} [correlationId] - Request correlation ID
   * @returns {Promise<HealthCheckResponse>} Complete health check response
   *
   * @example
   * ```typescript
   * const response = await ConnectionHealthService.checkMultipleConnections(
   *   ['DtsPrdEmp', 'DtsPrdMult', 'DtsTstEmp']
   * );
   * log.info(`Summary: ${response.summary.healthy}/${response.summary.total} healthy`);
   * ```
   */
  static async checkMultipleConnections(
    dsns: string[],
    correlationId?: string
  ): Promise<HealthCheckResponse> {
    log.info('Checking multiple connections', {
      count: dsns.length,
      correlationId,
    });

    // Execute all checks in parallel
    const checkPromises = dsns.map((dsn) => this.checkConnection(dsn, correlationId));
    const connections = await Promise.all(checkPromises);

    // Calculate summary
    const summary = this.calculateSummary(connections);

    return {
      success: summary.healthy === summary.total,
      timestamp: new Date(),
      connections,
      summary,
      correlationId,
    };
  }

  // ==========================================================================
  // FILTERED HEALTH CHECKS
  // ==========================================================================

  /**
   * Check health of all connections for a specific environment
   *
   * @description
   * Checks all connections for a given environment (production, test, etc).
   * Includes both Datasul and Informix connections if applicable.
   *
   * @param {string} environment - Environment name (production, test, homologation, etc)
   * @param {string} [correlationId] - Request correlation ID
   * @returns {Promise<HealthCheckResponse>} Health check response
   *
   * @example
   * ```typescript
   * const results = await ConnectionHealthService.checkConnectionsByEnvironment('production');
   * log.info('Production health:', results.summary);
   * ```
   */
  static async checkConnectionsByEnvironment(
    environment: string,
    correlationId?: string
  ): Promise<HealthCheckResponse> {
    log.info('Checking connections by environment', { environment, correlationId });

    // Map environment string to EnvironmentType
    const envMap: Record<string, EnvironmentType> = {
      production: EnvironmentType.PRODUCTION,
      prod: EnvironmentType.PRODUCTION,
      prd: EnvironmentType.PRODUCTION,
      test: EnvironmentType.TEST,
      tst: EnvironmentType.TEST,
      homologation: EnvironmentType.HOMOLOGATION,
      hml: EnvironmentType.HOMOLOGATION,
      development: EnvironmentType.DEVELOPMENT,
      dev: EnvironmentType.DEVELOPMENT,
      atualização: EnvironmentType.ATUALIZAÇÃO,
      atu: EnvironmentType.ATUALIZAÇÃO,
      new: EnvironmentType.NEW,
    };

    const envType = envMap[environment.toLowerCase()];
    if (!envType) {
      return {
        success: false,
        timestamp: new Date(),
        connections: [],
        summary: { total: 0, healthy: 0, unhealthy: 0, healthPercentage: 0 },
        correlationId,
      };
    }

    // Get all connections for this environment
    const configs = getConnectionsByEnvironment(envType);
    const dsns = configs.map((config) => config.dsn);

    return this.checkMultipleConnections(dsns, correlationId);
  }

  /**
   * Check health of all connections for a specific system
   *
   * @description
   * Checks all connections for a given system (datasul or informix).
   *
   * @param {string} system - System name ('datasul' or 'informix')
   * @param {string} [correlationId] - Request correlation ID
   * @returns {Promise<HealthCheckResponse>} Health check response
   *
   * @example
   * ```typescript
   * const results = await ConnectionHealthService.checkConnectionsBySystem('datasul');
   * log.info('Datasul connections:', results.summary);
   * ```
   */
  static async checkConnectionsBySystem(
    system: string,
    correlationId?: string
  ): Promise<HealthCheckResponse> {
    log.info('Checking connections by system', { system, correlationId });

    const systemType = system.toLowerCase();
    if (systemType !== 'datasul' && systemType !== 'informix') {
      return {
        success: false,
        timestamp: new Date(),
        connections: [],
        summary: { total: 0, healthy: 0, unhealthy: 0, healthPercentage: 0 },
        correlationId,
      };
    }

    // Get all DSNs for this system
    const dsns = getAllDSNs(systemType as 'datasul' | 'informix');

    return this.checkMultipleConnections(dsns, correlationId);
  }

  /**
   * Check health of all available connections
   *
   * @description
   * Checks ALL configured connections (22+ connections).
   * Warning: This is expensive! Use sparingly.
   *
   * @param {string} [correlationId] - Request correlation ID
   * @returns {Promise<HealthCheckResponse>} Health check response
   *
   * @example
   * ```typescript
   * const results = await ConnectionHealthService.checkAllConnections();
   * log.info(`Total: ${results.summary.total}, Healthy: ${results.summary.healthy}`);
   * ```
   */
  static async checkAllConnections(correlationId?: string): Promise<HealthCheckResponse> {
    log.info('Checking ALL connections (expensive operation)', { correlationId });

    const datasulDSNs = getAllDSNs('datasul');
    const informixDSNs = getAllDSNs('informix');
    const allDSNs = [...datasulDSNs, ...informixDSNs];

    return this.checkMultipleConnections(allDSNs, correlationId);
  }

  // ==========================================================================
  // ACTIVE CONNECTIONS INFO
  // ==========================================================================

  /**
   * Get information about active connections in the pool
   *
   * @description
   * Returns details about all currently active connections in DatabaseManager's pool.
   * Does NOT perform health checks, just returns current state.
   *
   * @returns {ConnectionPoolStatus} Active connection pool status
   *
   * @example
   * ```typescript
   * const status = ConnectionHealthService.getActiveConnectionsInfo();
   * log.info(`${status.totalConnections} active connections`);
   * status.activeConnections.forEach(conn => {
   *   log.info(`${conn.dsn}: ${conn.activeQueries} queries`);
   * });
   * ```
   */
  static getActiveConnectionsInfo(): ConnectionPoolStatus {
    const active = DatabaseManager.getActiveConnections();

    const activeConnections: ActiveConnectionInfo[] = active.map((conn) => {
      const config = findConnectionByDSN(conn.dsn);
      return {
        dsn: conn.dsn,
        description: conn.description,
        lastUsed: conn.lastUsed,
        activeQueries: conn.activeQueries,
        systemType: config?.systemType || 'unknown',
        environment: config?.environment || 'unknown',
      };
    });

    return {
      totalConnections: activeConnections.length,
      activeConnections,
      timestamp: new Date(),
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Perform actual health check on a connection
   *
   * @private
   * @param {ConnectionConfig} config - Connection configuration
   * @param {string} [correlationId] - Request correlation ID
   * @returns {Promise<HealthCheckResult>} Health check result
   */
  private static async performHealthCheck(
    config: ConnectionConfig,
    correlationId?: string
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Use DatabaseManager's health check method with timeout
      const healthPromise = DatabaseManager.healthCheckConnection(config.dsn);
      const timeoutPromise = new Promise<{ connected: boolean; responseTime: number }>(
        (_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT);
        }
      );

      const health = await Promise.race([healthPromise, timeoutPromise]);

      return {
        dsn: config.dsn,
        description: config.description,
        connected: health.connected,
        responseTime: health.responseTime,
        lastChecked: new Date(),
        systemType: config.systemType,
        environment: config.environment,
        purpose: config.purpose,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      log.warn('Health check failed', {
        dsn: config.dsn,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });

      return {
        dsn: config.dsn,
        description: config.description,
        connected: false,
        responseTime,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
        systemType: config.systemType,
        environment: config.environment,
        purpose: config.purpose,
      };
    }
  }

  /**
   * Calculate summary statistics from health check results
   *
   * @private
   * @param {HealthCheckResult[]} results - Array of health check results
   * @returns {HealthCheckSummary} Summary statistics
   */
  private static calculateSummary(results: HealthCheckResult[]): HealthCheckSummary {
    const total = results.length;
    const healthy = results.filter((r) => r.connected).length;
    const unhealthy = total - healthy;
    const healthPercentage = total > 0 ? Math.round((healthy / total) * 100) : 0;

    return {
      total,
      healthy,
      unhealthy,
      healthPercentage,
    };
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Get cached health check result if still valid
   *
   * @private
   * @param {string} dsn - Data Source Name
   * @returns {CachedHealthResult | null} Cached result or null if expired/not found
   */
  private static getCachedResult(dsn: string): CachedHealthResult | null {
    const cached = healthCheckCache.get(dsn);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      healthCheckCache.delete(dsn);
      return null;
    }

    return cached;
  }

  /**
   * Cache a health check result
   *
   * @private
   * @param {string} dsn - Data Source Name
   * @param {HealthCheckResult} result - Health check result to cache
   */
  private static cacheResult(dsn: string, result: HealthCheckResult): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + HEALTH_CHECK_CACHE_TTL);

    healthCheckCache.set(dsn, {
      result,
      cachedAt: now,
      expiresAt,
    });
  }

  /**
   * Clear all cached health check results
   *
   * @description
   * Useful for forcing fresh health checks or during testing.
   */
  static clearCache(): void {
    healthCheckCache.clear();
    log.debug('Health check cache cleared');
  }

  /**
   * Get cache statistics
   *
   * @returns {{ size: number, entries: string[] }} Cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: healthCheckCache.size,
      entries: Array.from(healthCheckCache.keys()),
    };
  }
}
