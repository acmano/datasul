// src/infrastructure/database/poolScaler/PoolScaler.ts

/**
 * @fileoverview Pool Auto-Scaler Core Implementation
 *
 * Monitors pool metrics and automatically adjusts pool size based on usage patterns.
 * Implements intelligent scaling with cooldown periods and sustained threshold checks.
 *
 * @module infrastructure/database/poolScaler/PoolScaler
 */

import { log } from '@shared/utils/logger';
import {
  PoolScalerConfig,
  PoolMetrics,
  ScaleDecision,
  ScaleEvent,
  ScaleAction,
  MetricHistory,
  ScalingCondition,
  PoolScalerStatus,
} from './types';
import { IConnection } from '../types';

/**
 * Pool Auto-Scaler
 *
 * @description
 * Monitors connection pool metrics and automatically scales pool size
 * to optimize resource utilization and response times.
 *
 * **Scaling Algorithm:**
 * - Scale UP: High utilization (>85%) sustained for 5 minutes
 * - Scale DOWN: Low utilization (<30%) sustained for 15 minutes
 * - Cooldown: 5 minutes between scaling actions to prevent thrashing
 *
 * @class
 */
export class PoolScaler {
  /** Configuration */
  private config: PoolScalerConfig;

  /** Associated connection instance */
  private connection: IConnection;

  /** Metrics history (for trend analysis) */
  private metricsHistory: MetricHistory[] = [];

  /** Scaling events history */
  private scalingHistory: ScaleEvent[] = [];

  /** Last scaling timestamp */
  private lastScalingTime: number = 0;

  /** Is currently monitoring */
  private isMonitoring: boolean = false;

  /** Monitoring interval handle */
  private monitorInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new PoolScaler instance
   *
   * @param {PoolScalerConfig} config - Scaler configuration
   * @param {IConnection} connection - Connection instance to monitor
   *
   * @example
   * ```typescript
   * const scaler = new PoolScaler(config, connection);
   * await scaler.start();
   * ```
   */
  constructor(config: PoolScalerConfig, connection: IConnection) {
    this.config = config;
    this.connection = connection;

    log.info('PoolScaler created', {
      connectionId: config.connectionId,
      minPoolSize: config.minPoolSize,
      maxPoolSize: config.maxPoolSize,
      enabled: config.enabled,
    });
  }

  /**
   * Start monitoring and auto-scaling
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await scaler.start();
   * console.log('Auto-scaling started');
   * ```
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      log.warn('PoolScaler disabled', { connectionId: this.config.connectionId });
      return;
    }

    if (this.isMonitoring) {
      log.warn('PoolScaler already monitoring', { connectionId: this.config.connectionId });
      return;
    }

    this.isMonitoring = true;
    log.info('PoolScaler monitoring started', { connectionId: this.config.connectionId });
  }

  /**
   * Stop monitoring and auto-scaling
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await scaler.stop();
   * console.log('Auto-scaling stopped');
   * ```
   */
  async stop(): Promise<void> {
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    log.info('PoolScaler monitoring stopped', { connectionId: this.config.connectionId });
  }

  /**
   * Check current metrics and scale if necessary
   *
   * @returns {Promise<ScaleDecision>} Scaling decision
   *
   * @example
   * ```typescript
   * const decision = await scaler.checkAndScale();
   * if (decision.action !== 'none') {
   *   console.log(`Scaled ${decision.action}: ${decision.oldSize} → ${decision.newSize}`);
   * }
   * ```
   */
  async checkAndScale(): Promise<ScaleDecision> {
    if (!this.config.enabled) {
      return this.createDecision('none', 'Auto-scaling disabled');
    }

    // Get current metrics
    const metrics = this.getPoolMetrics();

    // Store in history
    this.addMetricsToHistory(metrics);

    // Check cooldown period
    if (this.isInCooldownPeriod()) {
      const remaining = this.getCooldownRemaining();
      return this.createDecision(
        'none',
        `In cooldown period (${Math.round(remaining / 1000)}s remaining)`,
        metrics
      );
    }

    // Evaluate scaling conditions
    const scaleUpConditions = this.evaluateScaleUpConditions();
    const scaleDownConditions = this.evaluateScaleDownConditions();

    // Determine action
    if (scaleUpConditions.shouldScale) {
      return await this.scaleUp(metrics, scaleUpConditions.reason);
    } else if (scaleDownConditions.shouldScale) {
      return await this.scaleDown(metrics, scaleDownConditions.reason);
    }

    return this.createDecision('none', 'No scaling needed', metrics);
  }

