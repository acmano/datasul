// src/infrastructure/database/DatabaseManager.ts

import {
  ConnectionType,
  ConnectionStatus,
  IConnection,
  QueryParameter,
  DatabaseConfig,
} from './types';
import { SqlServerConnection } from './connections/SqlServerConnection';
import { OdbcConnection } from './connections/OdbcConnection';
import { MockConnection } from './connections/MockConnection';
import { getSqlServerConfigEmp, getSqlServerConfigMult } from './config/sqlServerConfig';
import { getOdbcConnectionString } from './config/odbcConfig';
import { DatabaseMetricsHelper } from '@infrastructure/metrics/helpers/databaseMetrics';
import { connectionMetrics } from '@infrastructure/metrics/ConnectionMetrics';
import { log } from '@shared/utils/logger';
import {
  ConnectionConfig,
  ConnectionRegistry,
  DatasulEnvironment,
  findConnectionByDSN,
  getDefaultDatasulEnvironment,
  getDefaultInformixEnvironment,
  getDefaultPCFactoryEnvironment,
  getDefaultCorporativoEnvironment,
  getDatasulConnection,
  getInformixConnection,
  getPCFactoryConnection,
  getCorporativoConnection,
  AVAILABLE_CONNECTIONS,
} from '@config/connections.config';
import { RetryPolicy } from './retry/RetryPolicy';
import { getRetryPolicyByDSN } from '@config/retry.config';
import { chaosInjector } from '../chaos/ChaosInjector';
import { connectionGroupRegistry } from './multiRegion/ConnectionGroups';
import { multiRegionMetrics } from '@infrastructure/metrics/MultiRegionMetrics';
import { DatabaseInstrumentation } from '@infrastructure/tracing/DatabaseInstrumentation';
import { circuitBreakerManager } from './circuitBreaker/CircuitBreaker';

/**
 * Connection pool entry for managing named connections
 *
 * @interface ConnectionPoolEntry
 * @private
 */
interface ConnectionPoolEntry {
  /** Connection instance */
  connection: IConnection;
  /** Connection configuration */
  config: ConnectionConfig;
  /** Timestamp of last use (for idle timeout) */
  lastUsed: Date;
  /** Number of active queries */
  activeQueries: number;
}

/**
 * Gerenciador centralizado de conexões com banco de dados
 *
 * @description
 * Implementa o padrão Singleton para gerenciar todas as conexões de banco de dados
 * da aplicação. Suporta múltiplos tipos de conexão (SQL Server, ODBC) e implementa
 * fallback automático para dados mockados em caso de falha.
 *
 * **NOVAS FUNCIONALIDADES v2.0:**
 * - Gerenciamento de múltiplas conexões nomeadas (22+ conexões ODBC)
 * - Pool de conexões com lazy initialization
 * - Conexões on-demand (criadas apenas quando necessárias)
 * - Suporte a todos os ambientes Datasul (Production, Test, Homologation)
 * - Suporte a todos os ambientes Informix (Dev, Atu, New, Prd)
 * - Health checking por conexão individual
 * - Lifecycle management completo (create, use, close)
 *
 * Funcionalidades principais:
 * - Gerenciamento de conexões EMP (empresa) e MULT (múltiplas empresas) - LEGACY
 * - Gerenciamento de conexões nomeadas via DSN - NOVO
 * - Suporte a SQL Server e ODBC
 * - Fallback automático para MockConnection
 * - Retry automático com backoff exponencial
 * - Instrumentação com métricas de performance
 * - Pool de conexões para otimização
 *
 * Arquitetura:
 * - Singleton: garante uma única instância na aplicação
 * - Strategy Pattern: suporta diferentes tipos de conexão
 * - Fail-Safe: nunca quebra, usa mock em caso de falha
 * - Lazy Loading: conexões criadas on-demand
 *
 * @example Uso legacy (mantido para compatibilidade)
 * ```typescript
 * await DatabaseManager.initialize();
 * const result = await DatabaseManager.queryEmpWithParams(
 *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
 *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
 * );
 * ```
 *
 * @example Uso com conexões nomeadas (NOVO)
 * ```typescript
 * await DatabaseManager.initialize();
 *
 * // Buscar por DSN específico
 * const result = await DatabaseManager.queryWithConnection(
 *   'DtsPrdEmp',
 *   'SELECT * FROM item WHERE "it-codigo" = ?',
 *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
 * );
 *
 * // Buscar por ambiente
 * const conn = await DatabaseManager.getConnectionByEnvironment('datasul', 'production', 'emp');
 * const result = await conn.queryWithParams('SELECT * FROM item', []);
 * ```
 *
 * @example Gerenciamento de conexões
 * ```typescript
 * // Listar conexões ativas
 * const active = DatabaseManager.getActiveConnections();
 * console.log('Conexões ativas:', active);
 *
 * // Fechar conexão específica
 * await DatabaseManager.closeConnection('DtsTstEmp');
 *
 * // Fechar todas
 * await DatabaseManager.closeAllConnections();
 * ```
 *
 * @critical
 * - NUNCA chamar o construtor diretamente, usar getInstance()
 * - SEMPRE inicializar com initialize() antes de usar
 * - Queries devem usar parâmetros para prevenir SQL injection
 * - Em produção, NUNCA usar useMockData
 * - Conexões são criadas on-demand (lazy initialization)
 * - Pool de conexões é gerenciado automaticamente
 *
 * @see {@link IConnection} - Interface de conexão
 * @see {@link QueryParameter} - Parâmetros de query
 * @see {@link ConnectionStatus} - Status das conexões
 * @see {@link ConnectionConfig} - Configuração de conexões nomeadas
 */
export class DatabaseManager {
  /**
   * Instância singleton do DatabaseManager
   * @private
   */
  private static instance: DatabaseManager | null = null;

  /**
   * Conexão com o database EMP (empresa) - LEGACY
   * @private
   * @deprecated Use getConnection() ou queryWithConnection() para novas implementações
   */
  private static connectionEmp: IConnection | null = null;

  /**
   * Conexão com o database MULT (múltiplas empresas) - LEGACY
   * @private
   * @deprecated Use getConnection() ou queryWithConnection() para novas implementações
   */
  private static connectionMult: IConnection | null = null;

  /**
   * Pool de conexões nomeadas (por DSN)
   * @private
   */
  private static connectionPool: Map<string, ConnectionPoolEntry> = new Map();

  /**
   * Tipo de conexão ativa (sqlserver ou odbc)
   * @private
   * @default 'odbc'
   */
  private static connectionType: ConnectionType = 'odbc';

  /**
   * Flag indicando se está usando dados mockados
   * @private
   * @default false
   */
  private static useMockData: boolean = false;

  /**
   * Mensagem de erro de conexão (se houver)
   * @private
   */
  private static connectionError: string | null = null;

  /**
   * Flag indicando se o manager foi inicializado
   * @private
   * @default false
   */
  private static isInitialized: boolean = false;

  /**
   * Promise de inicialização para prevenir múltiplas inicializações
   * @private
   */
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Mapa de políticas de retry por connectionId (DSN)
   * @private
   */
  private static retryPolicies: Map<string, RetryPolicy> = new Map();

  /**
   * Construtor privado para implementação do padrão Singleton
   *
   * @description
   * O construtor é privado para prevenir instanciação direta.
   * Use getInstance() para obter a instância.
   *
   * @private
   * @critical Nunca tornar público ou remover
   */
  private constructor() {}

  /**
   * Retorna a instância singleton do DatabaseManager
   *
   * @description
   * Implementação lazy do Singleton. Cria a instância apenas
   * na primeira chamada e retorna a mesma instância nas chamadas
   * subsequentes.
   *
   * @returns {DatabaseManager} Instância única do DatabaseManager
   *
   * @example
   * ```typescript
   * const manager = DatabaseManager.getInstance();
   * ```
   *
   * @critical
   * Esta é a ÚNICA forma de obter uma instância do DatabaseManager
   */
  static getInstance(): DatabaseManager {
    if (!this.instance) {
      this.instance = new DatabaseManager();
    }
    return this.instance;
  }

