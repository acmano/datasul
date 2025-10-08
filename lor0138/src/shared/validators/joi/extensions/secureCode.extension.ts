// src/shared/validators/joi/extensions/secureCode.extension.ts

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
  
  // Pré-processamento: sanitiza a string ANTES das validações
  coerce: {
    from: 'string',
    method(value) {
      if (typeof value !== 'string') {
        return { value };
      }

      let sanitized = value.trim();
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ''); // Remove caracteres de controle
      sanitized = sanitized.replace(/\.\./g, ''); // Remove path traversal
      sanitized = sanitized.replace(/[\/\\]/g, ''); // Remove slashes
      sanitized = sanitized.replace(/[';"\-\-]/g, ''); // Remove SQL chars
      sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove HTML tags

      return { value: sanitized };
    }
  },

  // Validação customizada: verifica padrões maliciosos
  validate(value, helpers) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    const upper = value.toUpperCase();
    
    // Verifica SQL keywords
    for (const keyword of SQL_KEYWORDS) {
      if (upper.includes(keyword)) {
        return helpers.error('secureCode.sqlInjection');
      }
    }

    // Verifica padrões perigosos
    for (const pattern of DANGEROUS_PATTERNS) {
      if (value.includes(pattern)) {
        return helpers.error('secureCode.commandInjection');
      }
    }

    return value;
  },

  // Regras adicionais
  rules: {
    alphanumeric: {
      method() {
        return this.$_addRule('alphanumeric');
      },
      validate(value, helpers) {
        if (typeof value !== 'string' || !/^[A-Za-z0-9]+$/.test(value)) {
          return helpers.error('secureCode.invalidChars');
        }
        return value;
      }
    },
    
    numeric: {
      method() {
        return this.$_addRule('numeric');
      },
      validate(value, helpers) {
        if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
          return helpers.error('secureCode.invalidChars');
        }
        return value;
      }
    }
  }
};