// @ts-nocheck
// src/infrastructure/database/connections/OdbcConnection.ts

import odbc from 'odbc';
import { IConnection, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';

export class OdbcConnection implements IConnection {
  private connection: odbc.Connection | null = null;
  private connectionString: string;
  private name: string;

  constructor(connectionString: string, name: string = 'ODBC') {
    this.connectionString = connectionString;
    this.name = name;
  }

  async connect(): Promise<void> {
    const context = `${this.name} (ODBC)`;
    
    log.info(`Conectando ${context}...`);

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
      this.connection = await retryWithBackoff(
        async () => {
          const conn = await odbc.connect(this.connectionString);
          return conn;
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
    if (!this.connection) {
      throw new Error(`${this.name}: Conexão não inicializada`);
    }

    try {
      const result = await this.connection.query(sql);
      return result;
    } catch (error) {
      log.error(`${this.name}: Erro na query`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        sql: sql.substring(0, 100),
      });
      throw error;
    }
  }

  async queryWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (!this.connection) {
      throw new Error(`${this.name}: Conexão não inicializada`);
    }

    try {
      // ODBC usa '?' como placeholder
      const values = params.map(p => p.value);
      const result = await this.connection.query(sql, values);
      return result;
    } catch (error) {
      log.error(`${this.name}: Erro na query parametrizada`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        params: params.map(p => ({ name: p.name, type: p.type })),
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      log.info(`${this.name} desconectado`);
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async healthCheck(): Promise<{ connected: boolean; responseTime: number }> {
    const startTime = Date.now();

    try {
      if (!this.connection) {
        return { connected: false, responseTime: 0 };
      }

      await this.connection.query('SELECT 1 AS health');
      const responseTime = Date.now() - startTime;

      return { connected: true, responseTime };
    } catch (error) {
      log.error(`${this.name}: Health check falhou`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return { connected: false, responseTime: Date.now() - startTime };
    }
  }
}