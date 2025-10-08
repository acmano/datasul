// src/shared/validators/secureCode.validator.ts

import Joi from 'joi';

/**
 * Validador seguro de códigos sem extensão customizada do Joi
 * @module SecureCodeValidator
 * @category Validators
 */

const SQL_KEYWORDS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION'];
const DANGEROUS_PATTERNS = ['&&', '||', '|', '`', '$', '$(', '${'];

/**
 * Sanitiza código removendo caracteres perigosos
 */
export function sanitizeCode(value: string): string {
  if (typeof value !== 'string') return value;

  let sanitized = value.trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ''); // Caracteres de controle
  sanitized = sanitized.replace(/\.\./g, ''); // Path traversal
  sanitized = sanitized.replace(/[\/\\]/g, ''); // Slashes
  sanitized = sanitized.replace(/[';"\-\-]/g, ''); // SQL chars
  sanitized = sanitized.replace(/<[^>]*>/g, ''); // HTML tags

  return sanitized;
}

/**
 * Valida se código contém padrões maliciosos
 */
export function validateSecureCode(value: string): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: 'Código inválido' };
  }

  const upper = value.toUpperCase();

  // Verifica SQL keywords
  for (const keyword of SQL_KEYWORDS) {
    if (upper.includes(keyword)) {
      return { valid: false, error: 'Código contém padrões não permitidos' };
    }
  }

  // Verifica padrões perigosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (value.includes(pattern)) {
      return { valid: false, error: 'Código contém caracteres não permitidos' };
    }
  }

  return { valid: true };
}

/**
 * Schema Joi para código alfanumérico seguro
 */
export function secureAlphanumericSchema(minLength = 1, maxLength = 8) {
  return Joi.string()
    .trim()
    .alphanum()
    .min(minLength)
    .max(maxLength)
    .custom((value, helpers) => {
      // Sanitiza
      const sanitized = sanitizeCode(value);

      // Valida segurança
      const validation = validateSecureCode(sanitized);
      if (!validation.valid) {
        return helpers.error('any.invalid', { message: validation.error });
      }

      // Valida alfanumérico novamente após sanitização
      if (!/^[A-Za-z0-9]+$/.test(sanitized)) {
        return helpers.error('string.alphanum');
      }

      return sanitized;
    })
    .messages({
      'any.required': 'Código é obrigatório',
      'string.empty': 'Código não pode estar vazio',
      'string.min': 'Código deve ter pelo menos {{#limit}} caractere(s)',
      'string.max': 'Código não pode ter mais de {{#limit}} caracteres',
      'string.alphanum': 'Código deve conter apenas letras e números',
      'any.invalid': '{{#message}}',
    });
}

/**
 * Schema Joi para código numérico seguro
 */
export function secureNumericSchema(minLength = 1, maxLength = 8) {
  return Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .min(minLength)
    .max(maxLength)
    .custom((value, helpers) => {
      const sanitized = sanitizeCode(value);
      const validation = validateSecureCode(sanitized);
      
      if (!validation.valid) {
        return helpers.error('any.invalid', { message: validation.error });
      }

      if (!/^[0-9]+$/.test(sanitized)) {
        return helpers.error('string.pattern.base');
      }

      return sanitized;
    })
    .messages({
      'any.required': 'Código é obrigatório',
      'string.empty': 'Código não pode estar vazio',
      'string.min': 'Código deve ter pelo menos {{#limit}} dígito(s)',
      'string.max': 'Código não pode ter mais de {{#limit}} dígitos',
      'string.pattern.base': 'Código deve conter apenas números',
      'any.invalid': '{{#message}}',
    });
}