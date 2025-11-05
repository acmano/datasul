// src/shared/health/routes.ts

/**
 * @fileoverview Routes for ODBC Connection Health Checks
 *
 * Defines all HTTP routes for comprehensive connection health checking.
 *
 * @module shared/health/routes
 */

import { Router } from 'express';
import { ConnectionHealthController } from './controller';
import { ConnectionMetricsController } from './metricsController';

const router = Router();

// ============================================================================
// CONNECTION HEALTH CHECK ROUTES
// ============================================================================

/**
 * @openapi
 * /health/connections:
 *   get:
 *     summary: List all available connections with health status
 *     description: |
 *       Returns health status for ALL configured ODBC connections (22+ connections).
 *       This is an expensive operation - results are cached for 10 seconds.
 *       Includes Datasul (production, test, homologation) and Informix (dev, atu, new, prd).
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: All connections healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 connections:
 *                   type: array
 *                   items:
 *                     type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     healthy:
 *                       type: number
 *                     unhealthy:
 *                       type: number
 *                     healthPercentage:
 *                       type: number
 *       503:
 *         description: Some connections unhealthy
 */
router.get('/', ConnectionHealthController.listAllConnections);

/**
 * @openapi
 * /health/connections/{dsn}:
 *   get:
 *     summary: Check health of a specific connection
 *     description: |
 *       Performs health check on a single connection by DSN.
 *       Results are cached for 10 seconds.
 *     tags:
 *       - Health Check
 *     parameters:
 *       - in: path
 *         name: dsn
 *         required: true
 *         schema:
 *           type: string
 *         description: Data Source Name (e.g., DtsPrdEmp, LgxDev)
 *         example: DtsPrdEmp
 *     responses:
 *       200:
 *         description: Connection healthy
 *       503:
 *         description: Connection unhealthy
 *       404:
 *         description: DSN not found
 */
router.get('/:dsn', ConnectionHealthController.checkSingleConnection);

/**
 * @openapi
 * /health/connections/environment/{env}:
 *   get:
 *     summary: Check health of all connections for an environment
 *     description: |
 *       Checks all connections for a specific environment (production, test, homologation, etc).
 *       Includes both Datasul and Informix connections if applicable.
 *     tags:
 *       - Health Check
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         schema:
 *           type: string
 *           enum: [production, test, homologation, development, atualização, new]
 *         description: Environment name
 *         example: production
 *     responses:
 *       200:
 *         description: Environment connections status
 *       503:
 *         description: Some connections unhealthy
 */
router.get('/environment/:env', ConnectionHealthController.checkByEnvironment);

/**
 * @openapi
 * /health/connections/system/{system}:
 *   get:
 *     summary: Check health of all connections for a system
 *     description: |
 *       Checks all connections for a specific system (datasul or informix).
 *       Includes all environments for that system.
 *     tags:
 *       - Health Check
 *     parameters:
 *       - in: path
 *         name: system
 *         required: true
 *         schema:
 *           type: string
 *           enum: [datasul, informix]
 *         description: System type
 *         example: datasul
 *     responses:
 *       200:
 *         description: System connections status
 *       503:
 *         description: Some connections unhealthy
 */
router.get('/system/:system', ConnectionHealthController.checkBySystem);

/**
 * @openapi
 * /health/connections/active:
 *   get:
 *     summary: Get active connections in the pool
 *     description: |
 *       Returns information about currently active connections in DatabaseManager's pool.
 *       Does NOT perform health checks, just returns current pool state.
 *       Useful for monitoring connection pool usage.
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Active connections info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalConnections:
 *                   type: number
 *                 activeConnections:
 *                   type: array
 *                   items:
 *                     type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/active', ConnectionHealthController.getActiveConnections);

/**
 * @openapi
 * /health/connections/cache/clear:
 *   post:
 *     summary: Clear health check cache
 *     description: |
 *       Clears the health check cache, forcing fresh checks on next request.
 *       Useful for testing or when you need immediate fresh data.
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/cache/clear', ConnectionHealthController.clearCache);

/**
 * @openapi
 * /health/connections/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: |
 *       Returns information about the health check cache (size, entries).
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get('/cache/stats', ConnectionHealthController.getCacheStats);

// ============================================================================
// CONNECTION METRICS ROUTES
// ============================================================================

/**
 * @openapi
 * /health/connections/metrics/by-system:
 *   get:
 *     summary: Get metrics grouped by system type
 *     description: |
 *       Returns aggregated metrics grouped by system (datasul, informix, sqlserver).
 *     tags:
 *       - Metrics
 *     responses:
 *       200:
 *         description: System-grouped metrics
 */
router.get('/metrics/by-system', ConnectionMetricsController.getMetricsBySystem);

/**
 * @openapi
 * /health/connections/metrics/slowest:
 *   get:
 *     summary: Get top N slowest connections
 *     description: |
 *       Returns the slowest connections ranked by P95 latency.
 *     tags:
 *       - Metrics
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of connections to return
 *     responses:
 *       200:
 *         description: Slowest connections
 */
router.get('/metrics/slowest', ConnectionMetricsController.getSlowestConnections);

/**
 * @openapi
 * /health/connections/metrics/{dsn}:
 *   get:
 *     summary: Get metrics for a specific connection
 *     description: |
 *       Returns detailed metrics for a single connection by DSN.
 *     tags:
 *       - Metrics
 *     parameters:
 *       - in: path
 *         name: dsn
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection DSN (e.g., DtsPrdEmp)
 *     responses:
 *       200:
 *         description: Connection metrics
 */
router.get('/metrics/:dsn', ConnectionMetricsController.getConnectionMetrics);

/**
 * @openapi
 * /health/connections/metrics:
 *   get:
 *     summary: Get advanced metrics for all connections
 *     description: |
 *       Returns comprehensive metrics for all 28 database connections.
 *       Includes latency percentiles (P50/P95/P99), throughput, error rates, and pool utilization.
 *       Metrics are calculated from a 5-minute rolling window.
 *     tags:
 *       - Metrics
 *     responses:
 *       200:
 *         description: Connection metrics
 */
router.get('/metrics', ConnectionMetricsController.getAllMetrics);

export default router;
