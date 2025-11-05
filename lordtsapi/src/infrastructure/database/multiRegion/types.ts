// src/infrastructure/database/multiRegion/types.ts

/**
 * Multi-region failover types and interfaces
 * @module infrastructure/database/multiRegion/types
 */

/**
 * Region priority for failover ordering
 */
export enum RegionPriority {
  PRIMARY = 1,
  SECONDARY = 2,
  TERTIARY = 3,
}

/**
 * Region configuration for a connection group
 */
export interface RegionConfig {
  /** Connection ID (DSN) */
  connectionId: string;
  /** Region name */
  region: string;
  /** Priority level (lower = higher priority) */
  priority: RegionPriority;
  /** Weight for load balancing (future) */
  weight?: number;
  /** Expected latency in milliseconds */
  latencyMs?: number;
  /** Is this a read-only replica */
  readOnly?: boolean;
}

/**
 * Failover policy configuration
 */
export interface FailoverPolicy {
  /** Maximum failures before triggering failover */
  maxFailures: number;
  /** Time window for counting failures (ms) */
  failureWindow: number;
  /** Interval for health checking failed regions (ms) */
  healthCheckInterval: number;
  /** Delay before failing back to primary (ms) */
  failbackDelay: number;
  /** Automatically failback to primary when recovered */
  autoFailback: boolean;
}

/**
 * Connection group with multi-region support
 */
export interface ConnectionGroup {
  /** Unique group identifier */
  groupId: string;
  /** Human-readable description */
  description: string;
  /** List of regions (sorted by priority) */
  regions: RegionConfig[];
  /** Currently active region */
  currentRegion: string;
  /** Failover policy */
  failoverPolicy: FailoverPolicy;
}

/**
 * Failure counter for tracking connection failures
 */
export interface FailureCounter {
  /** Number of failures */
  count: number;
  /** Timestamp of first failure */
  firstFailure: Date;
  /** Timestamp of last failure */
  lastFailure: Date;
  /** Array of error details */
  errors: Array<{
    timestamp: Date;
    message: string;
    code?: string;
  }>;
}

/**
 * Failover decision result
 */
export interface FailoverDecision {
  /** Should trigger failover */
  shouldFailover: boolean;
  /** New connection ID (if failover) */
  newConnection?: string;
  /** Old connection ID (if failover) */
  oldConnection?: string;
  /** Reason for failover */
  reason?: string;
}

/**
 * Failover event
 */
export interface FailoverEvent {
  /** Connection group ID */
  groupId: string;
  /** Source connection */
  from: string;
  /** Target connection */
  to: string;
  /** Event timestamp */
  timestamp: Date;
  /** Reason for failover */
  reason?: string;
}

/**
 * Failback event
 */
export interface FailbackEvent {
  /** Connection group ID */
  groupId: string;
  /** Source connection */
  from: string;
  /** Target connection (primary) */
  to: string;
  /** Event timestamp */
  timestamp: Date;
}

/**
 * Health change event
 */
export interface HealthChangeEvent {
  /** Connection ID */
  connectionId: string;
  /** Previous health status */
  previousStatus: boolean;
  /** New health status */
  currentStatus: boolean;
  /** Event timestamp */
  timestamp: Date;
}
