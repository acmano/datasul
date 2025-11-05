// src/infrastructure/metrics/MultiRegionMetrics.ts

/**
 * Multi-region failover metrics
 *
 * @module infrastructure/metrics/MultiRegionMetrics
 *
 * @description
 * Prometheus metrics for multi-region failover system.
 * Tracks failovers, failbacks, query distribution, and region health.
 */

import client from 'prom-client';
import { metricsManager } from './MetricsManager';
import { log } from '@shared/utils/logger';

/**
 * Multi-region metrics manager
 *
 * @description
 * Manages Prometheus metrics for multi-region failover system.
 *
 * Metrics:
 * - lor0138_multi_region_failovers_total: Total failovers
 * - lor0138_multi_region_failbacks_total: Total failbacks
 * - lor0138_multi_region_current_region: Current active region (gauge)
 * - lor0138_multi_region_queries_total: Total queries per region
 * - lor0138_multi_region_queries_success: Successful queries per region
 * - lor0138_multi_region_queries_failed: Failed queries per region
 * - lor0138_multi_region_region_health: Region health status (1=healthy, 0=unhealthy)
 *
 * @example
 * ```typescript
 * import { multiRegionMetrics } from '@infrastructure/metrics/MultiRegionMetrics';
 *
 * // Record failover
 * multiRegionMetrics.recordFailover('datasul-emp', 'DtsPrdEmp', 'DtsPrdEmpRJ');
 *
 * // Record query
 * multiRegionMetrics.recordQueryByRegion('datasul-emp', 'DtsPrdEmp', true);
 * ```
 */
export class MultiRegionMetrics {
  /** Total failovers */
  private failoversTotal: client.Counter<string>;

  /** Total failbacks */
  private failbacksTotal: client.Counter<string>;

  /** Current active region per group */
  private currentRegion: client.Gauge<string>;

  /** Total queries per region */
  private queriesTotal: client.Counter<string>;

  /** Successful queries per region */
  private queriesSuccess: client.Counter<string>;

  /** Failed queries per region */
  private queriesFailed: client.Counter<string>;

  /** Region health status */
  private regionHealth: client.Gauge<string>;

  constructor() {
    const registry = metricsManager.getRegistry();
    const prefix = 'lor0138_';

    // Failover counter
    this.failoversTotal = new client.Counter({
      name: `${prefix}multi_region_failovers_total`,
      help: 'Total number of failovers',
      labelNames: ['group', 'from', 'to'],
      registers: [registry],
    });

    // Failback counter
    this.failbacksTotal = new client.Counter({
      name: `${prefix}multi_region_failbacks_total`,
      help: 'Total number of failbacks',
      labelNames: ['group', 'to'],
      registers: [registry],
    });

    // Current region gauge
    this.currentRegion = new client.Gauge({
      name: `${prefix}multi_region_current_region`,
      help: 'Current active region (1=primary, 2=secondary, 3=tertiary)',
      labelNames: ['group', 'region'],
      registers: [registry],
    });

    // Query counters
    this.queriesTotal = new client.Counter({
      name: `${prefix}multi_region_queries_total`,
      help: 'Total queries per region',
      labelNames: ['group', 'region'],
      registers: [registry],
    });

    this.queriesSuccess = new client.Counter({
      name: `${prefix}multi_region_queries_success`,
      help: 'Successful queries per region',
      labelNames: ['group', 'region'],
      registers: [registry],
    });

    this.queriesFailed = new client.Counter({
      name: `${prefix}multi_region_queries_failed`,
      help: 'Failed queries per region',
      labelNames: ['group', 'region'],
      registers: [registry],
    });

    // Region health
    this.regionHealth = new client.Gauge({
      name: `${prefix}multi_region_region_health`,
      help: 'Region health status (1=healthy, 0=unhealthy)',
      labelNames: ['group', 'region'],
      registers: [registry],
    });

    log.info('Multi-region metrics initialized');
  }

  /**
   * Record a failover event
   *
   * @param groupId - Group identifier
   * @param from - Source connection
   * @param to - Target connection
   *
   * @example
   * ```typescript
   * multiRegionMetrics.recordFailover('datasul-emp', 'DtsPrdEmp', 'DtsPrdEmpRJ');
   * ```
   */
  recordFailover(groupId: string, from: string, to: string): void {
    this.failoversTotal.inc({ group: groupId, from, to });

    log.debug('Failover metric recorded', { groupId, from, to });
  }

  /**
   * Record a failback event
   *
   * @param groupId - Group identifier
   * @param to - Target connection (primary)
   *
   * @example
   * ```typescript
   * multiRegionMetrics.recordFailback('datasul-emp', 'DtsPrdEmp');
   * ```
   */
  recordFailback(groupId: string, to: string): void {
    this.failbacksTotal.inc({ group: groupId, to });

    log.debug('Failback metric recorded', { groupId, to });
  }

  /**
   * Update current region
   *
   * @param groupId - Group identifier
   * @param region - Current region
   * @param priority - Region priority (1=primary, 2=secondary, etc)
   *
   * @example
   * ```typescript
   * multiRegionMetrics.updateCurrentRegion('datasul-emp', 'DtsPrdEmp', 1);
   * ```
   */
  updateCurrentRegion(groupId: string, region: string, priority: number): void {
    this.currentRegion.set({ group: groupId, region }, priority);

    log.debug('Current region updated', { groupId, region, priority });
  }

  /**
   * Record query execution by region
   *
   * @param groupId - Group identifier
   * @param region - Connection region
   * @param success - Query success status
   *
   * @example
   * ```typescript
   * multiRegionMetrics.recordQueryByRegion('datasul-emp', 'DtsPrdEmp', true);
   * ```
   */
  recordQueryByRegion(groupId: string, region: string, success: boolean): void {
    const label = { group: groupId, region };

    this.queriesTotal.inc(label);

    if (success) {
      this.queriesSuccess.inc(label);
    } else {
      this.queriesFailed.inc(label);
    }

    log.debug('Query metric recorded', { groupId, region, success });
  }

  /**
   * Update region health status
   *
   * @param groupId - Group identifier
   * @param region - Connection region
   * @param isHealthy - Health status
   *
   * @example
   * ```typescript
   * multiRegionMetrics.updateRegionHealth('datasul-emp', 'DtsPrdEmp', true);
   * ```
   */
  updateRegionHealth(groupId: string, region: string, isHealthy: boolean): void {
    this.regionHealth.set({ group: groupId, region }, isHealthy ? 1 : 0);

    log.debug('Region health updated', { groupId, region, isHealthy });
  }
}

/**
 * Global multi-region metrics instance
 *
 * @example
 * ```typescript
 * import { multiRegionMetrics } from '@infrastructure/metrics/MultiRegionMetrics';
 *
 * multiRegionMetrics.recordFailover('datasul-emp', 'DtsPrdEmp', 'DtsPrdEmpRJ');
 * ```
 */
export const multiRegionMetrics = new MultiRegionMetrics();
