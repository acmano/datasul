// @ts-nocheck
// src/shared/errors/index.ts

// Classe base
export { AppError } from './AppError';

// Erros específicos
export {
  ItemNotFoundError,
  EstabelecimentoNotFoundError,
  ValidationError,
  DatabaseError,
  ConnectionTimeoutError,
  ExternalServiceError,
  CacheError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ConfigurationError,
  BusinessRuleError,
} from './CustomErrors';

// Helper types
export type ErrorDetails = Record<string, any>;

export type ErrorResponse = {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  correlationId: string;
  details?: ErrorDetails;
};