// src/infrastructure/database/retry/RetryPolicy.ts

import { log } from '@shared/utils/logger';
import { MaxRetriesExceededError } from '@shared/errors/RetryErrors';
import { DatabaseInstrumentation } from '@infrastructure/tracing/DatabaseInstrumentation';

/**
 * Configuração da política de retry
 *
 * @interface RetryConfig
 *
 * @property {number} maxAttempts - Número máximo de tentativas (padrão: 3)
 * @property {number} initialDelayMs - Delay inicial em ms (padrão: 100ms)
 * @property {number} maxDelayMs - Delay máximo em ms (padrão: 5000ms)
 * @property {number} backoffMultiplier - Multiplicador exponencial (padrão: 2)
 * @property {number} jitterMs - Jitter aleatório em ms (padrão: 50ms)
 * @property {string[]} retryableErrors - Códigos/mensagens de erros retryáveis
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
  retryableErrors: string[];
}

/**
 * Contexto de uma tentativa de retry
 *
 * @interface RetryContext
 *
 * @property {number} attempt - Número da tentativa atual (1-based)
 * @property {Error} lastError - Último erro ocorrido
 * @property {number} elapsedTime - Tempo total decorrido em ms
 * @property {string} connectionId - ID da conexão (DSN)
 */
export interface RetryContext {
  attempt: number;
  lastError: Error;
  elapsedTime: number;
  connectionId: string;
}

/**
 * Política de retry com exponential backoff
 *
 * @class RetryPolicy
 *
 * @description
 * Implementa retry automático com exponential backoff e jitter para
 * operações de banco de dados. Trata erros transientes de forma inteligente.
 *
 * **Funcionalidades:**
 * - Exponential backoff: delay dobra a cada tentativa
 * - Jitter aleatório: evita thundering herd problem
 * - Detecção de erros retryáveis vs não-retryáveis
 * - Logs detalhados de cada tentativa
 * - Timeout total implícito (soma dos delays)
 *
 * **Erros retryáveis por padrão:**
 * - ETIMEDOUT: timeout de conexão/requisição
 * - ECONNRESET: conexão resetada pelo servidor
 * - ECONNREFUSED: conexão recusada
 * - ENOTFOUND: host não encontrado (DNS)
 * - EHOSTUNREACH: host não alcançável
 * - EPIPE: pipe quebrado
 * - ConnectionError: erro de conexão genérico
 * - RequestError: erro de requisição genérico
 * - TimeoutError: timeout genérico
 * - PoolError: erro no pool de conexões
 *
 * **Erros NÃO retryáveis:**
 * - ValidationError: dados inválidos (400)
 * - AuthenticationError: falha de autenticação (401)
 * - AuthorizationError: sem permissão (403)
 * - NotFoundError: recurso não encontrado (404)
 * - BusinessRuleError: regra de negócio violada (422)
 * - Qualquer erro que não seja transiente
 *
 * @example Uso básico
 * ```typescript
 * const policy = new RetryPolicy();
 *
 * const result = await policy.execute(async () => {
 *   return await connection.query('SELECT * FROM item');
 * }, 'DtsPrdEmp');
 * ```
 *
 * @example Com configuração customizada
 * ```typescript
 * const policy = new RetryPolicy({
 *   maxAttempts: 5,
 *   initialDelayMs: 50,
 *   maxDelayMs: 3000
 * });
 * ```
 */
export class RetryPolicy {
  private readonly config: RetryConfig;

