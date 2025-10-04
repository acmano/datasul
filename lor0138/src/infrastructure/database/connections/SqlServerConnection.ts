import sql from 'mssql';
import { IConnection, DatabaseConfig, QueryParameter } from '../types';

export class SqlServerConnection implements IConnection {
  private pool: sql.ConnectionPool | null = null;
  private config: DatabaseConfig;
  private name: string;

  constructor(config: DatabaseConfig, name: string) {
    this.config = config;
    this.name = name;
  }

  async connect(): Promise<void> {
    console.log(`Conectando ${this.name} via SQL Server...`);

    console.log('🔍 DEBUG - Config recebida:', {
    server: this.config.server,
    user: this.config.user,
    password: this.config.password?.replace(/./g, '*'), // Mostra asteriscos
    database: this.config.database,
    port: this.config.port,
  });

    const sqlConfig: sql.config = {
      server: this.config.server!,
      database: this.config.database!,
      user: this.config.user!,
      password: this.config.password!,
      port: this.config.port!,
      options: {
        encrypt: this.config.encrypt!,
        trustServerCertificate: this.config.trustServerCertificate!,
        connectTimeout: this.config.connectionTimeout!,
        requestTimeout: this.config.requestTimeout!,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    this.pool = new sql.ConnectionPool(sqlConfig);
    await this.pool.connect();
    console.log(`${this.name} (SQL Server) conectado`);
  }

  async query(queryString: string): Promise<any> {
    if (!this.pool?.connected) {
      throw new Error(`Pool SQL Server ${this.name} indisponivel`);
    }

    const result = await this.pool.request().query(queryString);
    return result.recordset;
  }

  /**
   * Executa query com parâmetros (PROTEGIDO contra SQL Injection)
   */
  async queryWithParams(queryString: string, params: QueryParameter[]): Promise<any> {
    if (!this.pool?.connected) {
      throw new Error(`Pool SQL Server ${this.name} indisponivel`);
    }

    const request = this.pool.request();

    // Adiciona cada parâmetro ao request
    for (const param of params) {
      request.input(param.name, this.getSqlType(param.type), param.value);
    }

    const result = await request.query(queryString);
    return result.recordset;
  }

  /**
   * Converte tipo string para tipo mssql
   */
  private getSqlType(type: string): any {
    const typeMap: { [key: string]: any } = {
      varchar: sql.VarChar,
      nvarchar: sql.NVarChar,
      int: sql.Int,
      bigint: sql.BigInt,
      decimal: sql.Decimal,
      float: sql.Float,
      bit: sql.Bit,
      date: sql.Date,
      datetime: sql.DateTime,
    };

    return typeMap[type.toLowerCase()] || sql.VarChar;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  isConnected(): boolean {
    return this.pool?.connected || false;
  }
}