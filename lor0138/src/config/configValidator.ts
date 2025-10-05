// src/config/configValidator.ts

import { config } from './env.config';
import { log } from '@shared/utils/logger';

/**
 * Valida configurações obrigatórias
 * Fail-fast: Se configuração inválida, app não deve iniciar
 */
export class ConfigValidator {
  private errors: string[] = [];

  validate(): void {
    this.validateServer();
    this.validateDatabase();
    this.validateCors();
    this.validateTimeouts();
    this.validateRetry();

    if (this.errors.length > 0) {
      this.logErrors();
      throw new Error(`❌ Configuração inválida. Corrija os erros no .env`);
    }

    this.logSuccess();
  }

  private validateServer(): void {
    // Port
    if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
      this.errors.push(`PORT inválida: ${config.server.port}. Deve estar entre 1 e 65535.`);
    }

    // Node ENV
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(config.server.nodeEnv)) {
      this.errors.push(
        `NODE_ENV inválido: "${config.server.nodeEnv}". Valores válidos: ${validEnvs.join(', ')}`
      );
    }

    // API Prefix
    if (!config.server.apiPrefix || !config.server.apiPrefix.startsWith('/')) {
      this.errors.push(`API_PREFIX deve começar com "/". Atual: "${config.server.apiPrefix}"`);
    }
  }

  private validateDatabase(): void {
    const { database } = config;

    // Connection Type
    if (database.type !== 'sqlserver' && database.type !== 'odbc') {
      this.errors.push(
        `DB_CONNECTION_TYPE inválido: "${database.type}". Use "sqlserver" ou "odbc".`
      );
    }

    // SQL Server validations
    if (database.type === 'sqlserver' && !database.useMockData) {
      this.validateSqlServer();
    }

    // ODBC validations
    if (database.type === 'odbc' && !database.useMockData) {
      this.validateOdbc();
    }
  }

  private validateSqlServer(): void {
    const { sqlServer } = config.database;

    if (!sqlServer.server) {
      this.errors.push('DB_SERVER é obrigatório para SQL Server');
    }

    if (!sqlServer.port || sqlServer.port < 1 || sqlServer.port > 65535) {
      this.errors.push(`DB_PORT inválida: ${sqlServer.port}`);
    }

    if (!sqlServer.user) {
      this.errors.push('DB_USER é obrigatório para SQL Server');
    }

    if (!sqlServer.password) {
      this.errors.push('DB_PASSWORD é obrigatório para SQL Server');
    }

    // Database pode ser vazio (usa default do user)
    // Não validar databaseEmp e databaseMult

    // Timeouts
    if (sqlServer.connectionTimeout < 1000) {
      this.errors.push(
        `DB_CONNECTION_TIMEOUT muito baixo: ${sqlServer.connectionTimeout}ms. Mínimo: 1000ms`
      );
    }

    if (sqlServer.requestTimeout < 1000) {
      this.errors.push(
        `DB_REQUEST_TIMEOUT muito baixo: ${sqlServer.requestTimeout}ms. Mínimo: 1000ms`
      );
    }
  }

  private validateOdbc(): void {
    const { odbc } = config.database;

    if (!odbc.dsnEmp) {
      this.errors.push('ODBC_DSN_EMP é obrigatório para ODBC');
    }

    if (!odbc.dsnMult) {
      this.errors.push('ODBC_DSN_MULT é obrigatório para ODBC');
    }

    if (odbc.connectionTimeout < 1000) {
      this.errors.push(
        `ODBC_CONNECTION_TIMEOUT muito baixo: ${odbc.connectionTimeout}ms. Mínimo: 1000ms`
      );
    }
  }

  private validateCors(): void {
    if (!config.cors.allowedOrigins || config.cors.allowedOrigins.length === 0) {
      this.errors.push('CORS_ALLOWED_ORIGINS não pode estar vazio');
    }

    // Validar formato de URL
    config.cors.allowedOrigins.forEach(origin => {
      if (origin !== '*' && !origin.startsWith('http://') && !origin.startsWith('https://')) {
        this.errors.push(
          `CORS origin inválido: "${origin}". Deve começar com http:// ou https://`
        );
      }
    });
  }

  private validateTimeouts(): void {
    const { timeout } = config;

    if (timeout.request < 1000) {
      this.errors.push(
        `HTTP_REQUEST_TIMEOUT muito baixo: ${timeout.request}ms. Mínimo: 1000ms`
      );
    }

    if (timeout.healthCheck < 100) {
      this.errors.push(
        `HTTP_HEALTH_TIMEOUT muito baixo: ${timeout.healthCheck}ms. Mínimo: 100ms`
      );
    }

    if (timeout.healthCheck > timeout.request) {
      this.errors.push(
        `HTTP_HEALTH_TIMEOUT (${timeout.healthCheck}ms) não pode ser maior que HTTP_REQUEST_TIMEOUT (${timeout.request}ms)`
      );
    }
  }

  private validateRetry(): void {
    const { retry } = config.database;

    if (retry.maxAttempts < 1) {
      this.errors.push(
        `DB_RETRY_MAX_ATTEMPTS deve ser >= 1. Atual: ${retry.maxAttempts}`
      );
    }

    if (retry.maxAttempts > 10) {
      this.errors.push(
        `DB_RETRY_MAX_ATTEMPTS muito alto: ${retry.maxAttempts}. Máximo recomendado: 10`
      );
    }

    if (retry.initialDelay < 100) {
      this.errors.push(
        `DB_RETRY_INITIAL_DELAY muito baixo: ${retry.initialDelay}ms. Mínimo: 100ms`
      );
    }

    if (retry.maxDelay < retry.initialDelay) {
      this.errors.push(
        `DB_RETRY_MAX_DELAY (${retry.maxDelay}ms) deve ser >= DB_RETRY_INITIAL_DELAY (${retry.initialDelay}ms)`
      );
    }

    if (retry.backoffFactor < 1) {
      this.errors.push(
        `DB_RETRY_BACKOFF_FACTOR deve ser >= 1. Atual: ${retry.backoffFactor}`
      );
    }
  }

  private logErrors(): void {
    console.error('\n❌ ERROS DE CONFIGURAÇÃO:\n');
    this.errors.forEach((error, index) => {
      console.error(`   ${index + 1}. ${error}`);
    });
    console.error('\n');
  }

  private logSuccess(): void {
    log.info('✅ Configurações válidas');
    
    if (config.server.nodeEnv === 'development') {
      console.log('\n📋 Configuração Atual:');
      console.log(`   Ambiente: ${config.server.nodeEnv}`);
      console.log(`   Porta: ${config.server.port}`);
      console.log(`   API Prefix: ${config.server.apiPrefix}`);
      console.log(`   Banco: ${config.database.type.toUpperCase()}`);
      console.log(`   Mock Data: ${config.database.useMockData ? 'SIM' : 'NÃO'}`);
      console.log(`   Cache: ${config.cache.strategy} (${config.cache.enabled ? 'habilitado' : 'desabilitado'})`);
      console.log(`   Retry: ${config.database.retry.maxAttempts} tentativas\n`);
    }
  }
}

// Export singleton instance
export const configValidator = new ConfigValidator();