  /**
   * Cria uma nova política de retry
   *
   * @param config - Configuração parcial (usa defaults para valores não fornecidos)
   */
  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      maxAttempts: config?.maxAttempts ?? 3,
      initialDelayMs: config?.initialDelayMs ?? 100,
      maxDelayMs: config?.maxDelayMs ?? 5000,
      backoffMultiplier: config?.backoffMultiplier ?? 2,
      jitterMs: config?.jitterMs ?? 50,
      retryableErrors: config?.retryableErrors ?? [
        // Network errors
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'ENOTFOUND',
        'EHOSTUNREACH',
        'EPIPE',
        // Database errors
        'ConnectionError',
        'RequestError',
        'TimeoutError',
        'PoolError',
        // SQL Server specific
        'ETIMEOUT',
        'ELOGIN',
        'EREQUEST',
        // ODBC specific
        'HY000', // General error
        'HYT00', // Timeout expired
        'HYT01', // Connection timeout
        '08S01', // Communication link failure
        '08001', // Unable to connect
      ],
    };
  }

  /**
   * Executa função com retry logic
   *
   * @template T - Tipo do resultado da função
   * @param fn - Função assíncrona a ser executada
   * @param connectionId - ID da conexão (DSN) para logging
   * @returns {Promise<T>} Resultado da função
   * @throws {MaxRetriesExceededError} Se todas as tentativas falharem
   * @throws {Error} Se erro não for retryável
   *
   * @description
   * Executa a função fornecida e, em caso de erro retryável,
   * tenta novamente com exponential backoff até maxAttempts.
   *
   * Fluxo:
   * 1. Tenta executar função
   * 2. Se sucesso, retorna resultado
   * 3. Se erro retryável e não é última tentativa:
   *    - Calcula delay com exponential backoff + jitter
   *    - Aguarda delay
   *    - Tenta novamente
   * 4. Se erro não retryável ou última tentativa:
   *    - Lança erro apropriado
   *
   * @example
   * ```typescript
   * const result = await policy.execute(async () => {
   *   return await DatabaseManager.queryWithConnection(
   *     'DtsPrdEmp',
   *     'SELECT * FROM item WHERE "it-codigo" = ?',
   *     [{ name: 'codigo', type: 'varchar', value: '123' }]
   *   );
   * }, 'DtsPrdEmp');
   * ```
   */
  async execute<T>(fn: () => Promise<T>, connectionId: string): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        // Log tentativa
        if (attempt > 1) {
          // Add trace event for retry
          DatabaseInstrumentation.traceRetryAttempt(connectionId, attempt, this.config.maxAttempts);

          log.debug('Retry attempt', {
            connectionId,
            attempt,
            maxAttempts: this.config.maxAttempts,
            elapsedTime: Date.now() - startTime,
          });
        }

        // Executa função
        const result = await fn();

        // Sucesso após retry
        if (attempt > 1) {
          log.info('Query succeeded after retry', {
            connectionId,
            attempt,
            elapsedTime: Date.now() - startTime,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Verifica se erro é retryável
        const isRetryable = this.isRetryable(lastError);

        if (!isRetryable) {
          // Erro não retryável, falha imediatamente
          log.debug('Error not retryable, failing immediately', {
            connectionId,
            error: lastError.message,
            errorName: lastError.name,
            attempt,
          });
          throw lastError;
        }

        // Última tentativa, lança MaxRetriesExceededError
        if (attempt === this.config.maxAttempts) {
          log.error('All retry attempts exhausted', {
            connectionId,
            attempts: attempt,
            elapsedTime: Date.now() - startTime,
            error: lastError.message,
            errorName: lastError.name,
          });

          throw new MaxRetriesExceededError(
            `Failed after ${attempt} attempts: ${lastError.message}`,
            lastError,
            {
              connectionId,
              attempts: attempt,
              elapsedTime: Date.now() - startTime,
            }
          );
        }

        // Calcula delay com exponential backoff e jitter
        const delay = this.calculateDelay(attempt);

        log.warn('Query failed, retrying after delay', {
          connectionId,
          attempt,
          nextAttempt: attempt + 1,
          delayMs: delay,
          error: lastError.message,
          errorCode: (lastError as any).code,
        });

        // Aguarda antes de retry
        await this.sleep(delay);
      }
    }

    // Fallback (não deveria chegar aqui)
    throw lastError!;
  }

  /**
   * Verifica se um erro é retryável
   *
   * @param error - Erro a ser verificado
   * @returns {boolean} true se erro pode ser retentado
   *
   * @description
   * Verifica se o erro é transiente (temporário) e pode ser resolvido com retry.
   *
   * Critérios:
   * 1. Verifica `error.code` contra lista de códigos retryáveis
   * 2. Verifica `error.message` contra lista de mensagens retryáveis (case-insensitive)
   * 3. Verifica nome do erro (ValidationError, NotFoundError, etc são não-retryáveis)
   *
   * @example
   * ```typescript
   * const error = new Error('ETIMEDOUT');
   * error.code = 'ETIMEDOUT';
   * console.log(policy.isRetryable(error)); // true
   * ```
   *
   * @example
   * ```typescript
   * const error = new ValidationError('Invalid input');
   * console.log(policy.isRetryable(error)); // false
   * ```
   */
  private isRetryable(error: Error): boolean {
    if (!error) {
      return false;
    }

    // Erros explicitamente não retryáveis
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
      'ItemNotFoundError',
      'FamiliaNotFoundError',
      'EstabelecimentoNotFoundError',
      'GrupoDeEstoqueNotFoundError',
      'DepositoNotFoundError',
      'BusinessRuleError',
      'NonRetryableError',
    ];

    if (nonRetryableErrors.includes(error.name)) {
      return false;
    }

    // Verifica código de erro
    const errorCode = (error as any).code;
    if (errorCode && this.config.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Verifica mensagem de erro (case-insensitive)
    const message = error.message?.toLowerCase() || '';
    return this.config.retryableErrors.some((retryable) =>
      message.includes(retryable.toLowerCase())
    );
  }

  /**
   * Calcula delay com exponential backoff e jitter
   *
   * @param attempt - Número da tentativa atual (1-based)
   * @returns {number} Delay em ms
   *
   * @description
   * Implementa exponential backoff com jitter para evitar thundering herd.
   *
   * Fórmula:
   * ```
   * exponentialDelay = initialDelayMs * (backoffMultiplier ^ (attempt - 1))
   * cappedDelay = min(exponentialDelay, maxDelayMs)
   * finalDelay = cappedDelay + random(0, jitterMs)
   * ```
   *
   * Exemplo com defaults (initialDelay=100, multiplier=2, maxDelay=5000, jitter=50):
   * - Attempt 1: 100ms + jitter (0-50ms) = 100-150ms
   * - Attempt 2: 200ms + jitter (0-50ms) = 200-250ms
   * - Attempt 3: 400ms + jitter (0-50ms) = 400-450ms
   * - Attempt 4: 800ms + jitter (0-50ms) = 800-850ms
   * - Attempt 5: 1600ms + jitter (0-50ms) = 1600-1650ms
   *
   * @example
   * ```typescript
   * const delay1 = policy.calculateDelay(1); // ~100-150ms
   * const delay2 = policy.calculateDelay(2); // ~200-250ms
   * const delay3 = policy.calculateDelay(3); // ~400-450ms
   * ```
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
    const exponentialDelay =
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Aplica cap de delay máximo
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Adiciona jitter aleatório para evitar thundering herd
    const jitter = Math.random() * this.config.jitterMs;

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Aguarda por um período de tempo
   *
   * @param ms - Tempo em milissegundos
   * @returns {Promise<void>} Promise que resolve após o tempo especificado
   *
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna configuração atual
   *
   * @returns {Readonly<RetryConfig>} Configuração read-only
   */
  getConfig(): Readonly<RetryConfig> {
    return Object.freeze({ ...this.config });
  }
}