  /**
   * Retorna a conexão primária (EMP) - LEGACY
   *
   * @description
   * Retorna a conexão com o database EMP (empresa).
   * Usado principalmente pelo health check.
   * Se estiver usando mock, retorna MockConnection.
   *
   * @returns {IConnection} Conexão ativa ou MockConnection
   * @throws {Error} Se a conexão não foi inicializada
   *
   * @deprecated Use getConnection('DtsPrdEmp') para novas implementações
   *
   * @example
   * ```typescript
   * const conn = DatabaseManager.getConnection();
   * await conn.query('SELECT 1');
   * ```
   *
   * @critical
   * Sempre verificar se está inicializado antes de chamar
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

  // ============================================================================
  // RETRY POLICY MANAGEMENT
  // ============================================================================

  /**
   * Define política de retry customizada para uma conexão específica
   *
   * @param {string} connectionId - ID da conexão (DSN)
   * @param {RetryPolicy} policy - Política de retry a ser usada
   *
   * @description
   * Permite configurar política de retry específica para uma conexão.
   * Se não configurado, usa política automática baseada no DSN.
   *
   * @example
   * ```typescript
   * import { aggressiveRetryPolicy } from '@infrastructure/database/retry/RetryPolicy';
   *
   * DatabaseManager.setRetryPolicy('DtsPrdEmp', aggressiveRetryPolicy);
   * ```
   *
   * @example Política customizada
   * ```typescript
   * const customPolicy = new RetryPolicy({
   *   maxAttempts: 10,
   *   initialDelayMs: 25,
   *   maxDelayMs: 2000
   * });
   *
   * DatabaseManager.setRetryPolicy('MyCustomDSN', customPolicy);
   * ```
   */
  static setRetryPolicy(connectionId: string, policy: RetryPolicy): void {
    this.retryPolicies.set(connectionId, policy);
    log.info('Custom retry policy set', {
      connectionId,
      config: policy.getConfig(),
    });
  }

  /**
   * Obtém política de retry para uma conexão
   *
   * @param {string} connectionId - ID da conexão (DSN)
   * @returns {RetryPolicy} Política de retry (customizada ou automática)
   *
   * @description
   * Retorna política de retry para a conexão:
   * 1. Se houver política customizada, retorna ela
   * 2. Caso contrário, retorna política automática baseada no DSN
   *
   * @private
   *
   * @example
   * ```typescript
   * const policy = DatabaseManager.getRetryPolicy('DtsPrdEmp');
   * // Retorna: aggressiveRetryPolicy (5 tentativas)
   * ```
   */
  private static getRetryPolicy(connectionId: string): RetryPolicy {
    // Verifica se há política customizada
    const customPolicy = this.retryPolicies.get(connectionId);
    if (customPolicy) {
      return customPolicy;
    }

    // Retorna política automática baseada no DSN
    return getRetryPolicyByDSN(connectionId);
  }

  /**
   * Remove política de retry customizada (volta para automática)
   *
   * @param {string} connectionId - ID da conexão (DSN)
   *
   * @description
   * Remove política customizada. A conexão volta a usar
   * política automática baseada no DSN.
   *
   * @example
   * ```typescript
   * DatabaseManager.removeRetryPolicy('DtsPrdEmp');
   * // Volta a usar política automática (agressiva para produção)
   * ```
   */
  static removeRetryPolicy(connectionId: string): void {
    const removed = this.retryPolicies.delete(connectionId);
    if (removed) {
      log.info('Custom retry policy removed', { connectionId });
    }
  }

  /**
   * Limpa todas as políticas de retry customizadas
   *
   * @description
   * Remove todas as políticas customizadas. Todas as conexões
   * voltam a usar políticas automáticas.
   *
   * @example
   * ```typescript
   * DatabaseManager.clearRetryPolicies();
   * ```
   */
  static clearRetryPolicies(): void {
    const count = this.retryPolicies.size;
    this.retryPolicies.clear();
    if (count > 0) {
      log.info('All custom retry policies cleared', { count });
    }
  }

  /**
   * Inicializa todas as conexões com o banco de dados
   *
   * @description
   * Método principal de inicialização. Executa os seguintes passos:
   * 1. Verifica se já está inicializando ou inicializado
   * 2. Lê configurações do ambiente (tipo de conexão, mock mode)
   * 3. Tenta conectar no banco (SQL Server ou ODBC)
   * 4. Em caso de falha, ativa modo mock automaticamente
   * 5. Registra métricas de conexão
   *
   * **IMPORTANTE:** Apenas as conexões EMP e MULT legacy são criadas automaticamente.
   * Outras conexões são criadas on-demand quando necessárias.
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // No server.ts
   * try {
   *   await DatabaseManager.initialize();
   *   log.info('Banco conectado!');
   * } catch (error) {
   *   log.error('Falha na conexão:', error);
   * }
   * ```
   *
   * @critical
   * - DEVE ser chamado antes de qualquer query
   * - É seguro chamar múltiplas vezes (evita re-inicialização)
   * - NUNCA lança exceção (usa mock em caso de erro)
   * - Em produção, verificar se NÃO está em modo mock
   * - Conexões nomeadas são lazy-loaded (criadas on-demand)
   */
  static async initialize(): Promise<void> {
    // Se já está inicializando, aguarda a Promise existente
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Se já foi inicializado, retorna imediatamente
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // Cria nova Promise de inicialização
    this.initializationPromise = this.doInitialize();

    try {
      await this.initializationPromise;
    } finally {
      // Limpa a Promise ao finalizar (sucesso ou erro)
      this.initializationPromise = null;
    }
  }

  /**
   * Executa a inicialização das conexões
   *
   * @description
   * Método interno que realiza a inicialização propriamente dita.
   * Separado de initialize() para melhor controle do fluxo assíncrono.
   *
   * Fluxo:
   * 1. Lê DB_CONNECTION_TYPE do ambiente
   * 2. Chama initializeOdbc() ou initializeSqlServer()
   * 3. Marca como inicializado
   * 4. Em caso de erro: ativa mock e registra erro
   *
   * @returns {Promise<void>}
   * @private
   *
   * @critical
   * Este método NUNCA deve lançar exceção para não quebrar a aplicação.
   * Sempre usa fallback para mock em caso de falha.
   */
  private static async doInitialize(): Promise<void> {
    log.info('Inicializando conexões Datasul...');

    // Lê tipo de conexão do ambiente
    this.connectionType = (process.env.DB_CONNECTION_TYPE as ConnectionType) || 'odbc';
    log.info(`Modo: ${this.connectionType.toUpperCase()}`);

    try {
      // Inicializa baseado no tipo configurado
      if (this.connectionType === 'odbc') {
        await this.initializeOdbc();
      } else {
        await this.initializeSqlServer();
      }

      // Sucesso - marca como ativo
      this.useMockData = false;
      this.isInitialized = true;

      // Registra métricas de sucesso
      DatabaseMetricsHelper.setActiveConnections('EMP', 1);
      DatabaseMetricsHelper.setActiveConnections('MULT', 1);

      log.info('✅ CONECTADO AO DATASUL');
      log.info(`Pool de conexões inicializado (conexões adicionais serão criadas on-demand)`);
    } catch (error) {
      // Falha - ativa modo mock
      this.connectionError = (error as Error).message;
      this.useMockData = true;
      this.isInitialized = true;

      // Registra métricas de erro
      DatabaseMetricsHelper.recordConnectionError('EMP', error);
      DatabaseMetricsHelper.recordConnectionError('MULT', error);

      log.warn('⚠️  USANDO DADOS MOCK');
      log.error('Erro conexão', { error: this.connectionError });
    }
  }

