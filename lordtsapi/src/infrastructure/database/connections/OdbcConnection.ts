// @ts-nocheck
// src/infrastructure/database/connections/OdbcConnection.ts

import odbc from 'odbc';
import { IConnection, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';

/**
 * Options for OdbcConnection constructor
 *
 * @interface OdbcConnectionOptions
 *
 * @property {string} [connectionString] - Full ODBC connection string override
 * @property {string} [driver] - ODBC driver path override
 * @property {number} [timeout] - Connection timeout in milliseconds
 * @property {string} [username] - Database username override
 * @property {string} [password] - Database password override
 */
export interface OdbcConnectionOptions {
  /** Full ODBC connection string override (if provided, DSN is ignored) */
  connectionString?: string;
  /** ODBC driver path override */
  driver?: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Database username override (defaults to DB_USER env var) */
  username?: string;
  /** Database password override (defaults to DB_PASSWORD env var) */
  password?: string;
}

/**
 * Implementação de conexão ODBC para Progress OpenEdge
 *
 * @description
 * Gerencia conexões com Progress OpenEdge usando ODBC (Open Database Connectivity).
 * Implementa retry automático com backoff exponencial e suporte a queries parametrizadas.
 *
 * **NOVA VERSÃO v2.0:**
 * - Suporte a DSN dinâmico via construtor
 * - Integração completa com connections.config.ts
 * - Flexibilidade para override de connection string
 * - Metadata properties (dsn, isConnected, lastError)
 * - Melhor logging com identificação de DSN
 * - Tratamento de erros específicos de ODBC
 *
 * Funcionalidades principais:
 * - Conexão via DSN (Data Source Name) configurado no sistema
 * - Retry automático com backoff exponencial
 * - Queries parametrizadas para prevenir SQL injection
 * - Health check para monitoramento
 * - Instrumentação com logs detalhados
 * - Metadata tracking para diagnósticos
 *
 * Características técnicas:
 * - Usa biblioteca 'odbc' para conectividade
 * - Requer DSN configurado no sistema operacional (Windows ODBC ou unixODBC)
 * - Parâmetros usam '?' como placeholder (padrão ODBC)
 * - Não usa pool (cada instância = uma conexão)
 *
 * Requisitos do sistema:
 * - Windows: ODBC Data Source Administrator
 * - Linux: unixODBC + Progress OpenEdge ODBC driver
 * - DSN configurado apontando para o Progress Database
 *
 * @example Criar conexão com DSN simples
 * ```typescript
 * const conn = new OdbcConnection('DtsPrdEmp');
 * await conn.connect();
 * console.log(conn.dsn); // 'DtsPrdEmp'
 * console.log(conn.isConnected); // true
 * ```
 *
 * @example Criar conexão com opções customizadas
 * ```typescript
 * const conn = new OdbcConnection('DtsTstEmp', {
 *   driver: '/custom/path/pgoe27.so',
 *   timeout: 30000,
 *   username: 'custom_user',
 *   password: 'custom_pass'
 * });
 * await conn.connect();
 * ```
 *
 * @example Criar conexão com connection string override
 * ```typescript
 * const conn = new OdbcConnection('DtsPrdEmp', {
 *   connectionString: 'DSN=DtsPrdEmp;UID=totvs;PWD=senha;DRIVER=/usr/dlc/odbc/lib/pgoe27.so'
 * });
 * await conn.connect();
 * ```
 *
 * @example Query parametrizada (recomendado)
 * ```typescript
 * const result = await conn.queryWithParams(
 *   'SELECT * FROM item WHERE "it-codigo" = ?',
 *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
 * );
 * ```
 *
 * @example Health check com metadata
 * ```typescript
 * const health = await conn.healthCheck();
 * console.log(`DSN: ${conn.dsn}`);
 * console.log(`Conectado: ${health.connected}, Latência: ${health.responseTime}ms`);
 * if (conn.lastError) {
 *   console.error('Último erro:', conn.lastError.message);
 * }
 * ```
 *
 * @critical
 * - DSN deve estar configurado ANTES de usar esta classe
 * - Progress OpenEdge usa aspas duplas para nomes com hífen: "it-codigo"
 * - ODBC usa '?' como placeholder, diferente de '@param' do SQL Server
 * - Conexão ODBC não tem pool nativo - cada instância = uma conexão
 * - Teste conectividade com: odbcinst -q -s (Linux) ou ODBC Administrator (Windows)
 * - DSN deve corresponder a uma entrada em connections.config.ts
 *
 * @see {@link IConnection} - Interface implementada
 * @see {@link QueryParameter} - Estrutura de parâmetros
 * @see {@link OdbcConnectionOptions} - Opções de configuração
 */
export class OdbcConnection implements IConnection {
  /**
   * Nome do DSN (Data Source Name)
   * @public
   * @readonly
   */
  public readonly dsn: string;

  /**
   * Conexão ODBC ativa
   * @private
   */
  private connection: odbc.Connection | null = null;

  /**
   * String de conexão ODBC (formato: DSN=nome;UID=user;PWD=pass)
   * @private
   */
  private connectionString: string;

  /**
   * Opções de configuração da conexão
   * @private
   */
  private options: OdbcConnectionOptions;

  /**
   * Último erro capturado
   * @public
   */
  public lastError?: Error;

  /**
   * Construtor da conexão ODBC
   *
   * @description
   * Inicializa a instância com DSN e opções opcionais.
   * NÃO conecta automaticamente - use connect() para estabelecer conexão.
   *
   * A connection string é construída dinamicamente usando:
   * 1. options.connectionString (se fornecida) - override completo
   * 2. DSN + credenciais do ambiente (DB_USER, DB_PASSWORD)
   * 3. Driver opcional (options.driver ou padrão do sistema)
   *
   * @param {string} dsn - Nome do DSN (Data Source Name)
   * @param {OdbcConnectionOptions} [options={}] - Opções de configuração
   *
   * @example Construtor básico
   * ```typescript
   * const conn = new OdbcConnection('DtsPrdEmp');
   * await conn.connect();
   * ```
   *
   * @example Com credenciais customizadas
   * ```typescript
   * const conn = new OdbcConnection('DtsTstEmp', {
   *   username: 'test_user',
   *   password: 'test_pass'
   * });
   * await conn.connect();
   * ```
   *
   * @example Com driver customizado
   * ```typescript
   * const conn = new OdbcConnection('DtsPrdEmp', {
   *   driver: '/usr/dlc/odbc/lib/pgoe27.so'
   * });
   * await conn.connect();
   * ```
   *
   * @example Com connection string completa
   * ```typescript
   * const conn = new OdbcConnection('DtsPrdEmp', {
   *   connectionString: 'DSN=DtsPrdEmp;UID=totvs;PWD=senha;DRIVER=/usr/dlc/odbc/lib/pgoe27.so'
   * });
   * await conn.connect();
   * ```
   *
   * @critical
   * - DSN deve corresponder a uma entrada em /etc/odbc.ini
   * - Se options.connectionString for fornecida, DSN é usado apenas para identificação
   * - Credenciais vêm de options ou variáveis de ambiente (DB_USER, DB_PASSWORD)
   * - Connection string final é construída no método buildConnectionString()
   */
  constructor(dsn: string, options: OdbcConnectionOptions = {}) {
    this.dsn = dsn;
    this.options = options;
    this.connectionString = this.buildConnectionString();
  }

  /**
   * Constrói a connection string ODBC dinamicamente
   *
   * @description
   * Gera a connection string baseada no DSN e opções fornecidas.
   * Ordem de precedência:
   * 1. options.connectionString (override completo)
   * 2. DSN + credenciais + driver (construído automaticamente)
   *
   * @returns {string} Connection string ODBC formatada
   * @private
   *
   * @example Connection string construída automaticamente
   * ```
   * DSN=DtsPrdEmp;UID=totvs;PWD=senha
   * ```
   *
   * @example Com driver customizado
   * ```
   * DSN=DtsPrdEmp;UID=totvs;PWD=senha;DRIVER=/usr/dlc/odbc/lib/pgoe27.so
   * ```
   *
   * @critical
   * - Credenciais vêm de options ou variáveis de ambiente
   * - Driver é opcional (sistema usa padrão se não fornecido)
   * - Senhas com caracteres especiais devem ser escapadas
   */
  private buildConnectionString(): string {
    // Se connection string foi fornecida, usa ela diretamente
    if (this.options.connectionString) {
      log.debug(`Usando connection string override para DSN: ${this.dsn}`);
      return this.options.connectionString;
    }

    // Constrói connection string a partir do DSN e opções
    const parts: string[] = [`DSN=${this.dsn}`];

    // Adiciona credenciais (prioriza options, depois env vars)
    const username = this.options.username || process.env.DB_USER;
    const password = this.options.password || process.env.DB_PASSWORD;

    if (username) {
      parts.push(`UID=${username}`);
    }

    if (password) {
      parts.push(`PWD=${password}`);
    }

    // Adiciona driver se fornecido
    if (this.options.driver) {
      parts.push(`DRIVER=${this.options.driver}`);
    }

    const connStr = parts.join(';');
    log.debug(
      `Connection string construída para DSN ${this.dsn}: ${this.sanitizeConnectionString(connStr)}`
    );

    return connStr;
  }

  /**
   * Sanitiza connection string para logging (remove senha)
   *
   * @description
   * Remove informações sensíveis (senha) da connection string para logging seguro.
   *
   * @param {string} connStr - Connection string original
   * @returns {string} Connection string sanitizada
   * @private
   *
   * @example
   * ```typescript
   * const sanitized = this.sanitizeConnectionString('DSN=DtsPrdEmp;UID=totvs;PWD=senha123');
   * // 'DSN=DtsPrdEmp;UID=totvs;PWD=***'
   * ```
   */
  private sanitizeConnectionString(connStr: string): string {
    return connStr.replace(/PWD=[^;]+/i, 'PWD=***');
  }

  /**
   * Verifica se a conexão está ativa
   *
   * @description
   * Retorna true se a conexão foi estabelecida e está disponível.
   * NÃO executa query de teste - apenas verifica estado local.
   * Para teste real de conectividade, use healthCheck().
   *
   * @returns {boolean} True se conexão está inicializada
   * @public
   *
   * @example
   * ```typescript
   * if (!conn.isConnected()) {
   *   await conn.connect();
   * }
   * console.log(`Conectado ao DSN: ${conn.dsn}`);
   * ```
   *
   * @critical
   * Este método NÃO testa a conexão real com o banco.
   * Apenas verifica se a conexão local existe.
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Estabelece conexão com o Progress OpenEdge via ODBC
   *
   * @description
   * Tenta conectar ao banco usando a connection string construída.
   * O processo inclui:
   * 1. Validação do DSN no sistema operacional
   * 2. Tentativa de conexão inicial
   * 3. Retry com backoff exponencial (até maxAttempts)
   * 4. Registro em logs de sucesso/falha
   * 5. Atualização de metadata (lastError)
   *
   * Retry automático:
   * - maxAttempts: configurável via env (default: 3)
   * - initialDelay: configurável via env (default: 1000ms)
   * - backoffFactor: exponencial com jitter
   * - Só retenta erros retryable (conexão, timeout)
   *
   * Erros comuns:
   * - "Data source name not found": DSN não configurado no sistema
   * - "Login failed": credenciais incorretas
   * - "Connection timeout": banco inacessível ou lento
   *
   * @returns {Promise<void>}
   * @throws {Error} Se falhar após todas as tentativas de retry
   *
   * @example Conectar com configuração padrão
   * ```typescript
   * await conn.connect();
   * console.log(`Conectado ao DSN: ${conn.dsn}`);
   * ```
   *
   * @example Tratar erro de conexão
   * ```typescript
   * try {
   *   await conn.connect();
   * } catch (error) {
   *   console.error(`Falha ao conectar DSN ${conn.dsn}:`, error.message);
   *   console.error('Último erro:', conn.lastError);
   *   // Verificar se DSN existe: odbcinst -q -s (Linux)
   * }
   * ```
   *
   * @critical
   * - Este método pode demorar se o servidor estiver lento/inacessível
   * - Verifique DSN antes: odbcinst -q -s (Linux) ou ODBC Administrator (Windows)
   * - Retry só ocorre em erros de conexão (não em erros de auth)
   * - Logs detalhados registram cada tentativa com DSN
   * - Progress OpenEdge pode demorar mais que SQL Server para conectar
   * - lastError é atualizado em caso de falha
   */
  async connect(): Promise<void> {
    const context = `DSN: ${this.dsn}`;

    log.info(`Conectando ${context}...`, {
      dsn: this.dsn,
      connectionString: this.sanitizeConnectionString(this.connectionString),
      env: {
        DB_USER: process.env.DB_USER ? '***' : 'not set',
        DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'not set',
        NODE_ENV: process.env.NODE_ENV,
      },
    });

    // Configurar retry com backoff exponencial
    const retryOptions = {
      maxAttempts: config.database.retry.maxAttempts,
      initialDelay: config.database.retry.initialDelay,
      maxDelay: config.database.retry.maxDelay,
      backoffFactor: config.database.retry.backoffFactor,
      jitter: true,
      onRetry: (error: Error, attempt: number, _delay: number) => {
        // Capturar TODOS os detalhes do erro ODBC
        const errorDetails: any = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          // ODBC errors podem ter propriedades extras
          ...(error as any),
        };

        log.error(`${context}: Erro ODBC detalhado (tentativa ${attempt})`, {
          dsn: this.dsn,
          attempt,
          errorDetails,
          odbcState: (error as any).odbcErrors || (error as any).state || 'unknown',
          sqlState: (error as any).sqlState || 'unknown',
          code: (error as any).code || 'unknown',
        });

        // Só retry em erros de conexão
        if (!isRetryableError(error)) {
          log.error(`${context}: Erro não-retryable, abortando`, {
            dsn: this.dsn,
            error: error.message,
            attempt,
          });
          this.lastError = error;
          throw error;
        }
        this.lastError = error;
      },
    };

    try {
      this.connection = await retryWithBackoff(
        async () => {
          log.debug(`${context}: Tentando odbc.connect()...`, {
            dsn: this.dsn,
            connectionString: this.sanitizeConnectionString(this.connectionString),
          });
          const conn = await odbc.connect(this.connectionString);
          log.debug(`${context}: odbc.connect() retornou sucesso`, {
            dsn: this.dsn,
          });
          return conn;
        },
        retryOptions,
        context
      );

      // Limpa lastError em caso de sucesso
      this.lastError = undefined;

      log.info(`${context} conectado com sucesso`, {
        dsn: this.dsn,
        isConnected: this.isConnected(),
      });
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));

      // Log detalhado do erro final
      const errorDetails: any = {
        message: this.lastError.message,
        name: this.lastError.name,
        stack: this.lastError.stack,
        ...(this.lastError as any),
      };

      log.error(`${context}: Falha após todas as tentativas de retry`, {
        dsn: this.dsn,
        error: this.lastError.message,
        maxAttempts: retryOptions.maxAttempts,
        connectionString: this.sanitizeConnectionString(this.connectionString),
        errorDetails,
        odbcState: (this.lastError as any).odbcErrors || (this.lastError as any).state || 'unknown',
        sqlState: (this.lastError as any).sqlState || 'unknown',
        code: (this.lastError as any).code || 'unknown',
      });
      throw this.lastError;
    }
  }

  /**
   * Executa query simples no Progress OpenEdge (DEPRECATED)
   *
   * @description
   * Método legado para queries sem parâmetros.
   * DEPRECATED: Use queryWithParams() sempre que possível para evitar SQL injection.
   * Mantido apenas para compatibilidade com código antigo.
   *
   * @param {string} sql - Query SQL completa
   * @returns {Promise<T[]>} Array com resultados
   * @throws {Error} Se conexão não estiver inicializada ou query falhar
   *
   * @deprecated Use queryWithParams() para queries parametrizadas
   *
   * @example NÃO RECOMENDADO
   * ```typescript
   * const result = await conn.query('SELECT * FROM pub.item');
   * ```
   *
   * @example RECOMENDADO
   * ```typescript
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   * ```
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Progress usa aspas duplas para campos com hífen: "it-codigo"
   * - Logs registram apenas início da query (primeiros 100 chars)
   * - DSN é incluído em todos os logs de erro
   */
  async query<T = unknown>(sql: string): Promise<T[]> {
    if (!this.connection) {
      const error = new Error(`DSN ${this.dsn}: Conexão não inicializada`);
      this.lastError = error;
      throw error;
    }

    try {
      const result = await this.connection.query(sql);

      // ODBC Progress retorna colunas em UPPERCASE - converter para lowercase
      // para compatibilidade com TypeScript interfaces (que usam camelCase/lowercase)
      const normalizedResult = result.map((row: any) => {
        const normalizedRow: any = {};
        for (const key in row) {
          normalizedRow[key.toLowerCase()] = row[key];
        }
        return normalizedRow;
      });

      return normalizedResult;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));

      log.error(`DSN ${this.dsn}: Erro na query`, {
        dsn: this.dsn,
        error: this.lastError.message,
        sql: sql.substring(0, 100),
      });
      throw this.lastError;
    }
  }

  /**
   * Executa query parametrizada no Progress OpenEdge (RECOMENDADO)
   *
   * @description
   * Método RECOMENDADO para executar queries. Usa binding de parâmetros
   * para prevenir SQL injection e permite tipagem forte dos valores.
   *
   * Processo:
   * 1. Extrai valores dos parâmetros na ordem correta
   * 2. Executa query com placeholders '?'
   * 3. Retorna array de resultados
   * 4. Atualiza lastError em caso de falha
   *
   * Diferenças do SQL Server:
   * - ODBC usa '?' como placeholder (não '@nome')
   * - Ordem dos parâmetros importa (array sequencial)
   * - Não há mapeamento explícito de tipos (ODBC infere)
   *
   * Convenções do Progress:
   * - Nomes de tabela: pub.item, pub.estabelec
   * - Campos com hífen: "it-codigo", "ep-codigo"
   * - Case-sensitive em alguns casos
   *
   * @param {string} sql - Query SQL com placeholders (?, ?, etc)
   * @param {QueryParameter[]} params - Array de parâmetros (ordem importa!)
   * @returns {Promise<T[]>} Array com resultados
   * @throws {Error} Se conexão não estiver inicializada ou query falhar
   *
   * @example Query com um parâmetro
   * ```typescript
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * ```
   *
   * @example Query com múltiplos parâmetros (ORDEM IMPORTA!)
   * ```typescript
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "grupo-estoq" = ? AND "cod-obsoleto" = ?',
   *   [
   *     { name: 'grupo', type: 'int', value: 1 },
   *     { name: 'obsoleto', type: 'int', value: 0 }
   *   ]
   * );
   * ```
   *
   * @example Query com JOIN (Progress syntax)
   * ```typescript
   * const result = await conn.queryWithParams(
   *   `SELECT i.*, e."ep-codigo"
   *    FROM pub.item i
   *    INNER JOIN pub."item-uni-estab" e ON i."it-codigo" = e."it-codigo"
   *    WHERE i."it-codigo" = ?`,
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   * ```
   *
   * @critical
   * - SEMPRE use este método ao invés de query() para prevenir SQL injection
   * - ODBC usa '?' - a ordem dos parâmetros no array DEVE corresponder à ordem na query
   * - Progress usa aspas duplas para nomes com hífen: "it-codigo"
   * - Nomes de tabela incluem schema: pub.item, pub.estabelec
   * - DSN é incluído em todos os logs de erro para diagnóstico
   * - lastError é atualizado automaticamente em caso de falha
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   */
  async queryWithParams<T = unknown>(sql: string, params: QueryParameter[]): Promise<T[]> {
    if (!this.connection) {
      const error = new Error(`DSN ${this.dsn}: Conexão não inicializada`);
      this.lastError = error;
      throw error;
    }

    try {
      // Tradução de SQL Server T-SQL para ODBC Progress
      let translatedSql = sql;

      // Remove declarações DECLARE (específicas do T-SQL)
      translatedSql = translatedSql.replace(/DECLARE\s+@\w+\s+\w+(\(\d+\))?\s*=\s*@\w+;\s*/gi, '');

      // Substitui @paramName por ? na ordem em que aparecem
      params.forEach((param) => {
        const paramPattern = new RegExp(`@${param.name}\\b`, 'g');
        translatedSql = translatedSql.replace(paramPattern, '?');
      });

      // ODBC usa '?' como placeholder
      const values = params.map((p) => p.value);

      log.debug(`DSN ${this.dsn}: SQL traduzido`, {
        original: sql.substring(0, 150),
        translated: translatedSql.substring(0, 150),
        paramsCount: params.length,
      });

      const result = await this.connection.query(translatedSql, values);

      // ODBC Progress retorna colunas em UPPERCASE
      // Precisamos mapear de volta para o case original dos aliases SQL
      const normalizedResult = this.normalizeOdbcResults<T>(result, translatedSql);

      return normalizedResult;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));

      log.error(`DSN ${this.dsn}: Erro na query parametrizada`, {
        dsn: this.dsn,
        error: this.lastError.message,
        params: params.map((p) => ({ name: p.name, type: p.type })),
        sql: sql.substring(0, 100),
      });
      throw this.lastError;
    }
  }

  /**
   * Normaliza resultados ODBC preservando o case dos aliases SQL
   *
   * @description
   * ODBC Progress retorna todos os nomes de colunas em UPPERCASE, mas os aliases
   * SQL podem estar em camelCase. Esta função:
   * 1. Extrai aliases da query SQL (pattern: "AS aliasName")
   * 2. Cria mapeamento case-insensitive: ALIASNAME -> aliasName
   * 3. Aplica o mapeamento nos resultados, preservando o case original
   *
   * @param {unknown[]} results - Resultados brutos do ODBC
   * @param {string} sql - Query SQL original com aliases
   * @returns {T[]} Resultados com nomes de colunas no case correto
   * @private
   *
   * @example
   * SQL: SELECT "it-codigo" as itemCodigo, "desc-item" as itemDescricao
   * ODBC retorna: [{ ITEMCODIGO: "123", ITEMDESCRICAO: "Desc" }]
   * Resultado: [{ itemCodigo: "123", itemDescricao: "Desc" }]
   */
  private normalizeOdbcResults<T>(results: unknown[], sql: string): T[] {
    if (!results || results.length === 0) {
      return [];
    }

    // Extrai aliases da query SQL usando regex
    // Pattern: match "as aliasName" ou "AS aliasName" (case-insensitive)
    const aliasPattern = /\s+as\s+([a-z_][a-z0-9_]*)\b/gi;
    const aliasMap = new Map<string, string>();

    let match;
    while ((match = aliasPattern.exec(sql)) !== null) {
      const alias = match[1]; // Captura o alias original com case preservado
      aliasMap.set(alias.toUpperCase(), alias); // Mapa UPPERCASE -> case original
    }

    // Normaliza cada row aplicando o mapeamento
    return results.map((row, index) => {
      if (!row || typeof row !== 'object') {
        return row as T;
      }

      const normalizedRow: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(row)) {
        // Verifica se existe mapeamento para este campo
        const mappedKey = aliasMap.get(key.toUpperCase());
        const finalKey = mappedKey || key.toLowerCase();
        normalizedRow[finalKey] = value;
      }

      return normalizedRow as T;
    });
  }

  /**
   * Fecha a conexão ODBC
   *
   * @description
   * Encerra gracefully a conexão com o banco, liberando recursos.
   * É seguro chamar múltiplas vezes (ignora se já estiver fechado).
   *
   * @returns {Promise<void>}
   *
   * @example No shutdown da aplicação
   * ```typescript
   * await conn.close();
   * console.log(`Conexão ${conn.dsn} fechada`);
   * ```
   *
   * @example Com tratamento de erro
   * ```typescript
   * try {
   *   await conn.close();
   * } catch (error) {
   *   console.error(`Erro ao fechar DSN ${conn.dsn}:`, error);
   * }
   * ```
   *
   * @critical
   * - SEMPRE chamar antes de process.exit()
   * - Aguarda fechamento completo antes de continuar
   * - Libera recursos do driver ODBC
   * - DSN é incluído nos logs para rastreabilidade
   */
  async close(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        log.info(`DSN ${this.dsn} desconectado`, {
          dsn: this.dsn,
        });
      } catch (error) {
        this.lastError = error instanceof Error ? error : new Error(String(error));
        log.error(`Erro ao fechar conexão DSN ${this.dsn}`, {
          dsn: this.dsn,
          error: this.lastError.message,
        });
        throw this.lastError;
      }
    }
  }

  /**
   * Executa health check na conexão
   *
   * @description
   * Testa a conectividade real com o banco executando uma query simples.
   * Mede o tempo de resposta para detectar problemas de latência.
   *
   * Processo:
   * 1. Registra timestamp inicial
   * 2. Executa 'SELECT 1 AS health'
   * 3. Calcula tempo de resposta
   * 4. Retorna status + latência
   * 5. Atualiza lastError em caso de falha
   *
   * @returns {Promise<{connected: boolean, responseTime: number}>}
   *   - connected: true se query executou com sucesso
   *   - responseTime: latência em milissegundos
   *
   * @example Health check básico
   * ```typescript
   * const health = await conn.healthCheck();
   * if (health.connected) {
   *   console.log(`DSN ${conn.dsn} OK - Latência: ${health.responseTime}ms`);
   * } else {
   *   console.error(`DSN ${conn.dsn} FALHOU`);
   *   if (conn.lastError) {
   *     console.error('Erro:', conn.lastError.message);
   *   }
   * }
   * ```
   *
   * @example Alertar se latência alta
   * ```typescript
   * const health = await conn.healthCheck();
   * if (health.responseTime > 2000) {
   *   console.warn(`DSN ${conn.dsn} lento! ${health.responseTime}ms`);
   * }
   * ```
   *
   * @critical
   * - Query simples não valida permissões ou acesso a tabelas
   * - Progress pode ter latência maior que SQL Server
   * - Latência alta (>2s) indica problemas de rede ou banco
   * - Em caso de erro, retorna connected: false e atualiza lastError
   * - DSN é incluído em todos os logs
   */
  async healthCheck(): Promise<{ connected: boolean; responseTime: number }> {
    const startTime = Date.now();

    try {
      if (!this.connection) {
        return { connected: false, responseTime: 0 };
      }

      // Progress ODBC não suporta SELECT sem FROM - usar COUNT(*) de tabela existente
      await this.connection.query('SELECT COUNT(*) as health FROM pub.item');
      const responseTime = Date.now() - startTime;

      log.debug(`Health check DSN ${this.dsn}: OK (${responseTime}ms)`, {
        dsn: this.dsn,
        responseTime,
      });

      return { connected: true, responseTime };
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));

      log.error(`DSN ${this.dsn}: Health check falhou`, {
        dsn: this.dsn,
        error: this.lastError.message,
      });

      return { connected: false, responseTime: Date.now() - startTime };
    }
  }
}
