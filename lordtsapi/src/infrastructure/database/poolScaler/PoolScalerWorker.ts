// src/infrastructure/database/poolScaler/PoolScalerWorker.ts

/**
 * @fileoverview Pool Scaler Background Worker
 *
 * Runs periodic checks on all registered pool scalers and executes scaling decisions.
 * Operates as a background service independent of request handling.
 *
 * @module infrastructure/database/poolScaler/PoolScalerWorker
 */

import { log } from '@shared/utils/logger';
import { poolScalerManager } from './PoolScalerManager';
import { getPoolScalerCheckInterval } from '@config/poolScaler.config';
import { ScaleDecision } from './types';

/**
 * Pool Scaler Worker
 *
 * @description
 * Background worker that periodically checks all pool scalers
 * and executes scaling decisions automatically.
 *
 * **Features:**
 * - Periodic checking (configurable interval, default: 1 minute)
 * - Parallel execution across all scalers
 * - Error isolation (one scaler failure doesn't affect others)
 * - Detailed logging of all scaling events
 *
 * @class
 */
export class PoolScalerWorker {
  /** Worker interval handle */
  private interval: NodeJS.Timeout | null = null;

  /** Check interval in milliseconds */
  private readonly checkIntervalMs: number;

  /** Is worker running */
  private isRunning: boolean = false;

  /** Total checks performed */
  private checkCount: number = 0;

  /** Total scaling events executed */
  private scalingEventsCount: number = 0;

  /** Worker start time */
  private startTime: number = 0;

  /**
   * Create a new PoolScalerWorker
   *
   * @param {number} [checkIntervalMs] - Check interval in ms (default: from config)
   *
   * @example
   * ```typescript
   * const worker = new PoolScalerWorker();
   * worker.start();
   * ```
   */
  constructor(checkIntervalMs?: number) {
    this.checkIntervalMs = checkIntervalMs || getPoolScalerCheckInterval();

    log.info('PoolScalerWorker initialized', {
      checkIntervalMs: this.checkIntervalMs,
      checkIntervalSeconds: this.checkIntervalMs / 1000,
    });
  }

