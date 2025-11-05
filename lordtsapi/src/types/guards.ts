// src/types/guards.ts

/**
 * Type Guards para Validações Runtime
 *
 * @module types/guards
 * @version 1.0.0
 *
 * @description
 * Funções type guard para validações runtime type-safe.
 * Complementa os guards já disponíveis em utils.ts, ids.ts e responses.ts.
 *
 * Guards existentes em outros módulos:
 * - utils.ts: isSuccess, isFailure, isNotNullish, isNonEmptyArray
 * - ids.ts: isItemId, isFamiliaId, isGrupoDeEstoqueId, isEstabelecimentoId
 * - responses.ts: isSuccess (response), isError, isPaginatedSuccess
 *
 * @example
 * ```typescript
 * import { isString, isNumber, isObject } from '@/types/guards';
 *
 * if (isString(value)) {
 *   console.log(value.toUpperCase()); // ✅ Type-safe
 * }
 * ```
 */

// ============================================================================
// PRIMITIVE TYPE GUARDS
// ============================================================================

/**
 * Verifica se valor é string
 *
 * @param value - Valor a verificar
 * @returns true se for string
 *
 * @example
 * ```typescript
 * if (isString(value)) {
 *   const upper = value.toUpperCase(); // ✅ Type-safe
 * }
 * ```
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Verifica se valor é number
 *
 * @param value - Valor a verificar
 * @returns true se for number (incluindo NaN e Infinity)
 *
 * @example
 * ```typescript
 * if (isNumber(value)) {
 *   const doubled = value * 2; // ✅ Type-safe
 * }
 * ```
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Verifica se valor é number finito (exclui NaN e Infinity)
 *
 * @param value - Valor a verificar
 * @returns true se for number finito
 *
 * @example
 * ```typescript
 * isFiniteNumber(42); // true
 * isFiniteNumber(NaN); // false
 * isFiniteNumber(Infinity); // false
 * ```
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Verifica se valor é boolean
 *
 * @param value - Valor a verificar
 * @returns true se for boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Verifica se valor é null
 *
 * @param value - Valor a verificar
 * @returns true se for null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Verifica se valor é undefined
 *
 * @param value - Valor a verificar
 * @returns true se for undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Verifica se valor é null ou undefined
 *
 * @param value - Valor a verificar
 * @returns true se for null ou undefined
 *
 * @example
 * ```typescript
 * if (isNullish(value)) {
 *   return defaultValue;
 * }
 * ```
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

// ============================================================================
// OBJECT TYPE GUARDS
// ============================================================================

/**
 * Verifica se valor é object (exclui null)
 *
 * @param value - Valor a verificar
 * @returns true se for object (não-null)
 *
 * @example
 * ```typescript
 * if (isObject(value)) {
 *   const keys = Object.keys(value); // ✅ Type-safe
 * }
 * ```
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifica se valor é plain object (criado com {} ou new Object())
 *
 * @param value - Valor a verificar
 * @returns true se for plain object
 *
 * @example
 * ```typescript
 * isPlainObject({}); // true
 * isPlainObject({ a: 1 }); // true
 * isPlainObject(new Date()); // false
 * isPlainObject([]); // false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Verifica se valor é array
 *
 * @template T - Tipo dos elementos
 * @param value - Valor a verificar
 * @returns true se for array
 *
 * @example
 * ```typescript
 * if (isArray(value)) {
 *   const length = value.length; // ✅ Type-safe
 * }
 * ```
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Verifica se valor é array de strings
 *
 * @param value - Valor a verificar
 * @returns true se for array de strings
 *
 * @example
 * ```typescript
 * if (isStringArray(value)) {
 *   const uppers = value.map(s => s.toUpperCase()); // ✅ Type-safe
 * }
 * ```
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Verifica se valor é array de numbers
 *
 * @param value - Valor a verificar
 * @returns true se for array de numbers
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
}

/**
 * Verifica se valor é Date
 *
 * @param value - Valor a verificar
 * @returns true se for Date válido
 *
 * @example
 * ```typescript
 * if (isDate(value)) {
 *   const year = value.getFullYear(); // ✅ Type-safe
 * }
 * ```
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Verifica se valor é Error
 *
 * @param value - Valor a verificar
 * @returns true se for Error
 *
 * @example
 * ```typescript
 * if (isError(value)) {
 *   console.error(value.message, value.stack); // ✅ Type-safe
 * }
 * ```
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Verifica se valor é Promise
 *
 * @template T - Tipo do valor resolvido
 * @param value - Valor a verificar
 * @returns true se for Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObject(value) &&
      typeof (value as { then?: unknown }).then === 'function')
  );
}

/**
 * Verifica se valor é Function
 *
 * @param value - Valor a verificar
 * @returns true se for function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

// ============================================================================
// STRING VALIDATION GUARDS
// ============================================================================

/**
 * Verifica se string não está vazia
 *
 * @param value - Valor a verificar
 * @returns true se for string não-vazia
 *
 * @example
 * ```typescript
 * if (isNonEmptyString(value)) {
 *   const first = value[0]; // ✅ Guaranteed to exist
 * }
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se string é email válido (validação básica)
 *
 * @param value - Valor a verificar
 * @returns true se parecer um email
 *
 * @example
 * ```typescript
 * if (isEmail(value)) {
 *   sendEmail(value); // ✅ Type-safe
 * }
 * ```
 */