/**
 * Política de retry padrão (uso geral)
 *
 * @description
 * Configuração balanceada para uso geral:
 * - 3 tentativas
 * - Delay inicial: 100ms
 * - Delay máximo: 5s
 * - Backoff exponencial (2x)
 *
 * @example
 * ```typescript
 * const result = await defaultRetryPolicy.execute(async () => {
 *   return await query();
 * }, 'DtsPrdEmp');
 * ```
 */
export const defaultRetryPolicy = new RetryPolicy();

/**
 * Política de retry agressiva (conexões críticas)
 *
 * @description
 * Configuração agressiva para conexões críticas de produção:
 * - 5 tentativas
 * - Delay inicial: 50ms (mais rápido)
 * - Delay máximo: 3s
 * - Backoff exponencial (2x)
 *
 * Use para:
 * - Produção com alta disponibilidade
 * - Operações críticas
 * - Databases primários
 *
 * @example
 * ```typescript
 * const result = await aggressiveRetryPolicy.execute(async () => {
 *   return await criticalQuery();
 * }, 'DtsPrdEmp');
 * ```
 */
export const aggressiveRetryPolicy = new RetryPolicy({
  maxAttempts: 5,
  initialDelayMs: 50,
  maxDelayMs: 3000,
  backoffMultiplier: 2,
  jitterMs: 50,
});

/**
 * Política de retry conservadora (operações pesadas)
 *
 * @description
 * Configuração conservadora para operações pesadas ou não críticas:
 * - 2 tentativas apenas
 * - Delay inicial: 200ms (mais lento)
 * - Delay máximo: 2s
 * - Backoff exponencial (2x)
 *
 * Use para:
 * - Queries pesadas
 * - Relatórios
 * - Operações não críticas
 * - Ambientes de desenvolvimento/teste
 *
 * @example
 * ```typescript
 * const result = await conservativeRetryPolicy.execute(async () => {
 *   return await heavyReport();
 * }, 'DtsTestEmp');
 * ```
 */
export const conservativeRetryPolicy = new RetryPolicy({
  maxAttempts: 2,
  initialDelayMs: 200,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  jitterMs: 50,
});

/**
 * Política sem retry (fail-fast)
 *
 * @description
 * Configuração que NÃO faz retry (fail-fast):
 * - 1 tentativa apenas
 * - Falha imediatamente em caso de erro
 *
 * Use para:
 * - Health checks
 * - Operações que não podem ser retentadas
 * - Testes unitários
 * - Debugging
 *
 * @example
 * ```typescript
 * const result = await noRetryPolicy.execute(async () => {
 *   return await healthCheck();
 * }, 'DtsPrdEmp');
 * ```
 */
export const noRetryPolicy = new RetryPolicy({
  maxAttempts: 1,
  initialDelayMs: 0,
  maxDelayMs: 0,
  backoffMultiplier: 1,
  jitterMs: 0,
});
