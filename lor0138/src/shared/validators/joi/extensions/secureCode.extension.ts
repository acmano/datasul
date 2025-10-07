// src/shared/validators/extensions/secureCode.extension.ts

import Joi from 'joi';

/**
 * Extensão customizada do Joi para validação segura de códigos
 * @module SecureCodeExtension
 * @category Validators
 */

const SQL_KEYWORDS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION'];
const DANGEROUS_PATTERNS = ['&&', '||', '|', '`', '$', '$(', '${'];

export const secureCodeExtension: Joi.Extension = {
  type: 'secureCode',
  base: Joi.string(),
  messages: {
    'secureCode.sqlInjection': '{{#label}} contém padrões não permitidos',
    'secureCode.commandInjection': '{{#label}} contém caracteres não permitidos',
    'secureCode.invalidChars': '{{#label}} contém caracteres inválidos',
  },
  rules: {
    alphanumeric: {
      validate(value, helpers) {
        if (!/^[A-Za-z0-9]+$/.test(value)) {
          return helpers.error('secureCode.invalidChars');
        }
        return value;
      },
    },
    numeric: {
      validate(value, helpers) {
        if (!/^[0-9]+$/.test(value)) {
          return helpers.error('secureCode.invalidChars');
        }
        return value;
      },
    },
  },
  coerce(value, helpers) {
    if (typeof value !== 'string') return { value };

    let sanitized = value.trim();
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]/g, '');
    sanitized = sanitized.replace(/[';"\-\-]/g, '');
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    return { value: sanitized };
  },
  validate(value, helpers) {
    const upper = value.toUpperCase();
    for (const keyword of SQL_KEYWORDS) {
      if (upper.includes(keyword)) {
        return helpers.error('secureCode.sqlInjection');
      }
    }

    for (const pattern of DANGEROUS_PATTERNS) {
      if (value.includes(pattern)) {
        return helpers.error('secureCode.commandInjection');
      }
    }

    return value;
  },
};