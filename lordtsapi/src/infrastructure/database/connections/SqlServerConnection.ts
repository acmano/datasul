// @ts-nocheck
// src/infrastructure/database/connections/SqlServerConnection.ts

import sql from 'mssql';
import { IConnection, DatabaseConfig, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';

/**
 * Implementação de conexão SQL Server
 *
 * @description
 * Gerencia conexões com SQL Server usando a biblioteca mssql.
 * Implementa retry automático com backoff exponencial, pool de conexões
 * para otimização de performance e timeout manual para prevenir travamentos.
 *
 * Funcionalidades principais:
 * - Pool de conexões configurável (min/max/idle)
 * - Retry automático com backoff exponencial
 * - Timeout manual para prevenir travamentos
 * - Queries parametrizadas para prevenir SQL injection
 * - Health check para monitoramento
 * - Instrumentação com logs detalhados
 *
 * Características técnicas:
 * - Usa ConnectionPool do mssql para melhor performance
 * - Suporta TLS/SSL (encrypt + trustServerCertificate)
 * - Timeout em 2 níveis: connection e request
 * - Mapeia tipos SQL automaticamente
 *
 * @example
 * // Criar e conectar
 * const config = getSqlServerConfigEmp();
 * const conn = new SqlServerConnection(config, 'EMP');
 * await conn.connect();
 *
 * @example
 * // Query parametrizada (recomendado)
 * const result = await conn.queryWithParams(
 *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
 *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
 * );
 *
 * @example
 * // Health check
 * const health = await conn.healthCheck();
 * console.log(`Conectado: ${health.connected}, Latência: ${health.responseTime}ms`);
 *
 * @critical
 * - Sempre usar queryWithParams() ao invés de query() para prevenir SQL injection
 * - Configurar timeouts adequados (connection: 15s, request: 30s)
 * - Monitorar pool de conexões em produção
 * - Em caso de falha, o retry acontece automaticamente até maxAttempts
 *
 * @see {@link IConnection} - Interface implementada
 * @see {@link DatabaseConfig} - Configuração necessária
 * @see {@link QueryParameter} - Estrutura de parâmetros
 */
export class SqlServerConnection implements IConnection {
  /**
   * Pool de conexões SQL Server
   * @private
   */
  private pool: sql.ConnectionPool | null = null;

  /**
   * Configuração do banco de dados
   * @private
   */
  private config: DatabaseConfig;

  /**
   * Nome identificador da conexão (para logs)
   * @private
   */
  private name: string;

  /**
   * Construtor da conexão SQL Server
   *
   * @description
   * Inicializa a instância com configurações e nome identificador.
   * NÃO conecta automaticamente - use connect() para estabelecer conexão.
   *
   * @param config - Configuração do banco de dados
   * @param name - Nome identificador (usado em logs e métricas)
   *
   * @example
   * const conn = new SqlServerConnection(config, 'EMP');
   * await conn.connect();
   */
  constructor(config: DatabaseConfig, name: string = 'SQL Server') {
    this.config = config;
    this.name = name;
  }

  /**
   * Estabelece conexão com o SQL Server
   *
   * @description
   * Cria um ConnectionPool e tenta conectar com retry automático.
   * O processo inclui:
   * 1. Validação e montagem da configuração mssql
   * 2. Criação do ConnectionPool
   * 3. Retry com backoff exponencial (até maxAttempts)
   * 4. Timeout manual para evitar travamentos
   * 5. Registro em logs de sucesso/falha
   *
   * Configurações do pool:
   * - max: 10 conexões simultâneas
   * - min: 0 (conexões criadas sob demanda)
   * - idleTimeoutMillis: 30s (fecha conexões ociosas)
   *
   * Retry automático:
   * - maxAttempts: configurável via env (default: 3)
   * - initialDelay: configurável via env (default: 1000ms)
   * - backoffFactor: exponencial com jitter
   * - Só retenta erros retryable (conexão, timeout)
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
   *   // Fallback para mock ou outra estratégia
   * }
   *
   * @critical
   * - Este método pode demorar se o servidor estiver lento/inacessível
   * - Timeout manual em connectionTimeout previne travamentos indefinidos
   * - Retry só ocorre em erros de conexão (não em erros de auth)
   * - Logs detalhados registram cada tentativa
   */
  async connect(): Promise<void> {
    const context = `${this.name} (SQL Server)`;

    log.info(`Conectando ${context}...`);
    log.debug('🔍 DEBUG - Config recebida:', {
      server: this.config.server,
      user: this.config.user,
      password: '*********',
      database: this.config.database,
      port: this.config.port,
    });

    // Montar configuração do mssql
    const sqlConfig: sql.config = {
      server: this.config.server || '',
      port: this.config.port || 1433,
      user: this.config.user || '',
      password: this.config.password || '',
      database: this.config.database || '',
      connectionTimeout: this.config.connectionTimeout || 15000,
      requestTimeout: this.config.requestTimeout || 30000,
      options: {
        encrypt: this.config.encrypt ?? false,
        trustServerCertificate: this.config.trustServerCertificate ?? true,
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    // Configurar retry com backoff exponencial
    const retryOptions = {
      maxAttempts: config.database.retry.maxAttempts,
      initialDelay: config.database.retry.initialDelay,
      maxDelay: config.database.retry.maxDelay,
      backoffFactor: config.database.retry.backoffFactor,
      jitter: true,
      onRetry: (error: Error, attempt: number, _delay: number) => {
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
      this.pool = await retryWithBackoff(
        async () => {
          const pool = new sql.ConnectionPool(sqlConfig);

          // ✅ CRITICAL: Timeout manual para forçar erro se travar
          const connectPromise = pool.connect();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Connection timeout after ${sqlConfig.connectionTimeout}ms`));
            }, sqlConfig.connectionTimeout);
          });

          // Race: o que resolver/rejeitar primeiro ganha
          await Promise.race([connectPromise, timeoutPromise]);

          return pool;
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
   * Executa query simples no SQL Server (DEPRECATED)
   *
   * @description
   * Método legado para queries sem parâmetros.
   * DEPRECATED: Use queryWithParams() sempre que possível para evitar SQL injection.
   * Mantido apenas para compatibilidade com código antigo.
   *
   * @param sql - Query SQL completa
   * @returns {Promise<T[]>} Recordset com resultados
   * @throws {Error} Se pool não estiver inicializado ou query falhar
   *
   * @deprecated Use queryWithParams() para queries parametrizadas
   *
   * @example
   * // ❌ NÃO RECOMENDADO
   * const result = await conn.query('SELECT * FROM item');
   *
   * @example
   * // ✅ RECOMENDADO
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '123' }]
   * );
   *
   * @critical
   * - Não oferece proteção contra SQL injection
   * - Use apenas para queries estáticas sem variáveis
   * - Logs registram apenas início da query (primeiros 100 chars)
   */
  async query<T = unknown>(sql: string): Promise<T[]> {
    if (!this.pool) {
      throw new Error(`${this.name}: Pool não inicializado`);
    }

    try {
      const result = await this.pool.request().query(sql);
      return result.recordset;
    } catch (error) {
      log.error(`${this.name}: Erro na query`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        sql: sql.substring(0, 100), // Log apenas início da query
      });
      throw error;
    }
  }

  /**
   * Executa query parametrizada no SQL Server (RECOMENDADO)
   *
   * @description
   * Método RECOMENDADO para executar queries. Usa binding de parâmetros
   * para prevenir SQL injection e permite tipagem forte dos valores.
   *
   * Processo:
   * 1. Cria um Request do pool
   * 2. Adiciona cada parâmetro com tipo SQL correto
   * 3. Executa a query
   * 4. Retorna apenas o recordset
   *
   * Tipos suportados:
   * - varchar: strings
   * - int: inteiros 32-bit
   * - bigint: inteiros 64-bit
   * - float: números decimais
   * - decimal: decimais precisos
   * - datetime: datas
   * - bit: booleanos
   *
   * @param sql - Query SQL com placeholders (@param1, @param2, etc)
   * @param params - Array de parâmetros com nome, tipo e valor
   * @returns {Promise<any>} Recordset com resultados
   * @throws {Error} Se pool não estiver inicializado ou query falhar
   *
   * @example
   * // Query com um parâmetro
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM item WHERE "it-codigo" = @codigo',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }]
   * );
   *
   * @example
   * // Query com múltiplos parâmetros
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM item WHERE "grupo-estoq" = @grupo AND "cod-obsoleto" = @obsoleto',
   *   [
   *     { name: 'grupo', type: 'int', value: 1 },
   *     { name: 'obsoleto', type: 'int', value: 0 }
   *   ]
   * );
   *
   * @example
   * // Query com diferentes tipos
   * const result = await conn.queryWithParams(
   *   'SELECT * FROM pedido WHERE valor > @minimo AND data >= @dataInicio',
   *   [
   *     { name: 'minimo', type: 'decimal', value: 1000.50 },
   *     { name: 'dataInicio', type: 'datetime', value: new Date('2024-01-01') }
   *   ]
   * );
   *
   * @critical
   * - SEMPRE use este método ao invés de query() para prevenir SQL injection
   * - Tipos devem corresponder aos tipos do banco (varchar, int, etc)
   * - Nomes de parâmetros não incluem @ (adicionado automaticamente)
   * - Se tipo não for reconhecido, usa VarChar como fallback
   *
   * @see {@link QueryParameter} - Estrutura do parâmetro
   * @see {@link getSqlType} - Mapeamento de tipos
   */
  async queryWithParams<T = unknown>(sql: string, params: QueryParameter[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error(`${this.name}: Pool não inicializado`);
    }

    try {
      const request = this.pool.request();

      // Adicionar parâmetros
      params.forEach((param) => {
        const sqlType = this.getSqlType(param.type);
        request.input(param.name, sqlType, param.value);
      });

      const result = await request.query(sql);
      return result.recordset;
    } catch (error) {
      log.error(`${this.name}: Erro na query parametrizada`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        params: params.map((p) => ({ name: p.name, type: p.type })),
      });
      throw error;
    }
  }

  /**
   * Fecha a conexão com o SQL Server
   *
   * @description
   * Encerra gracefully o ConnectionPool, liberando recursos.
   * Aguarda fechamento de todas as conexões ativas do pool.
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
   * - Libera recursos do sistema operacional
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      log.info(`${this.name} desconectado`);
    }
  }

  /**
   * Verifica se a conexão está ativa
   *
   * @description
   * Retorna true se o pool foi criado e está disponível.
   * NÃO executa query de teste - apenas verifica estado local.
   * Para teste real de conectividade, use healthCheck().
   *
   * @returns {boolean} True se pool está inicializado
   *
   * @example
   * if (!conn.isConnected()) {
   *   await conn.connect();
   * }
   *
   * @critical
   * Este método NÃO testa a conexão real com o banco.
   * Apenas verifica se o pool local existe.
   */
  isConnected(): boolean {
    return this.pool !== null;
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
   * if (health.responseTime > 1000) {
   *   console.warn('Banco lento!');
   * }
   *
   * @critical
   * - Query simples não valida permissões ou acesso a tabelas
   * - Latência alta (>1s) indica problemas de rede ou banco
   * - Em caso de erro, retorna connected: false
   */
  async healthCheck(): Promise<{ connected: boolean; responseTime: number }> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        return { connected: false, responseTime: 0 };
      }

      await this.pool.request().query('SELECT 1 AS health');
      const responseTime = Date.now() - startTime;

      return { connected: true, responseTime };
    } catch (error) {
      log.error(`${this.name}: Health check falhou`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return { connected: false, responseTime: Date.now() - startTime };
    }
  }

  /**
   * Mapeia tipo string para tipo SQL Server
   *
   * @description
   * Converte tipos genéricos (varchar, int, etc) para tipos
   * específicos do mssql (sql.VarChar, sql.Int, etc).
   * Usado internamente por queryWithParams().
   *
   * Tipos suportados:
   * - varchar → sql.VarChar (strings)
   * - int → sql.Int (inteiros 32-bit)
   * - bigint → sql.BigInt (inteiros 64-bit)
   * - float → sql.Float (decimais de precisão simples)
   * - decimal → sql.Decimal (decimais de alta precisão)
   * - datetime → sql.DateTime (datas e horas)
   * - bit → sql.Bit (booleanos)
   *
   * @param type - Nome do tipo em lowercase
   * @returns Tipo SQL Server correspondente
   * @private
   *
   * @example
   * // Uso interno
   * const sqlType = this.getSqlType('varchar'); // sql.VarChar
   * request.input('nome', sqlType, 'João');
   *
   * @critical
   * - Case-insensitive (converte para lowercase)
   * - Tipos não reconhecidos usam VarChar como fallback
   * - Adicione novos tipos aqui se necessário
   */
  private getSqlType(type: string): unknown {
    const typeMap: Record<string, unknown> = {
      varchar: sql.VarChar,
      int: sql.Int,
      bigint: sql.BigInt,
      float: sql.Float,
      decimal: sql.Decimal,
      datetime: sql.DateTime,
      bit: sql.Bit,
    };

    return typeMap[type.toLowerCase()] || sql.VarChar;
  }
}
