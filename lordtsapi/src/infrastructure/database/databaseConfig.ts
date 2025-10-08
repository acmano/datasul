// src/infrastructure/database/databaseConfig.ts

/**
 * @fileoverview Configuração e gerenciamento de conexões com banco de dados
 *
 * @description
 * Este arquivo contém a implementação legada do DatabaseManager com configurações
 * SQL Server e ODBC embutidas. Mantido para compatibilidade retroativa.
 *
 * NOTA: Para novos desenvolvimentos, use:
 * - DatabaseManager em './DatabaseManager.ts'
 * - Configurações SQL Server em './config/sqlServerConfig.ts'
 * - Configurações ODBC em './config/odbcConfig.ts'
 *
 * @module infrastructure/database/databaseConfig
 */

import sql from 'mssql';
import odbc from 'odbc';

/**
 * Tipos de conexão suportados
 */
type ConnectionType = 'sqlserver' | 'odbc';

/**
 * Gerenciador de conexões com banco de dados
 *
 * @description
 * Implementação legada do DatabaseManager com configurações embutidas.
 * Gerencia pools de conexão SQL Server e ODBC, implementando fallback
 * automático para dados mockados em caso de falha.
 *
 * @class DatabaseManager
 *
 * @example
 * ```typescript
 * // Inicializar conexão
 * await DatabaseManager.initialize();
 *
 * // Executar query
 * const result = await DatabaseManager.queryEmp('SELECT * FROM item');
 *
 * // Fechar conexões
 * await DatabaseManager.close();
 * ```
 */
export class DatabaseManager {
  // ====================================================================
  // PROPRIEDADES PRIVADAS
  // ====================================================================

  /**
   * Pool de conexão SQL Server para banco EMP
   * @private
   * @static
   */
  private static poolEmp: sql.ConnectionPool | null = null;

  /**
   * Pool de conexão SQL Server para banco MULT
   * @private
   * @static
   */
  private static poolMult: sql.ConnectionPool | null = null;

  /**
   * Pool de conexão ODBC para banco EMP
   * @private
   * @static
   */
  private static odbcPoolEmp: odbc.Pool | null = null;

  /**
   * Pool de conexão ODBC para banco MULT
   * @private
   * @static
   */
  private static odbcPoolMult: odbc.Pool | null = null;

  /**
   * Tipo de conexão ativa (SQL Server ou ODBC)
   * @private
   * @static
   * @default 'odbc'
   */
  private static connectionType: ConnectionType = 'odbc';

  /**
   * Flag indicando se está usando dados mockados
   * @private
   * @static
   * @default false
   */
  private static useMockData: boolean = false;

  /**
   * Mensagem de erro de conexão, se houver
   * @private
   * @static
   * @default null
   */
  private static connectionError: string | null = null;

  /**
   * Flag indicando se o DatabaseManager foi inicializado
   * @private
   * @static
   * @default false
   */
  private static isInitialized: boolean = false;