  /**
   * Force scale up (manual trigger)
   *
   * @returns {Promise<ScaleDecision>}
   *
   * @example
   * ```typescript
   * const decision = await scaler.forceScaleUp();
   * ```
   */
  async forceScaleUp(): Promise<ScaleDecision> {
    const metrics = this.getPoolMetrics();
    return await this.scaleUp(metrics, 'Manual scale up triggered');
  }

  /**
   * Force scale down (manual trigger)
   *
   * @returns {Promise<ScaleDecision>}
   *
   * @example
   * ```typescript
   * const decision = await scaler.forceScaleDown();
   * ```
   */
  async forceScaleDown(): Promise<ScaleDecision> {
    const metrics = this.getPoolMetrics();
    return await this.scaleDown(metrics, 'Manual scale down triggered');
  }

  /**
   * Get current pool metrics
   *
   * @returns {PoolMetrics} Current metrics snapshot
   *
   * @example
   * ```typescript
   * const metrics = scaler.getMetrics();
   * console.log(`Utilization: ${metrics.utilization * 100}%`);
   * ```
   */
  getMetrics(): PoolMetrics {
    return this.getPoolMetrics();
  }

  /**
   * Get scaling history
   *
   * @param {number} limit - Maximum number of events to return (default: 10)
   * @returns {ScaleEvent[]} Recent scaling events
   *
   * @example
   * ```typescript
   * const history = scaler.getHistory(5);
   * history.forEach(event => {
   *   console.log(`${event.timestamp}: ${event.action} - ${event.reason}`);
   * });
   * ```
   */
  getHistory(limit: number = 10): ScaleEvent[] {
    return this.scalingHistory.slice(-limit);
  }

  /**
   * Get current status
   *
   * @returns {PoolScalerStatus} Complete status information
   *
   * @example
   * ```typescript
   * const status = scaler.getStatus();
   * console.log(status);
   * ```
   */
  getStatus(): PoolScalerStatus {
    const currentMetrics = this.getPoolMetrics();
    const lastScaling = this.scalingHistory[this.scalingHistory.length - 1];
    const inCooldown = this.isInCooldownPeriod();

    return {
      connectionId: this.config.connectionId,
      enabled: this.config.enabled,
      currentPoolSize: currentMetrics.currentSize,
      poolLimits: {
        min: this.config.minPoolSize,
        max: this.config.maxPoolSize,
      },
      currentMetrics,
      lastScaling,
      timeSinceLastScaling: lastScaling ? Date.now() - lastScaling.timestamp : undefined,
      inCooldown,
      cooldownRemaining: inCooldown ? this.getCooldownRemaining() : undefined,
      recentHistory: this.getHistory(10),
    };
  }

  // ============================================================================
  // PRIVATE METHODS - Pool Metrics
  // ============================================================================

