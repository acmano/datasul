// src/shared/errors/CustomErrors.ts

import { AppError } from './AppError';

/**
 * Erro quando item não é encontrado
 */
export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    super(404, `Item ${itemCodigo} não encontrado`, true, { itemCodigo });
  }
}

/**
 * Erro quando estabelecimento não é encontrado
 */
export class EstabelecimentoNotFoundError extends AppError {
  constructor(estabCodigo: string) {
    super(404, `Estabelecimento ${estabCodigo} não encontrado`, true, { estabCodigo });
  }
}

/**
 * Erro de validação de dados
 */
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(400, message, true, { fields });
  }
}

/**
 * Erro de banco de dados
 */
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

/**
 * Erro de timeout de conexão
 */
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

/**
 * Erro de conexão com serviço externo
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(503, `Erro no serviço ${service}: ${message}`, true, { service });
  }
}

/**
 * Erro de cache
 */
export class CacheError extends AppError {
  constructor(operation: string, message: string) {
    super(500, `Erro no cache (${operation}): ${message}`, true, { operation });
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(401, message, true);
  }
}

/**
 * Erro de autorização
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(403, message, true);
  }
}

/**
 * Erro de rate limit
 */
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

/**
 * Erro de configuração
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(500, `Erro de configuração: ${message}`, false);
  }
}

/**
 * Erro de business rule
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, rule?: string) {
    super(422, message, true, { rule });
  }
}