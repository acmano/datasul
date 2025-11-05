// src/infrastructure/chaos/ChaosInjector.ts

/**
 * Chaos Engineering - Inject controlled failures for resilience testing
 *
 * @description
 * Sistema para injetar falhas controladas (latência, timeouts, erros) e validar
 * que retry, circuit breaker e outros mecanismos funcionam corretamente.
 *
 * **CRITICAL SAFETY RULES:**
 * - NEVER enable in production by default
 * - Requires explicit override to run in production
 * - Always log chaos activities
 * - Respects schedule and target configuration
 *
 * @module ChaosInjector
 * @since 2.0.0
 */

import { log } from '@shared/utils/logger';

/**
 * Types of chaos that can be injected
 */
export enum ChaosType {
  LATENCY = 'latency', // Add artificial delay
  TIMEOUT = 'timeout', // Force timeout error
  ERROR = 'error', // Throw random errors
  INTERMITTENT = 'intermittent', // Random failures
  POOL_EXHAUSTION = 'pool_exhaustion', // Exhaust connection pool
  SLOW_QUERY = 'slow_query', // Make queries slower
}

/**
 * Configuration for chaos experiment
 */
export interface ChaosConfig {
  /** Enable/disable experiment */
  enabled: boolean;

  /** Type of chaos to inject */
  type: ChaosType;

  /** Probability of injection (0.0 - 1.0) */
  probability: number;

  // Latency config
  /** Minimum latency in ms */
  minLatencyMs?: number;
  /** Maximum latency in ms */
  maxLatencyMs?: number;

  // Error config
  /** Types of errors to throw */
  errorTypes?: string[];
  /** Error message */
  errorMessage?: string;

  // Intermittent config
  /** Failure rate (0.0 - 1.0) */
  failureRate?: number;

  // Target connections
  /** List of connection IDs to target (or 'all') */
  targetConnections?: string[];

  // Schedule
  schedule?: {
    /** Start time HH:MM */
    startTime?: string;
    /** End time HH:MM */
    endTime?: string;
    /** Days of week (0-6, 0=Sunday) */
    daysOfWeek?: number[];
  };
}

/**
 * Statistics for chaos experiment
 */
export interface ChaosStats {
  /** Total number of calls intercepted */
  totalCalls: number;

  /** Number of times chaos was injected */
  chaosInjected: number;

  /** Number of failures injected */
  failuresInjected: number;

  /** Number of latency injections */
  latencyInjected: number;
}

/**
 * Chaos Injector - Central controller for chaos experiments
 *
 * @description
 * Manages chaos experiments and injects failures into database operations.
 * Thread-safe and respects configuration, schedule, and probability.
 *
 * @example Register latency experiment
 * ```typescript
 * chaosInjector.registerExperiment('latency-test', {
 *   enabled: true,
 *   type: ChaosType.LATENCY,
 *   probability: 0.3,
 *   minLatencyMs: 1000,
 *   maxLatencyMs: 3000,
 *   targetConnections: ['DtsPrdEmp']
 * });
 * ```
 *
 * @example Inject chaos before operation
 * ```typescript
 * const result = await chaosInjector.injectChaos('DtsPrdEmp', async () => {
 *   return await connection.query('SELECT * FROM item');
 * });
 * ```
 */
export class ChaosInjector {
  /** Registered experiments */
  private configs: Map<string, ChaosConfig> = new Map();

  /** Statistics per experiment */
  private stats: Map<string, ChaosStats> = new Map();