  /**
   * Inicializa conexões SQL Server (EMP e MULT)
   *
   * @description
   * Cria duas instâncias de SqlServerConnection (uma para cada database)
   * e as conecta em paralelo usando Promise.all para melhor performance.
   *
   * @returns {Promise<void>}
   * @throws {Error} Se falhar ao conectar em qualquer uma das conexões
   * @private
   *
   * @example
   * ```typescript
   * // Interno - chamado por doInitialize()
   * await this.initializeSqlServer();
   * ```
   *
   * @critical
   * Usa Promise.all - se uma conexão falhar, ambas falham.
   * Isso é intencional para garantir consistência.
   */
  private static async initializeSqlServer(): Promise<void> {
    const configEmp = getSqlServerConfigEmp();
    const configMult = getSqlServerConfigMult();

    this.connectionEmp = new SqlServerConnection(configEmp, 'EMP');
    this.connectionMult = new SqlServerConnection(configMult, 'MULT');

    // Conecta ambas em paralelo
    await Promise.all([this.connectionEmp.connect(), this.connectionMult.connect()]);

    log.info('✅ SQL Server conectado');
  }

  /**
   * Inicializa conexões ODBC (EMP e MULT) - LEGACY
   *
   * @description
   * Cria duas instâncias de OdbcConnection usando connection strings legacy
   * e as conecta em paralelo usando Promise.all para melhor performance.
   *
   * **ATUALIZAÇÃO v2.0:**
   * - Usa novo construtor OdbcConnection com DSN + options
   * - Connection string é passada via options.connectionString para compatibilidade
   * - Extrai DSN da connection string para logging e identificação
   * - Mantém compatibilidade com código existente
   *
   * @returns {Promise<void>}
   * @throws {Error} Se falhar ao conectar em qualquer uma das conexões
   * @private
   *
   * @example
   * ```typescript
   * // Interno - chamado por doInitialize()
   * await this.initializeOdbc();
   * ```
   *
   * @critical
   * - Requer DSNs configurados no sistema operacional
   * - DSNs devem ter permissões adequadas no Progress OpenEdge
   * - Usa Promise.all para conectar em paralelo
   * - Connection string legacy é preservada para compatibilidade
   */
  private static async initializeOdbc(): Promise<void> {
    const connStringEmp = getOdbcConnectionString('EMP');
    const connStringMult = getOdbcConnectionString('MULT');

    // Extrai DSN da connection string para uso no novo construtor
    // Formato esperado: DSN=PRD_EMS2EMP;UID=user;PWD=pass
    const extractDSN = (connStr: string): string => {
      const match = connStr.match(/DSN=([^;]+)/i);
      return match ? match[1] : 'UNKNOWN_DSN';
    };

    const dsnEmp = extractDSN(connStringEmp);
    const dsnMult = extractDSN(connStringMult);

    // Usa novo construtor com connectionString override
    this.connectionEmp = new OdbcConnection(dsnEmp, {
      connectionString: connStringEmp,
    });

    this.connectionMult = new OdbcConnection(dsnMult, {
      connectionString: connStringMult,
    });

    // Conecta ambas em paralelo
    await Promise.all([this.connectionEmp.connect(), this.connectionMult.connect()]);

    log.info('✅ ODBC conectado (legacy mode)', {
      empDSN: dsnEmp,
      multDSN: dsnMult,
    });
  }

  // ============================================================================
  // NOVOS MÉTODOS - CONNECTION POOL MANAGEMENT
  // ============================================================================

  /**
   * Obtém ou cria uma conexão pelo DSN
   *
   * @description
   * Implementa lazy initialization de conexões. Se a conexão já existe no pool,
   * retorna a conexão existente. Caso contrário, cria uma nova conexão baseada
   * na configuração do DSN em connections.config.ts.
   *
   * Fluxo:
   * 1. Verifica se conexão existe no pool
   * 2. Se existir e estiver conectada, retorna
   * 3. Se não existir, busca configuração no registry
   * 4. Cria nova conexão ODBC
   * 5. Conecta e adiciona ao pool
   * 6. Atualiza métricas
   *
   * @param {string} dsn - Nome do DSN (ex: 'DtsPrdEmp', 'LgxDev')
   * @returns {Promise<IConnection>} Conexão ativa
   * @throws {Error} Se DSN não for encontrado ou conexão falhar
   *
   * @example Buscar conexão Datasul Production EMP
   * ```typescript
   * const conn = await DatabaseManager.getConnectionByDSN('DtsPrdEmp');
   * const result = await conn.queryWithParams('SELECT * FROM item', []);
   * ```
   *
   * @example Buscar conexão Informix Development
   * ```typescript
   * const conn = await DatabaseManager.getConnectionByDSN('LgxDev');
   * const result = await conn.queryWithParams('SELECT * FROM logix.item', []);
   * ```
   *
   * @critical
   * - DSN deve estar configurado em connections.config.ts
   * - DSN deve existir no /etc/odbc.ini do sistema
   * - Conexão é cacheada no pool para reuso
   * - Conexão é criada apenas na primeira vez (lazy)
   */
  static async getConnectionByDSN(dsn: string): Promise<IConnection> {
    if (this.useMockData) {
      log.warn(`Modo MOCK ativo - retornando MockConnection para DSN: ${dsn}`);
      return this.getMockConnection();
    }

    // Verifica se conexão já existe no pool
    const poolEntry = this.connectionPool.get(dsn);
    if (poolEntry) {
      poolEntry.lastUsed = new Date();
      log.debug(`Conexão reutilizada do pool: ${dsn}`);
      return poolEntry.connection;
    }

    // Busca configuração do DSN
    const config = findConnectionByDSN(dsn);
    if (!config) {
      throw new Error(
        `DSN '${dsn}' não encontrado em connections.config.ts. Verifique se o DSN está configurado.`
      );
    }

    log.info(`Criando nova conexão para DSN: ${dsn} (${config.description})`);

    // Cria conexão baseada no tipo de sistema
    let connection: IConnection;

    if (config.systemType === 'sqlserver') {
      // SQL Server connection
      const serverString = config.instance
        ? `${config.hostname}\\${config.instance}`
        : config.hostname;

      const dbConfig: DatabaseConfig = {
        server: serverString,
        port: config.port,
        user: config.user || process.env.DB_USER,
        password: config.password || process.env.DB_PASSWORD,
        database: config.database,
        connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT) || 15000,
        requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT) || 30000,
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      };

