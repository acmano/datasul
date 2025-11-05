// tests/setup/testcontainers.setup.ts

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

/**
 * Test Containers Setup
 *
 * Gerencia containers Docker para testes de integração isolados.
 * Evita dependência de serviços externos rodando localmente.
 *
 * Containers disponíveis:
 * - Redis (cache)
 * - SQL Server (database)
 */

let redisContainer: StartedTestContainer | null = null;
let sqlServerContainer: StartedTestContainer | null = null;

export interface TestContainersConfig {
  redis: {
    host: string;
    port: number;
  };
  sqlServer: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

/**
 * Inicializa Redis Container
 */
async function startRedisContainer(): Promise<void> {
  console.log('🐳 Starting Redis container...');

  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();

  const redisPort = redisContainer.getMappedPort(6379);
  const redisHost = redisContainer.getHost();

  console.log(`✅ Redis running at ${redisHost}:${redisPort}`);

  // Configurar env vars para os testes
  process.env.REDIS_HOST = redisHost;
  process.env.REDIS_PORT = String(redisPort);
}

/**
 * Inicializa SQL Server Container
 */
async function startSqlServerContainer(): Promise<void> {
  console.log('🐳 Starting SQL Server container...');

  const SA_PASSWORD = 'YourStrong!Passw0rd';

  sqlServerContainer = await new GenericContainer(
    'mcr.microsoft.com/mssql/server:2022-latest'
  )
    .withExposedPorts(1433)
    .withEnvironment({
      ACCEPT_EULA: 'Y',
      SA_PASSWORD,
      MSSQL_PID: 'Developer',
    })
    .withWaitStrategy(
      Wait.forLogMessage('SQL Server is now ready for client connections')
    )
    .start();

  const sqlPort = sqlServerContainer.getMappedPort(1433);
  const sqlHost = sqlServerContainer.getHost();

  console.log(`✅ SQL Server running at ${sqlHost}:${sqlPort}`);

  // Configurar env vars para os testes
  process.env.DB_HOST = sqlHost;
  process.env.DB_PORT = String(sqlPort);
  process.env.DB_USER = 'sa';
  process.env.DB_PASSWORD = SA_PASSWORD;
  process.env.DB_DATABASE = 'TestDB';

  // Aguardar SQL Server estar completamente pronto
  await new Promise((resolve) => setTimeout(resolve, 10000));
}

/**
 * Setup global - Executado antes de todos os testes
 */
export async function setup(): Promise<void> {
  console.log('\n🚀 Setting up Test Containers...\n');

  try {
    // Iniciar containers em paralelo
    await Promise.all([
      startRedisContainer(),
      // startSqlServerContainer(), // Descomentar se necessário
    ]);

    console.log('\n✅ All containers ready!\n');
  } catch (error) {
    console.error('❌ Error starting containers:', error);
    throw error;
  }
}

/**
 * Teardown global - Executado após todos os testes
 */
export async function teardown(): Promise<void> {
  console.log('\n🧹 Stopping Test Containers...\n');

  try {
    if (redisContainer) {
      await redisContainer.stop();
      console.log('✅ Redis container stopped');
    }

    if (sqlServerContainer) {
      await sqlServerContainer.stop();
      console.log('✅ SQL Server container stopped');
    }

    console.log('\n✅ All containers stopped!\n');
  } catch (error) {
    console.error('❌ Error stopping containers:', error);
    throw error;
  }
}

/**
 * Retorna configuração atual dos containers
 */
export function getConfig(): TestContainersConfig {
  return {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    sqlServer: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433', 10),
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'TestDB',
    },
  };
}

/**
 * Helper para esperar container estar pronto
 */
export async function waitForHealthy(
  container: StartedTestContainer,
  maxRetries: number = 30
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const health = await container.exec(['echo', 'healthy']);
      if (health.exitCode === 0) {
        return;
      }
    } catch {
      // Continuar tentando
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Container health check timeout');
}
