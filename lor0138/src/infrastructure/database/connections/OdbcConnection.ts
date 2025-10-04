import odbc from 'odbc';
import { IConnection, QueryParameter } from '../types';

export class OdbcConnection implements IConnection {
  private pool: odbc.Pool | null = null;
  private connectionString: string;
  private name: string;

  constructor(connectionString: string, name: string) {
    this.connectionString = connectionString;
    this.name = name;
  }

  async connect(): Promise<void> {
    console.log(`Conectando ${this.name} via ODBC...`);

    this.pool = await odbc.pool(this.connectionString);
    console.log(`${this.name} (ODBC) conectado`);
  }

  async query(queryString: string): Promise<any> {
    if (!this.pool) {
      throw new Error(`Pool ODBC ${this.name} indisponivel`);
    }

    const result = await this.pool.query(queryString);
    return result;
  }

  /**
   * Executa query com parâmetros (PROTEGIDO contra SQL Injection)
   * ODBC usa ? como placeholder
   */
  async queryWithParams(queryString: string, params: QueryParameter[]): Promise<any> {
    if (!this.pool) {
      throw new Error(`Pool ODBC ${this.name} indisponivel`);
    }

    // ODBC usa array de valores na ordem dos ?
    const paramValues = params.map(p => p.value);

    const result = await this.pool.query(queryString, paramValues);
    return result;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }
}