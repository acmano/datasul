// src/config/configValidator.ts

import { envConfig } from './env.config';

/**
 * Resultado da validação
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida configurações críticas na startup
 * Impede que a aplicação inicie com configurações inválidas
 */
export class ConfigValidator {
  /**
   * Valida TODAS as configurações
   * Falha rápido se houver erros críticos
   */
  static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Valida cada categoria
    this.validateServer(errors, warnings);
    this.validateDatabase(errors, warnings);
    this.validateCORS(errors, warnings);
    this.validateTimeouts(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida configurações do servidor
   */
  private static validateServer(errors: string[], warnings: string[]): void {
    // Porta
    if (!envConfig.port || envConfig.port < 1 || envConfig.port > 65535) {
      errors.push(`PORT inválida: ${envConfig.port}. Deve estar entre 1 e 65535.`);
    }

    // Node Environment
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(envConfig.nodeEnv)) {
      warnings.push(
        `NODE_ENV inválido: "${envConfig.nodeEnv}". Valores válidos: ${validEnvs.join(', ')}`
      );
    }

    // API Prefix
    if (!envConfig.apiPrefix || !envConfig.apiPrefix.startsWith('/')) {
      errors.push(`API_PREFIX deve começar com "/". Atual: "${envConfig.apiPrefix}"`);
    }
  }

  /**
   * Valida configurações do banco de dados
   */
  private static validateDatabase(errors: string[], warnings: string[]): void {
    const { database } = envConfig;

    // Tipo de conexão
    if (database.connectionType !== 'sqlserver' && database.connectionType !== 'odbc') {
      errors.push(
        `DB_CONNECTION_TYPE inválido: "${database.connectionType}". Use "sqlserver" ou "odbc".`
      );
    }

    // Mock data warning
    if (database.useMockData) {
      warnings.push('⚠️  USE_MOCK_DATA=true - Usando dados falsos! Não use em produção.');
    }

    // Validação SQL Server
    if (database.connectionType === 'sqlserver' && !database.useMockData) {
      if (!database.sqlServer.server || database.sqlServer.server === 'localhost') {
        warnings.push('DB_SERVER está como "localhost" - use IP real em produção.');
      }

      if (!database.sqlServer.user) {
        errors.push('DB_USER não configurado.');
      }

      if (!database.sqlServer.password) {
        errors.push('DB_PASSWORD não configurado.');
      }

      if (!database.sqlServer.databaseEmp) {
        errors.push('DB_NAME_EMP não configurado.');
      }

      if (!database.sqlServer.databaseMult) {
        errors.push('DB_NAME_MULT não configurado.');
      }

      // Timeouts
      if (database.sqlServer.connectionTimeout < 5000) {
        warnings.push(
          `DB_CONNECTION_TIMEOUT muito baixo (${database.sqlServer.connectionTimeout}ms). Recomendado: >= 10000ms`
        );
      }

      if (database.sqlServer.requestTimeout < 10000) {
        warnings.push(
          `DB_REQUEST_TIMEOUT muito baixo (${database.sqlServer.requestTimeout}ms). Recomendado: >= 15000ms`
        );
      }
    }

    // Validação ODBC
    if (database.connectionType === 'odbc' && !database.useMockData) {
      if (!database.odbc.dsnEmp) {
        errors.push('ODBC_DSN_EMP não configurado.');
      }

      if (!database.odbc.dsnMult) {
        errors.push('ODBC_DSN_MULT não configurado.');
      }
    }
  }

  /**
   * Valida configurações de CORS
   */
  private static validateCORS(errors: string[], _warnings: string[]): void {
    const { cors } = envConfig;

    if (!cors.allowedOrigins || cors.allowedOrigins.length === 0) {
      errors.push('CORS_ALLOWED_ORIGINS não configurado. Defina ao menos uma origem permitida.');
    }

    // Valida formato das origens
    for (const origin of cors.allowedOrigins) {
      if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
        errors.push(`Origem CORS inválida: "${origin}". Deve começar com http:// ou https://`);
      }
    }
  }

  /**
   * Valida configurações de timeout
   */
  private static validateTimeouts(errors: string[], warnings: string[]): void {
    const { timeout } = envConfig;

    // Timeout de requisição
    if (timeout.request < 5000) {
      warnings.push(
        `HTTP_REQUEST_TIMEOUT muito baixo (${timeout.request}ms). Recomendado: >= 10000ms`
      );
    }

    if (timeout.request > 120000) {
      warnings.push(
        `HTTP_REQUEST_TIMEOUT muito alto (${timeout.request}ms). Recomendado: <= 60000ms`
      );
    }

    // Timeout de operações pesadas
    if (timeout.heavyOperation < timeout.request) {
      errors.push(
        `HTTP_HEAVY_TIMEOUT (${timeout.heavyOperation}ms) deve ser maior que HTTP_REQUEST_TIMEOUT (${timeout.request}ms)`
      );
    }

    // Health check timeout
    if (timeout.healthCheck > 10000) {
      warnings.push(
        `HTTP_HEALTH_TIMEOUT muito alto (${timeout.healthCheck}ms). Health checks devem ser rápidos. Recomendado: <= 5000ms`
      );
    }
  }

  /**
   * Valida e exibe resultados
   * Encerra o processo se houver erros críticos
   */
  static validateAndExit(): void {
    console.log('🔍 Validando configurações...\n');

    const result = this.validate();

    // Exibe warnings
    if (result.warnings.length > 0) {
      console.log('⚠️  Avisos de Configuração:');
      result.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
      console.log('');
    }

    // Exibe erros
    if (result.errors.length > 0) {
      console.error('❌ Erros de Configuração:');
      result.errors.forEach((error) => {
        console.error(`   - ${error}`);
      });
      console.error('\n💡 Corrija as configurações no arquivo .env e tente novamente.\n');
      process.exit(1); // Encerra o processo com código de erro
    }

    console.log('✅ Configurações válidas!\n');
  }

  /**
   * Exibe resumo das configurações atuais
   */
  static printSummary(): void {
    console.log('📋 Resumo das Configurações:');
    console.log(`   Ambiente: ${envConfig.nodeEnv}`);
    console.log(`   Porta: ${envConfig.port}`);
    console.log(`   API Prefix: ${envConfig.apiPrefix}`);
    console.log(`   Banco: ${envConfig.database.connectionType.toUpperCase()}`);
    console.log(`   Mock Data: ${envConfig.database.useMockData ? 'SIM' : 'NÃO'}`);
    console.log(
      `   Timeout Request: ${envConfig.timeout.request}ms (${envConfig.timeout.request / 1000}s)`
    );
    console.log(
      `   CORS Origins: ${envConfig.cors.allowedOrigins.length} configurada(s)`
    );
    console.log('');
  }
}