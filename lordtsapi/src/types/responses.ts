// src/types/responses.ts

/**
 * Discriminated Unions para API Responses
 *
 * @module types/responses
 * @version 1.0.0
 *
 * @description
 * Define tipos discriminados para respostas de API consistentes e type-safe.
 * Usa discriminated unions para permitir narrowing automático do TypeScript.
 *
 * @example
 * ```typescript
 * import { ApiResponse, SuccessResponse, ErrorResponse } from '@/types/responses';
 *
 * function handleResponse(response: ApiResponse<User>) {
 *   if (response.success) {
 *     console.log(response.data.name); // ✅ Type-safe
 *   } else {
 *     console.error(response.error); // ✅ Type-safe
 *   }
 * }
 * ```
 */

import { CorrelationId, ItemId, FamiliaId } from './ids';
import { PaginationMeta } from './utils';

// ============================================================================
// BASE RESPONSE TYPES
// ============================================================================

/**
 * Resposta de sucesso da API
 *
 * @template T - Tipo dos dados retornados
 *
 * @example
 * ```typescript
 * const response: SuccessResponse<User> = {
 *   success: true,
 *   data: { id: '1', name: 'John' },
 *   correlationId: 'abc-123',
 *   timestamp: new Date()
 * };
 * ```
 */
export interface SuccessResponse<T> {
  /** Discriminator - sempre true para sucesso */
  success: true;

  /** Dados retornados */
  data: T;

  /** ID de correlação para tracing */
  correlationId?: string;

  /** Timestamp da resposta */
  timestamp?: Date;

  /** Metadados adicionais (ex: cache hit) */
  meta?: ResponseMeta;
}

/**
 * Resposta de erro da API
 *
 * @example
 * ```typescript
 * const response: ErrorResponse = {
 *   success: false,
 *   error: 'Item not found',
 *   code: 'ITEM_NOT_FOUND',
 *   statusCode: 404,
 *   correlationId: 'abc-123'
 * };
 * ```
 */
export interface ErrorResponse {
  /** Discriminator - sempre false para erro */
  success: false;

  /** Mensagem de erro legível */
  error: string;

  /** Código de erro (para i18n e debugging) */
  code?: string;

  /** HTTP status code */
  statusCode?: number;

  /** Detalhes adicionais do erro */
  details?: ErrorDetails;

  /** ID de correlação para tracing */
  correlationId?: string;

  /** Timestamp do erro */
  timestamp?: Date;
}

/**
 * Union discriminado de respostas da API
 *
 * @template T - Tipo dos dados em caso de sucesso
 *
 * @example
 * ```typescript
 * async function getUser(id: string): Promise<ApiResponse<User>> {
 *   try {
 *     const user = await db.findOne({ id });
 *     if (!user) {
 *       return {
 *         success: false,
 *         error: 'User not found',
 *         code: 'USER_NOT_FOUND',
 *         statusCode: 404
 *       };
 *     }
 *     return { success: true, data: user };
 *   } catch (error) {
 *     return {
 *       success: false,
 *       error: 'Database error',
 *       code: 'DB_ERROR',
 *       statusCode: 500
 *     };
 *   }
 * }
 * ```
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// RESPONSE METADATA
// ============================================================================

/**
 * Metadados da resposta
 *
 * @example
 * ```typescript
 * const meta: ResponseMeta = {
 *   cached: true,
 *   cacheHit: true,
 *   cacheTTL: 300,
 *   executionTime: 45
 * };
 * ```
 */
export interface ResponseMeta {
  /** Se a resposta veio do cache */
  cached?: boolean;

  /** Se houve hit no cache */
  cacheHit?: boolean;

  /** TTL do cache em segundos */
  cacheTTL?: number;

  /** Tempo de execução em ms */
  executionTime?: number;

  /** Fonte dos dados */
  source?: 'database' | 'cache' | 'mock';

  /** Versão da API */
  apiVersion?: string;
}

/**
 * Detalhes de erro
 *
 * @example
 * ```typescript
 * const details: ErrorDetails = {
 *   field: 'email',
 *   value: 'invalid-email',
 *   constraint: 'Email must be valid',
 *   stackTrace: error.stack
 * };
 * ```
 */
