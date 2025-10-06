// src/config/configValidator.ts

import { config } from './env.config';
import { log } from '@shared/utils/logger';

/**
 * Validador de configurações da aplicação
 *
 * @description
 * Implementa validação rigorosa de todas as configurações carregadas
 * do .env na startup da aplicação. Segue o princípio "Fail Fast" -
 * se há erro crítico de configuração, a aplicação NÃO inicia.
 *
 * Funcionalidades:
 * - Validação de servidor (porta, ambiente, prefixo API)
 * - Validação de banco de dados (SQL Server, ODBC)
 * - Validação de CORS (origens permitidas)
 * - Validação de timeouts (request, heavy, health check)
 * - Validação de configurações de retry
 * - Mensagens de erro claras e acionáveis
 *
 * Filosofia Fail Fast:
 * - Detecta problemas na startup (não em runtime)
 * - Para execução se houver erro crítico
 * - Economia de tempo de debugging
 * - Previne comportamento inesperado em produção
 *
 * @example
 * // No server.ts (startup)
 * try {
 *   configValidator.validate();
 *   // Prosseguir com inicialização
 * } catch (error) {
 *   // Erro crítico - não iniciar
 *   process.exit(1);
 * }
 *
 * @critical
 * - SEMPRE chamar na startup (antes de qualquer inicialização)
 * - NUNCA ignorar erros de validação
 * - Adicionar validações para novas configs
 * - Mensagens devem ser claras e acionáveis
 * - Diferenciar erro (fatal) de aviso (não-fatal)
 *
 * @see {@link config} - Configurações validadas
 */
export class ConfigValidator {
  /**
   * Array de erros críticos encontrados
   * @private
   */
  private errors: string[] = [];

  /**
   * Executa todas as validações
   *
   * @description
   * Método principal que orquestra todas as validações.
   * Se houver erros críticos, loga e lança exceção.
   *
   * Validações executadas:
   * 1. validateServer() - porta, ambiente, prefixo
   * 2. validateDatabase() - SQL Server ou ODBC
   * 3. validateCors() - origens permitidas
   * 4. validateTimeouts() - timeouts HTTP
   * 5. validateRetry() - configurações de retry
   *
   * @throws {Error} Se houver erros críticos de configuração
   *
   * @example
   * const validator = new ConfigValidator();
   * validator.validate(); // Throws se houver erros
   *
   * @critical
   * - Chama logErrors() se houver erros
   * - Chama logSuccess() se tudo OK
   * - Lança exceção com mensagem clara
   * - Não retorna valor (lança ou passa)
   */
  validate(): void {
    // Executar todas as validações
    this.validateServer();
    this.validateDatabase();
    this.validateCors();
    this.validateTimeouts();
    this.validateRetry();

    // Se houver erros, logar e falhar
    if (this.errors.length > 0) {
      this.logErrors();
      throw new Error(`❌ Configuração inválida. Corrija os erros no .env`);
    }

    // Sucesso - logar resumo
    this.logSuccess();
  }

  /**
   * Valida configurações do servidor
   *
   * @description
   * Valida porta, ambiente e prefixo da API.
   *
   * Validações:
   * - PORT: entre 1 e 65535
   * - NODE_ENV: 'development', 'production' ou 'test'
   * - API_PREFIX: deve começar com '/'
   *
   * @private
   *
   * @example
   * // Erros detectados:
   * // - PORT inválida: 70000. Deve estar entre 1 e 65535.
   * // - NODE_ENV inválido: "dev". Valores válidos: development, production, test
   * // - API_PREFIX deve começar com "/". Atual: "api"
   */
  private validateServer(): void {
    // Validar porta
    if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
      this.errors.push(`PORT inválida: ${config.server.port}. Deve estar entre 1 e 65535.`);
    }

