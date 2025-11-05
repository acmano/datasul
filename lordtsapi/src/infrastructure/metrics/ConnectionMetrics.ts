// src/infrastructure/metrics/ConnectionMetrics.ts

/**
 * @fileoverview Advanced Connection Metrics Tracking System
 *
 * Comprehensive metrics collection for all 28 database connections (22 ODBC + 6 SQL Server).
 * Tracks latency percentiles, throughput, error rates, and pool utilization using Prometheus.
 *
 * Features:
 * - Latency histograms with P50/P95/P99 percentiles
 * - Throughput calculation (queries/second)
 * - Error rate tracking per connection
 * - Pool utilization monitoring
 * - Query duration distribution
 * - Rolling window metrics (last 5 minutes)
 *
 * @module infrastructure/metrics/ConnectionMetrics
 */

import { Histogram, Counter, Gauge, Registry } from 'prom-client';
import { log } from '@shared/utils/logger';

/**
 * Connection metric snapshot
 *
 * @interface ConnectionMetric
 */
export interface ConnectionMetric {
  /** Connection identifier (DSN) */
  connectionId: string;
  /** P50 latency in milliseconds */
  latencyP50: number;
  /** P95 latency in milliseconds */
  latencyP95: number;
  /** P99 latency in milliseconds */
  latencyP99: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Queries per second */
  throughput: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Pool utilization percentage (0-100) */
  poolUtilization: number;
  /** Total queries executed */
  totalQueries: number;
  /** Failed queries count */
  failedQueries: number;
}

/**
 * Query record for throughput calculation
 *
 * @interface QueryRecord
 * @private
 */
interface QueryRecord {
  /** Timestamp when query was executed */
  timestamp: number;
  /** Query duration in milliseconds */
  duration: number;
  /** Query success status */
  success: boolean;
}

/**
 * Connection-specific metrics storage
 *
 * @interface ConnectionMetricsData
 * @private
 */
interface ConnectionMetricsData {
  /** Recent queries (last 5 minutes) */
  recentQueries: QueryRecord[];
  /** Total queries executed */
  totalQueries: number;
  /** Failed queries count */
  failedQueries: number;
  /** Pool active connections */
  poolActive: number;
  /** Pool idle connections */
  poolIdle: number;
}

/**
 * Advanced connection metrics collector
 *
 * @description
 * Collects and exposes comprehensive metrics for all database connections.
 * Uses Prometheus histograms for latency distribution and counters for throughput/errors.
 *
 * Metrics exported to Prometheus:
 * - lor0138_connection_query_duration_seconds (Histogram)
 * - lor0138_connection_queries_total (Counter)
 * - lor0138_connection_queries_success (Counter)
 * - lor0138_connection_queries_failed (Counter)
 * - lor0138_connection_pool_active (Gauge)
 * - lor0138_connection_pool_idle (Gauge)
 *
 * @example
 * ```typescript
 * // Record a successful query
 * connectionMetrics.recordQuery('DtsPrdEmp', 150, true);
 *
 * // Record a failed query
 * connectionMetrics.recordQuery('LgxDev', 50, false);
 *
 * // Get metrics for specific connection
 * const metrics = connectionMetrics.getConnectionMetrics('DtsPrdEmp');
 * console.log(`P95 latency: ${metrics.latencyP95}ms`);
 *
 * // Get all connection metrics
 * const allMetrics = connectionMetrics.getAllConnectionsMetrics();
 * ```
 *
 * @class
 */
export class ConnectionMetricsCollector {
  /** Prometheus registry for metrics */
  private registry: Registry;

  /** Latency histogram (query duration distribution) */
  private latencyHistogram: Histogram<string>;

  /** Total queries counter */
  private queriesTotal: Counter<string>;

  /** Successful queries counter */
  private queriesSuccess: Counter<string>;

  /** Failed queries counter */
  private queriesFailed: Counter<string>;

  /** Active connections gauge */
  private poolActiveConnections: Gauge<string>;

  /** Idle connections gauge */
  private poolIdleConnections: Gauge<string>;

  /** In-memory storage for metrics calculation */
  private metricsData: Map<string, ConnectionMetricsData>;

  /** Rolling window duration in milliseconds (5 minutes) */
  private readonly ROLLING_WINDOW_MS = 5 * 60 * 1000;