      connection = new SqlServerConnection(dbConfig, dsn);
      log.debug(`SQL Server connection criada: ${serverString} -> ${config.database}`);
    } else {
      // ODBC connection (Datasul, Informix)
      connection = new OdbcConnection(dsn, {
        driver: config.metadata.driver,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      log.debug(`ODBC connection criada: DSN=${dsn}`);
    }

    try {
      // Conecta
      await connection.connect();

      // Adiciona ao pool
      this.connectionPool.set(dsn, {
        connection,
        config,
        lastUsed: new Date(),
        activeQueries: 0,
      });

      // Atualiza métricas (apenas para conexões EMP/MULT legacy)
      if (dsn === 'DtsPrdEmp' || dsn === 'DtsTstEmp' || dsn === 'DtsHmlEmp') {
        DatabaseMetricsHelper.setActiveConnections('EMP', 1);
      } else if (dsn === 'DtsPrdMult' || dsn === 'DtsTstMult' || dsn === 'DtsHmlMult') {
        DatabaseMetricsHelper.setActiveConnections('MULT', 1);
      }

      log.info(`✅ Conexão criada e adicionada ao pool: ${dsn}`);

      return connection;
    } catch (error) {
      log.error(`Falha ao criar conexão para DSN: ${dsn}`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        dsn,
        description: config.description,
      });

      // Registra métricas de erro (apenas para conexões EMP/MULT legacy)
      if (dsn === 'DtsPrdEmp' || dsn === 'DtsTstEmp' || dsn === 'DtsHmlEmp') {
        DatabaseMetricsHelper.recordConnectionError('EMP', error);
      } else if (dsn === 'DtsPrdMult' || dsn === 'DtsTstMult' || dsn === 'DtsHmlMult') {
        DatabaseMetricsHelper.recordConnectionError('MULT', error);
      }

      throw error;
    }
  }

  /**
   * Obtém conexão por ambiente e tipo de database
   *
   * @description
   * Método de conveniência para buscar conexões por ambiente ao invés de DSN.
   * Mapeia ambiente + tipo para o DSN correto e chama getConnectionByDSN().
   *
   * @param {'datasul' | 'informix'} system - Sistema (Datasul ou Informix)
   * @param {string} environment - Ambiente (production, test, homologation, development, etc)
   * @param {string} [dbType] - Tipo de database (emp, mult, adt, esp, ems5, fnd) - obrigatório para Datasul
   * @returns {Promise<IConnection>} Conexão ativa
   * @throws {Error} Se ambiente/tipo não for encontrado
   *
   * @example Datasul Production EMP
   * ```typescript
   * const conn = await DatabaseManager.getConnectionByEnvironment('datasul', 'production', 'emp');
   * ```
   *
   * @example Datasul Test MULT
   * ```typescript
   * const conn = await DatabaseManager.getConnectionByEnvironment('datasul', 'test', 'mult');
   * ```
   *
   * @example Informix Development
   * ```typescript
   * const conn = await DatabaseManager.getConnectionByEnvironment('informix', 'development');
   * ```
   *
   * @critical
   * - Para Datasul, dbType é obrigatório
   * - Para Informix, dbType é ignorado
   * - Ambiente deve existir em connections.config.ts
   */
  static async getConnectionByEnvironment(
    system: 'datasul' | 'informix',
    environment: string,
    dbType?: string
  ): Promise<IConnection> {
    if (system === 'datasul') {
      if (!dbType) {
        throw new Error('dbType é obrigatório para conexões Datasul');
      }

      // Mapeia ambiente para chave do registry
      const envMap: Record<string, keyof typeof AVAILABLE_CONNECTIONS.datasul> = {
        production: 'production',
        prod: 'production',
        prd: 'production',
        test: 'test',
        tst: 'test',
        homologation: 'homologation',
        hml: 'homologation',
      };

      const envKey = envMap[environment.toLowerCase()];
      if (!envKey) {
        throw new Error(
          `Ambiente Datasul inválido: ${environment}. Use: production, test, homologation`
        );
      }

      const config =
        AVAILABLE_CONNECTIONS.datasul[envKey][
          dbType.toLowerCase() as keyof typeof AVAILABLE_CONNECTIONS.datasul.production
        ];

      if (!config) {
        throw new Error(
          `Tipo de database inválido: ${dbType}. Use: emp, mult, adt, esp, ems5, fnd`
        );
      }

      return this.getConnectionByDSN(config.dsn);
    } else if (system === 'informix') {
      // Mapeia ambiente para chave do registry
      const envMap: Record<string, keyof typeof AVAILABLE_CONNECTIONS.informix> = {
        development: 'development',
        dev: 'development',
        atualização: 'atualização',
        atu: 'atualização',
        new: 'new',
        production: 'production',
        prod: 'production',
        prd: 'production',
      };

      const envKey = envMap[environment.toLowerCase()];
      if (!envKey) {
        throw new Error(
          `Ambiente Informix inválido: ${environment}. Use: development, atualização, new, production`
        );
      }

      const config = AVAILABLE_CONNECTIONS.informix[envKey].logix;
      return this.getConnectionByDSN(config.dsn);
    } else {
      throw new Error(`Sistema inválido: ${system}. Use: datasul ou informix`);
    }
  }

  /**
   * Executa query com parâmetros em uma conexão específica
   *
   * @description
   * Método de conveniência que combina getConnectionByDSN() + queryWithParams().
   * Busca a conexão pelo DSN, executa a query e retorna o resultado.
   * Atualiza métricas de uso.
   *
   * @param {string} dsn - Nome do DSN
   * @param {string} sql - Query SQL com placeholders (?)
   * @param {QueryParameter[]} [params=[]] - Array de parâmetros
   * @returns {Promise<T[]>} Resultado da query
   * @throws {Error} Se DSN não existir ou query falhar
   *
   * @example Query simples
   * ```typescript
   * const result = await DatabaseManager.queryWithConnection(
   *   'DtsPrdEmp',
   *   'SELECT * FROM item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * ```
   *
   * @example Query sem parâmetros
   * ```typescript
   * const result = await DatabaseManager.queryWithConnection(
   *   'DtsTestEmp',
   *   'SELECT TOP 10 * FROM item'
   * );
   * ```
   *
   * @critical
   * - SEMPRE use parâmetros ao invés de concatenação de strings
   * - Conexão é criada automaticamente se não existir (lazy)
   * - Métricas são atualizadas automaticamente
   */
  static async queryWithConnection<T = unknown>(
    dsn: string,
    sql: string,
    params: QueryParameter[] = []
  ): Promise<T[]> {
    // Wrap with distributed tracing
    return DatabaseInstrumentation.traceQuery(dsn, sql, params || [], async () => {
      // Get circuit breaker for this connection
      const breaker = circuitBreakerManager.getBreaker(dsn);

      return breaker.execute(async () => {
        // Obtém política de retry para esta conexão
        const retryPolicy = this.getRetryPolicy(dsn);

        // Executa query com retry logic + chaos injection
        return retryPolicy.execute(async () => {
          // Wrap com chaos injection (se habilitado)
          return chaosInjector.injectChaos(dsn, async () => {
            // Trace connection acquire
            return DatabaseInstrumentation.traceConnectionAcquire(dsn, async () => {
              const connection = await this.getConnectionByDSN(dsn);

              // Atualiza contador de queries ativas
              const poolEntry = this.connectionPool.get(dsn);
              if (poolEntry) {
                poolEntry.activeQueries++;
              }

              // Start metrics tracking
              const startTime = Date.now();
              let success = false;

              try {
                // Executa query
                const result =
                  params.length > 0
                    ? await connection.queryWithParams<T>(sql, params)
                    : await connection.query<T>(sql);

                success = true;
                return result;
              } catch (error) {
                success = false;
                throw error;
              } finally {
                // Record metrics
                const duration = Date.now() - startTime;
                connectionMetrics.recordQuery(dsn, duration, success);

                // Update pool metrics
                if (poolEntry) {
                  const totalPool = this.connectionPool.size;
                  connectionMetrics.updatePoolMetrics(
                    dsn,
                    poolEntry.activeQueries,
                    totalPool - poolEntry.activeQueries
                  );
                }

                // Decrementa contador de queries ativas
                if (poolEntry) {
                  poolEntry.activeQueries--;
                  poolEntry.lastUsed = new Date();
                }
              }
            });
          });
        }, dsn);
      });
    });
  }

  /**
   * Fecha uma conexão específica do pool
   *
   * @description
   * Remove e fecha uma conexão do pool. Útil para liberar recursos
   * ou forçar reconexão em caso de problemas.
   *
   * @param {string} dsn - Nome do DSN da conexão a fechar
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // Fechar conexão específica
   * await DatabaseManager.closeConnection('DtsTstEmp');
   * ```
   *
   * @critical
   * - Não fecha conexões legacy (EMP/MULT)
   * - Aguarda queries ativas terminarem (max 5s)
   * - Remove conexão do pool após fechar
   */
  static async closeConnection(dsn: string): Promise<void> {
    const poolEntry = this.connectionPool.get(dsn);

    if (!poolEntry) {
      log.debug(`Conexão ${dsn} não existe no pool`);
      return;
    }

    log.info(`Fechando conexão: ${dsn}`);

    // Aguarda queries ativas terminarem (max 5s)
    const maxWait = 5000;
    const startWait = Date.now();

    while (poolEntry.activeQueries > 0 && Date.now() - startWait < maxWait) {
      log.debug(`Aguardando ${poolEntry.activeQueries} queries ativas em ${dsn}...`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (poolEntry.activeQueries > 0) {
      log.warn(`Forçando fechamento de ${dsn} com ${poolEntry.activeQueries} queries ativas`);
    }

    try {
      await poolEntry.connection.close();
      this.connectionPool.delete(dsn);

      // Atualiza métricas (apenas para conexões EMP/MULT legacy)
      if (dsn === 'DtsPrdEmp' || dsn === 'DtsTstEmp' || dsn === 'DtsHmlEmp') {
        DatabaseMetricsHelper.setActiveConnections('EMP', 0);
      } else if (dsn === 'DtsPrdMult' || dsn === 'DtsTstMult' || dsn === 'DtsHmlMult') {
        DatabaseMetricsHelper.setActiveConnections('MULT', 0);
      }

      log.info(`✅ Conexão fechada e removida do pool: ${dsn}`);
    } catch (error) {
      log.error(`Erro ao fechar conexão ${dsn}`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * Fecha todas as conexões do pool (exceto EMP e MULT legacy)
   *
   * @description
   * Fecha e remove todas as conexões do pool de conexões nomeadas.
   * Conexões legacy (EMP/MULT) são mantidas e devem ser fechadas via close().
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // Limpar pool de conexões
   * await DatabaseManager.closeAllConnections();
   * ```
   *
   * @critical
   * - Aguarda queries ativas terminarem (max 5s por conexão)
   * - Fecha conexões em paralelo para melhor performance
   * - Não fecha conexões legacy (use close() para isso)
   */
  static async closeAllConnections(): Promise<void> {
    if (this.connectionPool.size === 0) {
      log.debug('Pool de conexões vazio');
      return;
    }

    log.info(`Fechando ${this.connectionPool.size} conexões do pool...`);

    const closePromises: Promise<void>[] = [];

    // Convert iterator to array to avoid downlevelIteration requirement
    const dsnArray = Array.from(this.connectionPool.keys());
    for (const dsn of dsnArray) {
      closePromises.push(this.closeConnection(dsn));
    }

    await Promise.all(closePromises);

    log.info('✅ Todas as conexões do pool foram fechadas');
  }

  /**
   * Retorna lista de DSNs de conexões ativas no pool
   *
   * @description
   * Lista todas as conexões atualmente ativas no pool, incluindo
   * informações sobre uso e queries ativas.
   *
   * @returns {Array<{dsn: string, description: string, lastUsed: Date, activeQueries: number}>}
   *
   * @example
   * ```typescript
   * const active = DatabaseManager.getActiveConnections();
   * console.log('Conexões ativas:', active.length);
   * active.forEach(conn => {
   *   console.log(`${conn.dsn}: ${conn.description} (${conn.activeQueries} queries)`);
   * });
   * ```
   */
  static getActiveConnections(): Array<{
    dsn: string;
    description: string;
    lastUsed: Date;
    activeQueries: number;
  }> {
    const connections: Array<{
      dsn: string;
      description: string;
      lastUsed: Date;
      activeQueries: number;
    }> = [];

    // Convert iterator to array to avoid downlevelIteration requirement
    const entriesArray = Array.from(this.connectionPool.entries());
    for (const [dsn, entry] of entriesArray) {
      connections.push({
        dsn,
        description: entry.config.description,
        lastUsed: entry.lastUsed,
        activeQueries: entry.activeQueries,
      });
    }

    return connections;
  }

  /**
   * Verifica health de uma conexão específica
   *
   * @description
   * Executa health check em uma conexão específica do pool.
   * Se a conexão não existir, tenta criá-la primeiro.
   *
   * @param {string} dsn - Nome do DSN
   * @returns {Promise<{connected: boolean, responseTime: number}>}
   *
   * @example
   * ```typescript
   * const health = await DatabaseManager.healthCheckConnection('DtsPrdEmp');
   * if (health.connected) {
   *   console.log(`OK - ${health.responseTime}ms`);
   * } else {
   *   console.error('FALHOU');
   * }
   * ```
   */
  static async healthCheckConnection(
    dsn: string
  ): Promise<{ connected: boolean; responseTime: number }> {
    try {
      const connection = await this.getConnectionByDSN(dsn);
      // IConnection não tem método healthCheck definido na interface
      // mas OdbcConnection e SqlServerConnection implementam
      if ('healthCheck' in connection && typeof connection.healthCheck === 'function') {
        return await (connection as OdbcConnection | SqlServerConnection).healthCheck();
      }

      // Fallback: tenta query simples
      const startTime = Date.now();
      await connection.query('SELECT 1 AS health');
      return {
        connected: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      log.error(`Health check falhou para ${dsn}`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return { connected: false, responseTime: 0 };
    }
  }

  // ============================================================================
  // MULTI-REGION FAILOVER METHODS
  // ============================================================================

  /**
   * Query with multi-region failover support
   *
   * @description
   * Executes a query with automatic multi-region failover.
   * If the current region fails, automatically retries on next available region.
   *
   * **REQUIRES:**
   * - Connection group configured in multiRegion.config.ts
   * - MULTI_REGION_ENABLED=true in .env
   * - Database replicas configured and accessible
   *
   * @param {string} groupId - Connection group ID (e.g., 'datasul-emp')
   * @param {string} sql - SQL query
   * @param {QueryParameter[]} [params] - Query parameters
   * @returns {Promise<T[]>} Query results
   * @throws {Error} If all regions fail
   *
   * @example Query with failover
   * ```typescript
   * const items = await DatabaseManager.queryWithFailover(
   *   'datasul-emp',
   *   'SELECT * FROM item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * // Automatically uses DtsPrdEmp (primary)
   * // If fails, automatically retries on DtsPrdEmpRJ (secondary)
   * ```
   *
   * @example Handling all regions failed
   * ```typescript
   * try {
   *   const result = await DatabaseManager.queryWithFailover('datasul-emp', sql, params);
   * } catch (error) {
   *   // All regions failed
   *   console.error('All regions unavailable:', error);
   * }
   * ```
   *
   * @critical
   * - REQUIRES replica databases to be configured
   * - REQUIRES MULTI_REGION_ENABLED=true
   * - Maximum 3 attempts (tries up to 3 regions)
   * - Records metrics for monitoring
   * - Automatically fails back when primary recovers
   */
  static async queryWithFailover<T = unknown>(
    groupId: string,
    sql: string,
    params?: QueryParameter[]
  ): Promise<T[]> {
    const maxAttempts = 3; // Try up to 3 regions

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Get current connection for group
        const connectionId = connectionGroupRegistry.getCurrentConnection(groupId);

        log.debug('Attempting query with failover', {
          groupId,
          connectionId,
          attempt,
          maxAttempts,
        });

        // Execute query
        const result = await this.queryWithConnection<T>(connectionId, sql, params);

        // Record success
        connectionGroupRegistry.recordSuccess(groupId, connectionId);
        multiRegionMetrics.recordQueryByRegion(groupId, connectionId, true);

        return result;
      } catch (error: any) {
        const connectionId = connectionGroupRegistry.getCurrentConnection(groupId);

        log.warn('Query failed on region, checking failover', {
          groupId,
          connectionId,
          attempt,
          error: error.message,
        });

        // Record metrics
        multiRegionMetrics.recordQueryByRegion(groupId, connectionId, false);

        // Record failure and check failover
        const decision = await connectionGroupRegistry.recordFailure(groupId, connectionId, error);

        if (decision.shouldFailover) {
          log.info('Retrying on new region after failover', {
            oldConnection: decision.oldConnection,
            newConnection: decision.newConnection,
            attempt,
          });

          // Record failover metric
          if (decision.oldConnection && decision.newConnection) {
            multiRegionMetrics.recordFailover(
              groupId,
              decision.oldConnection,
              decision.newConnection
            );
          }

          // Continue to next attempt with new region
        } else if (attempt >= maxAttempts) {
          // No more regions and no more attempts
          log.error('All attempts failed for group', {
            groupId,
            attempts: maxAttempts,
            error: error.message,
          });

          throw error;
        } else {
          // Not ready for failover yet, but can retry
          log.debug('Not triggering failover yet, retrying', {
            groupId,
            connectionId,
            attempt,
          });
        }
      }
    }

    throw new Error(`All regions failed for group: ${groupId}`);
  }

  // ============================================================================
  // MÉTODOS LEGACY (mantidos para compatibilidade)
  // ============================================================================

  /**
   * Executa query parametrizada no database EMP (RECOMENDADO) - LEGACY
   *
   * @description
   * Método RECOMENDADO para executar queries. Usa parâmetros para prevenir
   * SQL injection e permite binding de valores de forma segura.
   * Automaticamente instrumentado com métricas de performance.
   *
   * @param sql - Query SQL com placeholders (@param1, @param2, etc)
   * @param params - Array de parâmetros com nome, tipo e valor
   * @returns {Promise<any>} Resultado da query
   *
   * @deprecated Para novas implementações, use queryWithConnection() ou getConnectionByDSN()
   *
   * @example Query simples com um parâmetro
   * ```typescript
   * const result = await DatabaseManager.queryEmpWithParams(
   *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * ```
   *
   * @example Query com múltiplos parâmetros
   * ```typescript
   * const result = await DatabaseManager.queryEmpWithParams(
   *   'SELECT * FROM item WHERE "grupo-estoq" = @grupo AND "cod-obsoleto" = @obsoleto',
   *   [
   *     { name: 'grupo', type: 'int', value: 1 },
   *     { name: 'obsoleto', type: 'int', value: 0 }
   *   ]
   * );
   * ```
   *
   * @critical
   * - SEMPRE use parâmetros ao invés de concatenação de strings
   * - Tipos suportados: varchar, int, decimal, date, bit
   * - Em modo mock, ignora parâmetros e retorna dados fixos
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   */
  static async queryEmpWithParams<T = unknown>(
    sql: string,
    params: QueryParameter[]
  ): Promise<T[]> {
    if (this.useMockData) {
      return this.getMockConnection().queryWithParams(sql, params);
    }

    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }

    // Instrumenta com métricas de performance
    return DatabaseMetricsHelper.instrumentQuery('EMP', sql, () =>
      this.connectionEmp!.queryWithParams(sql, params)
    );
  }

  /**
   * Executa query parametrizada no database MULT (RECOMENDADO) - LEGACY
   *
   * @description
   * Método RECOMENDADO para executar queries no database MULT.
   * Usa parâmetros para prevenir SQL injection e permite binding seguro.
   * Automaticamente instrumentado com métricas de performance.
   *
   * @param sql - Query SQL com placeholders (@param1, @param2, etc)
   * @param params - Array de parâmetros com nome, tipo e valor
   * @returns {Promise<any>} Resultado da query
   *
   * @deprecated Para novas implementações, use queryWithConnection() ou getConnectionByDSN()
   *
   * @example Buscar estabelecimento
   * ```typescript
   * const result = await DatabaseManager.queryMultWithParams(
   *   'SELECT * FROM estabelec WHERE "ep-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '01.01' }]
   * );
   * ```
   *
   * @critical
   * - SEMPRE use parâmetros ao invés de concatenação
   * - Database MULT contém dados de múltiplas empresas
   * - Cuidado com queries pesadas sem índices
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   */
  static async queryMultWithParams<T = unknown>(
    sql: string,
    params: QueryParameter[]
  ): Promise<T[]> {
    if (this.useMockData) {
      return this.getMockConnection().queryWithParams(sql, params);
    }

    if (!this.connectionMult) {
      throw new Error('Conexão MULT não inicializada');
    }

    // Instrumenta com métricas de performance
    return DatabaseMetricsHelper.instrumentQuery('MULT', sql, () =>
      this.connectionMult!.queryWithParams(sql, params)
    );
  }

  /**
   * Executa query simples no database EMP (DEPRECATED) - LEGACY
   *
   * @description
   * Método legado para queries simples sem parâmetros.
   * DEPRECATED: Use queryEmpWithParams() sempre que possível.
   * Mantido apenas para compatibilidade com código antigo.
   *
   * @param sql - Query SQL completa
   * @returns {Promise<any>} Resultado da query
   *
   * @deprecated Use queryEmpWithParams() para queries parametrizadas
   *
   * @example
   * ```typescript
   * // ❌ NÃO RECOMENDADO
   * const result = await DatabaseManager.queryEmp('SELECT * FROM item');
   * ```
   *
   * @example
   * ```typescript
   * // ✅ RECOMENDADO
   * const result = await DatabaseManager.queryEmpWithParams(
   *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   * ```
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Será removido em versões futuras
   */
  static async queryEmp<T = unknown>(sql: string): Promise<T[]> {
    if (this.useMockData) {
      return this.getMockConnection().query(sql);
    }

    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }

    // Instrumenta com métricas de performance
    return DatabaseMetricsHelper.instrumentQuery('EMP', sql, () => this.connectionEmp!.query(sql));
  }

  /**
   * Executa query simples no database MULT (DEPRECATED) - LEGACY
   *
   * @description
   * Método legado para queries simples sem parâmetros.
   * DEPRECATED: Use queryMultWithParams() sempre que possível.
   * Mantido apenas para compatibilidade com código antigo.
   *
   * @param sql - Query SQL completa
   * @returns {Promise<any>} Resultado da query
   *
   * @deprecated Use queryMultWithParams() para queries parametrizadas
   *
   * @example
   * ```typescript
   * // ❌ NÃO RECOMENDADO
   * const result = await DatabaseManager.queryMult('SELECT * FROM estabelec');
   * ```
   *
   * @example
   * ```typescript
   * // ✅ RECOMENDADO
   * const result = await DatabaseManager.queryMultWithParams(
   *   'SELECT * FROM estabelec WHERE "ep-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '01.01' }]
   * );
   * ```
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Será removido em versões futuras
   */
  static async queryMult<T = unknown>(sql: string): Promise<T[]> {
    if (this.useMockData) {
      return this.getMockConnection().query(sql);
    }

    if (!this.connectionMult) {
      throw new Error('Conexão MULT não inicializada');
    }

    // Instrumenta com métricas de performance
    return DatabaseMetricsHelper.instrumentQuery('MULT', sql, () =>
      this.connectionMult!.query(sql)
    );
  }

  /**
   * Retorna uma instância de MockConnection
   *
   * @description
   * Cria e retorna uma conexão mockada com dados falsos.
   * Usada automaticamente quando a conexão real falha ou
   * quando USE_MOCK_DATA=true.
   *
   * @returns {MockConnection} Instância de MockConnection
   * @private
   *
   * @critical
   * - NUNCA deve ser usada em produção
   * - Retorna sempre os mesmos dados fictícios
   * - Útil apenas para desenvolvimento e testes
   */
  private static getMockConnection(): MockConnection {
    return new MockConnection();
  }

  /**
   * Retorna o status atual das conexões
   *
   * @description
   * Fornece informações sobre o estado das conexões,
   * tipo de banco, modo (real ou mock) e erros.
   *
   * @returns {ConnectionStatus} Status das conexões
   *
   * @example
   * ```typescript
   * const status = DatabaseManager.getConnectionStatus();
   * log.info(status.mode); // 'REAL_DATABASE' ou 'MOCK_DATA'
   * log.info(status.type); // 'sqlserver' ou 'odbc'
   * if (status.error) {
   *   log.error('Erro:', status.error);
   * }
   * ```
   *
   * @example No health check
   * ```typescript
   * const status = DatabaseManager.getConnectionStatus();
   * res.json({
   *   database: {
   *     connected: status.mode === 'REAL_DATABASE',
   *     type: status.type,
   *     error: status.error
   *   }
   * });
   * ```
   */
  static getConnectionStatus(): ConnectionStatus {
    return {
      type: this.connectionType,
      mode: this.useMockData ? 'MOCK_DATA' : 'REAL_DATABASE',
      error: this.connectionError || undefined,
    };
  }

  /**
   * Verifica se o DatabaseManager está pronto para uso
   *
   * @description
   * Retorna true se o DatabaseManager foi inicializado,
   * independente de estar usando mock ou conexão real.
   *
   * @returns {boolean} True se inicializado
   *
   * @example
   * ```typescript
   * if (!DatabaseManager.isReady()) {
   *   await DatabaseManager.initialize();
   * }
   * ```
   *
   * @example No health check
   * ```typescript
   * const ready = DatabaseManager.isReady();
   * if (!ready) {
   *   return res.status(503).json({ error: 'Database not ready' });
   * }
   * ```
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Verifica se está usando dados mockados
   *
   * @description
   * Retorna true se o sistema está operando em modo mock,
   * seja por falha de conexão ou configuração manual.
   *
   * @returns {boolean} True se usando mock
   *
   * @example
   * ```typescript
   * if (DatabaseManager.isUsingMockData()) {
   *   log.warn('⚠️  Sistema usando dados MOCK');
   * }
   * ```
   *
   * @critical
   * Em produção, este método DEVE sempre retornar false.
   * Se retornar true em produção, há um problema crítico.
   */
  static isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * Fecha todas as conexões abertas
   *
   * @description
   * Encerra gracefully todas as conexões com o banco de dados,
   * liberando recursos. Deve ser chamado ao desligar a aplicação.
   *
   * Processo:
   * 1. Fecha todas as conexões do pool
   * 2. Fecha conexão EMP (se existir)
   * 3. Fecha conexão MULT (se existir)
   * 4. Reseta flags de estado
   * 5. Registra métricas de desconexão
   *
   * @returns {Promise<void>}
   *
   * @example No graceful shutdown
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   log.info('Fechando conexões...');
   *   await DatabaseManager.close();
   *   process.exit(0);
   * });
   * ```
   *
   * @critical
   * - SEMPRE chamar antes de process.exit()
   * - Aguarda o fechamento completo antes de continuar
   * - Não lança exceções mesmo se houver erros
   * - Fecha TODAS as conexões (pool + legacy)
   */
  static async close(): Promise<void> {
    log.info('Fechando conexões...');

    try {
      // Shutdown multi-region connection groups (stop health checks)
      connectionGroupRegistry.shutdown();

      // Fecha todas as conexões do pool
      await this.closeAllConnections();

      // Fecha conexão EMP
      if (this.connectionEmp) {
        await this.connectionEmp.close();
        this.connectionEmp = null;
      }

      // Fecha conexão MULT
      if (this.connectionMult) {
        await this.connectionMult.close();
        this.connectionMult = null;
      }

      // Reseta estado
      this.isInitialized = false;
      this.useMockData = false;

      // Registra métricas de desconexão
      DatabaseMetricsHelper.setActiveConnections('EMP', 0);
      DatabaseMetricsHelper.setActiveConnections('MULT', 0);

      log.info('✅ Conexões fechadas');
    } catch (error) {
      log.error('Erro ao fechar conexões:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Não lança exceção - apenas registra erro
    }
  }

  /**
   * Testa a conectividade com o banco de dados
   *
   * @description
   * Executa uma query simples de teste para verificar se a
   * conexão está funcionando. Útil para health checks e
   * diagnósticos.
   *
   * @returns {Promise<TestResult>} Resultado do teste
   *
   * @example
   * ```typescript
   * const result = await DatabaseManager.testConnections();
   * log.info('Conectado:', result.isConnected);
   * log.info('Tipo:', result.type);
   * log.info('Usando Mock:', result.usingMock);
   * if (result.error) {
   *   log.error('Erro:', result.error);
   * }
   * ```
   *
   * @example No health check detalhado
   * ```typescript
   * const test = await DatabaseManager.testConnections();
   * res.json({
   *   status: test.isConnected ? 'healthy' : 'unhealthy',
   *   database: {
   *     connected: test.isConnected,
   *     type: test.type,
   *     usingMock: test.usingMock,
   *     error: test.error
   *   }
   * });
   * ```
   */
  static async testConnections(): Promise<{
    isConnected: boolean;
    type: ConnectionType;
    usingMock: boolean;
    error?: string | undefined;
  }> {
    const status = this.getConnectionStatus();

    return {
      isConnected: !this.useMockData,
      type: this.connectionType,
      usingMock: this.useMockData,
      error: status.error,
    };
  }

  // ============================================================================
  // QUERY BY CONTEXT - SISTEMA INTELIGENTE DE RESOLUÇÃO DE CONEXÕES
  // ============================================================================

  /**
   * Resolve connectionId baseado em contexto do sistema
   *
   * @description
   * Método interno que traduz contexto de sistema em connectionId (DSN).
   * Resolve environment automaticamente usando variáveis de ambiente quando não especificado.
   *
   * Mapeamento de sistemas:
   * - datasul: usa DATASUL_ENVIRONMENT (default: production)
   * - informix: usa INFORMIX_ENVIRONMENT (default: production)
   * - pcfactory: usa PCFACTORY_ENVIRONMENT (default: production)
   * - corporativo: usa CORPORATIVO_ENVIRONMENT (default: production)
   *
   * @param {object} context - Contexto do sistema
   * @param {string} context.system - Sistema (datasul, informix, pcfactory, corporativo)
   * @param {string} [context.environment] - Ambiente (production, test, development, etc)
   * @param {string} [context.purpose] - Propósito do database (emp, mult, sistema, integracao, etc)
   * @returns {string} DSN/connectionId da conexão
   * @throws {Error} Se sistema desconhecido ou configuração inválida
   * @private
   *
   * @example Datasul com environment automático
   * ```typescript
   * // Com DATASUL_ENVIRONMENT=test em .env
   * const dsn = this.resolveConnectionId({ system: 'datasul', purpose: 'emp' });
   * // Retorna: 'DtsTstEmp'
   * ```
   *
   * @example PCFactory com environment explícito
   * ```typescript
   * const dsn = this.resolveConnectionId({
   *   system: 'pcfactory',
   *   environment: 'development',
   *   purpose: 'sistema'
   * });
   * // Retorna: 'PCF4_DEV'
   * ```
   */
  private static resolveConnectionId(context: {
    system: string;
    environment?: string;
    purpose?: string;
  }): string {
    const { system, environment, purpose } = context;

    // Resolver environment baseado nas variáveis de ambiente
    let env = environment;
    if (!env) {
      switch (system) {
        case 'datasul':
          env = getDefaultDatasulEnvironment();
          break;
        case 'informix':
          env = getDefaultInformixEnvironment();
          break;
        case 'pcfactory':
          env = getDefaultPCFactoryEnvironment();
          break;
        case 'corporativo':
          env = getDefaultCorporativoEnvironment();
          break;
        default:
          throw new Error(`Unknown system: ${system}`);
      }
    }

    // Obter conexão usando as funções do connections.config.ts
    let config: ConnectionConfig | null = null;

    switch (system) {
      case 'datasul':
        if (!purpose) {
          throw new Error('Purpose required for Datasul (emp, mult, adt, esp, ems5, fnd)');
        }
        config = getDatasulConnection(
          env as keyof ConnectionRegistry['datasul'],
          purpose as keyof DatasulEnvironment
        );
        break;

      case 'informix':
        config = getInformixConnection(env as keyof ConnectionRegistry['informix']);
        break;

      case 'pcfactory':
        if (!purpose) {
          throw new Error('Purpose required for PCFactory (sistema or integracao)');
        }
        config = getPCFactoryConnection(
          env as keyof ConnectionRegistry['sqlserver']['pcfactory'],
          purpose as 'sistema' | 'integracao'
        );
        break;

      case 'corporativo':
        config = getCorporativoConnection(
          env as keyof ConnectionRegistry['sqlserver']['corporativo']
        );
        break;

      default:
        throw new Error(
          `Unknown system: ${system}. Valid: datasul, informix, pcfactory, corporativo`
        );
    }

    if (!config) {
      throw new Error(
        `Connection not found for system=${system}, environment=${env}, purpose=${purpose}`
      );
    }

    log.debug('Resolved connection by context', {
      system,
      environment: env,
      purpose,
      dsn: config.dsn,
      description: config.description,
    });

    return config.dsn;
  }

  /**
   * Query by system context (automatic environment resolution)
   *
   * @description
   * Método de alto nível que executa queries baseado em contexto de sistema.
   * Resolve automaticamente o environment correto usando variáveis de ambiente.
   *
   * **Benefícios:**
   * - Código mais limpo e legível
   * - Environment automático via .env
   * - Menos acoplamento com DSNs específicos
   * - Facilita testes (trocar environment via .env)
   *
   * **Resolução de Environment:**
   * - datasul: usa DATASUL_ENVIRONMENT (default: production)
   * - informix: usa INFORMIX_ENVIRONMENT (default: production)
   * - pcfactory: usa PCFACTORY_ENVIRONMENT (default: production)
   * - corporativo: usa CORPORATIVO_ENVIRONMENT (default: production)
   *
   * @param {object} context - System context
   * @param {'datasul' | 'informix' | 'pcfactory' | 'corporativo'} context.system - Sistema
   * @param {string} [context.environment] - Ambiente (opcional, usa .env se não fornecido)
   * @param {string} [context.purpose] - Propósito do database (requerido para datasul e pcfactory)
   * @param {string} sql - SQL query
   * @param {QueryParameter[]} [params] - Query parameters
   * @returns {Promise<T[]>} Query results
   * @throws {Error} Se sistema desconhecido ou configuração inválida
   *
   * @example Datasul EMP (environment automático via DATASUL_ENVIRONMENT)
   * ```typescript
   * const items = await DatabaseManager.queryByContext(
   *   { system: 'datasul', purpose: 'emp' },
   *   'SELECT * FROM item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * ```
   *
   * @example PCFactory Sistema com environment explícito
   * ```typescript
   * const orders = await DatabaseManager.queryByContext(
   *   { system: 'pcfactory', environment: 'development', purpose: 'sistema' },
   *   'SELECT * FROM Orders WHERE OrderID = ?',
   *   [{ name: 'id', type: 'int', value: 12345 }]
   * );
   * ```
   *
   * @example Corporativo (environment automático via CORPORATIVO_ENVIRONMENT)
   * ```typescript
   * const data = await DatabaseManager.queryByContext(
   *   { system: 'corporativo' },
   *   'SELECT * FROM dbo.Dados WHERE ID = ?',
   *   [{ name: 'id', type: 'int', value: 1 }]
   * );
   * ```
   *
   * @example Informix Production (environment explícito)
   * ```typescript
   * const logix = await DatabaseManager.queryByContext(
   *   { system: 'informix', environment: 'production' },
   *   'SELECT * FROM logix.item WHERE cod_item = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   * ```
   *
   * @critical
   * - Purpose é OBRIGATÓRIO para datasul e pcfactory
   * - Environment é OPCIONAL (usa .env como default)
   * - SEMPRE use parâmetros ao invés de concatenação de strings
   * - Conexão é criada automaticamente se não existir (lazy)
   */
  static async queryByContext<T = unknown>(
    context: {
      system: 'datasul' | 'informix' | 'pcfactory' | 'corporativo';
      environment?: 'production' | 'development' | 'homologation' | 'test';
      purpose?: string;
    },
    sql: string,
    params?: QueryParameter[]
  ): Promise<T[]> {
    // Resolver DSN baseado no contexto
    const dsn = this.resolveConnectionId(context);

    // Executar query usando a conexão resolvida
    return this.queryWithConnection<T>(dsn, sql, params);
  }

  // ============================================================================
  // SYNTAX SUGAR HELPERS - ATALHOS PARA QUERIES COMUNS
  // ============================================================================

  /**
   * PCFactory database helpers
   *
   * @description
   * Atalhos convenientes para acessar databases PCFactory.
   * Environment é resolvido automaticamente via PCFACTORY_ENVIRONMENT.
   *
   * Databases disponíveis:
   * - sistema: PCF4_PRD ou PCF4_DEV
   * - integracao: PCF_Integ_PRD ou PCF_Integ_DEV
   *
   * @example Query no database sistema
   * ```typescript
   * const orders = await DatabaseManager.pcfactory.sistema.query(
   *   'SELECT * FROM Orders WHERE OrderID = ?',
   *   [{ name: 'id', type: 'int', value: 12345 }]
   * );
   * ```
   *
   * @example Query no database integração
   * ```typescript
   * const integrations = await DatabaseManager.pcfactory.integracao.query(
   *   'SELECT * FROM IntegrationLog WHERE Status = ?',
   *   [{ name: 'status', type: 'varchar', value: 'PENDING' }]
   * );
   * ```
   */
  static pcfactory = {
    sistema: {
      query: async <T = unknown>(sql: string, params?: QueryParameter[]): Promise<T[]> => {
        return DatabaseManager.queryByContext<T>(
          { system: 'pcfactory', purpose: 'sistema' },
          sql,
          params
        );
      },
    },
    integracao: {
      query: async <T = unknown>(sql: string, params?: QueryParameter[]): Promise<T[]> => {
        return DatabaseManager.queryByContext<T>(
          { system: 'pcfactory', purpose: 'integracao' },
          sql,
          params
        );
      },
    },
  };

  /**
   * Corporativo Lorenzetti database helper
   *
   * @description
   * Atalho conveniente para acessar database Corporativo Lorenzetti.
   * Environment é resolvido automaticamente via CORPORATIVO_ENVIRONMENT.
   *
   * @example Query no database corporativo
   * ```typescript
   * const data = await DatabaseManager.corporativo.query(
   *   'SELECT * FROM dbo.Dados WHERE ID = ?',
   *   [{ name: 'id', type: 'int', value: 1 }]
   * );
   * ```
   *
   * @example Query sem parâmetros
   * ```typescript
   * const all = await DatabaseManager.corporativo.query(
   *   'SELECT TOP 100 * FROM dbo.Dados'
   * );
   * ```
   */
  static corporativo = {
    query: async <T = unknown>(sql: string, params?: QueryParameter[]): Promise<T[]> => {
      return DatabaseManager.queryByContext<T>({ system: 'corporativo' }, sql, params);
    },
  };

  /**
   * Datasul helper (syntax sugar for existing functionality)
   *
   * @description
   * Atalho conveniente para acessar databases Datasul.
   * Environment é resolvido automaticamente via DATASUL_ENVIRONMENT.
   *
   * Databases disponíveis:
   * - emp: Empresa (main business data)
   * - mult: Múltiplas empresas
   * - adt: Auditoria
   * - esp: Especial
   * - ems5: EMS5
   * - fnd: Foundation
   *
   * @param {string} purpose - Database purpose (emp, mult, adt, esp, ems5, fnd)
   * @returns {object} Helper com método query
   *
   * @example Query no database EMP
   * ```typescript
   * const items = await DatabaseManager.datasul('emp').query(
   *   'SELECT * FROM item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * ```
   *
   * @example Query no database MULT
   * ```typescript
   * const estabelecimentos = await DatabaseManager.datasul('mult').query(
   *   'SELECT * FROM estabelec WHERE "ep-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '01.01' }]
   * );
   * ```
   *
   * @example Query no database Foundation
   * ```typescript
   * const users = await DatabaseManager.datasul('fnd').query(
   *   'SELECT * FROM usuarios WHERE ativo = ?',
   *   [{ name: 'ativo', type: 'bit', value: 1 }]
   * );
   * ```
   */
  static datasul = (purpose: 'emp' | 'mult' | 'adt' | 'esp' | 'ems5' | 'fnd') => ({
    query: async <T = unknown>(sql: string, params?: QueryParameter[]): Promise<T[]> => {
      return DatabaseManager.queryByContext<T>({ system: 'datasul', purpose }, sql, params);
    },
  });

  /**
   * Informix helper (syntax sugar)
   *
   * @description
   * Atalho conveniente para acessar databases Informix (Logix).
   * Se environment não for especificado, usa INFORMIX_ENVIRONMENT.
   *
   * Environments disponíveis:
   * - production: LgxPrd
   * - development: LgxDev
   * - atualização: LgxAtu
   * - new: LgxNew
   *
   * @param {string} [environment] - Environment (opcional, usa .env se não fornecido)
   * @returns {object} Helper com método query
   *
   * @example Query no ambiente production
   * ```typescript
   * const items = await DatabaseManager.informix('production').query(
   *   'SELECT * FROM logix.item WHERE cod_item = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   * ```
   *
   * @example Query com environment automático (usa INFORMIX_ENVIRONMENT)
   * ```typescript
   * const orders = await DatabaseManager.informix().query(
   *   'SELECT * FROM logix.pedidos WHERE num_pedido = ?',
   *   [{ name: 'numero', type: 'int', value: 12345 }]
   * );
   * ```
   *
   * @example Query no ambiente development
   * ```typescript
   * const test = await DatabaseManager.informix('development').query(
   *   'SELECT * FROM logix.test_data'
   * );
   * ```
   */
  static informix = (environment?: 'production' | 'development' | 'atualização' | 'new') => ({
    query: async <T = unknown>(sql: string, params?: QueryParameter[]): Promise<T[]> => {
      return DatabaseManager.queryByContext<T>(
        { system: 'informix', environment: environment as any },
        sql,
        params
      );
    },
  });
}
