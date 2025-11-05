// src/infrastructure/chaos/experiments.ts

/**
 * Predefined chaos experiments
 *
 * @description
 * Collection of ready-to-use chaos experiments for common scenarios.
 * These can be enabled/disabled via API or configuration.
 *
 * @module ChaosExperiments
 * @since 2.0.0
 */

import { ChaosType, ChaosConfig } from './ChaosInjector';

/**
 * Predefined chaos experiments
 *
 * @description
 * Each experiment tests a specific resilience mechanism:
 * - testRetry: Validates retry logic
 * - testCircuitBreaker: Validates circuit breaker
 * - testLatency: Validates latency tolerance
 * - businessHoursChaos: Low-level chaos during business hours
 * - testPoolExhaustion: Validates connection pool management
 * - testIntermittent: Validates handling of flaky connections
 */
export const chaosExperiments: Record<string, ChaosConfig> = {
  /**
   * Test retry logic
   *
   * @description
   * Injects intermittent failures to validate retry mechanism.
   * 50% of queries will be intercepted, 60% of those will fail.
   * Expected: System should retry and eventually succeed.
   */
  testRetry: {
    enabled: false,
    type: ChaosType.INTERMITTENT,
    probability: 0.5,
    failureRate: 0.6,
    targetConnections: ['DtsPrdEmp'],
  },

  /**
   * Test circuit breaker
   *
   * @description
   * Forces all queries to fail with ETIMEDOUT to trigger circuit breaker.
   * Expected: Circuit breaker should open after threshold failures.
   */
  testCircuitBreaker: {
    enabled: false,
    type: ChaosType.ERROR,
    probability: 1.0,
    errorTypes: ['ETIMEDOUT'],
    targetConnections: ['PCF4_PRD'],
  },

  /**
   * Test latency tolerance
   *
   * @description
   * Adds 1-3 second latency to 30% of queries.
   * Expected: System should handle slow responses gracefully.
   */
  testLatency: {
    enabled: false,
    type: ChaosType.LATENCY,
    probability: 0.3,
    minLatencyMs: 1000,
    maxLatencyMs: 3000,
    targetConnections: ['all'],
  },

  /**
   * Business hours chaos (low-level)
   *
   * @description
   * Low-level chaos during business hours (9am-6pm, Mon-Fri).
   * 10% of queries intercepted, 20% of those fail.
   * Expected: System remains stable with occasional errors.
   */
  businessHoursChaos: {
    enabled: false,
    type: ChaosType.INTERMITTENT,
    probability: 0.1,
    failureRate: 0.2,
    schedule: {
      startTime: '09:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
  },

  /**
   * Test pool exhaustion
   *
   * @description
   * Holds connections for 30 seconds to exhaust pool.
   * Expected: Pool management should handle gracefully.
   */
  testPoolExhaustion: {
    enabled: false,
    type: ChaosType.POOL_EXHAUSTION,
    probability: 0.1,
    targetConnections: ['DtsPrdEmp'],
  },

  /**
   * Test intermittent connection
   *
   * @description
   * Simulates flaky connection with random failures.
   * 40% of queries fail randomly.
   * Expected: System retries and circuit breaker prevents cascading failures.
   */
  testIntermittent: {
    enabled: false,
    type: ChaosType.INTERMITTENT,
    probability: 1.0,
    failureRate: 0.4,
    targetConnections: ['DtsTstEmp'],
  },

  /**
   * Test slow queries under load
   *
   * @description
   * Makes 50% of queries slow (2-5 seconds).
   * Expected: Timeouts work correctly, no deadlocks.
   */
  testSlowQueries: {
    enabled: false,
    type: ChaosType.SLOW_QUERY,
    probability: 0.5,
    minLatencyMs: 2000,
    maxLatencyMs: 5000,
    targetConnections: ['all'],
  },

  /**
   * Weekend chaos testing
   *
   * @description
   * High-intensity chaos during weekends for testing.
   * 50% failure rate on Saturdays and Sundays.
   */
  weekendChaos: {
    enabled: false,
    type: ChaosType.INTERMITTENT,
    probability: 0.5,
    failureRate: 0.5,
    schedule: {
      daysOfWeek: [0, 6], // Sunday and Saturday
    },
  },

  /**
   * Test all error types
   *
   * @description
   * Injects various error types to test error handling.
   * Expected: System logs errors correctly and retries appropriately.
   */
  testErrorHandling: {
    enabled: false,
    type: ChaosType.ERROR,
    probability: 0.3,
    errorTypes: ['ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH'],
    errorMessage: 'Chaos: Testing error handling',
    targetConnections: ['all'],
  },
};

/**
 * Get experiment by name
 *
 * @param name - Experiment name
 * @returns Experiment configuration or undefined
 *
 * @example
 * ```typescript
 * const config = getExperiment('testRetry');
 * if (config) {
 *   chaosInjector.registerExperiment('testRetry', config);
 * }
 * ```
 */
export function getExperiment(name: string): ChaosConfig | undefined {
  return chaosExperiments[name];
}

/**
 * Get all experiment names
 *
 * @returns List of experiment names
 *
 * @example
 * ```typescript
 * const names = getExperimentNames();
 * console.log(`Available experiments: ${names.join(', ')}`);
 * ```
 */
export function getExperimentNames(): string[] {
  return Object.keys(chaosExperiments);
}

/**
 * Get experiments by type
 *
 * @param type - Chaos type
 * @returns List of experiment names matching type
 *
 * @example
 * ```typescript
 * const latencyTests = getExperimentsByType(ChaosType.LATENCY);
 * console.log(`Latency experiments: ${latencyTests.join(', ')}`);
 * ```
 */
export function getExperimentsByType(type: ChaosType): string[] {
  return Object.entries(chaosExperiments)
    .filter(([_, config]) => config.type === type)
    .map(([name, _]) => name);
}
