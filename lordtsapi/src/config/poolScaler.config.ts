// src/config/poolScaler.config.ts

/**
 * @fileoverview Pool Auto-Scaler Configuration
 *
 * Centralized configuration for pool auto-scaling behavior.
 * Provides default configs and connection-specific overrides.
 *
 * @module config/poolScaler
 */

import { PoolScalerConfig } from '@infrastructure/database/poolScaler/types';

/**
 * Default pool scaler configuration
 *
 * @description
 * Conservative defaults suitable for most connections.
 * Can be overridden per connection in SCALER_CONFIGS.
 */
export const DEFAULT_SCALER_CONFIG: Omit<PoolScalerConfig, 'connectionId'> = {
  minPoolSize: Number(process.env.POOL_SCALER_MIN_SIZE) || 2,
  maxPoolSize: Number(process.env.POOL_SCALER_MAX_SIZE) || 20,
  scaleUpThreshold: 0.85, // 85% utilization
  scaleDownThreshold: 0.3, // 30% utilization
  scaleUpFactor: 1.5, // Increase by 50%
  scaleDownFactor: 0.7, // Decrease by 30%
  scaleUpDuration: 5 * 60 * 1000, // 5 minutes
  scaleDownDuration: 15 * 60 * 1000, // 15 minutes
  cooldownPeriod: Number(process.env.POOL_SCALER_COOLDOWN) || 5 * 60 * 1000, // 5 minutes
  queueLengthThreshold: 10,
  avgWaitTimeThreshold: 500, // 500ms
  idleThreshold: 0.7, // 70% idle
  enabled: process.env.POOL_SCALER_ENABLED !== 'false', // Default enabled unless explicitly disabled
};

/**
 * Connection-specific scaler configurations
 *
 * @description
 * Override default config for specific connections that need
 * different scaling behavior (e.g., high-traffic production DBs).
 *
 * @example
 * ```typescript
 * // Production Datasul EMP needs more aggressive scaling
 * SCALER_CONFIGS.set('DtsPrdEmp', {
 *   minPoolSize: 5,
 *   maxPoolSize: 50,
 *   scaleUpThreshold: 0.75,
 *   scaleUpDuration: 2 * 60 * 1000, // 2 minutes
 * });
 * ```
 */
export const SCALER_CONFIGS = new Map<string, Partial<Omit<PoolScalerConfig, 'connectionId'>>>();

// ============================================================================
// PRODUCTION CONNECTIONS - Aggressive scaling for high-traffic databases
// ============================================================================

// Datasul Production EMP - Main business database (high traffic expected)
SCALER_CONFIGS.set('DtsPrdEmp', {
  minPoolSize: 5,
  maxPoolSize: 50,
  scaleUpThreshold: 0.75, // Scale up earlier
  scaleUpDuration: 3 * 60 * 1000, // 3 minutes (faster response)
  cooldownPeriod: 3 * 60 * 1000, // 3 minutes
});

// Datasul Production MULT - Multi-company database (moderate traffic)
SCALER_CONFIGS.set('DtsPrdMult', {
  minPoolSize: 3,
  maxPoolSize: 30,
  scaleUpThreshold: 0.8,
  scaleUpDuration: 4 * 60 * 1000, // 4 minutes
});

// PCFactory Production - Manufacturing system (critical)
SCALER_CONFIGS.set('PCF4_PRD', {
  minPoolSize: 4,
  maxPoolSize: 40,
  scaleUpThreshold: 0.75,
  scaleUpDuration: 3 * 60 * 1000,
  cooldownPeriod: 3 * 60 * 1000,
});

// Informix Production - Legacy system (moderate traffic)
SCALER_CONFIGS.set('LgxPrd', {
  minPoolSize: 3,
  maxPoolSize: 25,
  scaleUpThreshold: 0.8,
});

// ============================================================================
// TEST/DEVELOPMENT CONNECTIONS - Conservative scaling (cost-effective)
// ============================================================================

// Test environments don't need aggressive scaling
SCALER_CONFIGS.set('DtsTstEmp', {
  minPoolSize: 2,
  maxPoolSize: 10,
  scaleUpThreshold: 0.9, // Higher threshold
  scaleDownThreshold: 0.2, // More aggressive scale down
});

SCALER_CONFIGS.set('DtsTstMult', {
  minPoolSize: 2,
  maxPoolSize: 10,
  scaleUpThreshold: 0.9,
  scaleDownThreshold: 0.2,
});

// Development environments - minimal resources
SCALER_CONFIGS.set('LgxDev', {
  minPoolSize: 1,
  maxPoolSize: 5,
  scaleUpThreshold: 0.95,
  scaleDownThreshold: 0.15,
  enabled: false, // Disable auto-scaling in dev by default
});

SCALER_CONFIGS.set('PCF4_DEV', {
  minPoolSize: 1,
  maxPoolSize: 5,
  scaleUpThreshold: 0.95,
  enabled: false, // Disable auto-scaling in dev by default
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get pool scaler configuration for a connection
 *
 * @param {string} connectionId - Connection identifier (DSN)
 * @returns {PoolScalerConfig} Complete configuration (merged with defaults)
 *
 * @example
 * ```typescript
 * const config = getPoolScalerConfig('DtsPrdEmp');
 * console.log(config.maxPoolSize); // 50 (from override)
 * console.log(config.scaleDownFactor); // 0.7 (from default)
 * ```
 */
export function getPoolScalerConfig(connectionId: string): PoolScalerConfig {
  const connectionOverrides = SCALER_CONFIGS.get(connectionId) || {};

  return {
    connectionId,
    ...DEFAULT_SCALER_CONFIG,
    ...connectionOverrides,
  };
}

/**
 * Check if auto-scaling is enabled globally
 *
 * @returns {boolean} True if enabled via environment variable
 *
 * @example
 * ```typescript
 * if (isPoolScalerEnabled()) {
 *   poolScalerWorker.start();
 * }
 * ```
 */
export function isPoolScalerEnabled(): boolean {
  return process.env.POOL_SCALER_ENABLED !== 'false';
}

/**
 * Get check interval for pool scaler worker
 *
 * @returns {number} Interval in milliseconds
 *
 * @example
 * ```typescript
 * setInterval(() => {
 *   checkAllPools();
 * }, getPoolScalerCheckInterval());
 * ```
 */
export function getPoolScalerCheckInterval(): number {
  return Number(process.env.POOL_SCALER_CHECK_INTERVAL) || 60000; // Default: 1 minute
}
