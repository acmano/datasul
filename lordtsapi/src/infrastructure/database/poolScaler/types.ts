// src/infrastructure/database/poolScaler/types.ts

/**
 * @fileoverview Types and interfaces for Pool Auto-Scaler System
 *
 * Defines all TypeScript interfaces for the dynamic pool scaling system.
 *
 * @module infrastructure/database/poolScaler/types
 */

/**
 * Pool scaler configuration
 *
 * @interface PoolScalerConfig
 */
export interface PoolScalerConfig {
  /** Connection identifier (DSN) */
  connectionId: string;

  /** Minimum pool size (default: 2) */
  minPoolSize: number;

  /** Maximum pool size (default: 20) */
  maxPoolSize: number;

  /** Scale up threshold - utilization percentage (default: 0.85 = 85%) */
  scaleUpThreshold: number;

  /** Scale down threshold - utilization percentage (default: 0.30 = 30%) */
  scaleDownThreshold: number;

  /** Scale up factor (default: 1.5) */
  scaleUpFactor: number;

  /** Scale down factor (default: 0.7) */
  scaleDownFactor: number;

  /** Duration threshold for scale up in ms (default: 300000 = 5min) */
  scaleUpDuration: number;

  /** Duration threshold for scale down in ms (default: 900000 = 15min) */
  scaleDownDuration: number;

  /** Cooldown period between scaling actions in ms (default: 300000 = 5min) */
  cooldownPeriod: number;

  /** Queue length threshold for scale up (default: 10) */
  queueLengthThreshold: number;

  /** Average wait time threshold for scale up in ms (default: 500) */
  avgWaitTimeThreshold: number;

  /** Idle connections percentage threshold for scale down (default: 0.7 = 70%) */
  idleThreshold: number;

  /** Enable/disable auto-scaling for this connection (default: true) */
  enabled: boolean;
}

/**
 * Pool metrics snapshot
 *
 * @interface PoolMetrics
 */
export interface PoolMetrics {
  /** Current pool size */
  currentSize: number;

  /** Active connections count */
  activeConnections: number;

  /** Idle connections count */
  idleConnections: number;

  /** Queue length (waiting clients) */
  queueLength: number;

  /** Average wait time in milliseconds */
  avgWaitTime: number;

  /** Pool utilization ratio (0.0 - 1.0) */
  utilization: number;

  /** Idle connections ratio (0.0 - 1.0) */
  idleRatio: number;

  /** Timestamp of metrics collection */
  timestamp: number;
}

/**
 * Scaling action type
 *
 * @typedef {'up' | 'down' | 'none'} ScaleAction
 */
export type ScaleAction = 'up' | 'down' | 'none';

/**
 * Scaling decision result
 *
 * @interface ScaleDecision
 */
export interface ScaleDecision {
  /** Action to take */
  action: ScaleAction;

  /** Old pool size */
  oldSize: number;

  /** New pool size */
  newSize: number;

  /** Reason for scaling */
  reason: string;

  /** Metrics that triggered the decision */
  triggerMetrics?: PoolMetrics;

  /** Timestamp of decision */
  timestamp: number;
}

/**
 * Scaling event record
 *
 * @interface ScaleEvent
 */
export interface ScaleEvent {
  /** Connection identifier */
  connectionId: string;

  /** Scaling action taken */
  action: ScaleAction;

  /** Pool size before scaling */
  oldSize: number;

  /** Pool size after scaling */
  newSize: number;

  /** Reason for scaling */
  reason: string;

  /** Metrics that triggered the event */
  metrics: PoolMetrics;

  /** Timestamp when event occurred */
  timestamp: number;

  /** Success status */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Pool scaler status
 *
 * @interface PoolScalerStatus
 */
export interface PoolScalerStatus {
  /** Connection identifier */
  connectionId: string;

  /** Is auto-scaling enabled */
  enabled: boolean;

  /** Current pool size */
  currentPoolSize: number;

  /** Min/Max pool size limits */
  poolLimits: {
    min: number;
    max: number;
  };

  /** Current metrics */
  currentMetrics: PoolMetrics;

  /** Last scaling event */
  lastScaling?: ScaleEvent;

  /** Time since last scaling (ms) */
  timeSinceLastScaling?: number;

  /** Is in cooldown period */
  inCooldown: boolean;

  /** Time remaining in cooldown (ms) */
  cooldownRemaining?: number;

  /** Scaling history (last 10 events) */
  recentHistory: ScaleEvent[];
}

/**
 * Metric history entry for trend analysis
 *
 * @interface MetricHistory
 * @private
 */
export interface MetricHistory {
  /** Timestamp */
  timestamp: number;

  /** Metrics snapshot */
  metrics: PoolMetrics;
}

/**
 * Scaling condition evaluation result
 *
 * @interface ScalingCondition
 * @private
 */
export interface ScalingCondition {
  /** Condition name */
  name: string;

  /** Is condition met */
  met: boolean;

  /** Current value */
  currentValue: number;

  /** Threshold value */
  threshold: number;

  /** Duration in ms (for sustained conditions) */
  duration?: number;
}
