// src/types/utils.ts

/**
 * Tipos Utilitários Globais
 *
 * @module types/utils
 * @version 1.0.0
 *
 * @description
 * Coleção de tipos TypeScript reutilizáveis para todo o projeto.
 * Fornece tipos para Result patterns, validação, paginação e utilitários avançados.
 *
 * @example
 * ```typescript
 * import { Result, Nullable, Paginated } from '@/types/utils';
 *
 * function fetchUser(id: string): Result<User> {
 *   // ...
 * }
 * ```
 */

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Representa o resultado bem-sucedido de uma operação
 *
 * @template T - Tipo dos dados retornados
 *
 * @example
 * ```typescript
 * const success: Success<User> = {
 *   success: true,
 *   data: { id: '1', name: 'John' }
 * };
 * ```
 */
export type Success<T> = {
  success: true;
  data: T;
};

/**
 * Representa o resultado falhado de uma operação
 *
 * @example
 * ```typescript
 * const failure: Failure = {
 *   success: false,
 *   error: 'User not found',
 *   code: 'USER_NOT_FOUND'
 * };
 * ```
 */
export type Failure = {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

/**
 * Tipo discriminado union para operações que podem falhar
 *
 * @template T - Tipo dos dados em caso de sucesso
 *
 * @example
 * ```typescript
 * function getUser(id: string): Result<User> {
 *   const user = db.find(id);
 *   if (!user) {
 *     return { success: false, error: 'Not found' };
 *   }
 *   return { success: true, data: user };
 * }
 *
 * const result = getUser('123');
 * if (result.success) {
 *   console.log(result.data.name); // ✅ Type-safe
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T> = Success<T> | Failure;

/**
 * Tipo para operações assíncronas que retornam Result
 *
 * @template T - Tipo dos dados em caso de sucesso
 *
 * @example
 * ```typescript
 * async function fetchUser(id: string): AsyncResult<User> {
 *   try {
 *     const user = await api.get(`/users/${id}`);
 *     return { success: true, data: user };
 *   } catch (error) {
 *     return { success: false, error: 'Failed to fetch' };
 *   }
 * }
 * ```
 */
export type AsyncResult<T> = Promise<Result<T>>;

// ============================================================================
// NULLABLE & OPTIONAL TYPES
// ============================================================================

/**
 * Tipo que pode ser nulo ou indefinido
 *
 * @template T - Tipo base
 *
 * @example
 * ```typescript
 * const userName: Nullable<string> = null;
 * const userAge: Nullable<number> = undefined;
 * ```
 */
export type Nullable<T> = T | null | undefined;

/**
 * Tipo que pode ser indefinido
 *
 * @template T - Tipo base
 *
 * @example
 * ```typescript
 * const config: Maybe<Config> = undefined;
 * ```
 */
export type Maybe<T> = T | undefined;

/**
 * Remove null e undefined de um tipo
 *
 * @template T - Tipo que pode conter null/undefined
 *
 * @example
 * ```typescript
 * type NullableString = string | null | undefined;
 * type CleanString = NonNullish<NullableString>; // string
 * ```
 */
export type NonNullish<T> = T extends null | undefined ? never : T;

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Parâmetros de paginação padrão
 *
 * @example
 * ```typescript
 * const params: PaginationParams = {
 *   page: 1,
 *   limit: 20,
 *   offset: 0
 * };
 * ```
 */
export interface PaginationParams {
  /** Número da página (1-indexed) */
  page?: number;
  /** Itens por página */
  limit?: number;
  /** Offset para skip (alternativa a page) */
  offset?: number;
}

/**
 * Metadados de paginação em resposta
 *
 * @example
 * ```typescript
 * const pagination: PaginationMeta = {
 *   total: 100,
 *   page: 1,
 *   limit: 20,
 *   totalPages: 5,
 *   hasNext: true,
 *   hasPrev: false
 * };
 * ```
 */
export interface PaginationMeta {
  /** Total de items disponíveis */
  total: number;
  /** Página atual */
  page: number;
  /** Items por página */
  limit: number;
  /** Total de páginas */
  totalPages: number;
  /** Se existe próxima página */
  hasNext: boolean;
  /** Se existe página anterior */
  hasPrev: boolean;
}

/**
 * Resposta paginada genérica
 *
 * @template T - Tipo dos items na lista
 *
 * @example
 * ```typescript
 * const response: Paginated<User> = {
 *   data: [user1, user2],
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
export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Resultado de validação de dados
 *
 * @template T - Tipo dos dados validados
 *
 * @example
 * ```typescript
 * function validateEmail(email: string): ValidationResult<string> {
 *   if (!email.includes('@')) {
 *     return { valid: false, error: 'Invalid email' };
 *   }
 *   return { valid: true, data: email.toLowerCase() };
 * }
 * ```
 */
export type ValidationResult<T = unknown> =
  | { valid: true; data: T }
  | { valid: false; error: string; field?: string };

/**
 * Erros de validação agrupados por campo
 *
 * @example
 * ```typescript
 * const errors: ValidationErrors = {
 *   email: ['Required field', 'Invalid format'],
 *   password: ['Must be at least 8 characters']
 * };
 * ```
 */
export type ValidationErrors = Record<string, string[]>;

// ============================================================================
// DEEP UTILITIES
// ============================================================================

/**
 * Torna todas as propriedades (incluindo aninhadas) opcionais
 *
 * @template T - Tipo base
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   address: {
 *     street: string;
 *     city: string;
 *   };
 * }
 *
 * type PartialUser = DeepPartial<User>;
 * // {
 * //   name?: string;
 * //   address?: {
 * //     street?: string;
 * //     city?: string;
 * //   };
 * // }
 * ```
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Torna todas as propriedades (incluindo aninhadas) readonly
 *
 * @template T - Tipo base
 *
 * @example
 * ```typescript
 * interface Config {
 *   database: {
 *     host: string;
 *     port: number;
 *   };
 * }
 *
 * type ImmutableConfig = DeepReadonly<Config>;
 * // config.database.host = 'new'; // ❌ Error
 * ```
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * Torna todas as propriedades (incluindo aninhadas) obrigatórias
 *
 * @template T - Tipo base
 *
 * @example
 * ```typescript
 * interface PartialUser {
 *   name?: string;
 *   email?: string;
 * }
 *
 * type CompleteUser = DeepRequired<PartialUser>;
 * // { name: string; email: string; }
 * ```
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Array não-vazio (pelo menos 1 elemento)
 *
 * @template T - Tipo dos elementos
 *
 * @example
 * ```typescript
 * const tags: NonEmptyArray<string> = ['typescript']; // ✅
 * const empty: NonEmptyArray<string> = []; // ❌ Type error
 *
 * function getFirst<T>(arr: NonEmptyArray<T>): T {
 *   return arr[0]; // Sempre seguro
 * }
 * ```
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Extrai todos os valores possíveis de um objeto
 *
 * @template T - Tipo objeto
 *
 * @example
 * ```typescript
 * const Status = {
 *   PENDING: 'pending',
 *   APPROVED: 'approved',
 *   REJECTED: 'rejected'
 * } as const;
 *
 * type StatusValue = ValueOf<typeof Status>;
 * // 'pending' | 'approved' | 'rejected'
 * ```
 */
export type ValueOf<T> = T[keyof T];

/**
 * Extrai chaves de um objeto cujos valores são de tipo específico
 *
 * @template T - Tipo objeto
 * @template V - Tipo do valor a filtrar
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * type StringKeys = KeysOfType<User, string>;
 * // 'name' | 'email'
 * ```
 */
export type KeysOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

/**
 * Extrai um subset do objeto com apenas certas chaves
 *
 * @template T - Tipo objeto
 * @template K - Chaves a incluir
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   password: string;
 * }
 *
 * type PublicUser = PickByKeys<User, 'id' | 'name' | 'email'>;
 * // { id: number; name: string; email: string; }
 * ```
 */
export type PickByKeys<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Remove certas chaves de um objeto
 *
 * @template T - Tipo objeto
 * @template K - Chaves a remover
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   password: string;
 * }
 *
 * type SafeUser = OmitByKeys<User, 'password'>;
 * // { id: number; name: string; }
 * ```
 */
export type OmitByKeys<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// ============================================================================
// JSON TYPES
// ============================================================================

/**
 * Tipos primitivos válidos em JSON
 */
export type JSONPrimitive = string | number | boolean | null;

/**
 * Valor JSON válido (recursivo)
 *
 * @example
 * ```typescript
 * const config: JSONValue = {
 *   host: 'localhost',
 *   port: 3000,
 *   features: ['cache', 'metrics'],
 *   enabled: true,
 *   metadata: null
 * };
 * ```
 */
export type JSONValue =
  | JSONPrimitive
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * Objeto JSON (não pode ser primitivo ou array no root)
 *
 * @example
 * ```typescript
 * const config: JSONObject = {
 *   database: {
 *     host: 'localhost',
 *     port: 5432
 *   }
 * };
 * ```
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * Array JSON
 *
 * @example
 * ```typescript
 * const items: JSONArray = [1, 'test', { id: 1 }, null];
 * ```
 */
export type JSONArray = JSONValue[];

/**
 * Converte um tipo TypeScript para sua representação JSON-safe
 *
 * @template T - Tipo a converter
 *
 * @description
 * Remove tipos não-serializáveis (functions, undefined, symbols, etc)
 * e converte Date para string.
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   createdAt: Date;
 *   login: () => void;
 * }
 *
 * type JSONUser = Jsonify<User>;
 * // { name: string; createdAt: string; }
 * ```
 */
