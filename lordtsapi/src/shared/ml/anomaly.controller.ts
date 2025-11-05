// src/shared/ml/anomaly.controller.ts

/**
 * @fileoverview Anomaly Detection HTTP Controller
 *
 * Exposes HTTP endpoints for anomaly detection system.
 *
 * @module shared/ml/anomaly.controller
 */

import { Request, Response } from 'express';
import { anomalyMonitor } from '@infrastructure/ml/ConnectionAnomalyMonitor';
import { anomalyWorker } from '@infrastructure/ml/AnomalyMonitorWorker';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { ValidationError } from '@shared/errors/errors';
import { findConnectionByDSN } from '@config/connections.config';

/**
 * Anomaly Controller
 *
 * @class AnomalyController
 */
export class AnomalyController {
  /**
   * GET /ml/anomalies
   * List all recent anomalies (last 24 hours)
   */
  static getRecentAnomalies = asyncHandler(async (req: Request, res: Response) => {
    const duration = parseInt(req.query.duration as string, 10) || 24 * 60 * 60 * 1000; // 24h default

    const allHealth = anomalyMonitor.getAllConnectionsHealth();
    const allAnomalies = [];

    for (const [connectionId, health] of allHealth.entries()) {
      if (health.anomalies.length > 0) {
        allAnomalies.push({
          connectionId,
          anomalies: health.anomalies,
          healthScore: health.healthScore,
          status: health.status,
        });
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      totalConnections: allHealth.size,
      connectionsWithAnomalies: allAnomalies.length,
      data: allAnomalies,
      correlationId: req.id,
    });
  });

  /**
   * GET /ml/anomalies/:connectionId
   * Get anomalies for specific connection
   */
  static getConnectionAnomalies = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;
    const duration = parseInt(req.query.duration as string, 10) || 24 * 60 * 60 * 1000;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    const health = anomalyMonitor.getConnectionHealth(connectionId!);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      healthScore: health.healthScore,
      status: health.status,
      activeAnomalies: health.activeAnomalies,
      anomalies: health.anomalies,
      correlationId: req.id,
    });
  });

  /**
   * GET /ml/health-scores
   * Get health scores for all connections
   */
  static getHealthScores = asyncHandler(async (req: Request, res: Response) => {
    const allHealth = anomalyMonitor.getAllConnectionsHealth();

    const scores = Array.from(allHealth.entries()).map(([connectionId, health]) => {
      const config = findConnectionByDSN(connectionId!);
      return {
        connectionId,
        description: config?.description || 'Unknown',
        healthScore: health.healthScore,
        status: health.status,
        activeAnomalies: health.activeAnomalies,
      };
    });

    // Sort by health score (worst first)
    scores.sort((a, b) => a.healthScore - b.healthScore);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalConnections: scores.length,
      averageHealthScore: scores.reduce((sum, s) => sum + s.healthScore, 0) / scores.length || 0,
      data: scores,
      correlationId: req.id,
    });
  });

  /**
   * GET /ml/baseline/:connectionId
   * Get baseline (expected values) for connection
   */
  static getBaseline = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    // TODO: Implement baseline retrieval from storage
    // For now, return placeholder
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      baseline: {
        latency: { min: 0, max: 200, mean: 100, stdDev: 30 },
        throughput: { min: 0, max: 100, mean: 50, stdDev: 15 },
        errorRate: { min: 0, max: 0.05, mean: 0.01, stdDev: 0.01 },
        poolUtilization: { min: 0, max: 100, mean: 60, stdDev: 20 },
      },
      message: 'Baseline data (placeholder)',
      correlationId: req.id,
    });
  });

  /**
   * POST /ml/baseline/:connectionId/learn
   * Force baseline learning for connection
   */
  static learnBaseline = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;
    const duration = parseInt(req.body.duration as string, 10) || undefined;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    await anomalyMonitor.learnBaseline(connectionId!, duration);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      message: 'Baseline learning initiated',
      duration: duration || 24 * 60 * 60 * 1000,
      correlationId: req.id,
    });
  });

  /**
   * POST /ml/baseline/:connectionId/clear
   * Clear baseline data (force re-learning)
   */
  static clearBaseline = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    await anomalyMonitor.clearBaseline(connectionId!);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      message: 'Baseline data cleared',
      correlationId: req.id,
    });
  });

  /**
   * GET /ml/status
   * Get anomaly detection system status
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const workerStatus = anomalyWorker.getStatus();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: workerStatus,
      correlationId: req.id,
    });
  });
}