  /**
   * Register chaos experiment
   *
   * @param name - Unique experiment name
   * @param config - Experiment configuration
   *
   * @example
   * ```typescript
   * chaosInjector.registerExperiment('test-retry', {
   *   enabled: true,
   *   type: ChaosType.INTERMITTENT,
   *   probability: 0.5,
   *   failureRate: 0.6,
   *   targetConnections: ['DtsPrdEmp']
   * });
   * ```
   */
  registerExperiment(name: string, config: ChaosConfig): void {
    if (!config.enabled) {
      log.info('Chaos experiment disabled', { name });
      return;
    }

    // Safety check: prevent production accidents
    if (process.env.NODE_ENV === 'production' && !process.env.CHAOS_PRODUCTION_OVERRIDE) {
      throw new Error(
        'CHAOS ENGINEERING BLOCKED IN PRODUCTION! ' +
          'Set CHAOS_PRODUCTION_OVERRIDE=true to explicitly allow (dangerous!)'
      );
    }

    this.configs.set(name, config);
    this.stats.set(name, {
      totalCalls: 0,
      chaosInjected: 0,
      failuresInjected: 0,
      latencyInjected: 0,
    });

    log.warn('⚠️ CHAOS EXPERIMENT REGISTERED', {
      name,
      type: config.type,
      probability: config.probability,
      targets: config.targetConnections || 'all',
    });
  }

  /**
   * Unregister experiment
   *
   * @param name - Experiment name
   */
  unregisterExperiment(name: string): void {
    this.configs.delete(name);
    this.stats.delete(name);
    log.info('Chaos experiment removed', { name });
  }

  /**
   * Inject chaos before query execution
   *
   * @param connectionId - Connection ID (DSN)
   * @param operation - Operation to execute (with potential chaos)
   * @returns Result of operation
   *
   * @description
   * Wraps operation with chaos injection. Checks all active experiments
   * and injects chaos based on probability and configuration.
   *
   * @example
   * ```typescript
   * const result = await chaosInjector.injectChaos('DtsPrdEmp', async () => {
   *   return await connection.queryWithParams('SELECT * FROM item', []);
   * });
   * ```
   */
  async injectChaos<T>(connectionId: string, operation: () => Promise<T>): Promise<T> {
    // Find active experiments for this connection
    const activeExperiments = this.getActiveExperiments(connectionId);

    if (activeExperiments.length === 0) {
      return operation();
    }

    // Apply chaos from each experiment
    for (const [name, config] of activeExperiments) {
      const stats = this.stats.get(name)!;
      stats.totalCalls++;

      // Check probability
      if (Math.random() > config.probability) {
        continue; // Skip this time
      }

      stats.chaosInjected++;

      // Inject chaos based on type
      switch (config.type) {
        case ChaosType.LATENCY:
          await this.injectLatency(config, name);
          stats.latencyInjected++;
          break;

        case ChaosType.TIMEOUT:
          await this.injectTimeout(config, name);
          stats.failuresInjected++;
          break;

        case ChaosType.ERROR:
          this.injectError(config, name);
          stats.failuresInjected++;
          break;

        case ChaosType.INTERMITTENT:
          await this.injectIntermittent(config, name, operation);
          break;

        case ChaosType.POOL_EXHAUSTION:
          await this.injectPoolExhaustion(config, name);
          stats.failuresInjected++;
          break;

        case ChaosType.SLOW_QUERY:
          return this.injectSlowQuery(config, name, operation);
      }
    }

    // Execute original operation
    return operation();
  }

  // ============================================================================
  // CHAOS INJECTION IMPLEMENTATIONS
  // ============================================================================

  /**
   * Inject artificial latency
   *
   * @private
   */
  private async injectLatency(config: ChaosConfig, name: string): Promise<void> {
    const min = config.minLatencyMs || 500;
    const max = config.maxLatencyMs || 2000;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;

    log.warn('💥 CHAOS: Injecting latency', { experiment: name, delayMs: delay });
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Inject timeout error
   *
   * @private
   */
  private async injectTimeout(config: ChaosConfig, name: string): Promise<void> {
    log.warn('💥 CHAOS: Injecting timeout', { experiment: name });
    const error: any = new Error('ETIMEDOUT - Chaos injected timeout');
    error.code = 'ETIMEDOUT';
    throw error;
  }

  /**
   * Inject random error
   *
   * @private
   */
  private injectError(config: ChaosConfig, name: string): void {
    const errorTypes = config.errorTypes || ['ECONNREFUSED', 'ETIMEDOUT'];
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];

    log.warn('💥 CHAOS: Injecting error', { experiment: name, errorType });

    const error: any = new Error(config.errorMessage || `${errorType} - Chaos injected error`);
    error.code = errorType;
    throw error;
  }