export type Jsonify<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T as T[K] extends Function ? never : K]: Jsonify<T[K]> }
      : T;

// ============================================================================
// BRANDED TYPES
// ============================================================================

/**
 * Marca nominal para criar tipos distintos em tempo de compilação
 *
 * @template T - Tipo base
 * @template Brand - String literal única para o brand
 *
 * @description
 * Permite criar tipos nominais em TypeScript estrutural.
 * Útil para IDs, emails validados, etc.
 *
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>;
 * type OrderId = Brand<string, 'OrderId'>;
 *
 * function getUser(id: UserId): User { ... }
 * function getOrder(id: OrderId): Order { ... }
 *
 * const userId = '123' as UserId;
 * const orderId = '456' as OrderId;
 *
 * getUser(userId); // ✅
 * getUser(orderId); // ❌ Type error
 * ```
 */
export type Brand<T, Brand extends string> = T & { __brand: Brand };

// ============================================================================
// FUNCTION TYPES
// ============================================================================

/**
 * Função que pode lançar erro ou retornar valor
 *
 * @template T - Tipo de retorno
 * @template Args - Tipos dos argumentos
 *
 * @example
 * ```typescript
 * const divide: Fallible<number, [number, number]> = (a, b) => {
 *   if (b === 0) throw new Error('Division by zero');
 *   return a / b;
 * };
 * ```
 */
