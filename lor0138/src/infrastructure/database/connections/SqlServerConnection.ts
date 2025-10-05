// src/infrastructure/database/connections/SqlServerConnection.ts

import sql from 'mssql';
import { IConnection, DatabaseConfig, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';

export class SqlServerConnection implements IConnection {
  private pool: sql.ConnectionPool | null = null;
  private config: DatabaseConfig;
  private name: string;

  constructor(config: DatabaseConfig, name: string = 'SQL Server') {
    this.config = config;
    this.name = name;
  }

  async connect(): Promise<void> {
    const context = `${this.name} (SQL Server)`;
    
    log.info(`Conectando ${context}...`);
    log.debug('🔍 DEBUG - Config recebida:', {
      server: this.config.server,
      user: this.config.user,
      password: '*********',
      database: this.config.database,
      port: this.config.port,
    });

    const sqlConfig: sql.config = {
      server: this.config.server || '',
      port: this.config.port || 1433,
      user: this.config.user || '',
      password: this.config.password || '',
      database: this.config.database || '',
      connectionTimeout: this.config.connectionTimeout || 15000,
      requestTimeout: this.config.requestTimeout || 30000,
      options: {
        encrypt: this.config.encrypt ?? false,
        trustServerCertificate: this.config.trustServerCertificate ?? true,
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    // ✅ NOVO: Retry com backoff exponencial
    const retryOptions = {
      maxAttempts: config.database.retry.maxAttempts,
      initialDelay: config.database.retry.initialDelay,
      maxDelay: config.database.retry.maxDelay,
      backoffFactor: config.database.retry.backoffFactor,
      jitter: true,
      onRetry: (error: Error, attempt: number, delay: number) => {
        // Só retry em erros de conexão
        if (!isRetryableError(error)) {
          log.error(`${context}: Erro não-retryable, abortando`, {
            error: error.message,
            attempt,
          });
          throw error;
        }
      },
    };

    try {
      this.pool = await retryWithBackoff(
        async () => {
          const pool = new sql.ConnectionPool(sqlConfig);
          
          // ✅ CRITICAL: Timeout manual para forçar erro se travar
          const connectPromise = pool.connect();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Connection timeout after ${sqlConfig.connectionTimeout}ms`));
            }, sqlConfig.connectionTimeout);
          });

          // Race: o que resolver/rejeitar primeiro ganha
          await Promise.race([connectPromise, timeoutPromise]);
          
          return pool;
        },
        retryOptions,
        context
      );

      log.info(`${context} conectado`);
    } catch (error) {
      log.error(`${context}: Falha após todas as tentativas de retry`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        maxAttempts: retryOptions.maxAttempts,
      });
      throw error;
    }
  }

  async query(sql: string): Promise<any> {
    if (!this.pool) {
      throw new Error(`${this.name}: Pool não inicializado`);
    }

    try {
      const result = await this.pool.request().query(sql);
      return result.recordset;
    } catch (error) {
      log.error(`${this.name}: Erro na query`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        sql: sql.substring(0, 100), // Log apenas início da query
      });
      throw error;
    }
  }

  async queryWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (!this.pool) {
      throw new Error(`${this.name}: Pool não inicializado`);
    }

    try {
      const request = this.pool.request();

      // Adicionar parâmetros
      params.forEach(param => {
        const sqlType = this.getSqlType(param.type);
        request.input(param.name, sqlType, param.value);
      });

      const result = await request.query(sql);
      return result.recordset;
    } catch (error) {
      log.error(`${this.name}: Erro na query parametrizada`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        params: params.map(p => ({ name: p.name, type: p.type })),
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      log.info(`${this.name} desconectado`);
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }

  async healthCheck(): Promise<{ connected: boolean; responseTime: number }> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        return { connected: false, responseTime: 0 };
      }

      await this.pool.request().query('SELECT 1 AS health');
      const responseTime = Date.now() - startTime;

      return { connected: true, responseTime };
    } catch (error) {
      log.error(`${this.name}: Health check falhou`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return { connected: false, responseTime: Date.now() - startTime };
    }
  }

  private getSqlType(type: string): any {
    const typeMap: Record<string, any> = {
      varchar: sql.VarChar,
      int: sql.Int,
      bigint: sql.BigInt,
      float: sql.Float,
      decimal: sql.Decimal,
      datetime: sql.DateTime,
      bit: sql.Bit,
    };

    return typeMap[type.toLowerCase()] || sql.VarChar;
  }
}