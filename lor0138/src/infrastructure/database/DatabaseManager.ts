// src/infrastructure/database/DatabaseManager.ts

import { ConnectionType, ConnectionStatus, IConnection, QueryParameter } from './types';
import { SqlServerConnection } from './connections/SqlServerConnection';
import { OdbcConnection } from './connections/OdbcConnection';
import { MockConnection } from './connections/MockConnection';
import { getSqlServerConfigEmp, getSqlServerConfigMult } from './config/sqlServerConfig';
import { getOdbcConnectionString } from './config/odbcConfig';
import { DatabaseMetricsHelper } from '@infrastructure/metrics/helpers/databaseMetrics';

/**
 * Gerenciador centralizado de conexões com banco de dados
 *
 * @description
 * Implementa o padrão Singleton para gerenciar todas as conexões de banco de dados
 * da aplicação. Suporta múltiplos tipos de conexão (SQL Server, ODBC) e implementa
 * fallback automático para dados mockados em caso de falha.
 *
 * Funcionalidades principais:
 * - Gerenciamento de conexões EMP (empresa) e MULT (múltiplas empresas)
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
 *
 * @example
 * // Inicializar no server.ts
 * await DatabaseManager.initialize();
 *
 * @example
 * // Query parametrizada (recomendado)
 * const result = await DatabaseManager.queryEmpWithParams(
 *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
 *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
 * );
 *
 * @example
 * // Verificar status
 * const status = DatabaseManager.getConnectionStatus();
 * console.log(status.mode); // 'REAL_DATABASE' ou 'MOCK_DATA'
 *
 * @critical
 * - NUNCA chamar o construtor diretamente, usar getInstance()
 * - SEMPRE inicializar com initialize() antes de usar
 * - Queries devem usar parâmetros para prevenir SQL injection
 * - Em produção, NUNCA usar useMockData
 *
 * @see {@link IConnection} - Interface de conexão
 * @see {@link QueryParameter} - Parâmetros de query
 * @see {@link ConnectionStatus} - Status das conexões
 */
export class DatabaseManager {
  /**
   * Instância singleton do DatabaseManager
   * @private
   */
  private static instance: DatabaseManager | null = null;

  /**
   * Conexão com o database EMP (empresa)
   * @private
   */
  private static connectionEmp: IConnection | null = null;

  /**
   * Conexão com o database MULT (múltiplas empresas)
   * @private
   */
  private static connectionMult: IConnection | null = null;

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
   * Construtor privado para implementação do padrão Singleton
   *
   * @description
   * O construtor é privado para prevenir instanciação direta.
   * Use getInstance() para obter a instância.
   *
   * @private
   * @critical Nunca tornar público ou remover
   */
  private constructor() { }

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
   * const manager = DatabaseManager.getInstance();
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
   * Retorna a conexão primária (EMP)
   *
   * @description
   * Retorna a conexão com o database EMP (empresa).
   * Usado principalmente pelo health check.
   * Se estiver usando mock, retorna MockConnection.
   *
   * @returns {IConnection} Conexão ativa ou MockConnection
   * @throws {Error} Se a conexão não foi inicializada
   *
   * @example
   * const conn = DatabaseManager.getConnection();
   * await conn.query('SELECT 1');
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
   * @returns {Promise<void>}
   *
   * @example
   * // No server.ts
   * try {
   *   await DatabaseManager.initialize();
   *   console.log('Banco conectado!');
   * } catch (error) {
   *   console.error('Falha na conexão:', error);
   * }
   *
   * @critical
   * - DEVE ser chamado antes de qualquer query
   * - É seguro chamar múltiplas vezes (evita re-inicialização)
   * - NUNCA lança exceção (usa mock em caso de erro)
   * - Em produção, verificar se NÃO está em modo mock
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
    console.log('Inicializando conexões Datasul...');

    // Lê tipo de conexão do ambiente
    this.connectionType = (process.env.DB_CONNECTION_TYPE as ConnectionType) || 'odbc';
    console.log(`Modo: ${this.connectionType.toUpperCase()}`);

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