export interface ErrorDetails {
  /** Campo que causou o erro */
  field?: string;

  /** Valor que causou o erro */
  value?: unknown;

  /** Constraint violada */
  constraint?: string;

  /** Stack trace (apenas em dev) */
  stackTrace?: string;

  /** Erros aninhados */
  inner?: ErrorDetails[];

  /** Contexto adicional */
  context?: Record<string, unknown>;
}

// ============================================================================
// PAGINATED RESPONSES
// ============================================================================

/**
 * Resposta paginada de sucesso
 *
 * @template T - Tipo dos itens da lista
 *
 * @example
 * ```typescript
 * const response: PaginatedSuccessResponse<User> = {
 *   success: true,
 *   data: [user1, user2, user3],
 *   pagination: {
 *     total: 100,
 *     page: 1,
 *     limit: 20,
 *     totalPages: 5,
 *     hasNext: true,
 *     hasPrev: false
 *   }
 * };
 * ```
 */
export interface PaginatedSuccessResponse<T> {
  /** Discriminator */
  success: true;

  /** Lista de items */
  data: T[];

  /** Metadados de paginação */
  pagination: PaginationMeta;

  /** ID de correlação */
  correlationId?: string;

  /** Timestamp */
  timestamp?: Date;

  /** Metadados adicionais */
  meta?: ResponseMeta;
}

/**
 * Resposta paginada (success ou error)
 *
 * @template T - Tipo dos itens
 *
 * @example
 * ```typescript
 * function listUsers(page: number): Promise<PaginatedResponse<User>> {
 *   // ...
 * }
 * ```
 */
export type PaginatedResponse<T> = PaginatedSuccessResponse<T> | ErrorResponse;

// ============================================================================
// SPECIFIC DOMAIN RESPONSES
// ============================================================================

/**
 * Resposta de item individual
 *
 * @template T - Tipo do item
 */
export type ItemResponse<T> = ApiResponse<T>;

/**
 * Resposta de lista de items
 *
 * @template T - Tipo dos items
 */
export type ListResponse<T> = ApiResponse<T[]>;

/**
 * Resposta de criação (retorna ID e dados criados)
 *
 * @template T - Tipo do recurso criado
 *
 * @example
 * ```typescript
 * const response: CreateResponse<User, UserId> = {
 *   success: true,
 *   data: {
 *     id: toUserId('user-123'),
 *     resource: { name: 'John', email: 'john@example.com' }
 *   }
 * };
 * ```
 */
export type CreateResponse<T, IdType = string> = ApiResponse<{
  id: IdType;
  resource: T;
}>;

/**
 * Resposta de atualização
 *
 * @template T - Tipo do recurso atualizado
 */
export type UpdateResponse<T> = ApiResponse<T>;

/**
 * Resposta de deleção
 *
 * @example
 * ```typescript
 * const response: DeleteResponse = {
 *   success: true,
 *   data: { deleted: true, id: 'item-123' }
 * };
 * ```
 */
export type DeleteResponse = ApiResponse<{
  deleted: boolean;
  id?: string;
}>;

/**
 * Resposta de health check
 *
 * @example
 * ```typescript
 * const response: HealthCheckResponse = {
 *   success: true,
 *   data: {
 *     status: 'healthy',
 *     timestamp: new Date(),
 *     services: {
 *       database: { connected: true, responseTime: 25 },
 *       cache: { connected: true, responseTime: 5 }
 *     }
 *   }
 * };
 * ```
 */
export type HealthCheckResponse = ApiResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services?: Record<
    string,
    {
      connected: boolean;
      responseTime?: number;
      error?: string;
    }
  >;
}>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cria uma resposta de sucesso
 *
 * @template T - Tipo dos dados
 * @param data - Dados a retornar
 * @param options - Opções adicionais
 * @returns SuccessResponse
 *
 * @example
 * ```typescript
 * const response = success({ id: '1', name: 'John' }, {
 *   correlationId: 'abc-123',
 *   meta: { cached: true }
 * });
 * ```
 */
export function success<T>(
  data: T,
  options?: {
    correlationId?: string | CorrelationId;
    timestamp?: Date;
    meta?: ResponseMeta;
  }
): SuccessResponse<T> {
  return {
    success: true,
    data,
    correlationId: options?.correlationId?.toString(),
    timestamp: options?.timestamp || new Date(),
    meta: options?.meta,
  };
}