export function isEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Verifica se string é UUID v4
 *
 * @param value - Valor a verificar
 * @returns true se for UUID v4 válido
 *
 * @example
 * ```typescript
 * if (isUUID(value)) {
 *   const correlationId = toCorrelationId(value); // ✅ Safe
 * }
 * ```
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Verifica se string contém apenas dígitos
 *
 * @param value - Valor a verificar
 * @returns true se contiver apenas dígitos
 *
 * @example
 * ```typescript
 * if (isNumericString(value)) {
 *   const num = parseInt(value); // ✅ Safe
 * }
 * ```
 */
export function isNumericString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d+$/.test(value);
}

/**
 * Verifica se string é ISO date válida
 *
 * @param value - Valor a verificar
 * @returns true se for ISO date
 *
 * @example
 * ```typescript
 * if (isISODate(value)) {
 *   const date = new Date(value); // ✅ Valid
 * }
 * ```
 */
export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!isoRegex.test(value)) return false;

  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ============================================================================
// NUMBER VALIDATION GUARDS
// ============================================================================

/**
 * Verifica se number é inteiro
 *
 * @param value - Valor a verificar
 * @returns true se for inteiro
 *
 * @example
 * ```typescript
 * if (isInteger(value)) {
 *   const doubled = value * 2; // ✅ Integer math
 * }
 * ```
 */
export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/**
 * Verifica se number é positivo (> 0)
 *
 * @param value - Valor a verificar
 * @returns true se for positivo
 */
export function isPositive(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

/**
 * Verifica se number é não-negativo (>= 0)
 *
 * @param value - Valor a verificar
 * @returns true se for não-negativo
 */
export function isNonNegative(value: unknown): value is number {
  return typeof value === 'number' && value >= 0;
}

/**
 * Verifica se number está em range
 *
 * @param value - Valor a verificar
 * @param min - Mínimo (inclusive)
 * @param max - Máximo (inclusive)
 * @returns true se estiver no range
 *
 * @example
 * ```typescript
 * if (isInRange(age, 18, 65)) {
 *   // Age between 18-65
 * }
 * ```
 */
export function isInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return typeof value === 'number' && value >= min && value <= max;
}

// ============================================================================
// OBJECT STRUCTURE GUARDS
// ============================================================================

