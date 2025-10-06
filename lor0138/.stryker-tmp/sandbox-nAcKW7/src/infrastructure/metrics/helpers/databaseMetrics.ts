// @ts-nocheck
// src/infrastructure/metrics/helpers/databaseMetrics.ts

import { metricsManager } from '../MetricsManager';

export type DatabaseType = 'EMP' | 'MULT';
export type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'other';

/**
 * Helper para instrumentar queries e coletar métricas de banco de dados
 */
export class DatabaseMetricsHelper {
  /**
   * Detecta o tipo de operação SQL
   */
  private static detectOperation(sql: string): QueryOperation {
    const normalizedSql = sql.trim().toUpperCase();

    if (normalizedSql.startsWith('SELECT')) return 'select';
    if (normalizedSql.startsWith('INSERT')) return 'insert';
    if (normalizedSql.startsWith('UPDATE')) return 'update';
    if (normalizedSql.startsWith('DELETE')) return 'delete';

    return 'other';
  }

  /**
   * Executa uma query e coleta métricas automaticamente
   */
  static async instrumentQuery<T>(
    database: DatabaseType,
    sql: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const operation = this.detectOperation(sql);
    const startTime = Date.now();

    // Incrementa queries em progresso
    metricsManager.dbQueriesInProgress.inc({ database });

    try {
      const result = await queryFn();

      // Sucesso - registra métricas
      const duration = (Date.now() - startTime) / 1000; // segundos

      metricsManager.dbQueriesTotal.inc({ database, operation });
      metricsManager.dbQueryDuration.observe({ database, operation }, duration);

      return result;
    } catch (error) {
      // Erro - registra métrica de erro
      const errorType = this.classifyError(error);
      metricsManager.dbQueryErrors.inc({ database, error_type: errorType });

      throw error;
    } finally {
      // Decrementa queries em progresso
      metricsManager.dbQueriesInProgress.dec({ database });
    }
  }

  /**
   * Classifica o tipo de erro
   */
  private static classifyError(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('timeout')) return 'timeout';
    if (message.includes('connection')) return 'connection';
    if (message.includes('syntax')) return 'syntax';
    if (message.includes('permission') || message.includes('denied')) return 'permission';
    if (message.includes('deadlock')) return 'deadlock';

    return 'unknown';
  }

  /**
   * Registra erro de conexão
   */
  static recordConnectionError(database: DatabaseType, error: any): void {
    const errorType = this.classifyError(error);
    metricsManager.dbConnectionErrors.inc({ database, error_type: errorType });
  }

  /**
   * Atualiza o gauge de conexões ativas
   */
  static setActiveConnections(database: DatabaseType, count: number): void {
    metricsManager.dbConnectionsActive.set({ database }, count);
  }
}