  /**
   * Inject intermittent failure
   *
   * @private
   */
  private async injectIntermittent<T>(
    config: ChaosConfig,
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const failureRate = config.failureRate || 0.3;

    if (Math.random() < failureRate) {
      log.warn('💥 CHAOS: Intermittent failure', { experiment: name });
      throw new Error('Intermittent failure - Chaos injected');
    }

    return operation();
  }

  /**
   * Inject pool exhaustion (hold connection for long time)
   *
   * @private
   */
  private async injectPoolExhaustion(config: ChaosConfig, name: string): Promise<void> {
    log.warn('💥 CHAOS: Pool exhaustion', { experiment: name });
    // Hold connection for long time
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }

  /**
   * Inject slow query
   *
   * @private
   */
  private async injectSlowQuery<T>(
    config: ChaosConfig,
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const delay = config.minLatencyMs || 1000;
    log.warn('💥 CHAOS: Slow query', { experiment: name, delayMs: delay });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return operation();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get active experiments for connection
   *
   * @private
   */
  private getActiveExperiments(connectionId: string): [string, ChaosConfig][] {
    const now = new Date();
    const active: [string, ChaosConfig][] = [];

    for (const [name, config] of this.configs) {
      if (!config.enabled) continue;

      // Check target connections
      if (config.targetConnections && config.targetConnections.length > 0) {
        if (
          !config.targetConnections.includes(connectionId) &&
          !config.targetConnections.includes('all')
        ) {
          continue;
        }
      }

      // Check schedule
      if (config.schedule) {
        if (!this.isInSchedule(now, config.schedule)) {
          continue;
        }
      }

      active.push([name, config]);
    }

    return active;
  }

  /**
   * Check if current time is within schedule
   *
   * @private
   */
  private isInSchedule(now: Date, schedule: ChaosConfig['schedule']): boolean {
    if (!schedule) return true;

    // Check day of week
    if (schedule.daysOfWeek) {
      const day = now.getDay();
      if (!schedule.daysOfWeek.includes(day)) return false;
    }

    // Check time range
    if (schedule.startTime && schedule.endTime) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get experiment statistics
   *
   * @param name - Experiment name (optional, returns all if not provided)
   * @returns Statistics
   *
   * @example Get all stats
   * ```typescript
   * const allStats = chaosInjector.getStats();
   * ```
   *
   * @example Get specific experiment stats
   * ```typescript
   * const stats = chaosInjector.getStats('test-retry');
   * console.log(`Chaos injected: ${stats.chaosInjected} times`);
   * ```
   */
  getStats(name?: string): Map<string, ChaosStats> | ChaosStats | undefined {
    if (name) {
      return this.stats.get(name);
    }
    return this.stats;
  }

  /**
   * Reset statistics
   *
   * @param name - Experiment name (optional, resets all if not provided)
   *
   * @example Reset all stats
   * ```typescript
   * chaosInjector.resetStats();
   * ```
   *
   * @example Reset specific experiment
   * ```typescript
   * chaosInjector.resetStats('test-retry');
   * ```
   */
  resetStats(name?: string): void {
    if (name) {
      const stats = this.stats.get(name);
      if (stats) {
        stats.totalCalls = 0;
        stats.chaosInjected = 0;
        stats.failuresInjected = 0;
        stats.latencyInjected = 0;
      }
    } else {
      this.stats.forEach((stats) => {
        stats.totalCalls = 0;
        stats.chaosInjected = 0;
        stats.failuresInjected = 0;
        stats.latencyInjected = 0;
      });
    }
  }

  /**
   * Get all active experiments
   *
   * @returns List of active experiment names
   *
   * @example
   * ```typescript
   * const active = chaosInjector.getActiveExperimentsList();
   * console.log(`Active experiments: ${active.join(', ')}`);
   * ```
   */
  getActiveExperimentsList(): string[] {
    return Array.from(this.configs.keys()).filter((name) => this.configs.get(name)?.enabled);
  }

  /**
   * Check if chaos is enabled
   *
   * @returns True if any experiment is active
   */
  isEnabled(): boolean {
    return this.getActiveExperimentsList().length > 0;
  }
}

/**
 * Singleton instance
 */
export const chaosInjector = new ChaosInjector();