  /** Cleanup interval handle */
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new ConnectionMetricsCollector
   *
   * @param {Registry} registry - Prometheus registry to use
   */
  constructor(registry: Registry) {
    this.registry = registry;
    this.metricsData = new Map();

    // Initialize Prometheus metrics
    this.latencyHistogram = new Histogram({
      name: 'lor0138_connection_query_duration_seconds',
      help: 'Query duration histogram per connection',
      labelNames: ['connection_id'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.queriesTotal = new Counter({
      name: 'lor0138_connection_queries_total',
      help: 'Total queries executed per connection',
      labelNames: ['connection_id'],
      registers: [this.registry],
    });

    this.queriesSuccess = new Counter({
      name: 'lor0138_connection_queries_success',
      help: 'Successful queries per connection',
      labelNames: ['connection_id'],
      registers: [this.registry],
    });

    this.queriesFailed = new Counter({
      name: 'lor0138_connection_queries_failed',
      help: 'Failed queries per connection',
      labelNames: ['connection_id'],
      registers: [this.registry],
    });

    this.poolActiveConnections = new Gauge({
      name: 'lor0138_connection_pool_active',
      help: 'Active connections in pool',
      labelNames: ['connection_id'],
      registers: [this.registry],
    });

    this.poolIdleConnections = new Gauge({
      name: 'lor0138_connection_pool_idle',
      help: 'Idle connections in pool',
      labelNames: ['connection_id'],
      registers: [this.registry],
    });

    // Start cleanup interval (every minute)
    this.startCleanupInterval();

    log.info('ConnectionMetricsCollector initialized');
  }

  /**
   * Record a query execution
   *
   * @param {string} connectionId - Connection identifier (DSN)
   * @param {number} duration - Query duration in milliseconds
   * @param {boolean} success - Query success status
   *
   * @example
   * ```typescript
   * // Successful query
   * connectionMetrics.recordQuery('DtsPrdEmp', 145, true);
   *
   * // Failed query
   * connectionMetrics.recordQuery('PCF4_PRD', 50, false);
   * ```
   */
  recordQuery(connectionId: string, duration: number, success: boolean): void {
    // Get or create metrics data
    let data = this.metricsData.get(connectionId);
    if (!data) {
      data = {
        recentQueries: [],
        totalQueries: 0,
        failedQueries: 0,
        poolActive: 0,
        poolIdle: 0,
      };
      this.metricsData.set(connectionId, data);
    }

    // Record query in rolling window
    const now = Date.now();
    data.recentQueries.push({
      timestamp: now,
      duration,
      success,
    });

    // Update counters
    data.totalQueries++;
    if (!success) {
      data.failedQueries++;
    }

    // Update Prometheus metrics
    this.latencyHistogram.observe({ connection_id: connectionId }, duration / 1000); // Convert to seconds
    this.queriesTotal.inc({ connection_id: connectionId });
    if (success) {
      this.queriesSuccess.inc({ connection_id: connectionId });
    } else {
      this.queriesFailed.inc({ connection_id: connectionId });
    }

    // Cleanup old queries from rolling window
    this.cleanupOldQueries(connectionId);
  }

  /**
   * Update pool utilization metrics
   *
   * @param {string} connectionId - Connection identifier
   * @param {number} activeConnections - Number of active connections
   * @param {number} idleConnections - Number of idle connections
   *
   * @example
   * ```typescript
   * connectionMetrics.updatePoolMetrics('DtsPrdEmp', 5, 3);
   * ```
   */
  updatePoolMetrics(
    connectionId: string,
    activeConnections: number,
    idleConnections: number
  ): void {
    let data = this.metricsData.get(connectionId);
    if (!data) {
      data = {
        recentQueries: [],
        totalQueries: 0,
        failedQueries: 0,
        poolActive: 0,
        poolIdle: 0,
      };
      this.metricsData.set(connectionId, data);
    }

    data.poolActive = activeConnections;
    data.poolIdle = idleConnections;

    // Update Prometheus gauges
    this.poolActiveConnections.set({ connection_id: connectionId }, activeConnections);
    this.poolIdleConnections.set({ connection_id: connectionId }, idleConnections);
  }

  /**
   * Get metrics for a specific connection
   *
   * @param {string} connectionId - Connection identifier
   * @returns {ConnectionMetric} Connection metrics
   *
   * @example
   * ```typescript
   * const metrics = connectionMetrics.getConnectionMetrics('DtsPrdEmp');
   * console.log(`P95 latency: ${metrics.latencyP95}ms`);
   * console.log(`Throughput: ${metrics.throughput} queries/sec`);
   * console.log(`Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
   * ```
   */
  getConnectionMetrics(connectionId: string): ConnectionMetric {
    const data = this.metricsData.get(connectionId);

    if (!data || data.recentQueries.length === 0) {
      return {
        connectionId,
        latencyP50: 0,
        latencyP95: 0,
        latencyP99: 0,
        avgResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        poolUtilization: 0,
        totalQueries: data?.totalQueries ?? 0,
        failedQueries: data?.failedQueries ?? 0,
      };
    }

    // Cleanup old queries first
    this.cleanupOldQueries(connectionId);

    const recentQueries = data.recentQueries;
    const durations = recentQueries.map((q) => q.duration).sort((a, b) => a - b);
    const successCount = recentQueries.filter((q) => q.success).length;

    // Calculate percentiles
    const latencyP50 = this.calculatePercentile(durations, 50);
    const latencyP95 = this.calculatePercentile(durations, 95);
    const latencyP99 = this.calculatePercentile(durations, 99);

    // Calculate average response time
    const avgResponseTime =
      durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

    // Calculate throughput (queries per second)
    const timeWindow = Date.now() - recentQueries[0].timestamp;
    const throughput = timeWindow > 0 ? (recentQueries.length / timeWindow) * 1000 : 0;

    // Calculate error rate
    const errorRate = recentQueries.length > 0 ? 1 - successCount / recentQueries.length : 0;

    // Calculate pool utilization
    const totalPool = data.poolActive + data.poolIdle;
    const poolUtilization = totalPool > 0 ? (data.poolActive / totalPool) * 100 : 0;

    return {
      connectionId,
      latencyP50,
      latencyP95,
      latencyP99,
      avgResponseTime,
      throughput,
      errorRate,
      poolUtilization,
      totalQueries: data.totalQueries,
      failedQueries: data.failedQueries,
    };
  }

  /**
   * Get metrics for all connections
   *
   * @returns {Map<string, ConnectionMetric>} Map of connection ID to metrics
   *
   * @example
   * ```typescript
   * const allMetrics = connectionMetrics.getAllConnectionsMetrics();
   * allMetrics.forEach((metric, connectionId) => {
   *   console.log(`${connectionId}: P95=${metric.latencyP95}ms`);
   * });
   * ```
   */
  getAllConnectionsMetrics(): Map<string, ConnectionMetric> {
    const metrics = new Map<string, ConnectionMetric>();

    // Convert iterator to array to avoid downlevelIteration requirement
    const connectionIds = Array.from(this.metricsData.keys());
    for (const connectionId of connectionIds) {
      metrics.set(connectionId, this.getConnectionMetrics(connectionId));
    }

    return metrics;
  }

  /**
   * Reset all metrics (for testing only)
   *
   * @example
   * ```typescript
   * connectionMetrics.reset();
   * ```
   *
   * @critical NEVER use in production
   */
  reset(): void {
    this.metricsData.clear();
    this.registry.resetMetrics();
    log.warn('ConnectionMetricsCollector reset - ALL METRICS CLEARED');
  }

  /**
   * Stop the collector and cleanup resources
   *
   * @example
   * ```typescript
   * await connectionMetrics.stop();
   * ```
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    log.info('ConnectionMetricsCollector stopped');
  }

  /**
   * Calculate percentile from sorted array
   *
   * @param {number[]} sortedArray - Sorted array of numbers
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   * @private
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) {
      return 0;
    }

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedArray[lower];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Remove queries older than rolling window
   *
   * @param {string} connectionId - Connection identifier
   * @private
   */
  private cleanupOldQueries(connectionId: string): void {
    const data = this.metricsData.get(connectionId);
    if (!data) {
      return;
    }

    const now = Date.now();
    const cutoff = now - this.ROLLING_WINDOW_MS;

    // Remove queries older than rolling window
    data.recentQueries = data.recentQueries.filter((q) => q.timestamp > cutoff);
  }

  /**
   * Start periodic cleanup of old queries
   * @private
   */
  private startCleanupInterval(): void {
    // Cleanup every minute
    this.cleanupInterval = setInterval(() => {
      // Convert iterator to array to avoid downlevelIteration requirement
      const connectionIds = Array.from(this.metricsData.keys());
      for (const connectionId of connectionIds) {
        this.cleanupOldQueries(connectionId);
      }
    }, 60 * 1000);
  }
}

/**
 * Singleton instance of ConnectionMetricsCollector
 *
 * @description
 * Pre-initialized singleton for use throughout the application.
 * Uses the existing MetricsManager registry.
 *
 * @example
 * ```typescript
 * import { connectionMetrics } from '@infrastructure/metrics/ConnectionMetrics';
 *
 * // Record query
 * connectionMetrics.recordQuery('DtsPrdEmp', 150, true);
 *
 * // Get metrics
 * const metrics = connectionMetrics.getConnectionMetrics('DtsPrdEmp');
 * ```
 */
export const connectionMetrics = new ConnectionMetricsCollector(
  // Will be initialized with shared registry in MetricsManager
  new Registry()
);
