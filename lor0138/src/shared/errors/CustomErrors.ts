// src/shared/errors/CustomErrors.ts

import { AppError } from './AppError';

/**
 * Erros customizados da aplicação
 * @module CustomErrors
 * @category Errors
 */

// ============================================================================
// NOT FOUND (404)
// ============================================================================

export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    super(404, `Item ${itemCodigo} não encontrado`, true, { itemCodigo });
  }
}

export class FamiliaNotFoundError extends AppError {
  constructor(familiaCodigo: string) {
    super(404, `Familia ${familiaCodigo} não encontrada`, true, { familiaCodigo });
  }
}

export class EstabelecimentoNotFoundError extends AppError {
  constructor(estabCodigo: string) {
    super(404, `Estabelecimento ${estabCodigo} não encontrado`, true, { estabCodigo });
  }
}

// ============================================================================
// VALIDATION (400)
// ============================================================================

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(400, message, true, { fields });
  }
}

// ============================================================================
// DATABASE (500)
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(500, `Erro no banco de dados: ${message}`, true, {
      originalMessage: originalError?.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: originalError?.stack
      }),
    });
  }
}

// ============================================================================
// TIMEOUT / SERVICE UNAVAILABLE (503)
// ============================================================================

export class ConnectionTimeoutError extends AppError {
  constructor(service: string, timeout: number) {
    super(
      503,
      `Timeout ao conectar com ${service} após ${timeout}ms`,
      true,
      { service, timeout }
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(503, `Erro no serviço ${service}: ${message}`, true, { service });
  }
}

// ============================================================================
// CACHE (500)
// ============================================================================

export class CacheError extends AppError {
  constructor(operation: string, message: string) {
    super(500, `Erro no cache (${operation}): ${message}`, true, { operation });
  }
}

// ============================================================================
// AUTHENTICATION / AUTHORIZATION (401, 403)
// ============================================================================

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(401, message, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(403, message, true);
  }
}

// ============================================================================
// RATE LIMIT (429)
// ============================================================================

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      429,
      'Muitas requisições. Tente novamente em alguns segundos.',
      true,
      { retryAfter }
    );
  }
}

// ============================================================================
// CONFIGURATION (500)
// ============================================================================

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(500, `Erro de configuração: ${message}`, false); // isOperational: false!
  }
}

// ============================================================================
// BUSINESS RULE (422)
// ============================================================================

export class BusinessRuleError extends AppError {
  constructor(message: string, rule?: string) {
    super(422, message, true, { rule });
  }
}