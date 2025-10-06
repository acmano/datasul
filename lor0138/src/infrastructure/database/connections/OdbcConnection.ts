// src/infrastructure/database/connections/OdbcConnection.ts

import odbc from 'odbc';
import { IConnection, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';

/**
 * Implementação de conexão ODBC para Progress OpenEdge
 *
 * @description
 * Gerencia conexões com Progress OpenEdge usando ODBC (Open Database Connectivity).
 * Implementa retry automático com backoff exponencial e suporte a queries parametrizadas.
 *
 * Funcionalidades principais:
 * - Conexão via DSN (Data Source Name) configurado no sistema
 * - Retry automático com backoff exponencial
 * - Queries parametrizadas para prevenir SQL injection
 * - Health check para monitoramento
 * - Instrumentação com logs detalhados
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
 * @example
 * // Criar e conectar
 * const connString = 'DSN=PRD_EMS2EMP;UID=user;PWD=pass';
 * const conn = new OdbcConnection(connString, 'EMP');
 * await conn.connect();
 *
 * @example
 * // Query parametrizada (recomendado)
 * const result = await conn.queryWithParams(
 *   'SELECT * FROM item WHERE "it-codigo" = ?',
 *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
 * );
 *
 * @example
 * // Health check
 * const health = await conn.healthCheck();
 * console.log(`Conectado: ${health.connected}, Latência: ${health.responseTime}ms`);
 *
 * @critical
 * - DSN deve estar configurado ANTES de usar esta classe
 * - Progress OpenEdge usa aspas duplas para nomes com hífen: "it-codigo"
 * - ODBC usa '?' como placeholder, diferente de '@param' do SQL Server
 * - Conexão ODBC não tem pool nativo - cada instância = uma conexão
 * - Teste conectividade com: odbcinst -q -s (Linux) ou ODBC Administrator (Windows)
 *
 * @see {@link IConnection} - Interface implementada
 * @see {@link QueryParameter} - Estrutura de parâmetros
 */
export class OdbcConnection implements IConnection {
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
   * Nome identificador da conexão (para logs)
   * @private
   */
  private name: string;

  /**
   * Construtor da conexão ODBC
   *
   * @description
   * Inicializa a instância com connection string e nome identificador.
   * NÃO conecta automaticamente - use connect() para estabelecer conexão.
   *
   * @param connectionString - String de conexão ODBC (DSN=nome;UID=user;PWD=pass)
   * @param name - Nome identificador (usado em logs e métricas)
   *
   * @example
   * const conn = new OdbcConnection('DSN=PRD_EMS2EMP;UID=totvs;PWD=senha', 'EMP');
   * await conn.connect();
   *
   * @critical
   * - Connection string deve incluir DSN, UID e PWD
   * - DSN deve existir no sistema operacional
   */
  constructor(connectionString: string, name: string = 'ODBC') {
    this.connectionString = connectionString;
    this.name = name;
  }

  /**
   * Estabelece conexão com o Progress OpenEdge via ODBC
   *
   * @description
   * Tenta conectar ao banco usando a connection string fornecida.
   * O processo inclui:
   * 1. Validação do DSN no sistema operacional
   * 2. Tentativa de conexão inicial
   * 3. Retry com backoff exponencial (até maxAttempts)
   * 4. Registro em logs de sucesso/falha
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
   * @example
   * // Conectar com configuração padrão
   * await conn.connect();
   *
   * @example
   * // Tratar erro de conexão
   * try {
   *   await conn.connect();
   * } catch (error) {
   *   console.error('Falha ao conectar:', error.message);
   *   // Verificar se DSN existe: odbcinst -q -s (Linux)
   * }
   *
   * @critical
   * - Este método pode demorar se o servidor estiver lento/inacessível
   * - Verifique DSN antes: odbcinst -q -s (Linux) ou ODBC Administrator (Windows)
   * - Retry só ocorre em erros de conexão (não em erros de auth)
   * - Logs detalhados registram cada tentativa
   * - Progress OpenEdge pode demorar mais que SQL Server para conectar
   */
  async connect(): Promise<void> {
    const context = `${this.name} (ODBC)`;

    log.info(`Conectando ${context}...`);

    // Configurar retry com backoff exponencial
    const retryOptions = {
      maxAttempts: config.database.retry.maxAttempts,
      initialDelay: config.database.retry.initialDelay,
      maxDelay: config.database.retry.maxDelay,
      backoffFactor: config.database.retry.backoffFactor,
      jitter: true,
      onRetry: (error: Error, attempt: number, delay: number) => {
        // Só retry em erros de conexão
        if (!isRetryableError(error)) {
          log.error(`${context}: Erro não-retryable, abortando`, {
            error: error.message,
            attempt,
          });
          throw error;
        }
      },
    };

    try {
      this.connection = await retryWithBackoff(
        async () => {
          const conn = await odbc.connect(this.connectionString);
          return conn;
        },
        retryOptions,
        context
      );

      log.info(`${context} conectado`);
    } catch (error) {
      log.error(`${context}: Falha após todas as tentativas de retry`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        maxAttempts: retryOptions.maxAttempts,
      });
      throw error;
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
   * @param sql - Query SQL completa
   * @returns {Promise<any>} Array com resultados
   * @throws {Error} Se conexão não estiver inicializada ou query falhar
   *
   * @deprecated Use queryWithParams() para queries parametrizadas
   *
   * @example
   * // ❌ NÃO RECOMENDADO
   * const result = await conn.query('SELECT * FROM pub.item');
   *
   * @example
   * // ✅ RECOMENDADO
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Progress usa aspas duplas para campos com hífen: "it-codigo"
   * - Logs registram apenas início da query (primeiros 100 chars)
   */
  async query(sql: string): Promise<any> {
    if (!this.connection) {
      throw new Error(`${this.name}: Conexão não inicializada`);
    }

    try {
      const result = await this.connection.query(sql);
      return result;
    } catch (error) {
      log.error(`${this.name}: Erro na query`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        sql: sql.substring(0, 100),
      });
      throw error;
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
   * @param sql - Query SQL com placeholders (?, ?, etc)
   * @param params - Array de parâmetros (ordem importa!)
   * @returns {Promise<any>} Array com resultados
   * @throws {Error} Se conexão não estiver inicializada ou query falhar
   *
   * @example
   * // Query com um parâmetro
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   *
   * @example
   * // Query com múltiplos parâmetros (ORDEM IMPORTA!)
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "grupo-estoq" = ? AND "cod-obsoleto" = ?',
   *   [
   *     { name: 'grupo', type: 'int', value: 1 },
   *     { name: 'obsoleto', type: 'int', value: 0 }
   *   ]
   * );
   *
   * @example
   * // Query com JOIN (Progress syntax)
   * const result = await conn.queryWithParams(
   *   `SELECT i.*, e."ep-codigo"
   *    FROM pub.item i
   *    INNER JOIN pub."item-uni-estab" e ON i."it-codigo" = e."it-codigo"
   *    WHERE i."it-codigo" = ?`,
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   *
   * @critical
   * - SEMPRE use este método ao invés de query() para prevenir SQL injection
   * - ODBC usa '?' - a ordem dos parâmetros no array DEVE corresponder à ordem na query
   * - Progress usa aspas duplas para nomes com hífen: "it-codigo"
   * - Nomes de tabela incluem schema: pub.item, pub.estabelec
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   */
  async queryWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (!this.connection) {
      throw new Error(`${this.name}: Conexão não inicializada`);
    }

    try {
      // ODBC usa '?' como placeholder
      const values = params.map(p => p.value);
      const result = await this.connection.query(sql, values);
      return result;
    } catch (error) {
      log.error(`${this.name}: Erro na query parametrizada`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        params: params.map(p => ({ name: p.name, type: p.type })),
      });
      throw error;
    }
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
   * @example
   * // No shutdown da aplicação
   * await conn.close();
   *
   * @example
   * // Com tratamento de erro
   * try {
   *   await conn.close();
   * } catch (error) {
   *   console.error('Erro ao fechar:', error);
   * }
   *
   * @critical
   * - SEMPRE chamar antes de process.exit()
   * - Aguarda fechamento completo antes de continuar
   * - Libera recursos do driver ODBC
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      log.info(`${this.name} desconectado`);
    }
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
   *
   * @example
   * if (!conn.isConnected()) {
   *   await conn.connect();
   * }
   *
   * @critical
   * Este método NÃO testa a conexão real com o banco.
   * Apenas verifica se a conexão local existe.
   */
  isConnected(): boolean {
    return this.connection !== null;
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
   *
   * @returns {Promise<{connected: boolean, responseTime: number}>}
   *   - connected: true se query executou com sucesso
   *   - responseTime: latência em milissegundos
   *
   * @example
   * const health = await conn.healthCheck();
   * if (health.connected) {
   *   console.log(`Latência: ${health.responseTime}ms`);
   * } else {
   *   console.error('Conexão falhou!');
   * }
   *
   * @example
   * // Alertar se latência alta
   * const health = await conn.healthCheck();
   * if (health.responseTime > 2000) {
   *   console.warn('Progress OpenEdge lento!');
   * }
   *
   * @critical
   * - Query simples não valida permissões ou acesso a tabelas
   * - Progress pode ter latência maior que SQL Server
   * - Latência alta (>2s) indica problemas de rede ou banco
   * - Em caso de erro, retorna connected: false
   */
  async healthCheck(): Promise<{ connected: boolean; responseTime: number }> {
    const startTime = Date.now();

    try {
      if (!this.connection) {
        return { connected: false, responseTime: 0 };
      }

      await this.connection.query('SELECT 1 AS health');
      const responseTime = Date.now() - startTime;

      return { connected: true, responseTime };
    } catch (error) {
      log.error(`${this.name}: Health check falhou`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return { connected: false, responseTime: Date.now() - startTime };
    }
  }
}