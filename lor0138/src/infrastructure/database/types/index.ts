// src/infrastructure/database/types/index.ts

/**
 * @fileoverview Tipos e interfaces para o sistema de banco de dados
 *
 * Define as interfaces e tipos TypeScript usados pelo DatabaseManager
 * e suas conexões (SQL Server, ODBC, Mock).
 *
 * @module infrastructure/database/types
 */

/**
 * Tipo de conexão de banco de dados suportada
 *
 * @typedef {'sqlserver' | 'odbc'} ConnectionType
 *
 * @description
 * - `sqlserver`: Conexão direta via driver mssql
 * - `odbc`: Conexão via DSN ODBC configurado no sistema
 */
export type ConnectionType = 'sqlserver' | 'odbc';

/**
 * Status atual da conexão com o banco de dados
 *
 * @interface ConnectionStatus
 *
 * @property {ConnectionType} type - Tipo de conexão ativa (sqlserver ou odbc)
 * @property {'MOCK_DATA' | 'REAL_DATABASE'} mode - Modo de operação
 * @property {string} [error] - Mensagem de erro caso a conexão tenha falhado
 *
 * @example
 * ```typescript
 * const status: ConnectionStatus = {
 *   type: 'odbc',
 *   mode: 'REAL_DATABASE'
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Com erro
 * const status: ConnectionStatus = {
 *   type: 'sqlserver',
 *   mode: 'MOCK_DATA',
 *   error: 'Connection timeout'
 * };
 * ```
 */
export interface ConnectionStatus {
  type: ConnectionType;
  mode: 'MOCK_DATA' | 'REAL_DATABASE';
  error?: string;
}

/**
 * Parâmetro de query SQL
 *
 * @interface QueryParameter
 *
 * @property {string} name - Nome do parâmetro (sem prefixo @)
 * @property {string} type - Tipo SQL do parâmetro (varchar, int, etc)
 * @property {any} value - Valor do parâmetro
 *
 * @description
 * Usado para queries parametrizadas, prevenindo SQL injection.
 * O tipo deve ser compatível com o driver de banco de dados usado.
 *
 * @example
 * ```typescript
 * const params: QueryParameter[] = [
 *   { name: 'itemCodigo', type: 'varchar', value: '7530110' },
 *   { name: 'estabCodigo', type: 'varchar', value: '30110' }
 * ];
 *
 * await connection.queryWithParams(
 *   'SELECT * FROM item WHERE it-codigo = @itemCodigo',
 *   params
 * );
 * ```
 */
export interface QueryParameter {
  name: string;
  type: string;
  value: any;
}

/**
 * Interface de conexão com banco de dados
 *
 * @interface IConnection
 *
 * @description
 * Define o contrato que todas as implementações de conexão devem seguir.
 * Implementada por:
 * - SqlServerConnection: Conexão direta SQL Server
 * - OdbcConnection: Conexão via DSN ODBC
 * - MockConnection: Dados simulados para fallback
 *
 * @example
 * ```typescript
 * class CustomConnection implements IConnection {
 *   async connect(): Promise<void> {
 *     // Implementação
 *   }
 *
 *   async query(sql: string): Promise<any> {
 *     // Implementação
 *   }
 *
 *   async queryWithParams(sql: string, params: QueryParameter[]): Promise<any> {
 *     // Implementação
 *   }
 *
 *   async close(): Promise<void> {
 *     // Implementação
 *   }
 *
 *   isConnected(): boolean {
 *     // Implementação
 *   }
 * }
 * ```
 */
export interface IConnection {
  /**
   * Estabelece conexão com o banco de dados
   *
   * @returns {Promise<void>} Promise que resolve quando conectado
   *
   * @throws {Error} Se falhar ao conectar
   *
   * @description
   * - Valida configurações
   * - Cria pool de conexões
   * - Testa conectividade
   * - Registra métricas de conexão
   *
   * @example
   * ```typescript
   * try {
   *   await connection.connect();
   *   console.log('Conectado com sucesso');
   * } catch (error) {
   *   console.error('Falha ao conectar:', error);
   * }
   * ```
   */
  connect(): Promise<void>;

  /**
   * Executa query SQL simples (sem parâmetros)
   *
   * @param {string} sql - Query SQL a ser executada
   *
   * @returns {Promise<any>} Promise com o resultado da query
   *
   * @throws {Error} Se a query falhar
   *
   * @description
   * Executa query SQL diretamente.
   * ⚠️ ATENÇÃO: Use queryWithParams() para evitar SQL injection.
   *
   * @example
   * ```typescript
   * const result = await connection.query('SELECT * FROM item WHERE it-codigo = "7530110"');
   * console.log(result.recordset);
   * ```
   *
   * @example
   * ```typescript
   * // ❌ NÃO FAÇA ISSO (SQL injection)
   * const itemCodigo = req.params.id;
   * const result = await connection.query(`SELECT * FROM item WHERE it-codigo = "${itemCodigo}"`);
   *
   * // ✅ FAÇA ISSO
   * const result = await connection.queryWithParams(
   *   'SELECT * FROM item WHERE it-codigo = @itemCodigo',
   *   [{ name: 'itemCodigo', type: 'varchar', value: itemCodigo }]
   * );
   * ```
   */
  query(sql: string): Promise<any>;

