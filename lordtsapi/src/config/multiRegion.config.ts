// src/config/multiRegion.config.ts

/**
 * Multi-region connection groups configuration
 *
 * @module config/multiRegion.config
 *
 * @description
 * Defines connection groups with multiple regions for automatic failover.
 * Each group has a primary region and one or more backup regions.
 *
 * @example
 * ```typescript
 * import { connectionGroups } from '@config/multiRegion.config';
 *
 * // Auto-registers all groups
 * // Use via DatabaseManager.queryWithFailover()
 * ```
 */

import { connectionGroupRegistry } from '@infrastructure/database/multiRegion/ConnectionGroups';
import { ConnectionGroup, RegionPriority } from '@infrastructure/database/multiRegion/types';
import { log } from '@shared/utils/logger';

/**
 * Connection groups with multi-region failover
 *
 * @description
 * IMPORTANT: This configuration assumes you have replica databases configured.
 * The DSN names used here (like DtsPrdEmpRJ, DtsPrdEmpSC) are EXAMPLES.
 *
 * To use this system in production:
 * 1. Configure database replication (master-slave or multi-master)
 * 2. Add replica DSNs to /etc/odbc.ini
 * 3. Add replica configs to connections.config.ts
 * 4. Test connectivity to all replicas
 * 5. Update the connectionGroups below with actual DSN names
 *
 * @example Datasul EMP with multi-region
 * This assumes you have:
 * - DtsPrdEmp: Primary in São Paulo
 * - DtsPrdEmpRJ: Replica in Rio de Janeiro (read-only)
 * - DtsPrdEmpSC: Replica in Santa Catarina (read-only)
 */
export const connectionGroups: ConnectionGroup[] = [
  // ============================================
  // EXAMPLE: Datasul EMP - Multi-region
  // ============================================
  // NOTE: Disabled by default - replica DSNs don't exist yet
  // Uncomment and configure when replicas are ready
  /*
  {
    groupId: 'datasul-emp',
    description: 'Datasul Empresa database with multi-region failover',
    regions: [
      {
        connectionId: 'DtsPrdEmp',
        region: 'sao-paulo',
        priority: RegionPriority.PRIMARY,
        latencyMs: 10,
        readOnly: false,
      },
      {
        connectionId: 'DtsPrdEmpRJ', // TODO: Create this DSN + replica
        region: 'rio-janeiro',
        priority: RegionPriority.SECONDARY,
        latencyMs: 50,
        readOnly: true,
      },
      {
        connectionId: 'DtsPrdEmpSC', // TODO: Create this DSN + replica
        region: 'santa-catarina',
        priority: RegionPriority.TERTIARY,
        latencyMs: 80,
        readOnly: true,
      },
    ],
    currentRegion: 'DtsPrdEmp',
    failoverPolicy: {
      maxFailures: 5,
      failureWindow: 60000, // 1 minute
      healthCheckInterval: 30000, // 30 seconds
      failbackDelay: 300000, // 5 minutes
      autoFailback: true,
    },
  },
  */
  // ============================================
  // EXAMPLE: PCFactory - Disaster Recovery
  // ============================================
  // NOTE: Disabled by default - DR site doesn't exist yet
  // Uncomment and configure when DR is ready
  /*
  {
    groupId: 'pcfactory-sistema',
    description: 'PCFactory Sistema with DR failover',
    regions: [
      {
        connectionId: 'PCF4_PRD',
        region: 'primary',
        priority: RegionPriority.PRIMARY,
        readOnly: false,
      },
      {
        connectionId: 'PCF4_PRD_DR', // TODO: Create this DSN + DR site
        region: 'dr-site',
        priority: RegionPriority.SECONDARY,
        readOnly: false, // Full replica, not read-only
      },
    ],
    currentRegion: 'PCF4_PRD',
    failoverPolicy: {
      maxFailures: 3,
      failureWindow: 30000, // 30 seconds
      healthCheckInterval: 60000, // 1 minute
      failbackDelay: 600000, // 10 minutes
      autoFailback: false, // Manual failback for critical system
    },
  },
  */
];

/**
 * Check if multi-region is enabled
 */
export const isMultiRegionEnabled = (): boolean => {
  return process.env.MULTI_REGION_ENABLED === 'true';
};

/**
 * Auto-register all connection groups
 *
 * @description
 * Registers all configured groups on module load.
 * Only registers if MULTI_REGION_ENABLED=true in .env
 */
if (isMultiRegionEnabled()) {
  if (connectionGroups.length === 0) {
    log.warn('Multi-region enabled but no connection groups configured');
  } else {
    connectionGroups.forEach((group) => {
      try {
        connectionGroupRegistry.registerGroup(group);
      } catch (error) {
        log.error('Failed to register connection group', {
          groupId: group.groupId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    log.info(`Multi-region failover enabled with ${connectionGroups.length} groups`);
  }
} else {
  log.info('Multi-region failover disabled (set MULTI_REGION_ENABLED=true to enable)');
}
