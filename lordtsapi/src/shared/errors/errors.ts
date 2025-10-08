// src/shared/errors/errors.ts

/**
 * Sistema de erros customizados - Ponto de entrada centralizado
 *
 * @module shared/errors
 * @see errors.md para documentação completa
 *
 * Exports:
 * - AppError: Classe base para erros customizados
 * - CustomErrors: Erros específicos por contexto (404, 400, 500, etc)
 * - Types: ErrorDetails, ErrorResponse
 *
 * @example
 * import { ItemNotFoundError, ValidationError } from '@shared/errors';
 *
 * throw new ItemNotFoundError('7530110');
 * throw new ValidationError('Dados inválidos', { campo: 'mensagem' });
 */

// Classe base
export { AppError } from './AppError';

// Erros customizados por contexto
export {
  // 404 - Not Found
  ItemNotFoundError,
  FamiliaNotFoundError,
  EstabelecimentoNotFoundError,

  // 400 - Bad Request
  ValidationError,

  // 401 - Unauthorized
  AuthenticationError,

  // 403 - Forbidden
  AuthorizationError,

  // 422 - Unprocessable Entity
  BusinessRuleError,

  // 429 - Too Many Requests
  RateLimitError,

  // 500 - Internal Server Error
  DatabaseError,
  CacheError,
  ConfigurationError,

  // 503 - Service Unavailable
  ConnectionTimeoutError,
  ExternalServiceError,
} from './CustomErrors';

// Types
export type ErrorDetails = Record<string, any>;

export type ErrorResponse = {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  correlationId: string;
  details?: ErrorDetails;
};