/**
 * Cria uma resposta de erro
 *
 * @param error - Mensagem de erro
 * @param options - Opções adicionais
 * @returns ErrorResponse
 *
 * @example
 * ```typescript
 * const response = error('User not found', {
 *   code: 'USER_NOT_FOUND',
 *   statusCode: 404,
 *   correlationId: 'abc-123'
 * });
 * ```
 */
export function error(
  error: string,
  options?: {
    code?: string;
    statusCode?: number;
    details?: ErrorDetails;
    correlationId?: string | CorrelationId;
    timestamp?: Date;
  }
): ErrorResponse {
  return {
    success: false,
    error,
    code: options?.code,
    statusCode: options?.statusCode,
    details: options?.details,
    correlationId: options?.correlationId?.toString(),
    timestamp: options?.timestamp || new Date(),
  };
}

/**
 * Cria uma resposta paginada de sucesso
 *
 * @template T - Tipo dos items
 * @param data - Array de items
 * @param pagination - Metadados de paginação
 * @param options - Opções adicionais
 * @returns PaginatedSuccessResponse
 *
 * @example
 * ```typescript
 * const response = paginated(users, {
 *   total: 100,
 *   page: 1,
 *   limit: 20,
 *   totalPages: 5,
 *   hasNext: true,
 *   hasPrev: false
 * });
 * ```
 */
export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  options?: {
    correlationId?: string | CorrelationId;
    timestamp?: Date;
    meta?: ResponseMeta;
  }
): PaginatedSuccessResponse<T> {
  return {
    success: true,
    data,
    pagination,
    correlationId: options?.correlationId?.toString(),
    timestamp: options?.timestamp || new Date(),
    meta: options?.meta,
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard para verificar se resposta é de sucesso
 *
 * @template T - Tipo dos dados
 * @param response - Resposta a verificar
 * @returns true se for SuccessResponse
 *
 * @example
 * ```typescript
 * const response = await getUser('123');
 * if (isSuccess(response)) {
 *   console.log(response.data.name); // ✅ Type-safe
 * }
 * ```
 */
export function isSuccess<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard para verificar se resposta é de erro
 *
 * @template T - Tipo dos dados
 * @param response - Resposta a verificar
 * @returns true se for ErrorResponse
 *
 * @example
 * ```typescript
 * const response = await getUser('123');
 * if (isError(response)) {
 *   console.error(response.error, response.code); // ✅ Type-safe
 * }
 * ```
 */
export function isError<T>(response: ApiResponse<T>): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard para verificar se resposta paginada é de sucesso
 *
 * @template T - Tipo dos items
 * @param response - Resposta a verificar
 * @returns true se for PaginatedSuccessResponse
 */
export function isPaginatedSuccess<T>(
  response: PaginatedResponse<T>
): response is PaginatedSuccessResponse<T> {
  return response.success === true;
}

// ============================================================================
// COMMON ERROR CODES
// ============================================================================

/**
 * Códigos de erro comuns da API
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * return error('Item not found', {
 *   code: ErrorCode.NOT_FOUND,
 *   statusCode: 404
 * });
 * ```
 */
export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFLICT = 'CONFLICT',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Domain-specific
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  FAMILIA_NOT_FOUND = 'FAMILIA_NOT_FOUND',
  ESTABELECIMENTO_NOT_FOUND = 'ESTABELECIMENTO_NOT_FOUND',
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_API_KEY = 'EXPIRED_API_KEY',
}

/**
 * Mapeamento de códigos de erro para status HTTP
 *
 * @example
 * ```typescript
 * const statusCode = HTTP_STATUS_MAP[ErrorCode.NOT_FOUND]; // 404
 * ```
 */
export const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.CONFLICT]: 409,

  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,

  [ErrorCode.ITEM_NOT_FOUND]: 404,
  [ErrorCode.FAMILIA_NOT_FOUND]: 404,
  [ErrorCode.ESTABELECIMENTO_NOT_FOUND]: 404,
  [ErrorCode.INVALID_API_KEY]: 401,
  [ErrorCode.EXPIRED_API_KEY]: 401,
};
