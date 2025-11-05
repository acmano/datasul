// src/shared/health/metricsController.ts

/**
 * @fileoverview Advanced Connection Metrics HTTP Controller
 *
 * Exposes comprehensive connection metrics via HTTP endpoints.
 * Provides latency percentiles, throughput, error rates, and pool utilization.
 *
 * @module shared/health/metricsController
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { connectionMetrics } from '@infrastructure/metrics/ConnectionMetrics';
import { AVAILABLE_CONNECTIONS } from '@config/connections.config';

/**
 * Connection Metrics Controller
 *
 * @description
 * Provides HTTP endpoints for retrieving advanced connection metrics.
 * All metrics are calculated from a 5-minute rolling window.
 *
 * @class
 */
export class ConnectionMetricsController {
  /**
   * Get advanced metrics for all connections
   *
   * @route GET /health/connections/metrics
   * @returns {Object} Comprehensive metrics for all connections
   *
   * @example Response
   * ```json
   * {
   *   "success": true,
   *   "timestamp": "2025-10-25T15:30:00.000Z",
   *   "connections": [
   *     {
   *       "id": "DtsPrdEmp",
   *       "description": "Datasul Production - Empresa",
   *       "latency": {
   *         "p50": 145,
   *         "p95": 380,
   *         "p99": 520,
   *         "avg": 180
   *       },
   *       "throughput": {
   *         "queriesPerSecond": 15.3,
   *         "total": 1523
   *       },
   *       "reliability": {
   *         "successRate": "99.87",
   *         "errorRate": 0.0013,
   *         "failedQueries": 2
   *       },
   *       "pool": {
   *         "utilization": 45.2
   *       }
   *     }
   *   ],
   *   "summary": {
   *     "totalConnections": 28,
   *     "activeConnections": 12,
   *     "avgLatencyP95": 425,
   *     "totalThroughput": 145.7,
   *     "avgErrorRate": 0.002
   *   }
   * }
   * ```
   */
  static getAllMetrics = asyncHandler(async (req: Request, res: Response) => {
    const allMetrics = connectionMetrics.getAllConnectionsMetrics();

    // Format response
    const connections = Array.from(allMetrics.entries()).map(([id, metric]) => {
      // Find connection config for description
      let description = id;
      const config = findConnectionConfig(id);
      if (config) {
        description = config.description;
      }

      return {
        id,
        description,
        latency: {
          p50: Math.round(metric.latencyP50),
          p95: Math.round(metric.latencyP95),
          p99: Math.round(metric.latencyP99),
          avg: Math.round(metric.avgResponseTime),
        },
        throughput: {
          queriesPerSecond: parseFloat(metric.throughput.toFixed(2)),
          total: metric.totalQueries,
        },
        reliability: {
          successRate: ((1 - metric.errorRate) * 100).toFixed(2),
          errorRate: parseFloat(metric.errorRate.toFixed(4)),
          failedQueries: metric.failedQueries,
        },
        pool: {
          utilization: parseFloat(metric.poolUtilization.toFixed(2)),
        },
      };
    });

    // Calculate summary statistics
    const summary = calculateSummary(Array.from(allMetrics.values()));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connections,
      summary,
    });
  });

  /**
   * Get metrics for a specific connection
   *
   * @route GET /health/connections/metrics/:dsn
   * @param {string} dsn - Connection DSN (e.g., DtsPrdEmp)
   * @returns {Object} Metrics for specific connection
   *
   * @example Response
   * ```json
   * {
   *   "success": true,
   *   "connection": {
   *     "id": "DtsPrdEmp",
   *     "description": "Datasul Production - Empresa",
   *     "latency": { "p50": 145, "p95": 380, "p99": 520, "avg": 180 },
   *     "throughput": { "queriesPerSecond": 15.3, "total": 1523 },
   *     "reliability": { "successRate": "99.87", "errorRate": 0.0013 },
   *     "pool": { "utilization": 45.2 }
   *   }
   * }
   * ```
   */
  static getConnectionMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { dsn } = req.params;

    const metric = connectionMetrics.getConnectionMetrics(dsn!);

    // Find connection config for description
    let description = dsn!;
    const config = findConnectionConfig(dsn!);
    if (config) {
      description = config.description;
    }

    res.json({
      success: true,
      connection: {
        id: dsn,
        description,
        latency: {
          p50: Math.round(metric.latencyP50),
          p95: Math.round(metric.latencyP95),
          p99: Math.round(metric.latencyP99),
          avg: Math.round(metric.avgResponseTime),
        },
        throughput: {
          queriesPerSecond: parseFloat(metric.throughput.toFixed(2)),
          total: metric.totalQueries,
        },
        reliability: {
          successRate: ((1 - metric.errorRate) * 100).toFixed(2),
          errorRate: parseFloat(metric.errorRate.toFixed(4)),
          failedQueries: metric.failedQueries,
        },
        pool: {
          utilization: parseFloat(metric.poolUtilization.toFixed(2)),
        },
      },
    });
  });

  /**
   * Get metrics grouped by system (datasul, informix, sqlserver)
   *
   * @route GET /health/connections/metrics/by-system
   * @returns {Object} Metrics grouped by system type
   *
   * @example Response
   * ```json
   * {
   *   "success": true,
   *   "systems": {
   *     "datasul": {
   *       "connections": 18,
   *       "avgLatencyP95": 350,
   *       "totalThroughput": 85.4,
   *       "avgErrorRate": 0.001
   *     },
   *     "informix": {
   *       "connections": 4,
   *       "avgLatencyP95": 280,
   *       "totalThroughput": 45.2,
   *       "avgErrorRate": 0.003
   *     },
   *     "sqlserver": {
   *       "connections": 6,
   *       "avgLatencyP95": 420,
   *       "totalThroughput": 15.1,
   *       "avgErrorRate": 0.002
   *     }
   *   }
   * }
   * ```
   */
  static getMetricsBySystem = asyncHandler(async (req: Request, res: Response) => {
    const allMetrics = connectionMetrics.getAllConnectionsMetrics();

    // Group metrics by system type
    const systems: Record<string, any> = {
      datasul: { connections: [], avgLatencyP95: 0, totalThroughput: 0, avgErrorRate: 0 },
      informix: { connections: [], avgLatencyP95: 0, totalThroughput: 0, avgErrorRate: 0 },
      sqlserver: { connections: [], avgLatencyP95: 0, totalThroughput: 0, avgErrorRate: 0 },
    };

    allMetrics.forEach((metric, id) => {
      const config = findConnectionConfig(id);
      if (!config) return;

      const systemType = config.systemType;
      if (!systems[systemType]) return;

      systems[systemType].connections.push(metric);
    });

    // Calculate aggregated metrics per system
    Object.keys(systems).forEach((systemType) => {
      const metrics = systems[systemType].connections;
      if (metrics.length === 0) {
        systems[systemType] = {
          connections: 0,
          avgLatencyP95: 0,
          totalThroughput: 0,
          avgErrorRate: 0,
        };
        return;
      }

      const summary = calculateSummary(metrics);
      systems[systemType] = {
        connections: metrics.length,
        avgLatencyP95: summary.avgLatencyP95,
        totalThroughput: summary.totalThroughput,
        avgErrorRate: summary.avgErrorRate,
      };
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      systems,
    });
  });

  /**
   * Get top N slowest connections by P95 latency
   *
   * @route GET /health/connections/metrics/slowest?limit=10
   * @query {number} limit - Number of connections to return (default: 10)
   * @returns {Object} Top N slowest connections
   *
   * @example Response
   * ```json
   * {
   *   "success": true,
   *   "slowest": [
   *     {
   *       "id": "PCF4_PRD",
   *       "description": "PCFactory Production",
   *       "latencyP95": 850,
   *       "avgResponseTime": 520
   *     }
   *   ]
   * }
   * ```
   */
  static getSlowestConnections = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const allMetrics = connectionMetrics.getAllConnectionsMetrics();

    // Convert to array and sort by P95 latency
    const sorted = Array.from(allMetrics.entries())
      .map(([id, metric]) => {
        const config = findConnectionConfig(id);
        return {
          id,
          description: config?.description || id,
          latencyP95: Math.round(metric.latencyP95),
          avgResponseTime: Math.round(metric.avgResponseTime),
          totalQueries: metric.totalQueries,
        };
      })
      .filter((m) => m.totalQueries > 0) // Only connections with queries
      .sort((a, b) => b.latencyP95 - a.latencyP95)
      .slice(0, limit);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      slowest: sorted,
    });
  });
}

