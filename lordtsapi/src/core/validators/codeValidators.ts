/**
 * Validadores puros de código (sem dependências externas)
 *
 * Contém lógica de validação de domínio que não depende de:
 * - Bibliotecas externas (Joi, etc)
 * - Infraestrutura (banco, cache, etc)
 * - Framework (Express, etc)
 *
 * @module core/validators/codeValidators
 * @since 2.0.0
 */

import {
  SQL_KEYWORDS,
  DANGEROUS_PATTERNS,
  CONTROL_CHARS_REGEX,
  PATH_TRAVERSAL_REGEX,
  PATH_SEPARATORS_REGEX,
  SQL_DANGEROUS_CHARS_REGEX,
  HTML_TAGS_REGEX,
} from '../constants/securityPatterns';

/**
 * Resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Sanitiza código removendo caracteres perigosos
 *
 * Remove:
 * - Caracteres de controle (0x00-0x1F, 0x7F)
 * - Path traversal (..)
 * - Separadores de path (/, \)
 * - Caracteres SQL perigosos (', ", --)
 * - Tags HTML/XML
 *
 * @param value - Valor a sanitizar
 * @returns Valor sanitizado
 *
 * @example
 * ```typescript
 * sanitizeCode("ABC123")        // "ABC123"
 * sanitizeCode("AB'C--123")     // "ABC123"
 * sanitizeCode("../etc/passwd") // "etcpasswd"
 * ```
 */
export function sanitizeCode(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }

  let sanitized = value.trim();

  // Remove caracteres de controle
  sanitized = sanitized.replace(CONTROL_CHARS_REGEX, '');

  // Remove path traversal
  sanitized = sanitized.replace(PATH_TRAVERSAL_REGEX, '');

  // Remove separadores de path
  sanitized = sanitized.replace(PATH_SEPARATORS_REGEX, '');

  // Remove caracteres SQL perigosos
  sanitized = sanitized.replace(SQL_DANGEROUS_CHARS_REGEX, '');

  // Remove tags HTML
  sanitized = sanitized.replace(HTML_TAGS_REGEX, '');

  return sanitized;
}

/**
 * Valida se código contém padrões de segurança proibidos
 *
 * Verifica:
 * - Palavras-chave SQL (SELECT, INSERT, etc)
 * - Padrões perigosos (&&, ||, $, etc)
 *
 * @param value - Valor a validar
 * @returns Resultado da validação
 *
 * @example
 * ```typescript
 * validateSecureCode("ABC123")           // { valid: true }
 * validateSecureCode("SELECT * FROM")    // { valid: false, error: "..." }
 * validateSecureCode("test && malware")  // { valid: false, error: "..." }
 * ```
 */
export function validateSecureCode(value: string): ValidationResult {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Código inválido',
    };
  }

  const upper = value.toUpperCase();

  // Verifica palavras-chave SQL
  for (const keyword of SQL_KEYWORDS) {
    if (upper.includes(keyword)) {
      return {
        valid: false,
        error: 'Código contém padrões não permitidos',
      };
    }
  }

  // Verifica padrões perigosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (value.includes(pattern)) {
      return {
        valid: false,
        error: 'Código contém caracteres inválidos',
      };
    }
  }

  return { valid: true };
}

/**
 * Valida formato de código alfanumérico
 *
 * @param value - Valor a validar
 * @param minLength - Tamanho mínimo (padrão: 1)
 * @param maxLength - Tamanho máximo (padrão: 16)
 * @returns Resultado da validação
 *
 * @example
 * ```typescript
 * validateAlphanumericFormat("ABC123", 1, 8)    // { valid: true }
 * validateAlphanumericFormat("ABC-123", 1, 8)   // { valid: false }
 * validateAlphanumericFormat("AB", 5, 10)       // { valid: false }
 * ```
 */
export function validateAlphanumericFormat(
  value: string,
  minLength: number = 1,
  maxLength: number = 16
): ValidationResult {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Código inválido',
    };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: `Código deve ter pelo menos ${minLength} caractere(s)`,
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `Código não pode ter mais de ${maxLength} caracteres`,
    };
  }

  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return {
      valid: false,
      error: 'Código deve conter apenas letras e números',
    };
  }

  return { valid: true };
}

/**
 * Valida formato de código numérico
 *
 * @param value - Valor a validar
 * @param minLength - Tamanho mínimo (padrão: 1)
 * @param maxLength - Tamanho máximo (padrão: 16)
 * @returns Resultado da validação
 *
 * @example
 * ```typescript
 * validateNumericFormat("12345", 1, 8)     // { valid: true }
 * validateNumericFormat("ABC123", 1, 8)    // { valid: false }
 * validateNumericFormat("12", 5, 10)       // { valid: false }
 * ```
 */
export function validateNumericFormat(
  value: string,
  minLength: number = 1,
  maxLength: number = 16
): ValidationResult {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Código inválido',
    };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: `Código deve ter pelo menos ${minLength} dígito(s)`,
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `Código não pode ter mais de ${maxLength} dígitos`,
    };
  }

  if (!/^[0-9]+$/.test(value)) {
    return {
      valid: false,
      error: 'Código deve conter apenas números',
    };
  }

  return { valid: true };
}

/**
 * Valida código completo (sanitização + segurança + formato)
 *
 * Executa validação completa em ordem:
 * 1. Sanitiza o código
 * 2. Valida segurança
 * 3. Valida formato alfanumérico
 *
 * @param value - Valor a validar
 * @param minLength - Tamanho mínimo (padrão: 1)
 * @param maxLength - Tamanho máximo (padrão: 16)
 * @returns Resultado da validação com código sanitizado
 *
 * @example
 * ```typescript
 * validateCode("ABC123", 1, 16)
 * // { valid: true, sanitized: "ABC123" }
 *
 * validateCode("AB'C--123", 1, 16)
 * // { valid: true, sanitized: "ABC123" }
 *
 * validateCode("SELECT", 1, 16)
 * // { valid: false, error: "..." }
 * ```
 */
export function validateCode(
  value: string,
  minLength: number = 1,
  maxLength: number = 16
): ValidationResult {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Código inválido',
    };
  }

  // 1. Sanitiza
  const sanitized = sanitizeCode(value);

  // 2. Valida se ficou vazio após sanitização
  if (!sanitized || sanitized.length === 0) {
    return {
      valid: false,
      error: 'Código inválido após sanitização',
    };
  }

  // 3. Valida formato
  const formatValidation = validateAlphanumericFormat(sanitized, minLength, maxLength);
  if (!formatValidation.valid) {
    return formatValidation;
  }

  // 4. Valida segurança
  const securityValidation = validateSecureCode(sanitized);
  if (!securityValidation.valid) {
    return securityValidation;
  }

  return {
    valid: true,
    sanitized,
  };
}