export type Fallible<T, Args extends unknown[] = []> = (...args: Args) => T;

/**
 * Função assíncrona
 *
 * @template T - Tipo de retorno
 * @template Args - Tipos dos argumentos
 *
 * @example
 * ```typescript
 * const fetchUser: AsyncFn<User, [string]> = async (id) => {
 *   return await api.get(`/users/${id}`);
 * };
 * ```
 */
export type AsyncFn<T, Args extends unknown[] = []> = (
  ...args: Args
) => Promise<T>;

/**
 * Função sem retorno (void)
 *
 * @template Args - Tipos dos argumentos
 *
 * @example
 * ```typescript
 * const logger: VoidFn<[string]> = (message) => {
 *   console.log(message);
 * };
 * ```
 */
export type VoidFn<Args extends unknown[] = []> = (...args: Args) => void;

// ============================================================================
// UTILITY FUNCTIONS TYPE GUARDS
// ============================================================================

/**
 * Type guard para verificar se um valor é Success
 *
 * @template T - Tipo dos dados
 * @param result - Result a verificar
 * @returns true se for Success
 *
 * @example
 * ```typescript
 * const result = getUser('123');
 * if (isSuccess(result)) {
 *   console.log(result.data.name); // ✅ Type-safe
 * }
 * ```
 */
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.success === true;
}

/**
 * Type guard para verificar se um valor é Failure
 *
 * @param result - Result a verificar
 * @returns true se for Failure
 *
 * @example
 * ```typescript
 * const result = getUser('123');
 * if (isFailure(result)) {
 *   console.error(result.error); // ✅ Type-safe
 * }
 * ```
 */
export function isFailure<T>(result: Result<T>): result is Failure {
  return result.success === false;
}

/**
 * Type guard para verificar se valor não é null/undefined
 *
 * @template T - Tipo do valor
 * @param value - Valor a verificar
 * @returns true se não for null/undefined
 *
 * @example
 * ```typescript
 * const values: Array<string | null> = ['a', null, 'b'];
 * const clean = values.filter(isNotNullish); // string[]
 * ```
 */
export function isNotNullish<T>(value: T): value is NonNullish<T> {
  return value !== null && value !== undefined;
}

/**
 * Type guard para verificar se um array não está vazio
 *
 * @template T - Tipo dos elementos
 * @param arr - Array a verificar
 * @returns true se array tem pelo menos 1 elemento
 *
 * @example
 * ```typescript
 * const tags: string[] = getTags();
 * if (isNonEmptyArray(tags)) {
 *   const first = tags[0]; // ✅ Seguro, não pode ser undefined
 * }
 * ```
 */
export function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}
