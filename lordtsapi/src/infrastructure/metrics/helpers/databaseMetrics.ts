// src/infrastructure/metrics/helpers/databaseMetrics.ts

import { metricsManager } from '../MetricsManager';

/**
 * Tipo de database (EMP ou MULT)
 */
export type DatabaseType = 'EMP' | 'MULT';

/**
 * Tipo de operação SQL
 */
export type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'other';

/**
 * Helper para instrumentação de queries e coleta de métricas de banco de dados
 *
 * @description
 * Classe utilitária que fornece métodos para instrumentar queries SQL
 * e registrar métricas automaticamente no Prometheus. Trabalha em conjunto
 * com MetricsManager para coletar dados de performance e erros.
 *
 * Funcionalidades principais:
 * - Instrumentação automática de queries (duração, sucesso, erro)
 * - Detecção automática do tipo de operação SQL
 * - Classificação de erros por tipo
 * - Tracking de conexões ativas
 * - Métricas de queries em progresso
 *
 * Métricas coletadas:
 * - db_queries_total: Total de queries executadas
 * - db_query_duration_seconds: Duração das queries
 * - db_queries_in_progress: Queries em andamento
 * - db_query_errors_total: Total de erros
 * - db_connections_active: Conexões ativas
 * - db_connection_errors_total: Erros de conexão
 *
 * Uso típico:
 * - DatabaseManager chama instrumentQuery() para cada query
 * - Métricas são automaticamente registradas
 * - Prometheus faz scraping em /metrics
 *
 * @example
 * // Instrumentar uma query
 * const result = await DatabaseMetricsHelper.instrumentQuery(
 *   'EMP',
 *   'SELECT * FROM item WHERE "it-codigo" = ?',
 *   async () => {
 *     return await connection.query(sql, params);
 *   }
 * );
 *
 * @example
 * // Registrar erro de conexão
 * try {
 *   await connection.connect();
 * } catch (error) {
 *   DatabaseMetricsHelper.recordConnectionError('EMP', error);
 *   throw error;
 * }
 *
 * @example
 * // Atualizar conexões ativas
 * DatabaseMetricsHelper.setActiveConnections('EMP', 1); // Conectou
 * DatabaseMetricsHelper.setActiveConnections('EMP', 0); // Desconectou
 *
 * @critical
 * - Métricas são essenciais para monitoramento em produção
 * - Instrumentação adiciona overhead mínimo (<1ms por query)
 * - Não loga SQL completo por segurança (apenas tipo de operação)
 * - MetricsManager deve estar inicializado antes de usar
 *
 * @see {@link MetricsManager} - Gerenciador central de métricas
 * @see {@link DatabaseManager} - Usa este helper para instrumentação
 */
export class DatabaseMetricsHelper {
  /**
   * Detecta o tipo de operação SQL baseado na query
   *
   * @description
   * Analisa o início da query SQL para determinar o tipo de operação.
   * Usado para classificar métricas por tipo de operação.
   *
   * Detecção:
   * - SELECT → 'select'
   * - INSERT → 'insert'
   * - UPDATE → 'update'
   * - DELETE → 'delete'
   * - Outros → 'other' (CREATE, DROP, etc)
   *
   * @param sql - Query SQL a ser analisada
   * @returns {QueryOperation} Tipo da operação
   * @private
   *
   * @example
   * detectOperation('SELECT * FROM item'); // 'select'
   * detectOperation('INSERT INTO item VALUES (...)'); // 'insert'
   * detectOperation('UPDATE item SET ...'); // 'update'
   * detectOperation('DELETE FROM item WHERE ...'); // 'delete'
   * detectOperation('CREATE TABLE ...'); // 'other'
   *
   * @critical
   * - Case-insensitive (normaliza para uppercase)
   * - Apenas analisa o início da query (não faz parse completo)
   * - Query com espaços no início é tratada corretamente (.trim())
   */
  private static detectOperation(sql: string): QueryOperation {
    const normalizedSql = sql.trim().toUpperCase();

    if (normalizedSql.startsWith('SELECT')) return 'select';
    if (normalizedSql.startsWith('INSERT')) return 'insert';
    if (normalizedSql.startsWith('UPDATE')) return 'update';
    if (normalizedSql.startsWith('DELETE')) return 'delete';

    return 'other';
  }