  /**
   * Get pool metrics from connection
   * @private
   */
  private getPoolMetrics(): PoolMetrics {
    // Check if connection has getPoolMetrics method
    if (
      'getPoolMetrics' in this.connection &&
      typeof this.connection.getPoolMetrics === 'function'
    ) {
      return (this.connection as any).getPoolMetrics();
    }

    // Fallback: return empty metrics
    log.warn('Connection does not implement getPoolMetrics, returning empty metrics', {
      connectionId: this.config.connectionId,
    });

    return {
      currentSize: this.config.minPoolSize,
      activeConnections: 0,
      idleConnections: this.config.minPoolSize,
      queueLength: 0,
      avgWaitTime: 0,
      utilization: 0,
      idleRatio: 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Add metrics to history
   * @private
   */
  private addMetricsToHistory(metrics: PoolMetrics): void {
    this.metricsHistory.push({
      timestamp: Date.now(),
      metrics,
    });

    // Keep only last hour of metrics (for 1-minute intervals = 60 entries)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metricsHistory = this.metricsHistory.filter((h) => h.timestamp > oneHourAgo);
  }

  // ============================================================================
  // PRIVATE METHODS - Scaling Conditions
  // ============================================================================

  /**
   * Evaluate scale up conditions
   * @private
   */
  private evaluateScaleUpConditions(): { shouldScale: boolean; reason: string } {
    const conditions: ScalingCondition[] = [];

    // Condition 1: High utilization sustained
    const highUtilization = this.checkSustainedCondition(
      'High Utilization',
      (m) => m.utilization,
      this.config.scaleUpThreshold,
      this.config.scaleUpDuration,
      'greater'
    );
    conditions.push(highUtilization);

    // Condition 2: High queue length
    const highQueue = this.checkSustainedCondition(
      'High Queue Length',
      (m) => m.queueLength,
      this.config.queueLengthThreshold,
      this.config.scaleUpDuration * 0.6, // 60% of scaleUpDuration (3 min if scaleUpDuration=5min)
      'greater'
    );
    conditions.push(highQueue);

    // Condition 3: High average wait time
    const highWaitTime = this.checkSustainedCondition(
      'High Wait Time',
      (m) => m.avgWaitTime,
      this.config.avgWaitTimeThreshold,
      this.config.scaleUpDuration * 0.4, // 40% of scaleUpDuration (2 min if scaleUpDuration=5min)
      'greater'
    );
    conditions.push(highWaitTime);

    // Scale up if ANY condition is met
    const metConditions = conditions.filter((c) => c.met);
    if (metConditions.length > 0) {
      const reason = metConditions
        .map((c) => `${c.name} (${c.currentValue.toFixed(2)} > ${c.threshold})`)
        .join(', ');
      return { shouldScale: true, reason };
    }

    return { shouldScale: false, reason: 'No scale up conditions met' };
  }

  /**
   * Evaluate scale down conditions
   * @private
   */
  private evaluateScaleDownConditions(): { shouldScale: boolean; reason: string } {
    const conditions: ScalingCondition[] = [];

    // Condition 1: Low utilization sustained
    const lowUtilization = this.checkSustainedCondition(
      'Low Utilization',
      (m) => m.utilization,
      this.config.scaleDownThreshold,
      this.config.scaleDownDuration,
      'less'
    );
    conditions.push(lowUtilization);

    // Condition 2: No queue
    const noQueue = this.checkSustainedCondition(
      'No Queue',
      (m) => m.queueLength,
      0,
      this.config.scaleDownDuration * 0.67, // 67% of scaleDownDuration (10 min if scaleDownDuration=15min)
      'equal'
    );
    conditions.push(noQueue);

    // Condition 3: High idle ratio
    const highIdle = this.checkSustainedCondition(
      'High Idle Ratio',
      (m) => m.idleRatio,
      this.config.idleThreshold,
      this.config.scaleDownDuration * 0.67,
      'greater'
    );
    conditions.push(highIdle);

    // Scale down if ANY condition is met
    const metConditions = conditions.filter((c) => c.met);
    if (metConditions.length > 0) {
      const reason = metConditions
        .map((c) => `${c.name} (${c.currentValue.toFixed(2)} ${c.threshold})`)
        .join(', ');
      return { shouldScale: true, reason };
    }

    return { shouldScale: false, reason: 'No scale down conditions met' };
  }

  /**
   * Check if condition is sustained over duration
   * @private
   */
  private checkSustainedCondition(
    name: string,
    metricGetter: (m: PoolMetrics) => number,
    threshold: number,
    duration: number,
    comparison: 'greater' | 'less' | 'equal'
  ): ScalingCondition {
    const cutoffTime = Date.now() - duration;
    const recentMetrics = this.metricsHistory.filter((h) => h.timestamp > cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        name,
        met: false,
        currentValue: 0,
        threshold,
        duration,
      };
    }

    // Check if ALL recent metrics meet the condition
    const allMet = recentMetrics.every((h) => {
      const value = metricGetter(h.metrics);
      switch (comparison) {
        case 'greater':
          return value > threshold;
        case 'less':
          return value < threshold;
        case 'equal':
          return value === threshold;
        default:
          return false;
      }
    });

    const currentValue = metricGetter(recentMetrics[recentMetrics.length - 1].metrics);

    return {
      name,
      met: allMet,
      currentValue,
      threshold,
      duration,
    };
  }

  // ============================================================================
  // PRIVATE METHODS - Scaling Actions
  // ============================================================================

  /**
   * Scale up the pool
   * @private
   */
  private async scaleUp(metrics: PoolMetrics, reason: string): Promise<ScaleDecision> {
    const oldSize = metrics.currentSize;
    const newSize = Math.min(
      Math.ceil(oldSize * this.config.scaleUpFactor),
      this.config.maxPoolSize
    );

    if (newSize <= oldSize) {
      return this.createDecision('none', 'Already at maximum pool size', metrics);
    }

    try {
      await this.resizePool(newSize);
      this.recordScalingEvent('up', oldSize, newSize, reason, metrics, true);
      this.lastScalingTime = Date.now();

      log.info('Pool scaled up', {
        connectionId: this.config.connectionId,
        oldSize,
        newSize,
        reason,
      });

      return this.createDecision('up', reason, metrics, oldSize, newSize);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.recordScalingEvent('up', oldSize, newSize, reason, metrics, false, errorMsg);

      log.error('Failed to scale up pool', {
        connectionId: this.config.connectionId,
        error: errorMsg,
      });

      return this.createDecision('none', `Scale up failed: ${errorMsg}`, metrics);
    }
  }

  /**
   * Scale down the pool
   * @private
   */
  private async scaleDown(metrics: PoolMetrics, reason: string): Promise<ScaleDecision> {
    const oldSize = metrics.currentSize;
    const newSize = Math.max(
      Math.floor(oldSize * this.config.scaleDownFactor),
      this.config.minPoolSize
    );

    if (newSize >= oldSize) {
      return this.createDecision('none', 'Already at minimum pool size', metrics);
    }

    try {
      await this.resizePool(newSize);
      this.recordScalingEvent('down', oldSize, newSize, reason, metrics, true);
      this.lastScalingTime = Date.now();

      log.info('Pool scaled down', {
        connectionId: this.config.connectionId,
        oldSize,
        newSize,
        reason,
      });

      return this.createDecision('down', reason, metrics, oldSize, newSize);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.recordScalingEvent('down', oldSize, newSize, reason, metrics, false, errorMsg);

      log.error('Failed to scale down pool', {
        connectionId: this.config.connectionId,
        error: errorMsg,
      });

      return this.createDecision('none', `Scale down failed: ${errorMsg}`, metrics);
    }
  }

  /**
   * Resize pool (delegates to connection)
   * @private
   */
  private async resizePool(newSize: number): Promise<void> {
    // Check if connection has resizePool method
    if ('resizePool' in this.connection && typeof this.connection.resizePool === 'function') {
      await (this.connection as any).resizePool(newSize);
    } else {
      throw new Error('Connection does not support pool resizing');
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Cooldown & History
  // ============================================================================

  /**
   * Check if in cooldown period
   * @private
   */
  private isInCooldownPeriod(): boolean {
    if (this.lastScalingTime === 0) {
      return false;
    }

    const timeSinceLastScaling = Date.now() - this.lastScalingTime;
    return timeSinceLastScaling < this.config.cooldownPeriod;
  }

  /**
   * Get remaining cooldown time
   * @private
   */
  private getCooldownRemaining(): number {
    if (!this.isInCooldownPeriod()) {
      return 0;
    }

    const timeSinceLastScaling = Date.now() - this.lastScalingTime;
    return this.config.cooldownPeriod - timeSinceLastScaling;
  }

  /**
   * Record scaling event in history
   * @private
   */
  private recordScalingEvent(
    action: ScaleAction,
    oldSize: number,
    newSize: number,
    reason: string,
    metrics: PoolMetrics,
    success: boolean,
    error?: string
  ): void {
    const event: ScaleEvent = {
      connectionId: this.config.connectionId,
      action,
      oldSize,
      newSize,
      reason,
      metrics,
      timestamp: Date.now(),
      success,
      error,
    };

    this.scalingHistory.push(event);

    // Keep only last 100 events
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }
  }

  /**
   * Create scale decision
   * @private
   */
  private createDecision(
    action: ScaleAction,
    reason: string,
    metrics?: PoolMetrics,
    oldSize?: number,
    newSize?: number
  ): ScaleDecision {
    return {
      action,
      oldSize: oldSize ?? metrics?.currentSize ?? 0,
      newSize: newSize ?? metrics?.currentSize ?? 0,
      reason,
      triggerMetrics: metrics,
      timestamp: Date.now(),
    };
  }
}
