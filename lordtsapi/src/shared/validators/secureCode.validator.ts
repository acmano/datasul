/**
 * Validators Joi para códigos seguros
 *
 * Wrapper sobre validators puros do core que integra com Joi.
 * Mantém a interface atual mas usa lógica pura do core/validators.
 *
 * @module shared/validators/secureCode.validator
 * @since 1.0.0
 */

import Joi from 'joi';
import {
  sanitizeCode,
  validateCode,
  validateSecureCode,
  validateNumericFormat,
} from '@/core/validators';

/**
 * Schema Joi para código alfanumérico seguro
 *
 * Usa validators puros do core para validação.
 *
 * @param minLength - Tamanho mínimo (padrão: 1)
 * @param maxLength - Tamanho máximo (padrão: 8)
 * @returns Schema Joi configurado
 */
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

      // 3. Usa validação pura do core
      const validation = validateCode(value, minLength, maxLength);

      // 4. Se inválido, retorna erro
      if (!validation.valid) {
        return helpers.error('any.invalid', { message: validation.error });
      }

      // 5. Retorna valor sanitizado
      return validation.sanitized;
    })
    .messages({
      'any.required': 'Código é obrigatório',
      'string.base': 'Código deve ser uma string',
      'string.min': 'Código deve ter pelo menos {{#limit}} caractere(s)',
      'string.max': 'Código não pode ter mais de {{#limit}} caracteres',
      'any.invalid': '{{#message}}',
    });
}

/**
 * Schema Joi para código numérico seguro
 *
 * Usa validators puros do core para validação.
 *
 * @param minLength - Tamanho mínimo (padrão: 1)
 * @param maxLength - Tamanho máximo (padrão: 8)
 * @returns Schema Joi configurado
 */
export function secureNumericSchema(minLength = 1, maxLength = 8) {
  return Joi.string()
    .required()
    .custom((value, helpers) => {
      if (typeof value !== 'string') {
        return helpers.error('string.base');
      }

      // Sanitiza usando core
      const sanitized = sanitizeCode(value);

      if (!sanitized || sanitized.length === 0) {
        return helpers.error('any.invalid', { message: 'Código inválido' });
      }

      // Valida formato numérico usando core
      const formatValidation = validateNumericFormat(sanitized, minLength, maxLength);
      if (!formatValidation.valid) {
        return helpers.error('any.invalid', { message: formatValidation.error });
      }

      // Valida segurança usando core
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

// Re-exporta funções puras do core para manter compatibilidade
export { sanitizeCode, validateSecureCode } from '@/core/validators';
