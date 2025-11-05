// src/infrastructure/database/multiRegion/ConnectionGroups.ts

/**
 * Multi-region connection groups with automatic failover
 *
 * @module infrastructure/database/multiRegion/ConnectionGroups
 *
 * @description
 * Manages connection groups with multiple regions and automatic failover.
 * Detects failures, triggers failover, monitors health, and fails back when recovered.
 */

import { log } from '@shared/utils/logger';
import { DatabaseManager } from '../DatabaseManager';
import { failoverEvents } from './FailoverEvents';
import {
  ConnectionGroup,
  RegionConfig,
  FailureCounter,
  FailoverDecision,
  FailoverEvent,
  FailbackEvent,
} from './types';

/**
 * Connection Group Registry
 *
 * @description
 * Central registry for managing multi-region connection groups.
 * Tracks failures, triggers failover, monitors health, and fails back.
 *
 * @example Register a group
 * ```typescript
 * connectionGroupRegistry.registerGroup({
 *   groupId: 'datasul-emp',
 *   description: 'Datasul EMP with multi-region',
 *   regions: [
 *     { connectionId: 'DtsPrdEmp', region: 'sao-paulo', priority: RegionPriority.PRIMARY },
 *     { connectionId: 'DtsPrdEmpRJ', region: 'rio-janeiro', priority: RegionPriority.SECONDARY }
 *   ],
 *   currentRegion: 'DtsPrdEmp',
 *   failoverPolicy: {
 *     maxFailures: 5,
 *     failureWindow: 60000,
 *     healthCheckInterval: 30000,
 *     failbackDelay: 300000,
 *     autoFailback: true
 *   }
 * });
 * ```
 */
export class ConnectionGroupRegistry {
  /** Registered connection groups */
  private groups: Map<string, ConnectionGroup> = new Map();

  /** Failure counters per connection */
  private failureCounters: Map<string, FailureCounter> = new Map();

  /** Health check intervals per connection */
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a connection group with regions
   *
   * @param group - Connection group configuration
   *
   * @description
   * Registers a new connection group and sorts regions by priority.
   * Sets primary region as current active region.
   *
   * @example
   * ```typescript
   * connectionGroupRegistry.registerGroup({
   *   groupId: 'datasul-emp',
   *   description: 'Datasul EMP with failover',
   *   regions: [...],
   *   currentRegion: 'DtsPrdEmp',
   *   failoverPolicy: {...}
   * });
   * ```
   */
  registerGroup(group: ConnectionGroup): void {
    // Sort regions by priority (lower number = higher priority)
    group.regions.sort((a, b) => a.priority - b.priority);

    // Set primary as current
    group.currentRegion = group.regions[0].connectionId;

    this.groups.set(group.groupId, group);

    log.info('Multi-region group registered', {
      groupId: group.groupId,
      regions: group.regions.length,
      primary: group.currentRegion,
      description: group.description,
    });
  }

