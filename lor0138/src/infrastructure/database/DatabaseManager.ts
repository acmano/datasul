// src/infrastructure/database/DatabaseManager.ts

import { ConnectionType, ConnectionStatus, IConnection, QueryParameter } from './types';
import { SqlServerConnection } from './connections/SqlServerConnection';
import { OdbcConnection } from './connections/OdbcConnection';
import { MockConnection } from './connections/MockConnection';
// ✅ CORRIGIDO: Import do arquivo correto
import { getSqlServerConfigEmp, getSqlServerConfigMult } from './config/sqlServerConfig';
import { getOdbcConnectionString } from './config/odbcConfig';

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private static connectionEmp: IConnection | null = null;
  private static connectionMult: IConnection | null = null;
  private static connectionType: ConnectionType = 'odbc';
  private static useMockData: boolean = false;
  private static connectionError: string | null = null;
  private static isInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;

  // Construtor privado para padrão Singleton
  private constructor() {}

  /**
   * ✅ NOVO: Retorna instância singleton
   * Usado pelo health check no app.ts
   */
  static getInstance(): DatabaseManager {
    if (!this.instance) {
      this.instance = new DatabaseManager();
    }
    return this.instance;
  }

  /**
   * ✅ NOVO: Retorna a conexão primária (EMP)
   * Usado pelo health check no app.ts
   */
  static getConnection(): IConnection {
    if (this.useMockData) {
      return this.getMockConnection();
    }

    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }

    return this.connectionEmp;
  }

  static async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initializationPromise = this.doInitialize();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private static async doInitialize(): Promise<void> {
    console.log('Inicializando conexoes Datasul...');

    this.connectionType = (process.env.DB_CONNECTION_TYPE as ConnectionType) || 'odbc';
    console.log(`Modo: ${this.connectionType.toUpperCase()}`);

    try {
      if (this.connectionType === 'odbc') {
        await this.initializeOdbc();
      } else {
        await this.initializeSqlServer();
      }

      this.useMockData = false;
      this.isInitialized = true;
      console.log('✅ CONECTADO AO DATASUL');
    } catch (error) {
      this.connectionError = (error as Error).message;
      this.useMockData = true;
      this.isInitialized = true;
      console.warn('⚠️ USANDO DADOS MOCK');
      console.error('Erro conexão:', this.connectionError);
    }
  }

  private static async initializeSqlServer(): Promise<void> {
    const configEmp = getSqlServerConfigEmp();
    const configMult = getSqlServerConfigMult();

    this.connectionEmp = new SqlServerConnection(configEmp, 'EMP');
    this.connectionMult = new SqlServerConnection(configMult, 'MULT');

    await Promise.all([
      this.connectionEmp.connect(),
      this.connectionMult.connect(),
    ]);

    console.log('✅ SQL Server conectado');
  }

  private static async initializeOdbc(): Promise<void> {
    const connStringEmp = getOdbcConnectionString('EMP');
    const connStringMult = getOdbcConnectionString('MULT');

    this.connectionEmp = new OdbcConnection(connStringEmp, 'EMP');
    this.connectionMult = new OdbcConnection(connStringMult, 'MULT');

    await Promise.all([
      this.connectionEmp.connect(),
      this.connectionMult.connect(),
    ]);

    console.log('✅ ODBC conectado');
  }

  /**
   * Query simples EMP (DEPRECATED - Use queryEmpWithParams quando possível)
   */
  static async queryEmp(sql: string): Promise<any> {
    if (this.useMockData) {
      return this.getMockConnection().query(sql);
    }

    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }

    return this.connectionEmp.query(sql);
  }

  /**
   * Query simples MULT (DEPRECATED - Use queryMultWithParams quando possível)
   */
  static async queryMult(sql: string): Promise<any> {
    if (this.useMockData) {
      return this.getMockConnection().query(sql);
    }

    if (!this.connectionMult) {
      throw new Error('Conexão MULT não inicializada');
    }

    return this.connectionMult.query(sql);
  }

  /**
   * Query parametrizada EMP (✅ PROTEGIDO contra SQL Injection)
   */
  static async queryEmpWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (this.useMockData) {
      return this.getMockConnection().queryWithParams(sql, params);
    }

    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }

    return this.connectionEmp.queryWithParams(sql, params);
  }

  /**
   * Query parametrizada MULT (✅ PROTEGIDO contra SQL Injection)
   */
  static async queryMultWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (this.useMockData) {
      return this.getMockConnection().queryWithParams(sql, params);
    }

    if (!this.connectionMult) {
      throw new Error('Conexão MULT não inicializada');
    }

    return this.connectionMult.queryWithParams(sql, params);
  }

  private static getMockConnection(): IConnection {
    return new MockConnection();
  }

  static getConnectionStatus(): ConnectionStatus {
    return {
      type: this.connectionType,
      mode: this.useMockData ? 'MOCK_DATA' : 'REAL_DATABASE',
      error: this.connectionError || undefined,
    };
  }

  static isReady(): boolean {
    return this.isInitialized;
  }

  static async close(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.connectionEmp) {
      promises.push(this.connectionEmp.close());
    }
    if (this.connectionMult) {
      promises.push(this.connectionMult.close());
    }

    await Promise.all(promises);

    this.connectionEmp = null;
    this.connectionMult = null;
    this.isInitialized = false;

    console.log('🔌 Conexões fechadas');
  }

  // Métodos legados para compatibilidade
  static getConnectionEmp(): IConnection {
    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }
    return this.connectionEmp;
  }

  static getConnectionMult(): IConnection {
    if (!this.connectionMult) {
      throw new Error('Conexão MULT não inicializada');
    }
    return this.connectionMult;
  }
}