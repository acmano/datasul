// @ts-nocheck
import sql from 'mssql';
import odbc from 'odbc';

type ConnectionType = 'sqlserver' | 'odbc';

export class DatabaseManager {
  // SQL Server pools
  private static poolEmp: sql.ConnectionPool | null = null;
  private static poolMult: sql.ConnectionPool | null = null;

  // ODBC connections
  private static odbcPoolEmp: odbc.Pool | null = null;
  private static odbcPoolMult: odbc.Pool | null = null;

  private static connectionType: ConnectionType = 'odbc';
  private static useMockData: boolean = false;
  private static connectionError: string | null = null;
  private static isInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;

  // Mock data para fallback
  private static mockData = {
    itens: [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item Teste 1',
        unidadeMedidaCodigo: 'UN',
        grupoEstoqueCodigo: 1,
        familiaCodigo: 'FAM01',
      }
    ]
  };

  // Configuração SQL Server EMP
  private static getSqlServerConfigEmp(): sql.config {
    return {
      server: process.env.DB_SERVER || '',
      database: process.env.DB_DATABASE_EMP || 'PRD_EMS2EMP',
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '1433'),
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000'),
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }

  // Configuração SQL Server MULT
  private static getSqlServerConfigMult(): sql.config {
    return {
      ...this.getSqlServerConfigEmp(),
      database: process.env.DB_DATABASE_MULT || 'PRD_EMS2MULT',
    };
  }

  // Connection string ODBC
  private static getOdbcConnectionString(database: 'EMP' | 'MULT'): string {
    const dsnName = database === 'EMP'
      ? process.env.ODBC_DSN_EMP || 'PRD_EMS2EMP'
      : process.env.ODBC_DSN_MULT || 'PRD_EMS2MULT';

    const user = process.env.ODBC_USER || process.env.DB_USER || '';
    const password = process.env.ODBC_PASSWORD || process.env.DB_PASSWORD || '';

    return `DSN=${dsnName};UID=${user};PWD=${password}`;
  }

  // Inicialização principal
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

  // Executa inicialização
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
      console.log('CONECTADO AO DATASUL');
    } catch (error) {
      this.connectionError = (error as Error).message;
      this.useMockData = true;
      this.isInitialized = true;
      console.log('Usando modo mock');
      console.log('Erro:', this.connectionError);
    }
  }

  // Inicializa ODBC
  private static async initializeOdbc(): Promise<void> {
    console.log('Conectando via ODBC ao Progress...');

    try {
      const connStrEmp = this.getOdbcConnectionString('EMP');
      this.odbcPoolEmp = await odbc.pool(connStrEmp);
      console.log('EMP (ODBC Progress) conectado');

      const connStrMult = this.getOdbcConnectionString('MULT');
      this.odbcPoolMult = await odbc.pool(connStrMult);
      console.log('MULT (ODBC Progress) conectado');

      // Testa conexão
      const result = await this.odbcPoolEmp.query(
        'SELECT CURRENT_TIMESTAMP as data FROM pub.sysprogress WHERE rownum = 1'
      );
      console.log('Teste conexao OK:', result?.[0]);
    } catch (error) {
      console.error('Erro ao conectar ODBC:', error);
      throw error;
    }
  }

  // Inicializa SQL Server
  private static async initializeSqlServer(): Promise<void> {
    console.log('Conectando via SQL Server...');

    try {
      this.poolEmp = new sql.ConnectionPool(this.getSqlServerConfigEmp());
      await this.poolEmp.connect();
      console.log('EMP (SQL Server) conectado');

      this.poolMult = new sql.ConnectionPool(this.getSqlServerConfigMult());
      await this.poolMult.connect();
      console.log('MULT (SQL Server) conectado');

      const result = await this.poolEmp.request().query('SELECT GETDATE() as data');
      console.log('Teste conexao OK:', result.recordset[0]?.data);
    } catch (error) {
      console.error('Erro ao conectar SQL Server:', error);
      throw error;
    }
  }

  // Executa query no banco EMP
  static async executeQueryEmp(query: string): Promise<any> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (this.useMockData) {
      return this.executeMockQuery(query);
    }

    try {
      if (this.connectionType === 'odbc') {
        if (!this.odbcPoolEmp) {
          throw new Error('Pool ODBC EMP indisponivel');
        }
        const result = await this.odbcPoolEmp.query(query);
        return result; // ODBC retorna array direto
      } else {
        if (!this.poolEmp?.connected) {
          throw new Error('Pool SQL Server EMP indisponivel');
        }
        const result = await this.poolEmp.request().query(query);
        return result.recordset; // SQL Server tem .recordset
      }
    } catch (error) {
      console.error('Erro query EMP:', error);
      this.useMockData = true;
      return this.executeMockQuery(query);
    }
  }

  // Executa query no banco MULT
  static async executeQueryMult(query: string): Promise<any> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (this.useMockData) {
      return this.executeMockQuery(query);
    }

    try {
      if (this.connectionType === 'odbc') {
        if (!this.odbcPoolMult) {
          throw new Error('Pool ODBC MULT indisponivel');
        }
        const result = await this.odbcPoolMult.query(query);
        return result;
      } else {
        if (!this.poolMult?.connected) {
          throw new Error('Pool SQL Server MULT indisponivel');
        }
        const result = await this.poolMult.request().query(query);
        return result.recordset;
      }
    } catch (error) {
      console.error('Erro query MULT:', error);
      this.useMockData = true;
      return this.executeMockQuery(query);
    }
  }

  // Mock query
  private static async executeMockQuery(_query: string): Promise<any> {
    console.log('Executando query mock');
    return this.mockData.itens;
  }

  // Status da conexão
  static getConnectionStatus() {
    return {
      type: this.connectionType,
      mode: this.useMockData ? 'MOCK_DATA' : 'REAL_DATABASE',
      error: this.connectionError || undefined,
    };
  }

  // Verifica se está pronto
  static isReady(): boolean {
    return this.isInitialized;
  }

  // Verifica se está usando mock
  static isUsingMockData(): boolean {
    return this.useMockData;
  }

  // Fecha todas as conexões
  static async close(): Promise<void> {
    console.log('Fechando conexoes...');

    if (this.poolEmp) {
      await this.poolEmp.close();
      this.poolEmp = null;
    }

    if (this.poolMult) {
      await this.poolMult.close();
      this.poolMult = null;
    }

    if (this.odbcPoolEmp) {
      await this.odbcPoolEmp.close();
      this.odbcPoolEmp = null;
    }

    if (this.odbcPoolMult) {
      await this.odbcPoolMult.close();
      this.odbcPoolMult = null;
    }

    this.isInitialized = false;
    this.useMockData = false;
    console.log('Conexoes fechadas');
  }

  // Testa conectividade
  static async testConnections(): Promise<{
    isConnected: boolean;
    type: ConnectionType;
    usingMock: boolean;
    error?: string;
  }> {
    const status = this.getConnectionStatus();

    return {
      isConnected: !this.useMockData,
      type: this.connectionType,
      usingMock: this.useMockData,
      error: status.error,
    };
  }
}