  /**
   * Get current active connection for group
   *
   * @param groupId - Group identifier
   * @returns Current connection ID (DSN)
   * @throws Error if group not found
   *
   * @example
   * ```typescript
   * const dsn = connectionGroupRegistry.getCurrentConnection('datasul-emp');
   * // Returns: 'DtsPrdEmp' (or 'DtsPrdEmpRJ' if failed over)
   * ```
   */
  getCurrentConnection(groupId: string): string {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Connection group not found: ${groupId}`);
    }

    return group.currentRegion;
  }

  /**
   * Get group configuration
   *
   * @param groupId - Group identifier
   * @returns Connection group or undefined
   */
  getGroup(groupId: string): ConnectionGroup | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Get all registered groups
   *
   * @returns Map of all connection groups
   */
  getAllGroups(): Map<string, ConnectionGroup> {
    return this.groups;
  }

  /**
   * Record a failure and check if should failover
   *
   * @param groupId - Group identifier
   * @param connectionId - Connection ID that failed
   * @param error - Error that occurred
   * @returns Failover decision
   *
   * @description
   * Increments failure counter and checks if threshold exceeded.
   * If yes, triggers failover to next available region.
   *
   * @example
   * ```typescript
   * const decision = await connectionGroupRegistry.recordFailure(
   *   'datasul-emp',
   *   'DtsPrdEmp',
   *   new Error('Connection timeout')
   * );
   *
   * if (decision.shouldFailover) {
   *   console.log(`Failover to ${decision.newConnection}`);
   * }
   * ```
   */
  async recordFailure(
    groupId: string,
    connectionId: string,
    error: Error
  ): Promise<FailoverDecision> {
    const group = this.groups.get(groupId);
    if (!group) {
      return { shouldFailover: false };
    }

    // Get or create failure counter
    let counter = this.failureCounters.get(connectionId);
    if (!counter) {
      counter = {
        count: 0,
        firstFailure: new Date(),
        lastFailure: new Date(),
        errors: [],
      };
      this.failureCounters.set(connectionId, counter);
    }

    // Increment failure count
    counter.count++;
    counter.lastFailure = new Date();
    counter.errors.push({
      timestamp: new Date(),
      message: error.message,
      code: (error as any).code,
    });

    // Keep only last 100 errors
    if (counter.errors.length > 100) {
      counter.errors = counter.errors.slice(-100);
    }

    log.warn('Connection failure recorded', {
      groupId,
      connectionId,
      failureCount: counter.count,
      error: error.message,
    });

    // Check if should failover
    const shouldFailover = this.shouldFailover(group, counter);

    if (shouldFailover) {
      const nextRegion = this.getNextRegion(group, connectionId);

      if (nextRegion) {
        log.error('FAILOVER TRIGGERED', {
          groupId,
          from: connectionId,
          to: nextRegion.connectionId,
          reason: 'max_failures_exceeded',
          failures: counter.count,
          policy: group.failoverPolicy,
        });

        // Execute failover
        await this.executeFailover(group, nextRegion);

        // Start health check for failed region
        this.startHealthCheck(groupId, connectionId);

        return {
          shouldFailover: true,
          newConnection: nextRegion.connectionId,
          oldConnection: connectionId,
          reason: 'max_failures_exceeded',
        };
      } else {
        log.error('ALL REGIONS FAILED - NO FAILOVER AVAILABLE', {
          groupId,
          regions: group.regions.map((r) => r.connectionId),
        });
      }
    }

    return { shouldFailover: false };
  }

  /**
   * Record successful query
   *
   * @param groupId - Group identifier
   * @param connectionId - Connection ID
   *
   * @description
   * Decrements failure counter on successful query.
   * Helps prevent false positives from transient errors.
   */
  recordSuccess(groupId: string, connectionId: string): void {
    const counter = this.failureCounters.get(connectionId);
    if (counter && counter.count > 0) {
      counter.count = Math.max(0, counter.count - 1);

      log.debug('Connection success - failure count decremented', {
        groupId,
        connectionId,
        remainingFailures: counter.count,
      });
    }
  }

  /**
   * Check if should trigger failover
   *
   * @param group - Connection group
   * @param counter - Failure counter
   * @returns True if should failover
   * @private
   */
  private shouldFailover(group: ConnectionGroup, counter: FailureCounter): boolean {
    const policy = group.failoverPolicy;

    // Check if exceeded max failures
    if (counter.count < policy.maxFailures) {
      return false;
    }

    // Check if failures are within window
    const elapsed = Date.now() - counter.firstFailure.getTime();
    if (elapsed > policy.failureWindow) {
      // Reset counter if outside window
      counter.count = 1;
      counter.firstFailure = new Date();
      return false;
    }

    return true;
  }

  /**
   * Get next available region for failover
   *
   * @param group - Connection group
   * @param currentConnection - Current connection ID
   * @returns Next region or null if none available
   * @private
   */
  private getNextRegion(group: ConnectionGroup, currentConnection: string): RegionConfig | null {
    const currentIndex = group.regions.findIndex((r) => r.connectionId === currentConnection);

    if (currentIndex === -1) return null;

    // Try next region
    for (let i = currentIndex + 1; i < group.regions.length; i++) {
      const region = group.regions[i];

      // Check if region is healthy
      const counter = this.failureCounters.get(region.connectionId);
      if (!counter || counter.count < group.failoverPolicy.maxFailures) {
        return region;
      }
    }

    // All regions failed!
    log.error('ALL REGIONS FAILED', {
      groupId: group.groupId,
      regions: group.regions.map((r) => r.connectionId),
    });

    return null;
  }

  /**
   * Execute failover to new region
   *
   * @param group - Connection group
   * @param newRegion - Target region
   * @private
   */
  private async executeFailover(group: ConnectionGroup, newRegion: RegionConfig): Promise<void> {
    const oldRegion = group.currentRegion;
    group.currentRegion = newRegion.connectionId;

    // Emit failover event
    const event: FailoverEvent = {
      groupId: group.groupId,
      from: oldRegion,
      to: newRegion.connectionId,
      timestamp: new Date(),
      reason: 'max_failures_exceeded',
    };

    failoverEvents.emitFailover(event);

    log.error('FAILOVER EXECUTED', {
      groupId: group.groupId,
      from: oldRegion,
      to: newRegion.connectionId,
      region: newRegion.region,
      priority: newRegion.priority,
    });
  }

  /**
   * Start health check for failed connection
   *
   * @param groupId - Group identifier
   * @param failedConnection - Failed connection ID
   * @private
   */
  private startHealthCheck(groupId: string, failedConnection: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    // Clear existing health check if any
    const existingInterval = this.healthCheckIntervals.get(failedConnection);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    log.info('Starting health check for failed connection', {
      groupId,
      connectionId: failedConnection,
      interval: group.failoverPolicy.healthCheckInterval,
    });

    const interval = setInterval(async () => {
      const isHealthy = await this.checkHealth(failedConnection);

      if (isHealthy) {
        log.info('Region recovered', {
          groupId,
          connectionId: failedConnection,
        });

        // Reset failure counter
        this.failureCounters.delete(failedConnection);

        // Check if should fail-back
        if (group.failoverPolicy.autoFailback) {
          await this.executeFailback(group, failedConnection);
        }

        // Stop health check
        clearInterval(interval);
        this.healthCheckIntervals.delete(failedConnection);
      }
    }, group.failoverPolicy.healthCheckInterval);

    this.healthCheckIntervals.set(failedConnection, interval);
  }

  /**
   * Check health of a connection
   *
   * @param connectionId - Connection ID to check
   * @returns True if healthy
   * @private
   */
  private async checkHealth(connectionId: string): Promise<boolean> {
    try {
      const health = await DatabaseManager.healthCheckConnection(connectionId);
      return health.connected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute failback to recovered connection
   *
   * @param group - Connection group
   * @param recoveredConnection - Recovered connection ID
   * @private
   */
  private async executeFailback(
    group: ConnectionGroup,
    recoveredConnection: string
  ): Promise<void> {
    // Wait for failback delay
    await new Promise((resolve) => setTimeout(resolve, group.failoverPolicy.failbackDelay));

    // Check if still healthy
    const isHealthy = await this.checkHealth(recoveredConnection);
    if (!isHealthy) {
      log.warn('Failback cancelled - connection not healthy', {
        groupId: group.groupId,
        connectionId: recoveredConnection,
      });
      return;
    }

    // Find region config
    const region = group.regions.find((r) => r.connectionId === recoveredConnection);
    if (!region) return;

    // Only fail-back if recovered is higher priority
    const currentRegion = group.regions.find((r) => r.connectionId === group.currentRegion);
    if (!currentRegion || region.priority >= currentRegion.priority) {
      return;
    }

    log.info('FAILBACK to primary', {
      groupId: group.groupId,
      from: group.currentRegion,
      to: recoveredConnection,
      priority: region.priority,
    });

    const oldRegion = group.currentRegion;
    group.currentRegion = recoveredConnection;

    // Emit failback event
    const event: FailbackEvent = {
      groupId: group.groupId,
      from: oldRegion,
      to: recoveredConnection,
      timestamp: new Date(),
    };

    failoverEvents.emitFailback(event);
  }

  /**
   * Get failure statistics for a connection
   *
   * @param connectionId - Connection ID
   * @returns Failure counter or undefined
   */
  getFailureStats(connectionId: string): FailureCounter | undefined {
    return this.failureCounters.get(connectionId);
  }

  /**
   * Clear all health check intervals (cleanup on shutdown)
   */
  shutdown(): void {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    log.info('Multi-region connection group registry shutdown');
  }
}

/**
 * Global connection group registry instance
 *
 * @example
 * ```typescript
 * import { connectionGroupRegistry } from '@infrastructure/database/multiRegion/ConnectionGroups';
 *
 * // Get current connection for group
 * const dsn = connectionGroupRegistry.getCurrentConnection('datasul-emp');
 *
 * // Record failure
 * const decision = await connectionGroupRegistry.recordFailure(
 *   'datasul-emp',
 *   'DtsPrdEmp',
 *   error
 * );
 * ```
 */
export const connectionGroupRegistry = new ConnectionGroupRegistry();
