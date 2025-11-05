// src/infrastructure/database/__tests__/connections.health.test.ts

/**
 * @fileoverview Health check test for all 28 database connections
 *
 * This test validates that all configured connections can be established
 * and execute a simple query. It's meant to be run manually during setup
 * or deployment to verify all database credentials and network access.
 *
 * Total Connections: 28
 * - 18 Datasul ODBC (3 environments x 6 databases)
 * - 4 Informix ODBC (4 environments)
 * - 6 SQL Server (PCFactory + Corporativo, 2 environments each)
 *
 * @group health
 * @group integration
 */

import { DatabaseManager } from '../DatabaseManager';
import { AVAILABLE_CONNECTIONS } from '@config/connections.config';
import { log } from '@shared/utils/logger';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface HealthCheckResult {
  dsn: string;
  description: string;
  systemType: string;
  environment: string;
  purpose?: string;
  connected: boolean;
  responseTime?: number;
  error?: string;
  hostname?: string;
  port?: number;
}

interface HealthCheckSummary {
  total: number;
  healthy: number;
  unhealthy: number;
  healthPercentage: number;
  bySystem: {
    datasul: { total: number; healthy: number; unhealthy: number };
    informix: { total: number; healthy: number; unhealthy: number };
    sqlserver: { total: number; healthy: number; unhealthy: number };
  };
  slowestConnections: Array<{
    dsn: string;
    description: string;
    responseTime: number;
  }>;
  failedConnections: Array<{
    dsn: string;
    description: string;
    error: string;
  }>;
  averageResponseTime: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Test connection with retry and timeout
 */
async function testConnection(
  dsn: string,
  description: string,
  systemType: string,
  environment: string,
  purpose?: string,
  hostname?: string,
  port?: number,
  retries: number = 1,
  timeout: number = 10000
): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    dsn,
    description,
    systemType,
    environment,
    purpose,
    connected: false,
    hostname,
    port,
  };

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
      });

      // Query based on system type
      const queryPromise =
        systemType === 'sqlserver'
          ? DatabaseManager.queryWithConnection(dsn, 'SELECT 1 as health', [])
          : DatabaseManager.queryWithConnection(
              dsn,
              'SELECT 1 as health FROM SYSIBM.SYSDUMMY1',
              []
            );

      // Race between query and timeout
      await Promise.race([queryPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;

      result.connected = true;
      result.responseTime = responseTime;

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // If not the last attempt, wait before retry
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // All retries failed
  result.connected = false;
  result.error = lastError?.message || 'Unknown error';

  return result;
}

/**
 * Generate summary report from health check results
 */
function generateSummary(results: HealthCheckResult[]): HealthCheckSummary {
  const healthy = results.filter((r) => r.connected);
  const unhealthy = results.filter((r) => !r.connected);

  const datasulResults = results.filter((r) => r.systemType === 'datasul');
  const informixResults = results.filter((r) => r.systemType === 'informix');
  const sqlserverResults = results.filter((r) => r.systemType === 'sqlserver');

  const healthyResponseTimes = healthy
    .map((r) => r.responseTime)
    .filter((t): t is number => t !== undefined);

  const averageResponseTime =
    healthyResponseTimes.length > 0
      ? healthyResponseTimes.reduce((a, b) => a + b, 0) / healthyResponseTimes.length
      : 0;

  // Find slowest connections (top 5)
  const slowest = healthy
    .filter((r) => r.responseTime !== undefined)
    .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
    .slice(0, 5)
    .map((r) => ({
      dsn: r.dsn,
      description: r.description,
      responseTime: r.responseTime || 0,
    }));

  return {
    total: results.length,
    healthy: healthy.length,
    unhealthy: unhealthy.length,
    healthPercentage: (healthy.length / results.length) * 100,
    bySystem: {
      datasul: {
        total: datasulResults.length,
        healthy: datasulResults.filter((r) => r.connected).length,
        unhealthy: datasulResults.filter((r) => !r.connected).length,
      },
      informix: {
        total: informixResults.length,
        healthy: informixResults.filter((r) => r.connected).length,
        unhealthy: informixResults.filter((r) => !r.connected).length,
      },
      sqlserver: {
        total: sqlserverResults.length,
        healthy: sqlserverResults.filter((r) => r.connected).length,
        unhealthy: sqlserverResults.filter((r) => !r.connected).length,
      },
    },
    slowestConnections: slowest,
    failedConnections: unhealthy.map((r) => ({
      dsn: r.dsn,
      description: r.description,
      error: r.error || 'Unknown error',
    })),
    averageResponseTime,
  };
}

/**
 * Print summary report
 */
function printSummary(summary: HealthCheckSummary): void {
  console.log('\n========================================');
  console.log('Database Connection Health Check Report');
  console.log('========================================\n');

  console.log(`Total Connections: ${summary.total}`);
  console.log(`Healthy: ${summary.healthy} (${summary.healthPercentage.toFixed(2)}%)`);
  console.log(`Unhealthy: ${summary.unhealthy}\n`);

  console.log('By System:');
  console.log(
    `  Datasul:    ${summary.bySystem.datasul.healthy}/${summary.bySystem.datasul.total} (${((summary.bySystem.datasul.healthy / summary.bySystem.datasul.total) * 100).toFixed(2)}%)`
  );
  console.log(
    `  Informix:   ${summary.bySystem.informix.healthy}/${summary.bySystem.informix.total} (${((summary.bySystem.informix.healthy / summary.bySystem.informix.total) * 100).toFixed(2)}%)`
  );
  console.log(
    `  SQL Server: ${summary.bySystem.sqlserver.healthy}/${summary.bySystem.sqlserver.total} (${((summary.bySystem.sqlserver.healthy / summary.bySystem.sqlserver.total) * 100).toFixed(2)}%)\n`
  );

  if (summary.failedConnections.length > 0) {
    console.log('Failed Connections:');
    summary.failedConnections.forEach((conn) => {
      console.log(`  ${conn.dsn} - ${conn.description}`);
      console.log(`    Error: ${conn.error}`);
    });
    console.log('');
  }

  if (summary.slowestConnections.length > 0) {
    console.log('Slowest Connections:');
    summary.slowestConnections.forEach((conn, idx) => {
      console.log(`  ${idx + 1}. ${conn.dsn} - ${conn.responseTime}ms`);
    });
    console.log('');
  }

  console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
  console.log('========================================\n');
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Database Connections Health Check', () => {
  let allResults: HealthCheckResult[] = [];

  beforeAll(async () => {
    await DatabaseManager.initialize();
  });

  afterAll(async () => {
    // Print final summary
    const summary = generateSummary(allResults);
    printSummary(summary);

    // Close all connections
    await DatabaseManager.close();
  });

  // ========================================================================
  // DATASUL CONNECTIONS (18 total)
  // ========================================================================

  describe('Datasul Connections (18 total)', () => {
    // PRODUCTION (6)
    describe('Production Environment (6)', () => {
      test('DtsPrdEmp should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.production.emp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsPrdMult should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.production.mult;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsPrdAdt should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.production.adt;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsPrdEsp should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.production.esp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsPrdEms5 should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.production.ems5;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsPrdFnd should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.production.fnd;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });
    });

    // TEST (6)
    describe('Test Environment (6)', () => {
      test('DtsTstEmp should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.test.emp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsTstMult should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.test.mult;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsTstAdt should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.test.adt;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsTstEsp should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.test.esp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsTstEms5 should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.test.ems5;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsTstFnd should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.test.fnd;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });
    });

    // HOMOLOGATION (6)
    describe('Homologation Environment (6)', () => {
      test('DtsHmlEmp should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.homologation.emp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsHmlMult should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.homologation.mult;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsHmlAdt should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.homologation.adt;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsHmlEsp should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.homologation.esp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsHmlEms5 should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.homologation.ems5;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DtsHmlFnd should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.datasul.homologation.fnd;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          config.purpose,
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });
    });
  });

  // ========================================================================
  // INFORMIX CONNECTIONS (4 total)
  // ========================================================================

  describe('Informix Connections (4 total)', () => {
    test('LgxPrd should connect', async () => {
      const config = AVAILABLE_CONNECTIONS.informix.production.logix;
      const result = await testConnection(
        config.dsn,
        config.description,
        config.systemType,
        config.environment,
        undefined,
        config.hostname,
        config.port
      );

      allResults.push(result);

      expect(result.connected).toBe(true);
      if (result.responseTime) {
        expect(result.responseTime).toBeLessThan(10000);
      }
    });

    test('LgxDev should connect', async () => {
      const config = AVAILABLE_CONNECTIONS.informix.development.logix;
      const result = await testConnection(
        config.dsn,
        config.description,
        config.systemType,
        config.environment,
        undefined,
        config.hostname,
        config.port
      );

      allResults.push(result);

      expect(result.connected).toBe(true);
      if (result.responseTime) {
        expect(result.responseTime).toBeLessThan(10000);
      }
    });

    test('LgxAtu should connect', async () => {
      const config = AVAILABLE_CONNECTIONS.informix.atualização.logix;
      const result = await testConnection(
        config.dsn,
        config.description,
        config.systemType,
        config.environment,
        undefined,
        config.hostname,
        config.port
      );

      allResults.push(result);

      expect(result.connected).toBe(true);
      if (result.responseTime) {
        expect(result.responseTime).toBeLessThan(10000);
      }
    });

    test('LgxNew should connect', async () => {
      const config = AVAILABLE_CONNECTIONS.informix.new.logix;
      const result = await testConnection(
        config.dsn,
        config.description,
        config.systemType,
        config.environment,
        undefined,
        config.hostname,
        config.port
      );

      allResults.push(result);

      expect(result.connected).toBe(true);
      if (result.responseTime) {
        expect(result.responseTime).toBeLessThan(10000);
      }
    });
  });

  // ========================================================================
  // SQL SERVER CONNECTIONS (6 total)
  // ========================================================================

  describe('SQL Server Connections (6 total)', () => {
    describe('PCFactory', () => {
      test('PCF4_PRD should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.pcfactory.production.sistema;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          'sistema',
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('PCF_Integ_PRD should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.pcfactory.production.integracao;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          'integracao',
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('PCF4_DEV should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.pcfactory.development.sistema;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          'sistema',
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('PCF_Integ_DEV should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.pcfactory.development.integracao;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          'integracao',
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });
    });

    describe('Corporativo', () => {
      test('DATACORP_PRD should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.corporativo.production.datacorp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          'datacorp',
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });

      test('DATACORP_DEV should connect', async () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.corporativo.development.datacorp;
        const result = await testConnection(
          config.dsn,
          config.description,
          config.systemType,
          config.environment,
          'datacorp',
          config.hostname,
          config.port
        );

        allResults.push(result);

        expect(result.connected).toBe(true);
        if (result.responseTime) {
          expect(result.responseTime).toBeLessThan(10000);
        }
      });
    });
  });

  // ========================================================================
  // QUERY BY CONTEXT HEALTH (SYNTAX SUGAR HELPERS)
  // ========================================================================

  describe('queryByContext Health', () => {
    test('should query via pcfactory.sistema helper', async () => {
      const result = await DatabaseManager.pcfactory.sistema.query('SELECT 1 as health');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should query via pcfactory.integracao helper', async () => {
      const result = await DatabaseManager.pcfactory.integracao.query('SELECT 1 as health');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should query via corporativo helper', async () => {
      const result = await DatabaseManager.corporativo.query('SELECT 1 as health');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should query via datasul helper (emp)', async () => {
      const result = await DatabaseManager.datasul('emp').query(
        'SELECT 1 as health FROM SYSIBM.SYSDUMMY1'
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should query via informix helper', async () => {
      const result = await DatabaseManager.informix('production').query(
        'SELECT 1 as health FROM SYSIBM.SYSDUMMY1'
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