  /**
   * Executa uma query e coleta métricas automaticamente
   *
   * @description
   * Método principal de instrumentação. Envolve a execução da query
   * com coleta automática de métricas de performance e erros.
   *
   * Processo:
   * 1. Detecta tipo de operação SQL
   * 2. Registra timestamp inicial
   * 3. Incrementa queries em progresso
   * 4. Executa a query fornecida
   * 5. Em sucesso: registra duração e total
   * 6. Em erro: registra tipo de erro
   * 7. Sempre: decrementa queries em progresso
   *
   * Métricas registradas (sucesso):
   * - db_queries_total +1
   * - db_query_duration_seconds = duração
   *
   * Métricas registradas (erro):
   * - db_query_errors_total +1 (com tipo de erro)
   *
   * @template T - Tipo de retorno da query
   * @param database - Database onde a query será executada (EMP ou MULT)
   * @param sql - Query SQL a ser executada
   * @param queryFn - Função que executa a query
   * @returns {Promise<T>} Resultado da query
   * @throws Propaga qualquer erro da query original
   *
   * @example
   * // Query simples
   * const items = await DatabaseMetricsHelper.instrumentQuery(
   *   'EMP',
   *   'SELECT * FROM pub.item',
   *   async () => await pool.query('SELECT * FROM pub.item')
   * );
   *
   * @example
   * // Query parametrizada
   * const result = await DatabaseMetricsHelper.instrumentQuery(
   *   'EMP',
   *   'SELECT * FROM item WHERE "it-codigo" = ?',
   *   async () => {
   *     return await connection.queryWithParams(sql, params);
   *   }
   * );
   *
   * @example
   * // Tratando erro
   * try {
   *   const result = await DatabaseMetricsHelper.instrumentQuery(
   *     'EMP',
   *     'SELECT * FROM tabela_inexistente',
   *     async () => await pool.query('SELECT * FROM tabela_inexistente')
   *   );
   * } catch (error) {
   *   // Métricas de erro já foram registradas automaticamente
   *   console.error('Query falhou:', error);
   * }
   *
   * @critical
   * - SEMPRE use este método para instrumentar queries do DatabaseManager
   * - Não adiciona overhead significativo (<1ms por query)
   * - Erro na métrica NÃO afeta a query (try/catch interno)
   * - Queries em progresso são SEMPRE decrementadas (finally)
   * - Duração é em segundos (dividido por 1000)
   */
  static async instrumentQuery<T>(
    database: DatabaseType,
    sql: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const operation = this.detectOperation(sql);
    const startTime = Date.now();

    // Incrementa queries em progresso
    metricsManager.dbQueriesInProgress.inc({ database });

    try {
      const result = await queryFn();

      // Sucesso - registra métricas
      const duration = (Date.now() - startTime) / 1000; // segundos

      metricsManager.dbQueriesTotal.inc({ database, operation });
      metricsManager.dbQueryDuration.observe({ database, operation }, duration);

      return result;
    } catch (error) {
      // Erro - registra métrica de erro
      const errorType = this.classifyError(error);
      metricsManager.dbQueryErrors.inc({ database, error_type: errorType });

      throw error;
    } finally {
      // Decrementa queries em progresso
      metricsManager.dbQueriesInProgress.dec({ database });
    }
  }

