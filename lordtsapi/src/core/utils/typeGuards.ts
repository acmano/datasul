/**
 * Type guards puros para validações de tipo em tempo de execução
 *
 * @module core/utils/typeGuards
 * @since 2.0.0
 */

/**
 * Verifica se valor é uma string válida e não vazia
 *
 * @param value - Valor a verificar
 * @returns true se for string válida
 *
 * @example
 * ```typescript
 * isValidString("abc")      // true
 * isValidString("")         // false
 * isValidString(null)       // false
 * isValidString(undefined)  // false
 * ```
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Verifica se código é válido (não null, não undefined, string não vazia)
 *
 * Type guard que garante que o código é uma string válida.
 * Útil para verificar códigos antes de fazer queries.
 *
 * @param code - Código a verificar
 * @returns true se código for válido
 *
 * @example
 * ```typescript
 * isValidCode("7530110")     // true
 * isValidCode("")            // false
 * isValidCode(null)          // false
 * isValidCode(undefined)     // false
 * isValidCode("  ")          // false
 * ```
 */
export function isValidCode(code: unknown): code is string {
  return code !== null && code !== undefined && typeof code === 'string' && code.trim() !== '';
}

/**
 * Verifica se valor é um número válido
 *
 * @param value - Valor a verificar
 * @returns true se for número válido (não NaN, não Infinity)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Verifica se valor é um array não vazio
 *
 * @param value - Valor a verificar
 * @returns true se for array com pelo menos 1 elemento
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Verifica se valor é um objeto não nulo
 *
 * @param value - Valor a verificar
 * @returns true se for objeto (não null, não array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
