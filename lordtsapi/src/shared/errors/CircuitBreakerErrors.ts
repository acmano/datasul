// src/shared/errors/CircuitBreakerErrors.ts

import { AppError } from './AppError';

/**
 * Erro lançado quando circuit breaker está OPEN (rejeitando requests)
 *
 * @class CircuitBreakerOpenError
 * @extends AppError
 *
 * @description
 * Indica que o circuit breaker detectou muitas falhas e está
 * no estado OPEN, rejeitando requests automaticamente para
 * prevenir sobrecarga do serviço com falha.
 *
 * HTTP Status: 503 Service Unavailable
 *
 * @example
 * ```typescript
 * throw new CircuitBreakerOpenError(
 *   'Circuit breaker is OPEN for connection PCF4_PRD',
 *   {
 *     connectionId: 'PCF4_PRD',
 *     state: 'OPEN',
 *     tripTime: new Date('2025-10-25T10:00:00Z'),
 *     nextAttemptIn: 45000
 *   }
 * );
 * ```
 */
export class CircuitBreakerOpenError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(503, message, true, context);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Erro genérico relacionado ao circuit breaker
 *
 * @class CircuitBreakerError
 * @extends AppError
 *
 * @description
 * Erro genérico para problemas com circuit breaker que não
 * se encaixam em outras categorias específicas.
 *
 * HTTP Status: 500 Internal Server Error
 *
 * @example
 * ```typescript
 * throw new CircuitBreakerError(
 *   'Failed to initialize circuit breaker',
 *   { connectionId: 'PCF4_PRD', reason: 'Invalid configuration' }
 * );
 * ```
 */
export class CircuitBreakerError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(500, message, true, context);
    this.name = 'CircuitBreakerError';
  }
}