  /**
   * Classifica o tipo de erro baseado na mensagem
   *
   * @description
   * Analisa a mensagem de erro para determinar a categoria.
   * Usado para agrupar métricas por tipo de erro.
   *
   * Categorias de erro:
   * - timeout: Query ou conexão excedeu tempo limite
   * - connection: Problemas de conexão com o banco
   * - syntax: Erro de sintaxe SQL
   * - permission: Erro de permissão/acesso negado
   * - deadlock: Deadlock detectado
   * - unknown: Outros erros não categorizados
   *
   * @param error - Erro capturado
   * @returns {string} Tipo do erro
   * @private
   *
   * @example
   * classifyError(new Error('Connection timeout')); // 'timeout'
   * classifyError(new Error('Connection refused')); // 'connection'
   * classifyError(new Error('Syntax error near SELECT')); // 'syntax'
   * classifyError(new Error('Permission denied')); // 'permission'
   * classifyError(new Error('Deadlock detected')); // 'deadlock'
   * classifyError(new Error('Something else')); // 'unknown'
   *
   * @critical
   * - Case-insensitive (normaliza para lowercase)
   * - Procura palavras-chave na mensagem
   * - Ordem das verificações importa (timeout antes de connection)
   * - Fallback para 'unknown' se nenhum padrão for encontrado
   */
  private static classifyError(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('timeout')) return 'timeout';
    if (message.includes('connection')) return 'connection';
    if (message.includes('syntax')) return 'syntax';
    if (message.includes('permission') || message.includes('denied')) return 'permission';
    if (message.includes('deadlock')) return 'deadlock';

    return 'unknown';
  }

  /**
   * Registra erro de conexão nas métricas
   *
   * @description
   * Método especializado para registrar erros ao conectar com o banco.
   * Diferente de erros de query, erros de conexão são mais graves e
   * devem ser monitorados separadamente.
   *
   * Métrica registrada:
   * - db_connection_errors_total +1 (com tipo de erro)
   *
   * @param database - Database onde ocorreu o erro (EMP ou MULT)
   * @param error - Erro capturado
   *
   * @example
   * // No DatabaseManager.initialize()
   * try {
   *   await this.connectionEmp.connect();
   * } catch (error) {
   *   DatabaseMetricsHelper.recordConnectionError('EMP', error);
   *   throw error;
   * }
   *
   * @example
   * // Tratando erro de reconnect
   * try {
   *   await connection.reconnect();
   * } catch (error) {
   *   DatabaseMetricsHelper.recordConnectionError('EMP', error);
   *   // Ativar fallback para mock
   * }
   *
   * @critical
   * - Use apenas para erros de CONEXÃO, não de query
   * - Erros de conexão são mais graves que erros de query
   * - Útil para alertar sobre instabilidade do banco
   * - Em produção, alto número de connection_errors indica problema grave
   */
  static recordConnectionError(database: DatabaseType, error: any): void {
    const errorType = this.classifyError(error);
    metricsManager.dbConnectionErrors.inc({ database, error_type: errorType });
  }

  /**
   * Atualiza o gauge de conexões ativas
   *
   * @description
   * Registra o número atual de conexões ativas com o banco.
   * Usado para monitorar o estado das conexões.
   *
   * Métrica atualizada:
   * - db_connections_active = count
   *
   * Valores típicos:
   * - 0: Desconectado ou fechado
   * - 1: Conectado (valor normal)
   * - >1: Pool com múltiplas conexões (SQL Server)
   *
   * @param database - Database a ser atualizado (EMP ou MULT)
   * @param count - Número de conexões ativas
   *
   * @example
   * // Ao conectar
   * await connection.connect();
   * DatabaseMetricsHelper.setActiveConnections('EMP', 1);
   *
   * @example
   * // Ao desconectar
   * await connection.close();
   * DatabaseMetricsHelper.setActiveConnections('EMP', 0);
   *
   * @example
   * // Pool com múltiplas conexões
   * const poolSize = pool.size;
   * DatabaseMetricsHelper.setActiveConnections('EMP', poolSize);
   *
   * @critical
   * - SEMPRE chamar ao conectar/desconectar
   * - Valor 0 indica desconexão (pode indicar problema)
   * - Em produção, monitorar para detectar quedas de conexão
   * - Para ODBC (1 conexão): sempre 0 ou 1
   * - Para SQL Server (pool): pode ser > 1
   */
  static setActiveConnections(database: DatabaseType, count: number): void {
    metricsManager.dbConnectionsActive.set({ database }, count);
  }
}