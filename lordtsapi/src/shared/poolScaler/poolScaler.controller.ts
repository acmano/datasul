// src/shared/poolScaler/poolScaler.controller.ts

/**
 * Pool Auto-scaling HTTP API Controller
 *
 * @description
 * REST API for managing connection pool auto-scaling.
 * Allows viewing pool status, triggering manual scaling, and configuring auto-scaling behavior.
 *
 * @module PoolScalerController
 * @since 2.0.0
 */

import { Request, Response } from 'express';
import { poolScalerManager } from '@infrastructure/database/poolScaler/PoolScalerManager';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';
import { ValidationError } from '@shared/errors/errors';
import { findConnectionByDSN } from '@config/connections.config';

/**
 * Pool Scaler Controller
 *
 * @class PoolScalerController
 */
export class PoolScalerController {
  /**
   * GET /pool-scaler/status
   * Get overall pool scaling status for all connections
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const statusMap = poolScalerManager.getAllStatus();
    const status = Array.from(statusMap.entries()).map(([connectionId, st]) => ({
      connectionId,
      ...st,
    }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalConnections: status.length,
      activeScalers: status.filter((s) => s.enabled).length,
      data: status,
      correlationId: req.id,
    });
  });

  /**
   * GET /pool-scaler/status/:connectionId
   * Get pool scaling status for specific connection
   */
  static getConnectionStatus = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    const scaler = poolScalerManager.getScaler(connectionId!);
    if (!scaler) {
      throw new ValidationError(`No scaler configured for connection ${connectionId}`);
    }

    const status = scaler.getStatus();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      status,
      correlationId: req.id,
    });
  });

  /**
   * POST /pool-scaler/start/:connectionId
   * Start auto-scaling for specific connection
   */
  static startScaling = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    const scaler = poolScalerManager.getScaler(connectionId!);
    if (!scaler) {
      throw new ValidationError(`No scaler configured for connection ${connectionId}`);
    }

    await scaler.start();

    log.info('Pool auto-scaling started', {
      correlationId: req.id,
      connectionId,
    });

    res.json({
      success: true,
      message: `Auto-scaling started for ${connectionId}`,
      connectionId,
      correlationId: req.id,
    });
  });

  /**
   * POST /pool-scaler/stop/:connectionId
   * Stop auto-scaling for specific connection
   */
  static stopScaling = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    const scaler = poolScalerManager.getScaler(connectionId!);
    if (!scaler) {
      throw new ValidationError(`No scaler configured for connection ${connectionId}`);
    }

    await scaler.stop();

    log.info('Pool auto-scaling stopped', {
      correlationId: req.id,
      connectionId,
    });

    res.json({
      success: true,
      message: `Auto-scaling stopped for ${connectionId}`,
      connectionId,
      correlationId: req.id,
    });
  });

  /**
   * GET /pool-scaler/history/:connectionId
   * Get scaling history for connection
   */
  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    const scaler = poolScalerManager.getScaler(connectionId!);
    if (!scaler) {
      throw new ValidationError(`No scaler configured for connection ${connectionId}`);
    }

    // TODO: Implement getScalingHistory in PoolScaler
    const history: any[] = [];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      history,
      count: history.length,
      message: 'Scaling history feature coming soon',
      correlationId: req.id,
    });
  });

  /**
   * GET /pool-scaler/metrics/:connectionId
   * Get current metrics driving scaling decisions
   */
  static getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;

    // Validate connection exists
    const connectionConfig = findConnectionByDSN(connectionId!);
    if (!connectionConfig) {
      throw new ValidationError(`Connection ${connectionId} not found`);
    }

    const scaler = poolScalerManager.getScaler(connectionId!);
    if (!scaler) {
      throw new ValidationError(`No scaler configured for ${connectionId}`);
    }

    const metrics = scaler.getMetrics();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionId,
      description: connectionConfig.description,
      metrics,
      correlationId: req.id,
    });
  });
}