  /**
   * Start the background worker
   *
   * @example
   * ```typescript
   * worker.start();
   * console.log('Pool scaler worker started');
   * ```
   */
  start(): void {
    if (this.isRunning) {
      log.warn('PoolScalerWorker already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // Start interval
    this.interval = setInterval(() => {
      this.checkAllPools();
    }, this.checkIntervalMs);

    log.info('PoolScalerWorker started', {
      interval: `${this.checkIntervalMs}ms`,
      scalers: poolScalerManager.getScalerCount(),
    });
  }

  /**
   * Stop the background worker
   *
   * @example
   * ```typescript
   * worker.stop();
   * console.log('Pool scaler worker stopped');
   * ```
   */
  stop(): void {
    if (!this.isRunning) {
      log.warn('PoolScalerWorker not running');
      return;
    }

    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    const uptimeMs = Date.now() - this.startTime;
    const uptimeMinutes = Math.round(uptimeMs / 60000);

    log.info('PoolScalerWorker stopped', {
      uptimeMinutes,
      totalChecks: this.checkCount,
      totalScalingEvents: this.scalingEventsCount,
      avgChecksPerMinute: this.checkCount / Math.max(1, uptimeMinutes),
    });
  }

  /**
   * Check all pools once (manual trigger)
   *
   * @returns {Promise<Map<string, ScaleDecision>>} Map of connectionId to decisions
   *
   * @example
   * ```typescript
   * const decisions = await worker.checkAllPoolsOnce();
   * decisions.forEach((decision, connectionId) => {
   *   if (decision.action !== 'none') {
   *     console.log(`${connectionId}: ${decision.action}`);
   *   }
   * });
   * ```
   */
  async checkAllPoolsOnce(): Promise<Map<string, ScaleDecision>> {
    return await this.checkAllPools();
  }

  /**
   * Get worker statistics
   *
   * @returns {object} Worker stats
   *
   * @example
   * ```typescript
   * const stats = worker.getStats();
   * console.log(`Uptime: ${stats.uptimeMinutes} minutes`);
   * console.log(`Scaling events: ${stats.scalingEventsCount}`);
   * ```
   */
  getStats(): {
    isRunning: boolean;
    uptimeMs: number;
    uptimeMinutes: number;
    checkCount: number;
    scalingEventsCount: number;
    avgChecksPerMinute: number;
    managedConnections: number;
  } {
    const uptimeMs = this.isRunning ? Date.now() - this.startTime : 0;
    const uptimeMinutes = Math.round(uptimeMs / 60000);

    return {
      isRunning: this.isRunning,
      uptimeMs,
      uptimeMinutes,
      checkCount: this.checkCount,
      scalingEventsCount: this.scalingEventsCount,
      avgChecksPerMinute: this.checkCount / Math.max(1, uptimeMinutes),
      managedConnections: poolScalerManager.getScalerCount(),
    };
  }

  /**
   * Reset statistics
   *
   * @example
   * ```typescript
   * worker.resetStats();
   * ```
   */
  resetStats(): void {
    this.checkCount = 0;
    this.scalingEventsCount = 0;
    this.startTime = Date.now();

    log.info('PoolScalerWorker statistics reset');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check all pools and execute scaling decisions
   * @private
   */
  private async checkAllPools(): Promise<Map<string, ScaleDecision>> {
    this.checkCount++;

    const connectionIds = poolScalerManager.getAllConnectionIds();
    const decisions = new Map<string, ScaleDecision>();

    log.debug('PoolScalerWorker checking all pools', {
      checkNumber: this.checkCount,
      connections: connectionIds.length,
    });

    // Check all scalers in parallel
    const checkPromises = connectionIds.map(async (connectionId) => {
      try {
        const scaler = poolScalerManager.getScaler(connectionId);
        if (!scaler) {
          log.warn('Scaler not found', { connectionId });
          return;
        }

        const decision = await scaler.checkAndScale();
        decisions.set(connectionId, decision);

        // Log if action was taken
        if (decision.action !== 'none') {
          this.scalingEventsCount++;

          log.info('Pool scaling executed', {
            connectionId,
            action: decision.action,
            oldSize: decision.oldSize,
            newSize: decision.newSize,
            reason: decision.reason,
            utilization: decision.triggerMetrics?.utilization.toFixed(2),
            queueLength: decision.triggerMetrics?.queueLength,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        log.error('Pool scaler check error', {
          connectionId,
          error: errorMsg,
          checkNumber: this.checkCount,
        });

        // Create error decision
        decisions.set(connectionId, {
          action: 'none',
          oldSize: 0,
          newSize: 0,
          reason: `Check failed: ${errorMsg}`,
          timestamp: Date.now(),
        });
      }
    });

    await Promise.allSettled(checkPromises);

    // Log summary if any actions were taken
    const actionsCount = Array.from(decisions.values()).filter((d) => d.action !== 'none').length;
    if (actionsCount > 0) {
      log.info('Pool scaler check completed', {
        checkNumber: this.checkCount,
        connections: connectionIds.length,
        actionsTaken: actionsCount,
      });
    }

    return decisions;
  }
}

/**
 * Singleton instance of PoolScalerWorker
 *
 * @description
 * Pre-initialized singleton for use throughout the application.
 *
 * @example
 * ```typescript
 * import { poolScalerWorker } from '@infrastructure/database/poolScaler/PoolScalerWorker';
 *
 * // Start worker
 * poolScalerWorker.start();
 *
 * // Get stats
 * const stats = poolScalerWorker.getStats();
 * console.log(stats);
 *
 * // Stop worker
 * poolScalerWorker.stop();
 * ```
 */
export const poolScalerWorker = new PoolScalerWorker();
