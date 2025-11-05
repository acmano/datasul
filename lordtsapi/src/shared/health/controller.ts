// src/shared/health/controller.ts

/**
 * @fileoverview Health Check Controller for ODBC Connections
 *
 * HTTP controller for comprehensive health check endpoints.
 * Provides endpoints to check individual connections, groups of connections,
 * and the overall connection pool status.
 *
 * @module shared/health/controller
 */

import { Request, Response } from 'express';
import { ConnectionHealthService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';

// ============================================================================
// CONTROLLER CLASS
// ============================================================================

/**
 * Health Check Controller for ODBC Connections
 *
 * @class ConnectionHealthController
 * @static
 *
 * @example
 * ```typescript
 * // In routes
 * router.get('/connections', ConnectionHealthController.listAllConnections);
 * router.get('/connections/:dsn', ConnectionHealthController.checkSingleConnection);
 * ```
 */
export class ConnectionHealthController {
  // ==========================================================================
  // LIST ALL AVAILABLE CONNECTIONS
  // ==========================================================================

  /**
   * GET /health/connections
   *
   * List all available DSNs with their current health status
   *
   * @description
   * Returns health status for ALL configured connections (22+ connections).
   * This is an expensive operation - results are cached for 10s.
   *
   * @route GET /health/connections
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * GET /health/connections
   *
   * Response 200:
   * {
   *   "success": true,
   *   "timestamp": "2025-10-24T...",
   *   "connections": [
   *     {
   *       "dsn": "DtsPrdEmp",
   *       "description": "Datasul Production - Empresa",
   *       "connected": true,
   *       "responseTime": 45,
   *       "lastChecked": "2025-10-24T...",
   *       "systemType": "datasul",
   *       "environment": "production",
   *       "purpose": "emp"
   *     },
   *     ...
   *   ],
   *   "summary": {
   *     "total": 22,
   *     "healthy": 20,
   *     "unhealthy": 2,
   *     "healthPercentage": 91
   *   },
   *   "correlationId": "req-123"
   * }
   * ```
   */
  static listAllConnections = asyncHandler(async (req: Request, res: Response) => {
    const correlationId = req.id || 'unknown';

    log.info('Health check: listing all connections', { correlationId });

    const result = await ConnectionHealthService.checkAllConnections(correlationId);

    const statusCode = result.success ? 200 : 503;

    res.status(statusCode).json(result);
  });

  // ==========================================================================
  // CHECK SINGLE CONNECTION
  // ==========================================================================

  /**
   * GET /health/connections/:dsn
   *
   * Check health of a specific connection by DSN
   *
   * @description
   * Performs health check on a single connection and returns detailed status.
   * Results are cached for 10s.
   *
   * @route GET /health/connections/:dsn
   * @param {Request} req - Express request (params.dsn required)
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * GET /health/connections/DtsPrdEmp
   *
   * Response 200 (healthy):
   * {
   *   "dsn": "DtsPrdEmp",
   *   "description": "Datasul Production - Empresa",
   *   "connected": true,
   *   "responseTime": 45,
   *   "lastChecked": "2025-10-24T...",
   *   "systemType": "datasul",
   *   "environment": "production",
   *   "purpose": "emp"
   * }
   *
   * Response 503 (unhealthy):
   * {
   *   "dsn": "DtsPrdEmp",
   *   "description": "Datasul Production - Empresa",
   *   "connected": false,
   *   "responseTime": 5000,
   *   "lastError": "Connection timeout",
   *   "lastChecked": "2025-10-24T...",
   *   "systemType": "datasul",
   *   "environment": "production",
   *   "purpose": "emp"
   * }
   * ```
   */
  static checkSingleConnection = asyncHandler(async (req: Request, res: Response) => {
    const { dsn } = req.params;
    const correlationId = req.id || 'unknown';

    log.info('Health check: single connection', { dsn, correlationId });

    const result = await ConnectionHealthService.checkConnection(dsn!, correlationId);

    const statusCode = result.connected ? 200 : 503;

    res.status(statusCode).json(result);
  });

  // ==========================================================================
  // CHECK BY ENVIRONMENT
  // ==========================================================================

  /**
   * GET /health/connections/environment/:env
   *
   * Check health of all connections for a specific environment
   *
   * @description
   * Checks all connections for a given environment (production, test, homologation, etc).
   * Includes both Datasul and Informix connections if applicable.
   *
   * @route GET /health/connections/environment/:env
   * @param {Request} req - Express request (params.env required)
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * GET /health/connections/environment/production
   *
   * Response 200:
   * {
   *   "success": true,
   *   "timestamp": "2025-10-24T...",
   *   "connections": [
   *     {
   *       "dsn": "DtsPrdEmp",
   *       "description": "Datasul Production - Empresa",
   *       "connected": true,
   *       "responseTime": 45,
   *       ...
   *     },
   *     {
   *       "dsn": "DtsPrdMult",
   *       "description": "Datasul Production - Múltiplas Empresas",
   *       "connected": true,
   *       "responseTime": 52,
   *       ...
   *     },
   *     ...
   *   ],
   *   "summary": {
   *     "total": 7,
   *     "healthy": 7,
   *     "unhealthy": 0,
   *     "healthPercentage": 100
   *   }
   * }
   * ```
   */
  static checkByEnvironment = asyncHandler(async (req: Request, res: Response) => {
    const { env } = req.params;
    const correlationId = req.id || 'unknown';

    log.info('Health check: by environment', { environment: env, correlationId });

    const result = await ConnectionHealthService.checkConnectionsByEnvironment(env!, correlationId);

    const statusCode = result.success ? 200 : 503;

    res.status(statusCode).json(result);
  });

  // ==========================================================================
  // CHECK BY SYSTEM
  // ==========================================================================

  /**
   * GET /health/connections/system/:system
   *
   * Check health of all connections for a specific system
   *
   * @description
   * Checks all connections for a given system (datasul or informix).
   *
   * @route GET /health/connections/system/:system
   * @param {Request} req - Express request (params.system required)
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * GET /health/connections/system/datasul
   *
   * Response 200:
   * {
   *   "success": true,
   *   "timestamp": "2025-10-24T...",
   *   "connections": [
   *     // All Datasul connections (production + test + homologation)
   *   ],
   *   "summary": {
   *     "total": 18,
   *     "healthy": 18,
   *     "unhealthy": 0,
   *     "healthPercentage": 100
   *   }
   * }
   * ```
   */
  static checkBySystem = asyncHandler(async (req: Request, res: Response) => {
    const { system } = req.params;
    const correlationId = req.id || 'unknown';

    log.info('Health check: by system', { system, correlationId });

    const result = await ConnectionHealthService.checkConnectionsBySystem(system!, correlationId);

    const statusCode = result.success ? 200 : 503;

    res.status(statusCode).json(result);
  });

  // ==========================================================================
  // ACTIVE CONNECTIONS INFO
  // ==========================================================================

  /**
   * GET /health/connections/active
   *
   * Get information about currently active connections in the pool
   *
   * @description
   * Returns details about all currently active connections.
   * Does NOT perform health checks, just returns current pool state.
   * Useful for monitoring connection pool usage.
   *
   * @route GET /health/connections/active
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * GET /health/connections/active
   *
   * Response 200:
   * {
   *   "totalConnections": 3,
   *   "activeConnections": [
   *     {
   *       "dsn": "DtsPrdEmp",
   *       "description": "Datasul Production - Empresa",
   *       "lastUsed": "2025-10-24T...",
   *       "activeQueries": 0,
   *       "systemType": "datasul",
   *       "environment": "production"
   *     },
   *     ...
   *   ],
   *   "timestamp": "2025-10-24T..."
   * }
   * ```
   */
  static getActiveConnections = asyncHandler(async (req: Request, res: Response) => {
    const correlationId = req.id || 'unknown';

    log.info('Health check: active connections', { correlationId });

    const status = ConnectionHealthService.getActiveConnectionsInfo();

    res.status(200).json(status);
  });

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * POST /health/connections/cache/clear
   *
   * Clear health check cache
   *
   * @description
   * Clears the health check cache, forcing fresh checks on next request.
   * Useful for testing or when you need immediate fresh data.
   *
   * @route POST /health/connections/cache/clear
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * POST /health/connections/cache/clear
   *
   * Response 200:
   * {
   *   "success": true,
   *   "message": "Health check cache cleared",
   *   "timestamp": "2025-10-24T..."
   * }
   * ```
   */
  static clearCache = asyncHandler(async (req: Request, res: Response) => {
    const correlationId = req.id || 'unknown';

    log.info('Clearing health check cache', { correlationId });

    ConnectionHealthService.clearCache();

    res.status(200).json({
      success: true,
      message: 'Health check cache cleared',
      timestamp: new Date().toISOString(),
      correlationId,
    });
  });

  /**
   * GET /health/connections/cache/stats
   *
   * Get cache statistics
   *
   * @description
   * Returns information about the health check cache (size, entries).
   *
   * @route GET /health/connections/cache/stats
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   *
   * @example
   * ```bash
   * GET /health/connections/cache/stats
   *
   * Response 200:
   * {
   *   "size": 5,
   *   "entries": ["DtsPrdEmp", "DtsPrdMult", "DtsTstEmp", "LgxDev", "LgxPrd"],
   *   "timestamp": "2025-10-24T..."
   * }
   * ```
   */
  static getCacheStats = asyncHandler(async (req: Request, res: Response) => {
    const correlationId = req.id || 'unknown';

    log.debug('Getting cache stats', { correlationId });

    const stats = ConnectionHealthService.getCacheStats();

    res.status(200).json({
      ...stats,
      timestamp: new Date().toISOString(),
      correlationId,
    });
  });
}