  /**
   * Executa query SQL com parâmetros (previne SQL injection)
   *
   * @param {string} sql - Query SQL com placeholders (@paramName)
   * @param {QueryParameter[]} params - Array de parâmetros
   *
   * @returns {Promise<any>} Promise com o resultado da query
   *
   * @throws {Error} Se a query falhar ou parâmetros forem inválidos
   *
   * @description
   * Método seguro para executar queries com valores dinâmicos.
   * Usa prepared statements internamente para prevenir SQL injection.
   *
   * @example
   * ```typescript
   * const result = await connection.queryWithParams(
   *   'SELECT * FROM item WHERE it-codigo = @itemCodigo AND cod-estabel = @estabCodigo',
   *   [
   *     { name: 'itemCodigo', type: 'varchar', value: '7530110' },
   *     { name: 'estabCodigo', type: 'varchar', value: '30110' }
   *   ]
   * );
   * ```
   */
  queryWithParams(sql: string, params: QueryParameter[]): Promise<any>;

  /**
   * Fecha a conexão com o banco de dados
   *
   * @returns {Promise<void>} Promise que resolve quando fechado
   *
   * @description
   * - Fecha todas as conexões abertas no pool
   * - Limpa recursos alocados
   * - Atualiza métricas de conexão
   * - Não lança erro se já estiver fechado
   *
   * @example
   * ```typescript
   * await connection.close();
   * console.log('Conexão fechada');
   * ```
   *
   * @example
   * ```typescript
   * // Graceful shutdown
   * process.on('SIGTERM', async () => {
   *   console.log('Recebido SIGTERM, fechando conexões...');
   *   await connection.close();
   *   process.exit(0);
   * });
   * ```
   */
  close(): Promise<void>;

  /**
   * Verifica se a conexão está ativa
   *
   * @returns {boolean} `true` se conectado, `false` caso contrário
   *
   * @description
   * Método síncrono que retorna o estado atual da conexão.
   * Não testa conectividade ativa, apenas retorna o estado interno.
   *
   * @example
   * ```typescript
   * if (connection.isConnected()) {
   *   const result = await connection.query('SELECT 1');
   * } else {
   *   console.log('Conexão não estabelecida');
   *   await connection.connect();
   * }
   * ```
   */
  isConnected(): boolean;
}

/**
 * Configuração de conexão com banco de dados
 *
 * @interface DatabaseConfig
 *
 * @property {string} [server] - Endereço do servidor (ex: '10.105.0.4\LOREN')
 * @property {number} [port] - Porta de conexão (padrão: 1433 para SQL Server)
 * @property {string} [user] - Usuário do banco
 * @property {string} [password] - Senha do banco
 * @property {string} [database] - Nome do banco de dados
 * @property {string} [dsn] - DSN ODBC configurado no sistema (alternativa ao server)
 * @property {number} [connectionTimeout] - Timeout de conexão em ms (padrão: 15000)
 * @property {number} [requestTimeout] - Timeout de queries em ms (padrão: 30000)
 * @property {boolean} [encrypt] - Se deve encriptar a conexão (padrão: false)
 * @property {boolean} [trustServerCertificate] - Se deve confiar no certificado (padrão: true)
 *
 * @description
 * Todas as propriedades são opcionais para permitir diferentes cenários:
 * - SQL Server direto: usar server, port, user, password, database
 * - ODBC: usar dsn (DSN já contém server, database, etc)
 * - Mock: não precisa de configuração
 *
 * @example
 * ```typescript
 * // SQL Server direto
 * const config: DatabaseConfig = {
 *   server: '10.105.0.4\\LOREN',
 *   port: 1433,
 *   user: 'dcloren',
 *   password: '#dcloren#',
 *   database: 'PRD_EMS2EMP',
 *   connectionTimeout: 30000,
 *   requestTimeout: 30000,
 *   encrypt: false,
 *   trustServerCertificate: true
 * };
 * ```
 *
 * @example
 * ```typescript
 * // ODBC via DSN
 * const config: DatabaseConfig = {
 *   dsn: 'DSN_PRD_EMS2_EMP',
 *   connectionTimeout: 30000,
 *   requestTimeout: 30000
 * };
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: Senhas com caracteres especiais como # devem usar aspas simples no .env
 * ```env
 * DB_PASSWORD='#senha#'  # ✅ CORRETO
 * DB_PASSWORD=#senha#    # ❌ ERRADO (# é comentário em bash)
 * ```
 */
export interface DatabaseConfig {
  server?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  dsn?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}