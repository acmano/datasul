// src/application/interfaces/infrastructure/IDatabase.ts

import type { QueryParameter } from '@infrastructure/database/types';

/**
 * Interface de Database (Port)
 *
 * @description
 * Define o contrato para acesso a banco de dados.
 * Permite injeção de dependência e substituição de implementações.
 *
 * Seguindo Dependency Inversion Principle:
 * - Application Layer depende desta interface (abstração)
 * - Infrastructure Layer implementa esta interface (detalhe)
 *
 * @example
 * ```typescript
 * class ItemRepositoryAdapter {
 *   constructor(private database: IDatabase) {}
 *
 *   async findByCodigo(codigo: string): Promise<Item | null> {
 *     const result = await this.database.queryEmpWithParams(
 *       'SELECT * FROM item WHERE "it-codigo" = @codigo',
 *       [{ name: 'codigo', type: 'varchar', value: codigo }]
 *     );
 *     return result[0] || null;
 *   }
 * }
 * ```
 */
export interface IDatabase {
  /**
   * Executa query no banco EMP com parâmetros
   *
   * @param sql - Query SQL
   * @param params - Parâmetros da query
   * @returns Resultado da query
   */
  queryEmpWithParams<T = unknown>(
    sql: string,
    params: QueryParameter[]
  ): Promise<T[]>;

  /**
   * Executa query no banco MULT com parâmetros
   *
   * @param sql - Query SQL
   * @param params - Parâmetros da query
   * @returns Resultado da query
   */
  queryMultWithParams<T = unknown>(
    sql: string,
    params: QueryParameter[]
  ): Promise<T[]>;

  /**
   * Executa query no banco EMP (sem parâmetros - DEPRECATED)
   *
   * @param sql - Query SQL
   * @returns Resultado da query
   * @deprecated Use queryEmpWithParams para segurança
   */
  queryEmp<T = unknown>(sql: string): Promise<T[]>;

  /**
   * Executa query no banco MULT (sem parâmetros - DEPRECATED)
   *
   * @param sql - Query SQL
   * @returns Resultado da query
   * @deprecated Use queryMultWithParams para segurança
   */
  queryMult<T = unknown>(sql: string): Promise<T[]>;

  /**
   * Testa conexão com banco de dados
   *
   * @returns true se conectado
   */
  testConnection(): Promise<boolean>;

  /**
   * Fecha conexões
   */
  close(): Promise<void>;

  /**
   * Retorna estatísticas de conexão
   *
   * @returns Estatísticas
   */
  getStats(): Promise<DatabaseStats>;
}

/**
 * Estatísticas de banco de dados
 */
export interface DatabaseStats {
  connectionType: 'sqlserver' | 'odbc' | 'mock';
  connected: boolean;
  totalQueries: number;
  failedQueries: number;
  avgQueryTime: number;
  activeConnections?: number;
}

/**
 * Opções de query
 */
export interface QueryOptions {
  timeout?: number;
  maxRetries?: number;
  cacheKey?: string;
  cacheTTL?: number;
}
