/**
 * Utilitários puros para manipulação de strings
 *
 * @module core/utils/stringUtils
 * @since 2.0.0
 */

/**
 * Remove espaços em branco no início e fim
 *
 * @param value - String a processar
 * @returns String sem espaços nas pontas
 */
export function trim(value: string): string {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Converte para maiúsculas
 *
 * @param value - String a converter
 * @returns String em maiúsculas
 */
export function toUpperCase(value: string): string {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

/**
 * Converte para minúsculas
 *
 * @param value - String a converter
 * @returns String em minúsculas
 */
export function toLowerCase(value: string): string {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

/**
 * Verifica se string está vazia ou contém apenas espaços
 *
 * @param value - String a verificar
 * @returns true se vazia ou só espaços
 */
export function isEmpty(value: string): boolean {
  return !value || value.trim() === '';
}

/**
 * Trunca string até tamanho máximo
 *
 * @param value - String a truncar
 * @param maxLength - Tamanho máximo
 * @param ellipsis - Adicionar '...' no final (padrão: false)
 * @returns String truncada
 *
 * @example
 * ```typescript
 * truncate("Hello World", 5)        // "Hello"
 * truncate("Hello World", 5, true)  // "He..."
 * ```
 */
export function truncate(value: string, maxLength: number, ellipsis: boolean = false): string {
  if (!value || value.length <= maxLength) {
    return value;
  }

  if (ellipsis) {
    return value.substring(0, maxLength - 3) + '...';
  }

  return value.substring(0, maxLength);
}

/**
 * Remove caracteres especiais mantendo apenas alfanuméricos
 *
 * @param value - String a processar
 * @param keepSpaces - Manter espaços (padrão: false)
 * @returns String apenas com alfanuméricos
 *
 * @example
 * ```typescript
 * removeSpecialChars("ABC-123")         // "ABC123"
 * removeSpecialChars("Hello World!")    // "HelloWorld"
 * removeSpecialChars("Hello World!", true) // "Hello World"
 * ```
 */
export function removeSpecialChars(value: string, keepSpaces: boolean = false): string {
  if (!value) return value;

  const pattern = keepSpaces ? /[^A-Za-z0-9\s]/g : /[^A-Za-z0-9]/g;
  return value.replace(pattern, '');
}

/**
 * Normaliza espaços múltiplos para espaço único
 *
 * @param value - String a normalizar
 * @returns String com espaços normalizados
 *
 * @example
 * ```typescript
 * normalizeSpaces("Hello    World")  // "Hello World"
 * ```
 */
export function normalizeSpaces(value: string): string {
  if (!value) return value;
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Capitaliza primeira letra
 *
 * @param value - String a capitalizar
 * @returns String com primeira letra maiúscula
 *
 * @example
 * ```typescript
 * capitalize("hello")  // "Hello"
 * ```
 */
export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Converte para formato camelCase
 *
 * @param value - String a converter
 * @returns String em camelCase
 *
 * @example
 * ```typescript
 * toCamelCase("hello_world")      // "helloWorld"
 * toCamelCase("hello-world")      // "helloWorld"
 * toCamelCase("hello world")      // "helloWorld"
 * ```
 */
export function toCamelCase(value: string): string {
  if (!value) return value;

  return value
    .toLowerCase()
    .replace(/[_\-\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
}

/**
 * Converte para formato snake_case
 *
 * @param value - String a converter
 * @returns String em snake_case
 *
 * @example
 * ```typescript
 * toSnakeCase("helloWorld")  // "hello_world"
 * toSnakeCase("HelloWorld")  // "hello_world"
 * ```
 */
export function toSnakeCase(value: string): string {
  if (!value) return value;

  return value
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}