    // Validar NODE_ENV
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(config.server.nodeEnv)) {
      this.errors.push(
        `NODE_ENV inválido: "${config.server.nodeEnv}". Valores válidos: ${validEnvs.join(', ')}`
      );
    }

    // Validar API_PREFIX
    if (!config.server.apiPrefix || !config.server.apiPrefix.startsWith('/')) {
      this.errors.push(`API_PREFIX deve começar com "/". Atual: "${config.server.apiPrefix}"`);
    }
  }

  /**
   * Valida configurações de banco de dados
   *
   * @description
   * Valida tipo de conexão e configs específicas (SQL Server ou ODBC).
   * Pula validação se useMockData === true.
   *
   * Validações:
   * - DB_CONNECTION_TYPE: 'sqlserver' ou 'odbc'
   * - SQL Server: server, port, user, password, timeouts
   * - ODBC: DSNs, timeout
   *
   * @private
   *
   * @critical
   * - Mock data pula validações (desenvolvimento/testes)
   * - Database vazio é válido (usa default do usuário SQL)
   * - Senha é obrigatória (mesmo que vazia no .env)
   */
  private validateDatabase(): void {
    const { database } = config;

    // Validar tipo de conexão
    if (database.type !== 'sqlserver' && database.type !== 'odbc') {
      this.errors.push(
        `DB_CONNECTION_TYPE inválido: "${database.type}". Use "sqlserver" ou "odbc".`
      );
    }

    // Se usando mock, pular validações de banco
    if (database.useMockData) {
      return;
    }

    // Validações específicas por tipo
    if (database.type === 'sqlserver') {
      this.validateSqlServer();
    } else if (database.type === 'odbc') {
      this.validateOdbc();
    }
  }

  /**
   * Valida configurações específicas do SQL Server
   *
   * @description
   * Valida credenciais, server, porta e timeouts do SQL Server.
   *
   * Validações:
   * - DB_SERVER: obrigatório
   * - DB_PORT: entre 1 e 65535
   * - DB_USER: obrigatório
   * - DB_PASSWORD: obrigatório
   * - DB_CONNECTION_TIMEOUT: mínimo 1000ms
   * - DB_REQUEST_TIMEOUT: mínimo 1000ms
   *
   * @private
   *
   * @critical
   * - Database (EMP/MULT) pode ser vazio (usa default)
   * - Timeout < 1000ms é considerado erro (muito baixo)
   * - Porta deve ser válida (1-65535)
   */
  private validateSqlServer(): void {
    const { sqlServer } = config.database;

    // Validar server
    if (!sqlServer.server) {
      this.errors.push('DB_SERVER é obrigatório para SQL Server');
    }

    // Validar porta
    if (!sqlServer.port || sqlServer.port < 1 || sqlServer.port > 65535) {
      this.errors.push(`DB_PORT inválida: ${sqlServer.port}`);
    }

    // Validar credenciais
    if (!sqlServer.user) {
      this.errors.push('DB_USER é obrigatório para SQL Server');
    }

    if (!sqlServer.password) {
      this.errors.push('DB_PASSWORD é obrigatório para SQL Server');
    }

    // Database pode ser vazio (usa default do user)
    // Não validar databaseEmp e databaseMult

    // Validar timeouts
    if (sqlServer.connectionTimeout < 1000) {
      this.errors.push(
        `DB_CONNECTION_TIMEOUT muito baixo: ${sqlServer.connectionTimeout}ms. Mínimo: 1000ms`
      );
    }

    if (sqlServer.requestTimeout < 1000) {
      this.errors.push(
        `DB_REQUEST_TIMEOUT muito baixo: ${sqlServer.requestTimeout}ms. Mínimo: 1000ms`
      );
    }
  }

  /**
   * Valida configurações específicas do ODBC
   *
   * @description
   * Valida DSNs e timeout para conexões ODBC.
   *
   * Validações:
   * - ODBC_DSN_EMP: obrigatório
   * - ODBC_DSN_MULT: obrigatório
   * - ODBC_CONNECTION_TIMEOUT: mínimo 1000ms
   *
   * @private
   *
   * @critical
   * - DSNs devem existir no sistema operacional
   * - Timeout < 1000ms é considerado erro
   * - ODBC requer configuração no SO (odbcinst)
   */
  private validateOdbc(): void {
    const { odbc } = config.database;

    // Validar DSNs
    if (!odbc.dsnEmp) {
      this.errors.push('ODBC_DSN_EMP é obrigatório para ODBC');
    }

    if (!odbc.dsnMult) {
      this.errors.push('ODBC_DSN_MULT é obrigatório para ODBC');
    }

    // Validar timeout
    if (odbc.connectionTimeout < 1000) {
      this.errors.push(
        `ODBC_CONNECTION_TIMEOUT muito baixo: ${odbc.connectionTimeout}ms. Mínimo: 1000ms`
      );
    }
  }

  /**
   * Valida configurações de CORS
   *
   * @description
   * Valida origens permitidas para CORS.
   *
   * Validações:
   * - CORS_ALLOWED_ORIGINS: não pode ser vazio
   * - Formato: deve começar com http:// ou https:// (exceto '*')
   *
   * @private
   *
   * @example
   * // Válidos:
   * // - http://localhost:3000
   * // - https://app.example.com
   * // - *
   *
   * @example
   * // Inválidos:
   * // - localhost:3000 (falta http://)
   * // - example.com (falta https://)
   */
  private validateCors(): void {
    // Validar se há origens configuradas
    if (!config.cors.allowedOrigins || config.cors.allowedOrigins.length === 0) {
      this.errors.push('CORS_ALLOWED_ORIGINS não pode estar vazio');
    }

    // Validar formato de cada origem
    config.cors.allowedOrigins.forEach(origin => {
      if (origin !== '*' && !origin.startsWith('http://') && !origin.startsWith('https://')) {
        this.errors.push(
          `CORS origin inválido: "${origin}". Deve começar com http:// ou https://`
        );
      }
    });
  }

  /**
   * Valida configurações de timeouts HTTP
   *
   * @description
   * Valida timeouts de requisições HTTP.
   *
   * Validações:
   * - HTTP_REQUEST_TIMEOUT: mínimo 1000ms
   * - HTTP_HEALTH_TIMEOUT: mínimo 100ms
   * - HTTP_HEALTH_TIMEOUT: não pode ser > HTTP_REQUEST_TIMEOUT
   *
   * @private
   *
   * @critical
   * - Health check deve ser mais rápido que request normal
   * - Timeout < 100ms para health check é muito baixo
   * - Timeout < 1000ms para request é muito baixo
   */
  private validateTimeouts(): void {
    const { timeout } = config;

    // Validar timeout de request
    if (timeout.request < 1000) {
      this.errors.push(
        `HTTP_REQUEST_TIMEOUT muito baixo: ${timeout.request}ms. Mínimo: 1000ms`
      );
    }

    // Validar timeout de health check
    if (timeout.healthCheck < 100) {
      this.errors.push(
        `HTTP_HEALTH_TIMEOUT muito baixo: ${timeout.healthCheck}ms. Mínimo: 100ms`
      );
    }

    // Health check não pode ser maior que request normal
    if (timeout.healthCheck > timeout.request) {
      this.errors.push(
        `HTTP_HEALTH_TIMEOUT (${timeout.healthCheck}ms) não pode ser maior que HTTP_REQUEST_TIMEOUT (${timeout.request}ms)`
      );
    }
  }

  /**
   * Valida configurações de retry
   *
   * @description
   * Valida configurações de retry automático de conexões.
   *
   * Validações:
   * - DB_RETRY_MAX_ATTEMPTS: entre 1 e 10
   * - DB_RETRY_INITIAL_DELAY: mínimo 100ms
   * - DB_RETRY_MAX_DELAY: >= initial delay
   * - DB_RETRY_BACKOFF_FACTOR: >= 1
   *
   * @private
   *
   * @critical
   * - Max attempts > 10 pode causar timeouts longos
   * - Initial delay < 100ms é muito rápido
   * - Max delay < initial delay é inválido
   * - Backoff factor < 1 não aumenta delay
   */
  private validateRetry(): void {
    const { retry } = config.database;

    // Validar max attempts
    if (retry.maxAttempts < 1) {
      this.errors.push(
        `DB_RETRY_MAX_ATTEMPTS deve ser >= 1. Atual: ${retry.maxAttempts}`
      );
    }

    if (retry.maxAttempts > 10) {
      this.errors.push(
        `DB_RETRY_MAX_ATTEMPTS muito alto: ${retry.maxAttempts}. Máximo recomendado: 10`
      );
    }

    // Validar initial delay
    if (retry.initialDelay < 100) {
      this.errors.push(
        `DB_RETRY_INITIAL_DELAY muito baixo: ${retry.initialDelay}ms. Mínimo: 100ms`
      );
    }

    // Validar max delay
    if (retry.maxDelay < retry.initialDelay) {
      this.errors.push(
        `DB_RETRY_MAX_DELAY (${retry.maxDelay}ms) deve ser >= DB_RETRY_INITIAL_DELAY (${retry.initialDelay}ms)`
      );
    }

    // Validar backoff factor
    if (retry.backoffFactor < 1) {
      this.errors.push(
        `DB_RETRY_BACKOFF_FACTOR deve ser >= 1. Atual: ${retry.backoffFactor}`
      );
    }
  }

  /**
   * Loga erros de validação no console
   *
   * @description
   * Formata e exibe todos os erros encontrados.
   * Usado quando validação falha.
   *
   * @private
   *
   * @example
   * // Output:
   * // ❌ ERROS DE CONFIGURAÇÃO:
   * //
   * //    1. PORT inválida: 70000. Deve estar entre 1 e 65535.
   * //    2. DB_SERVER é obrigatório para SQL Server
   * //    3. CORS_ALLOWED_ORIGINS não pode estar vazio
   */
  private logErrors(): void {
    console.error('\n❌ ERROS DE CONFIGURAÇÃO:\n');
    this.errors.forEach((error, index) => {
      console.error(`   ${index + 1}. ${error}`);
    });
    console.error('\n');
  }

  /**
   * Loga sucesso da validação
   *
   * @description
   * Exibe mensagem de sucesso e resumo das configurações
   * (apenas em ambiente de desenvolvimento).
   *
   * @private
   *
   * @example
   * // Output (development):
   * // ✅ Configurações válidas
   * //
   * // 📋 Configuração Atual:
   * //    Ambiente: development
   * //    Porta: 3000
   * //    API Prefix: /api
   * //    Banco: SQLSERVER
   * //    Mock Data: NÃO
   * //    Cache: layered (habilitado)
   * //    Retry: 3 tentativas
   */
  private logSuccess(): void {
    log.info('✅ Configurações válidas');

    // Em desenvolvimento, mostrar resumo
    if (config.server.nodeEnv === 'development') {
      console.log('\n📋 Configuração Atual:');
      console.log(`   Ambiente: ${config.server.nodeEnv}`);
      console.log(`   Porta: ${config.server.port}`);
      console.log(`   API Prefix: ${config.server.apiPrefix}`);
      console.log(`   Banco: ${config.database.type.toUpperCase()}`);
      console.log(`   Mock Data: ${config.database.useMockData ? 'SIM' : 'NÃO'}`);
      console.log(`   Cache: ${config.cache.strategy} (${config.cache.enabled ? 'habilitado' : 'desabilitado'})`);
      console.log(`   Retry: ${config.database.retry.maxAttempts} tentativas\n`);
    }
  }
}

/**
 * Instância singleton do ConfigValidator
 *
 * @description
 * Instância pré-criada para uso em toda a aplicação.
 * Import e use diretamente.
 *
 * @example
 * import { configValidator } from '@config/configValidator';
 * configValidator.validate();
 */
export const configValidator = new ConfigValidator();