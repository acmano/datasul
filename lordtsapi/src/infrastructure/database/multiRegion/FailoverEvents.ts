// src/infrastructure/database/multiRegion/FailoverEvents.ts

import { EventEmitter } from 'events';
import { FailoverEvent, FailbackEvent, HealthChangeEvent } from './types';
import { log } from '@shared/utils/logger';

/**
 * Failover event emitter for multi-region system
 *
 * @description
 * Emits events when failover/failback occurs or health status changes.
 * Allows external systems to react to region changes (alerting, logging, etc).
 *
 * @example Subscribe to failover events
 * ```typescript
 * failoverEvents.onFailover((event) => {
 *   console.log(`Failover: ${event.from} -> ${event.to}`);
 *   alerting.sendCritical(`Database failover to ${event.to}`);
 * });
 * ```
 */
export class FailoverEventEmitter extends EventEmitter {
  /**
   * Subscribe to failover events
   *
   * @param handler - Callback function
   *
   * @example
   * ```typescript
   * failoverEvents.onFailover((event) => {
   *   log.error(`FAILOVER: ${event.from} -> ${event.to}`, { event });
   * });
   * ```
   */
  onFailover(handler: (event: FailoverEvent) => void): void {
    this.on('failover', handler);
  }

  /**
   * Subscribe to failback events
   *
   * @param handler - Callback function
   *
   * @example
   * ```typescript
   * failoverEvents.onFailback((event) => {
   *   log.info(`FAILBACK: ${event.from} -> ${event.to}`, { event });
   * });
   * ```
   */
  onFailback(handler: (event: FailbackEvent) => void): void {
    this.on('failback', handler);
  }

  /**
   * Subscribe to health change events
   *
   * @param handler - Callback function
   *
   * @example
   * ```typescript
   * failoverEvents.onRegionHealthChange((event) => {
   *   log.info(`Health change: ${event.connectionId}`, {
   *     previous: event.previousStatus,
   *     current: event.currentStatus
   *   });
   * });
   * ```
   */
  onRegionHealthChange(handler: (event: HealthChangeEvent) => void): void {
    this.on('health_change', handler);
  }

  /**
   * Emit failover event
   *
   * @param event - Failover event
   * @internal
   */
  emitFailover(event: FailoverEvent): void {
    log.error('FAILOVER EVENT', {
      groupId: event.groupId,
      from: event.from,
      to: event.to,
      reason: event.reason,
      timestamp: event.timestamp,
    });

    this.emit('failover', event);
  }

  /**
   * Emit failback event
   *
   * @param event - Failback event
   * @internal
   */
  emitFailback(event: FailbackEvent): void {
    log.info('FAILBACK EVENT', {
      groupId: event.groupId,
      from: event.from,
      to: event.to,
      timestamp: event.timestamp,
    });

    this.emit('failback', event);
  }

  /**
   * Emit health change event
   *
   * @param event - Health change event
   * @internal
   */
  emitHealthChange(event: HealthChangeEvent): void {
    const status = event.currentStatus ? 'HEALTHY' : 'UNHEALTHY';

    log.info(`Health change: ${event.connectionId} -> ${status}`, {
      connectionId: event.connectionId,
      previousStatus: event.previousStatus,
      currentStatus: event.currentStatus,
      timestamp: event.timestamp,
    });

    this.emit('health_change', event);
  }
}

/**
 * Global failover event emitter instance
 *
 * @example
 * ```typescript
 * import { failoverEvents } from '@infrastructure/database/multiRegion/FailoverEvents';
 *
 * failoverEvents.onFailover((event) => {
 *   alerting.sendCritical(`Failover to ${event.to}`);
 * });
 * ```
 */
export const failoverEvents = new FailoverEventEmitter();
