// src/shared/validators/secureCode.validator.ts

import Joi from 'joi';

const SQL_KEYWORDS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION'];
const DANGEROUS_PATTERNS = ['&&', '||', '|', '`', '$', '$(', '${'];

export function sanitizeCode(value: string): string {
  if (typeof value !== 'string') return value;

  let sanitized = value.trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  sanitized = sanitized.replace(/[';"\-\-]/g, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized;
}

export function validateSecureCode(value: string): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: 'Código inválido' };
  }

  const upper = value.toUpperCase();

  for (const keyword of SQL_KEYWORDS) {
    if (upper.includes(keyword)) {
      return { valid: false, error: 'Código contém padrões não permitidos' };
    }
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (value.includes(pattern)) {
      return { valid: false, error: 'Código contém caracteres inválidos' };
    }
  }

  return { valid: true };
}

export function secureAlphanumericSchema(minLength = 1, maxLength = 8) {
  return Joi.string()
    .required()
    .custom((value, helpers) => {
      // 1. Verifica tipo
      if (typeof value !== 'string') {
        return helpers.error('string.base');
      }

      // 2. Valida obrigatório ANTES de sanitizar
      if (value === '' || !value) {
        return helpers.error('any.required');
      }

      // 3. Sanitiza
      const sanitized = sanitizeCode(value);

      // 4. Valida se ficou vazio após sanitização
      if (!sanitized || sanitized.length === 0) {
        return helpers.error('any.invalid', { message: 'Código inválido' });
      }

      // 5. Valida tamanho
      if (sanitized.length < minLength) {
        return helpers.error('string.min', { limit: minLength });
      }
      if (sanitized.length > maxLength) {
        return helpers.error('string.max', { limit: maxLength });
      }

      // 6. Valida formato alfanumérico ANTES de segurança
      if (!/^[A-Za-z0-9]+$/.test(sanitized)) {
        return helpers.error('any.invalid', { message: 'Código contém caracteres inválidos' });
      }

      // 7. Valida segurança (SQL injection, etc) POR ÚLTIMO
      const securityValidation = validateSecureCode(sanitized);
      if (!securityValidation.valid) {
        return helpers.error('any.invalid', { message: securityValidation.error });
      }

      return sanitized;
    })
    .messages({
      'any.required': 'Código é obrigatório',
      'string.base': 'Código deve ser uma string',
      'string.min': 'Código deve ter pelo menos {{#limit}} caractere(s)',
      'string.max': 'Código não pode ter mais de {{#limit}} caracteres',
      'any.invalid': '{{#message}}',
    });
}

export function secureNumericSchema(minLength = 1, maxLength = 8) {
  return Joi.string()
    .required()
    .custom((value, helpers) => {
      if (typeof value !== 'string') {
        return helpers.error('string.base');
      }

      const sanitized = sanitizeCode(value);

      if (!sanitized || sanitized.length === 0) {
        return helpers.error('any.invalid', { message: 'Código inválido' });
      }

      if (sanitized.length < minLength) {
        return helpers.error('string.min', { limit: minLength });
      }
      if (sanitized.length > maxLength) {
        return helpers.error('string.max', { limit: maxLength });
      }

      if (!/^[0-9]+$/.test(sanitized)) {
        return helpers.error('any.invalid', { message: 'Código contém caracteres inválidos' });
      }

      const securityValidation = validateSecureCode(sanitized);
      if (!securityValidation.valid) {
        return helpers.error('any.invalid', { message: securityValidation.error });
      }

      return sanitized;
    })
    .messages({
      'any.required': 'Código é obrigatório',
      'string.base': 'Código deve ser uma string',
      'string.min': 'Código deve ter pelo menos {{#limit}} dígito(s)',
      'string.max': 'Código não pode ter mais de {{#limit}} dígitos',
      'any.invalid': '{{#message}}',
    });
}