  /**
   * Promise de inicialização para evitar múltiplas inicializações simultâneas
   * @private
   * @static
   * @default null
   */
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Dados mockados para fallback em caso de falha de conexão
   * @private
   * @static
   */
  private static mockData = {
    itens: [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item Teste 1',
        unidadeMedidaCodigo: 'UN',
        grupoEstoqueCodigo: 1,
        familiaCodigo: 'FAM01',
      },
    ],
  };

  // ====================================================================
  // MÉTODOS DE CONFIGURAÇÃO SQL SERVER
  // ====================================================================

  /**
   * Retorna configuração para conexão SQL Server EMP
   *
   * @description
   * Monta objeto de configuração para pool SQL Server do banco EMP
   * usando variáveis de ambiente. Suporta database vazio para usar
   * o database padrão do usuário SQL Server.
   *
   * @returns {sql.config} Objeto de configuração do mssql
   *
   * @private
   * @static
   *
   * @example
   * ```typescript
   * const config = DatabaseManager.getSqlServerConfigEmp();
   * // {
   * //   server: '10.105.0.4\LOREN',
   * //   database: '',  // Usa default do user
   * //   user: 'dcloren',
   * //   password: '#dcloren#',
   * //   ...
   * // }
   * ```
   *
   * @see {@link https://www.npmjs.com/package/mssql}
   */
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

  /**
   * Retorna configuração para conexão SQL Server MULT
   *
   * @description
   * Monta objeto de configuração para pool SQL Server do banco MULT.
   * Herda todas as configurações de EMP, alterando apenas o database.
   *
   * @returns {sql.config} Objeto de configuração do mssql
   *
   * @private
   * @static
   *
   * @example
   * ```typescript
   * const config = DatabaseManager.getSqlServerConfigMult();
   * // Mesmas configs de EMP, mas database: 'PRD_EMS2MULT'
   * ```
   */
  private static getSqlServerConfigMult(): sql.config {
    return {
      ...this.getSqlServerConfigEmp(),
      database: process.env.DB_DATABASE_MULT || 'PRD_EMS2MULT',
    };
  }

  // ====================================================================
  // MÉTODOS DE CONFIGURAÇÃO ODBC
  // ====================================================================

  /**
   * Retorna connection string ODBC para banco especificado
   *
   * @description
   * Monta string de conexão ODBC usando DSN configurado nas variáveis
   * de ambiente. Suporta conexão para banco EMP ou MULT.
   *
   * @param {('EMP'|'MULT')} database - Identificador do banco (EMP ou MULT)
   * @returns {string} Connection string ODBC formatada
   *
   * @private
   * @static
   *
   * @example
   * ```typescript
   * const connStr = DatabaseManager.getOdbcConnectionString('EMP');
   * // 'DSN=PRD_EMS2EMP'
   * ```
   *
   * @throws {Error} Se variáveis de ambiente ODBC não estiverem configuradas
   */
  private static getOdbcConnectionString(database: 'EMP' | 'MULT'): string {
    const dsnName =
      database === 'EMP'
        ? process.env.ODBC_DSN_EMP || 'PRD_EMS2EMP'
        : process.env.ODBC_DSN_MULT || 'PRD_EMS2MULT';
    return `DSN=${dsnName}`;
  }

  // ====================================================================
  // MÉTODOS DE INICIALIZAÇÃO
  // ====================================================================

  /**
   * Inicializa conexões com banco de dados
   *
   * @description
   * Método principal de inicialização. Detecta tipo de conexão através
   * de variável de ambiente e inicializa pools apropriados. Implementa
   * fallback automático para mock data em caso de falha.
   *
   * @returns {Promise<void>}
   *
   * @throws {Error} Se ambas as tentativas (SQL Server e ODBC) falharem
   *
   * @public
   * @static
   * @async
   *
   * @example
   * ```typescript
   * try {
   *   await DatabaseManager.initialize();
   *   console.log('Banco conectado!');
   * } catch (error) {
   *   console.error('Falha ao conectar:', error);
   * }
   * ```
   *
   * @remarks
   * - Se já inicializado, retorna a promise de inicialização existente
   * - Em caso de falha, ativa automaticamente modo MOCK_DATA
   * - Registra logs detalhados do processo de inicialização
   */
  static async initialize(): Promise<void> {
    // Evitar múltiplas inicializações simultâneas
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      return;
    }

    this.initializationPromise = this.doInitialize();
    await this.initializationPromise;
  }

  /**
   * Executa a inicialização das conexões
   *
   * @description
   * Método auxiliar privado que realiza a lógica de inicialização.
   * Tenta conexão SQL Server primeiro, depois ODBC, e finalmente
   * ativa mock data se ambos falharem.
   *
   * @returns {Promise<void>}
   *
   * @private
   * @static
   * @async
   *
   * @remarks
   * IMPORTANTE: Sempre usa parseInt() direto, NÃO parseTimeout()
   * Os timeouts devem estar em ms puros no .env (30000, não '30s')
   */
  private static async doInitialize(): Promise<void> {
    try {
      // Determinar tipo de conexão
      this.connectionType =
        (process.env.DB_CONNECTION_TYPE as ConnectionType) || 'odbc';

      // Verificar se deve usar mock data
      const useMockEnv = process.env.USE_MOCK_DATA?.toLowerCase();
      if (useMockEnv === 'true' || useMockEnv === '1') {
        console.log('⚠️  MODO MOCK ATIVADO via USE_MOCK_DATA=true');
        this.useMockData = true;
        this.isInitialized = true;
        return;
      }

      // Tentar conexão real
      if (this.connectionType === 'sqlserver') {
        await this.initializeSqlServer();
      } else {
        await this.initializeOdbc();
      }

      this.isInitialized = true;
      console.log('✅ Banco de dados inicializado com sucesso');
    } catch (error) {
      // Fallback para mock data
      console.error('❌ Erro ao conectar ao banco:', error);
      console.log('⚠️  Usando MOCK_DATA como fallback');

      this.useMockData = true;
      this.connectionError =
        error instanceof Error ? error.message : String(error);
      this.isInitialized = true;
    }
  }

  /**
   * Inicializa conexões SQL Server
   *
   * @description
   * Cria e conecta pools SQL Server para bancos EMP e MULT.
   * Realiza conexão em paralelo para melhor performance.
   *
   * @returns {Promise<void>}
   *
   * @private
   * @static
   * @async
   *
   * @throws {Error} Se falhar ao conectar em qualquer dos pools
   *
   * @example
   * ```typescript
   * // Chamado internamente por initialize()
   * await DatabaseManager.initializeSqlServer();
   * ```
   */
  private static async initializeSqlServer(): Promise<void> {
    console.log('📡 Inicializando SQL Server...');

    const configEmp = this.getSqlServerConfigEmp();
    const configMult = this.getSqlServerConfigMult();

    // Criar pools
    this.poolEmp = new sql.ConnectionPool(configEmp);
    this.poolMult = new sql.ConnectionPool(configMult);

    // Conectar em paralelo
    await Promise.all([this.poolEmp.connect(), this.poolMult.connect()]);

    console.log('✅ SQL Server conectado com sucesso');
  }

  /**
   * Inicializa conexões ODBC
   *
   * @description
   * Cria e conecta pools ODBC para bancos EMP e MULT.
   * Realiza conexão em paralelo para melhor performance.
   *
   * @returns {Promise<void>}
   *
   * @private
   * @static
   * @async
   *
   * @throws {Error} Se falhar ao conectar em qualquer dos pools
   *
   * @example
   * ```typescript
   * // Chamado internamente por initialize()
   * await DatabaseManager.initializeOdbc();
   * ```
   */
  private static async initializeOdbc(): Promise<void> {
    console.log('📡 Inicializando ODBC...');

    const connStrEmp = this.getOdbcConnectionString('EMP');
    const connStrMult = this.getOdbcConnectionString('MULT');

    // Criar pools ODBC
    this.odbcPoolEmp = await odbc.pool(connStrEmp);
    this.odbcPoolMult = await odbc.pool(connStrMult);

    console.log('✅ ODBC conectado com sucesso');
  }

  // ====================================================================
  // MÉTODOS DE QUERY
  // ====================================================================

  /**
   * Executa query no banco EMP
   *
   * @description
   * Executa query SQL no banco EMP. Se mock data estiver ativo,
   * retorna dados mockados. Suporta tanto SQL Server quanto ODBC.
   *
   * @param {string} sql - Query SQL a ser executada
   * @returns {Promise<any>} Resultado da query
   *
   * @public
   * @static
   * @async
   *
   * @throws {Error} Se conexão não estiver inicializada
   * @throws {Error} Se query falhar
   *
   * @example
   * ```typescript
   * const items = await DatabaseManager.queryEmp(`
   *   SELECT * FROM OPENQUERY(PRD_EMS2EMP,
   *     'SELECT "it-codigo" FROM pub.item LIMIT 10'
   *   )
   * `);
   * ```
   *
   * @remarks
   * IMPORTANTE: Para queries com parâmetros, use queryEmpWithParams()
   * para prevenir SQL Injection
   */
  static async queryEmp(sql: string): Promise<any> {
    if (this.useMockData) {
      return this.getMockData();
    }

    if (!this.isInitialized) {
      throw new Error('DatabaseManager não inicializado. Chame initialize() primeiro.');
    }

    if (this.connectionType === 'sqlserver') {
      if (!this.poolEmp) {
        throw new Error('Pool EMP não está disponível');
      }
      const result = await this.poolEmp.request().query(sql);
      return result.recordset;
    } else {
      if (!this.odbcPoolEmp) {
        throw new Error('Pool ODBC EMP não está disponível');
      }
      const result = await this.odbcPoolEmp.query(sql);
      return result;
    }
  }

  /**
   * Executa query no banco MULT
   *
   * @description
   * Executa query SQL no banco MULT. Se mock data estiver ativo,
   * retorna dados mockados. Suporta tanto SQL Server quanto ODBC.
   *
   * @param {string} sql - Query SQL a ser executada
   * @returns {Promise<any>} Resultado da query
   *
   * @public
   * @static
   * @async
   *
   * @throws {Error} Se conexão não estiver inicializada
   * @throws {Error} Se query falhar
   *
   * @example
   * ```typescript
   * const estabelecimentos = await DatabaseManager.queryMult(`
   *   SELECT * FROM OPENQUERY(PRD_EMS2MULT,
   *     'SELECT "cod-estabel" FROM pub.estabelec'
   *   )
   * `);
   * ```
   */
  static async queryMult(sql: string): Promise<any> {
    if (this.useMockData) {
      return this.getMockData();
    }

    if (!this.isInitialized) {
      throw new Error('DatabaseManager não inicializado. Chame initialize() primeiro.');
    }

    if (this.connectionType === 'sqlserver') {
      if (!this.poolMult) {
        throw new Error('Pool MULT não está disponível');
      }
      const result = await this.poolMult.request().query(sql);
      return result.recordset;
    } else {
      if (!this.odbcPoolMult) {
        throw new Error('Pool ODBC MULT não está disponível');
      }
      const result = await this.odbcPoolMult.query(sql);
      return result;
    }
  }

  // ====================================================================
  // MÉTODOS DE UTILIDADE
  // ====================================================================

  /**
   * Retorna dados mockados para fallback
   *
   * @description
   * Retorna conjunto de dados mockados quando conexão real falha.
   * Útil para testes e desenvolvimento sem acesso ao banco.
   *
   * @returns {any} Objeto com dados mockados
   *
   * @private
   * @static
   *
   * @example
   * ```typescript
   * const mockData = DatabaseManager.getMockData();
   * // { itens: [...] }
   * ```
   */
  private static getMockData(): any {
    return this.mockData;
  }

  /**
   * Verifica se DatabaseManager está pronto para uso
   *
   * @description
   * Retorna true se o manager foi inicializado com sucesso,
   * seja com conexão real ou em modo mock.
   *
   * @returns {boolean} true se inicializado, false caso contrário
   *
   * @public
   * @static
   *
   * @example
   * ```typescript
   * if (DatabaseManager.isReady()) {
   *   const data = await DatabaseManager.queryEmp('...');
   * }
   * ```
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Retorna status atual das conexões
   *
   * @description
   * Fornece informações detalhadas sobre o estado das conexões:
   * tipo de conexão ativa, se está usando mock data, e mensagens de erro.
   *
   * @returns {object} Objeto com status das conexões
   * @returns {ConnectionType} returns.type - Tipo de conexão (sqlserver/odbc)
   * @returns {string} returns.mode - Modo de operação (MOCK_DATA/REAL_DATABASE)
   * @returns {string} [returns.error] - Mensagem de erro, se houver
   *
   * @public
   * @static
   *
   * @example
   * ```typescript
   * const status = DatabaseManager.getConnectionStatus();
   * // {
   * //   type: 'odbc',
   * //   mode: 'REAL_DATABASE',
   * //   error: undefined
   * // }
   * ```
   */
  static getConnectionStatus(): {
    type: ConnectionType;
    mode: 'MOCK_DATA' | 'REAL_DATABASE';
    error?: string;
  } {
    return {
      type: this.connectionType,
      mode: this.useMockData ? 'MOCK_DATA' : 'REAL_DATABASE',
      error: this.connectionError || undefined,
    };
  }

  /**
   * Fecha todas as conexões abertas
   *
   * @description
   * Encerra gracefully todos os pools de conexão ativos.
   * Importante chamar antes de encerrar a aplicação para
   * evitar conexões pendentes.
   *
   * @returns {Promise<void>}
   *
   * @public
   * @static
   * @async
   *
   * @example
   * ```typescript
   * // No graceful shutdown
   * process.on('SIGTERM', async () => {
   *   await DatabaseManager.close();
   *   process.exit(0);
   * });
   * ```
   *
   * @remarks
   * - Fecha pools SQL Server (EMP e MULT)
   * - Fecha pools ODBC (EMP e MULT)
   * - Reseta flags de inicialização
   * - Não lança erro se pools já estiverem fechados
   */
  static async close(): Promise<void> {
    console.log('🔌 Fechando conexões do banco...');

    try {
      // Fechar pools SQL Server
      if (this.poolEmp) {
        await this.poolEmp.close();
        this.poolEmp = null;
      }

      if (this.poolMult) {
        await this.poolMult.close();
        this.poolMult = null;
      }

      // Fechar pools ODBC
      if (this.odbcPoolEmp) {
        await this.odbcPoolEmp.close();
        this.odbcPoolEmp = null;
      }

      if (this.odbcPoolMult) {
        await this.odbcPoolMult.close();
        this.odbcPoolMult = null;
      }

      this.isInitialized = false;
      this.initializationPromise = null;

      console.log('✅ Conexões fechadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fechar conexões:', error);
      throw error;
    }
  }
}