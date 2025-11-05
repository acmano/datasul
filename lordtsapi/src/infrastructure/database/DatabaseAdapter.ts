// src/infrastructure/database/DatabaseAdapter.ts

import type { IDatabase, DatabaseStats } from '@application/interfaces/infrastructure/IDatabase';
import type { QueryParameter } from './types';
import { DatabaseManager } from './DatabaseManager';

/**
 * Database Adapter
 *
 * @description
 * Adapter que implementa IDatabase usando DatabaseManager legado.
 * Permite injeção de dependência e facilita testes.
 *
 * Padrão Adapter + Dependency Inversion:
 * - Use Cases dependem de IDatabase (abstração)
 * - Este adapter implementa IDatabase
 * - Internamente usa DatabaseManager (implementação legada)
 *
 * @example
 * ```typescript
 * // Em produção
 * const database: IDatabase = new DatabaseAdapter();
 *
 * // Em testes
 * const database: IDatabase = new MockDatabaseAdapter();
 *
 * // Ambos implementam mesma interface!
 * const repository = new ItemRepositoryAdapter(database);
 * ```
 */
export class DatabaseAdapter implements IDatabase {
  private queryCount: number = 0;
  private failedCount: number = 0;
  private totalQueryTime: number = 0;

  /**
   * Executa query no banco EMP com parâmetros
   */
  async queryEmpWithParams<T = unknown>(sql: string, params: QueryParameter[]): Promise<T[]> {
    const start = Date.now();

    try {
      this.queryCount++;

      const result = (await DatabaseManager.queryEmpWithParams(sql, params)) as T[];

      const duration = Date.now() - start;
      this.totalQueryTime += duration;

      return result;
    } catch (error) {
      this.failedCount++;
      throw error;
    }
  }

  /**
   * Executa query no banco MULT com parâmetros
   */
  async queryMultWithParams<T = unknown>(sql: string, params: QueryParameter[]): Promise<T[]> {
    const start = Date.now();

    try {
      this.queryCount++;

      const result = (await DatabaseManager.queryMultWithParams(sql, params)) as T[];

      const duration = Date.now() - start;
      this.totalQueryTime += duration;

      return result;
    } catch (error) {
      this.failedCount++;
      throw error;
    }
  }

  /**
   * Executa query no banco EMP (DEPRECATED)
   *
   * @deprecated Use queryEmpWithParams
   */
  async queryEmp<T = unknown>(sql: string): Promise<T[]> {
    const start = Date.now();

    try {
      this.queryCount++;

      const result = (await DatabaseManager.queryEmp(sql)) as T[];

      const duration = Date.now() - start;
      this.totalQueryTime += duration;

      return result;
    } catch (error) {
      this.failedCount++;
      throw error;
    }
  }

  /**
   * Executa query no banco MULT (DEPRECATED)
   *
   * @deprecated Use queryMultWithParams
   */
  async queryMult<T = unknown>(sql: string): Promise<T[]> {
    const start = Date.now();

    try {
      this.queryCount++;

      const result = (await DatabaseManager.queryMult(sql)) as T[];

      const duration = Date.now() - start;
      this.totalQueryTime += duration;

      return result;
    } catch (error) {
      this.failedCount++;
      throw error;
    }
  }

  /**
   * Testa conexão
   */
  async testConnection(): Promise<boolean> {
    try {
      // Progress ODBC não suporta SELECT sem FROM
      await this.queryEmpWithParams('SELECT COUNT(*) as health FROM pub.item', []);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fecha conexões
   */
  async close(): Promise<void> {
    // DatabaseManager gerencia conexões globalmente
    // Este método existe para compatibilidade com interface
    return Promise.resolve();
  }

  /**
   * Retorna estatísticas
   */
  async getStats(): Promise<DatabaseStats> {
    const connected = await this.testConnection();

    return {
      connectionType: (process.env.DB_CONNECTION_TYPE as any) || 'sqlserver',
      connected,
      totalQueries: this.queryCount,
      failedQueries: this.failedCount,
      avgQueryTime: this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.queryCount = 0;
    this.failedCount = 0;
    this.totalQueryTime = 0;
  }
}

/**
 * Instância singleton para uso global
 * (pode ser substituída por DI Container em produção)
 */
export const databaseAdapter = new DatabaseAdapter();