/**
 * Find connection configuration by DSN
 *
 * @param {string} dsn - Connection DSN
 * @returns {any} Connection config or null
 * @private
 */
function findConnectionConfig(dsn: string): any {
  // Search Datasul connections
  for (const env of Object.values(AVAILABLE_CONNECTIONS.datasul)) {
    for (const config of Object.values(env)) {
      if (config.dsn === dsn) return config;
    }
  }

  // Search Informix connections
  for (const env of Object.values(AVAILABLE_CONNECTIONS.informix)) {
    if (env.logix.dsn === dsn) return env.logix;
  }

  // Search SQL Server connections (PCFactory)
  for (const env of Object.values(AVAILABLE_CONNECTIONS.sqlserver.pcfactory)) {
    for (const config of Object.values(env)) {
      if (config.dsn === dsn) return config;
    }
  }

  // Search SQL Server connections (Corporativo)
  for (const env of Object.values(AVAILABLE_CONNECTIONS.sqlserver.corporativo)) {
    if (env.datacorp.dsn === dsn) return env.datacorp;
  }

  return null;
}

/**
 * Calculate summary statistics from metrics array
 *
 * @param {any[]} metrics - Array of connection metrics
 * @returns {Object} Summary statistics
 * @private
 */
function calculateSummary(metrics: any[]): any {
  if (metrics.length === 0) {
    return {
      totalConnections: 0,
      activeConnections: 0,
      avgLatencyP95: 0,
      totalThroughput: 0,
      avgErrorRate: 0,
    };
  }

  const activeConnections = metrics.filter((m) => m.totalQueries > 0).length;
  const avgLatencyP95 = metrics.reduce((sum, m) => sum + m.latencyP95, 0) / metrics.length;
  const totalThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0);
  const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

  return {
    totalConnections: metrics.length,
    activeConnections,
    avgLatencyP95: Math.round(avgLatencyP95),
    totalThroughput: parseFloat(totalThroughput.toFixed(2)),
    avgErrorRate: parseFloat(avgErrorRate.toFixed(4)),
  };
}
