// src/shared/errors/RetryErrors.ts

import { AppError } from './AppError';

/**
 * Erro lançado quando todas as tentativas de retry são esgotadas
 *
 * @class MaxRetriesExceededError
 * @extends AppError
 *
 * @description
 * Indica que uma operação falhou após múltiplas tentativas de retry.
 * Encapsula o erro original para análise posterior.
 *
 * Status HTTP: 503 Service Unavailable
 * Operational: true (erro esperado, não é bug)
 *
 * @example
 * ```typescript
 * throw new MaxRetriesExceededError(
 *   'Failed after 3 attempts',
 *   originalError,
 *   { connectionId: 'DtsPrdEmp', attempts: 3 }
 * );
 * ```
 */
export class MaxRetriesExceededError extends AppError {
  /**
   * Erro original que causou a falha
   */
  public readonly originalError: Error;

  /**
   * Cria uma nova instância de MaxRetriesExceededError
   *
   * @param message - Mensagem de erro descritiva
   * @param originalError - Erro original que causou a falha
   * @param context - Contexto adicional (connectionId, attempts, etc)
   */
  constructor(message: string, originalError: Error, context?: Record<string, unknown>) {
    super(
      503,
      message,
      true, // isOperational
      {
        ...context,
        originalError: originalError.message,
        originalStack: originalError.stack,
      }
    );

    this.name = 'MaxRetriesExceededError';
    this.originalError = originalError;

    // Mantém stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MaxRetriesExceededError);
    }
  }
}

/**
 * Erro temporário que deve ser retentado
 *
 * @class RetryableError
 * @extends AppError
 *
 * @description
 * Indica que um erro é temporário e pode ser resolvido com retry.
 * Usado internamente pelo sistema de retry para identificar erros retryáveis.
 *
 * Status HTTP: 503 Service Unavailable
 * Operational: true (erro esperado, não é bug)
 *
 * @example
 * ```typescript
 * if (error.code === 'ETIMEDOUT') {
 *   throw new RetryableError('Connection timeout', { connectionId: 'DtsPrdEmp' });
 * }
 * ```
 */
export class RetryableError extends AppError {
  /**
   * Cria uma nova instância de RetryableError
   *
   * @param message - Mensagem de erro descritiva
   * @param context - Contexto adicional (connectionId, errorCode, etc)
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(503, message, true, context);
    this.name = 'RetryableError';

    // Mantém stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryableError);
    }
  }
}

/**
 * Erro não retryável que deve falhar imediatamente
 *
 * @class NonRetryableError
 * @extends AppError
 *
 * @description
 * Indica que um erro NÃO é temporário e retry seria inútil.
 * Exemplos: ValidationError, AuthenticationError, NotFoundError.
 *
 * Status HTTP: varia conforme contexto (400, 401, 404, etc)
 * Operational: true
 *
 * @example
 * ```typescript
 * if (error.message.includes('Invalid credentials')) {
 *   throw new NonRetryableError('Authentication failed', 401, { userId: '123' });
 * }
 * ```
 */
export class NonRetryableError extends AppError {
  /**
   * Cria uma nova instância de NonRetryableError
   *
   * @param message - Mensagem de erro descritiva
   * @param statusCode - Código HTTP apropriado (400, 401, 404, etc)
   * @param context - Contexto adicional
   */
  constructor(message: string, statusCode: number = 500, context?: Record<string, unknown>) {
    super(statusCode, message, true, context);
    this.name = 'NonRetryableError';

    // Mantém stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonRetryableError);
    }
  }
}