/**
 * Verifica se objeto tem propriedade específica
 *
 * @template K - Nome da propriedade
 * @param obj - Objeto a verificar
 * @param key - Nome da propriedade
 * @returns true se objeto tem a propriedade
 *
 * @example
 * ```typescript
 * if (hasProperty(obj, 'name')) {
 *   console.log(obj.name); // ✅ Type-safe
 * }
 * ```
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Verifica se objeto tem todas as propriedades especificadas
 *
 * @template K - Nomes das propriedades
 * @param obj - Objeto a verificar
 * @param keys - Array de nomes de propriedades
 * @returns true se objeto tem todas as propriedades
 *
 * @example
 * ```typescript
 * if (hasProperties(obj, ['id', 'name', 'email'])) {
 *   // obj has id, name, and email
 * }
 * ```
 */
export function hasProperties<K extends string>(
  obj: unknown,
  keys: readonly K[]
): obj is Record<K, unknown> {
  if (!isObject(obj)) return false;
  return keys.every((key) => key in obj);
}

/**
 * Verifica se objeto tem estrutura de erro
 *
 * @param value - Valor a verificar
 * @returns true se parecer um erro
 *
 * @example
 * ```typescript
 * if (isErrorLike(value)) {
 *   console.error(value.message);
 * }
 * ```
 */
export function isErrorLike(
  value: unknown
): value is { message: string; name?: string; stack?: string } {
  return (
    isObject(value) &&
    hasProperty(value, 'message') &&
    typeof value.message === 'string'
  );
}

// ============================================================================
// COMPOSITE GUARDS
// ============================================================================

/**
 * Cria guard que verifica se valor é um dos tipos
 *
 * @template T - Union type
 * @param guards - Array de type guards
 * @returns Guard que verifica se algum guard passa
 *
 * @example
 * ```typescript
 * const isStringOrNumber = oneOf(isString, isNumber);
 *
 * if (isStringOrNumber(value)) {
 *   // value is string | number
 * }
 * ```
 */
export function oneOf<T>(...guards: Array<(value: unknown) => value is T>) {
  return (value: unknown): value is T => {
    return guards.some((guard) => guard(value));
  };
}

/**
 * Cria guard que verifica array de tipo específico
 *
 * @template T - Tipo dos elementos
 * @param guard - Type guard para elementos
 * @returns Guard que verifica array
 *
 * @example
 * ```typescript
 * const isUserArray = arrayOf(isUser);
 *
 * if (isUserArray(value)) {
 *   value.forEach(user => console.log(user.name)); // ✅ Type-safe
 * }
 * ```
 */
export function arrayOf<T>(guard: (value: unknown) => value is T) {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(guard);
  };
}

/**
 * Verifica se valor é Record com valores de tipo específico
 *
 * @template T - Tipo dos valores
 * @param guard - Type guard para valores
 * @returns Guard que verifica Record
 *
 * @example
 * ```typescript
 * const isStringRecord = recordOf(isString);
 *
 * if (isStringRecord(value)) {
 *   Object.values(value).forEach(str => console.log(str.toUpperCase()));
 * }
 * ```
 */
export function recordOf<T>(guard: (value: unknown) => value is T) {
  return (value: unknown): value is Record<string, T> => {
    return isObject(value) && Object.values(value).every(guard);
  };
}

// ============================================================================
// JSON GUARDS
// ============================================================================

/**
 * Verifica se valor é JSON primitivo
 *
 * @param value - Valor a verificar
 * @returns true se for primitivo JSON válido
 */
export function isJSONPrimitive(
  value: unknown
): value is string | number | boolean | null {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  );
}

/**
 * Verifica se valor é serializável como JSON
 *
 * @param value - Valor a verificar
 * @returns true se for serializável
 *
 * @example
 * ```typescript
 * if (isJSONSerializable(value)) {
 *   const json = JSON.stringify(value); // ✅ Safe
 * }
 * ```
 */
export function isJSONSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
