// src/infrastructure/database/poolScaler/PoolScalerManager.ts

/**
 * @fileoverview Pool Scaler Manager - Centralized management of all pool scalers
 *
 * Manages multiple PoolScaler instances across all connections.
 * Provides lifecycle management and aggregated metrics.
 *
 * @module infrastructure/database/poolScaler/PoolScalerManager
 */

import { log } from '@shared/utils/logger';
import { PoolScaler } from './PoolScaler';
import { PoolScalerConfig, PoolMetrics, PoolScalerStatus } from './types';
import { getPoolScalerConfig } from '@config/poolScaler.config';
import { IConnection } from '../types';

/**
 * Pool Scaler Manager
 *
 * @description
 * Centralized manager for all pool scalers in the system.
 * Handles creation, lifecycle, and monitoring of individual scalers.
 *
 * @class
 */
export class PoolScalerManager {
  /** Map of connectionId to PoolScaler instances */
  private scalers: Map<string, PoolScaler> = new Map();

  /** Is manager running */
  private isRunning: boolean = false;

  /**
   * Create a new PoolScalerManager
   *
   * @example
   * ```typescript
   * const manager = new PoolScalerManager();
   * ```
   */
  constructor() {
    log.info('PoolScalerManager initialized');
  }

  /**
   * Register a connection for auto-scaling
   *
   * @param {string} connectionId - Connection identifier (DSN)
   * @param {IConnection} connection - Connection instance
   * @param {Partial<Omit<PoolScalerConfig, 'connectionId'>>} [overrideConfig] - Optional config overrides
   *
   * @example
   * ```typescript
   * await manager.registerConnection('DtsPrdEmp', connection);
   * ```
   */
  async registerConnection(
    connectionId: string,
    connection: IConnection,
    overrideConfig?: Partial<Omit<PoolScalerConfig, 'connectionId'>>
  ): Promise<void> {
    if (this.scalers.has(connectionId)) {
      log.warn('Connection already registered for auto-scaling', { connectionId });
      return;
    }

    // Get config (from pool scaler config + overrides)
    const baseConfig = getPoolScalerConfig(connectionId);
    const config: PoolScalerConfig = {
      ...baseConfig,
      ...overrideConfig,
    };

    // Create scaler
    const scaler = new PoolScaler(config, connection);
    this.scalers.set(connectionId, scaler);

    // Start if manager is running and scaler is enabled
    if (this.isRunning && config.enabled) {
      await scaler.start();
    }

    log.info('Connection registered for auto-scaling', {
      connectionId,
      enabled: config.enabled,
      minPoolSize: config.minPoolSize,
      maxPoolSize: config.maxPoolSize,
    });
  }

  /**
   * Unregister a connection from auto-scaling
   *
   * @param {string} connectionId - Connection identifier
   *
   * @example
   * ```typescript
   * await manager.unregisterConnection('DtsTstEmp');
   * ```
   */
  async unregisterConnection(connectionId: string): Promise<void> {
    const scaler = this.scalers.get(connectionId);
    if (!scaler) {
      log.warn('Connection not registered', { connectionId });
      return;
    }

    // Stop scaler
    await scaler.stop();
    this.scalers.delete(connectionId);

    log.info('Connection unregistered from auto-scaling', { connectionId });
  }

  /**
   * Start all registered scalers
   *
   * @example
   * ```typescript
   * await manager.startAll();
   * ```
   */
  async startAll(): Promise<void> {
    if (this.isRunning) {
      log.warn('PoolScalerManager already running');
      return;
    }

    this.isRunning = true;

    const startPromises: Promise<void>[] = [];
    for (const [connectionId, scaler] of Array.from(this.scalers.entries())) {
      startPromises.push(scaler.start());
    }

    await Promise.all(startPromises);

    log.info('All pool scalers started', { count: this.scalers.size });
  }

  /**
   * Stop all registered scalers
   *
   * @example
   * ```typescript
   * await manager.stopAll();
   * ```
   */
  async stopAll(): Promise<void> {
    if (!this.isRunning) {
      log.warn('PoolScalerManager not running');
      return;
    }

    this.isRunning = false;

    const stopPromises: Promise<void>[] = [];
    for (const [connectionId, scaler] of Array.from(this.scalers.entries())) {
      stopPromises.push(scaler.stop());
    }

    await Promise.all(stopPromises);

    log.info('All pool scalers stopped', { count: this.scalers.size });
  }

  /**
   * Get scaler for specific connection
   *
   * @param {string} connectionId - Connection identifier
   * @returns {PoolScaler | undefined} Scaler instance or undefined
   *
   * @example
   * ```typescript
   * const scaler = manager.getScaler('DtsPrdEmp');
   * if (scaler) {
   *   const metrics = scaler.getMetrics();
   * }
   * ```
   */
  getScaler(connectionId: string): PoolScaler | undefined {
    return this.scalers.get(connectionId);
  }

  /**
   * Get all registered connection IDs
   *
   * @returns {string[]} Array of connection IDs
   *
   * @example
   * ```typescript
   * const connections = manager.getAllConnectionIds();
   * console.log(`Monitoring ${connections.length} connections`);
   * ```
   */
  getAllConnectionIds(): string[] {
    return Array.from(this.scalers.keys());
  }

  /**
   * Get metrics for all connections
   *
   * @returns {Map<string, PoolMetrics>} Map of connectionId to metrics
   *
   * @example
   * ```typescript
   * const allMetrics = manager.getAllMetrics();
   * allMetrics.forEach((metrics, connectionId) => {
   *   console.log(`${connectionId}: ${metrics.utilization * 100}%`);
   * });
   * ```
   */
  getAllMetrics(): Map<string, PoolMetrics> {
    const metrics = new Map<string, PoolMetrics>();

    for (const [connectionId, scaler] of Array.from(this.scalers.entries())) {
      metrics.set(connectionId, scaler.getMetrics());
    }

    return metrics;
  }

  /**
   * Get status for all connections
   *
   * @returns {Map<string, PoolScalerStatus>} Map of connectionId to status
   *
   * @example
   * ```typescript
   * const allStatus = manager.getAllStatus();
   * allStatus.forEach((status, connectionId) => {
   *   console.log(`${connectionId}: enabled=${status.enabled}, pool=${status.currentPoolSize}`);
   * });
   * ```
   */
  getAllStatus(): Map<string, PoolScalerStatus> {
    const statuses = new Map<string, PoolScalerStatus>();

    for (const [connectionId, scaler] of Array.from(this.scalers.entries())) {
      statuses.set(connectionId, scaler.getStatus());
    }

    return statuses;
  }

  /**
   * Get number of registered scalers
   *
   * @returns {number} Count of scalers
   *
   * @example
   * ```typescript
   * console.log(`Managing ${manager.getScalerCount()} connections`);
   * ```
   */
  getScalerCount(): number {
    return this.scalers.size;
  }

  /**
   * Check if manager is running
   *
   * @returns {boolean} True if running
   *
   * @example
   * ```typescript
   * if (!manager.isActive()) {
   *   await manager.startAll();
   * }
   * ```
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Singleton instance of PoolScalerManager
 *
 * @example
 * ```typescript
 * import { poolScalerManager } from '@infrastructure/database/poolScaler/PoolScalerManager';
 *
 * await poolScalerManager.registerConnection('DtsPrdEmp', connection);
 * await poolScalerManager.startAll();
 * ```
 */
export const poolScalerManager = new PoolScalerManager();