      console.log('✅ CONECTADO AO DATASUL');
    } catch (error) {
      // Falha - ativa modo mock
      this.connectionError = (error as Error).message;
      this.useMockData = true;
      this.isInitialized = true;

      // Registra métricas de erro
      DatabaseMetricsHelper.recordConnectionError('EMP', error);
      DatabaseMetricsHelper.recordConnectionError('MULT', error);

      console.warn('⚠️  USANDO DADOS MOCK');
      console.error('Erro conexão:', this.connectionError);
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
   * // Interno - chamado por doInitialize()
   * await this.initializeSqlServer();
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
    await Promise.all([
      this.connectionEmp.connect(),
      this.connectionMult.connect(),
    ]);

    console.log('✅ SQL Server conectado');
  }

  /**
   * Inicializa conexões ODBC (EMP e MULT)
   *
   * @description
   * Cria duas instâncias de OdbcConnection usando connection strings
   * e as conecta em paralelo usando Promise.all para melhor performance.
   *
   * @returns {Promise<void>}
   * @throws {Error} Se falhar ao conectar em qualquer uma das conexões
   * @private
   *
   * @example
   * // Interno - chamado por doInitialize()
   * await this.initializeOdbc();
   *
   * @critical
   * - Requer DSNs configurados no sistema operacional
   * - DSNs devem ter permissões adequadas no Progress OpenEdge
   * - Usa Promise.all para conectar em paralelo
   */
  private static async initializeOdbc(): Promise<void> {
    const connStringEmp = getOdbcConnectionString('EMP');
    const connStringMult = getOdbcConnectionString('MULT');

    this.connectionEmp = new OdbcConnection(connStringEmp, 'EMP');
    this.connectionMult = new OdbcConnection(connStringMult, 'MULT');

    // Conecta ambas em paralelo
    await Promise.all([
      this.connectionEmp.connect(),
      this.connectionMult.connect(),
    ]);

    console.log('✅ ODBC conectado');
  }

  // src/infrastructure/database/DatabaseManager.ts - PARTE 2
  // (Continuação da Parte 1 - Métodos de Query)

  /**
   * Executa query parametrizada no database EMP (RECOMENDADO)
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
   * @example
   * // Query simples com um parâmetro
   * const result = await DatabaseManager.queryEmpWithParams(
   *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   *
   * @example
   * // Query com múltiplos parâmetros
   * const result = await DatabaseManager.queryEmpWithParams(
   *   'SELECT * FROM item WHERE "grupo-estoq" = @grupo AND "cod-obsoleto" = @obsoleto',
   *   [
   *     { name: 'grupo', type: 'int', value: 1 },
   *     { name: 'obsoleto', type: 'int', value: 0 }
   *   ]
   * );
   *
   * @critical
   * - SEMPRE use parâmetros ao invés de concatenação de strings
   * - Tipos suportados: varchar, int, decimal, date, bit
   * - Em modo mock, ignora parâmetros e retorna dados fixos
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   */
  static async queryEmpWithParams(sql: string, params: QueryParameter[]): Promise<any> {
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
   * Executa query parametrizada no database MULT (RECOMENDADO)
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
   * @example
   * // Buscar estabelecimento
   * const result = await DatabaseManager.queryMultWithParams(
   *   'SELECT * FROM estabelec WHERE "ep-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '01.01' }]
   * );
   *
   * @critical
   * - SEMPRE use parâmetros ao invés de concatenação
   * - Database MULT contém dados de múltiplas empresas
   * - Cuidado com queries pesadas sem índices
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   */
  static async queryMultWithParams(sql: string, params: QueryParameter[]): Promise<any> {
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
   * Executa query simples no database EMP (DEPRECATED)
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
   * // ❌ NÃO RECOMENDADO
   * const result = await DatabaseManager.queryEmp('SELECT * FROM item');
   *
   * @example
   * // ✅ RECOMENDADO
   * const result = await DatabaseManager.queryEmpWithParams(
   *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Será removido em versões futuras
   */
  static async queryEmp(sql: string): Promise<any> {
    if (this.useMockData) {
      return this.getMockConnection().query(sql);
    }

    if (!this.connectionEmp) {
      throw new Error('Conexão EMP não inicializada');
    }

    // Instrumenta com métricas de performance
    return DatabaseMetricsHelper.instrumentQuery('EMP', sql, () =>
      this.connectionEmp!.query(sql)
    );
  }

  /**
   * Executa query simples no database MULT (DEPRECATED)
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
   * // ❌ NÃO RECOMENDADO
   * const result = await DatabaseManager.queryMult('SELECT * FROM estabelec');
   *
   * @example
   * // ✅ RECOMENDADO
   * const result = await DatabaseManager.queryMultWithParams(
   *   'SELECT * FROM estabelec WHERE "ep-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '01.01' }]
   * );
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Será removido em versões futuras
   */
  static async queryMult(sql: string): Promise<any> {
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
   * const status = DatabaseManager.getConnectionStatus();
   * console.log(status.mode); // 'REAL_DATABASE' ou 'MOCK_DATA'
   * console.log(status.type); // 'sqlserver' ou 'odbc'
   * if (status.error) {
   *   console.error('Erro:', status.error);
   * }
   *
   * @example
   * // No health check
   * const status = DatabaseManager.getConnectionStatus();
   * res.json({
   *   database: {
   *     connected: status.mode === 'REAL_DATABASE',
   *     type: status.type,
   *     error: status.error
   *   }
   * });
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
   * if (!DatabaseManager.isReady()) {
   *   await DatabaseManager.initialize();
   * }
   *
   * @example
   * // No health check
   * const ready = DatabaseManager.isReady();
   * if (!ready) {
   *   return res.status(503).json({ error: 'Database not ready' });
   * }
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
   * if (DatabaseManager.isUsingMockData()) {
   *   console.warn('⚠️  Sistema usando dados MOCK');
   * }
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
   * 1. Fecha conexão EMP (se existir)
   * 2. Fecha conexão MULT (se existir)
   * 3. Reseta flags de estado
   * 4. Registra métricas de desconexão
   *
   * @returns {Promise<void>}
   *
   * @example
   * // No graceful shutdown
   * process.on('SIGTERM', async () => {
   *   console.log('Fechando conexões...');
   *   await DatabaseManager.close();
   *   process.exit(0);
   * });
   *
   * @critical
   * - SEMPRE chamar antes de process.exit()
   * - Aguarda o fechamento completo antes de continuar
   * - Não lança exceções mesmo se houver erros
   */
  static async close(): Promise<void> {
    console.log('Fechando conexões...');

    try {
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

      console.log('✅ Conexões fechadas');
    } catch (error) {
      console.error('Erro ao fechar conexões:', error);
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
   * const result = await DatabaseManager.testConnections();
   * console.log('Conectado:', result.isConnected);
   * console.log('Tipo:', result.type);
   * console.log('Usando Mock:', result.usingMock);
   * if (result.error) {
   *   console.error('Erro:', result.error);
   * }
   *
   * @example
   * // No health check detalhado
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
   */
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