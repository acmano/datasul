/**
 * Validators - Suprimentos Fornecedores
 *
 * Validação de entrada para endpoints de fornecedores
 *
 * Em desenvolvimento
 */

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema para validação de parâmetros de fornecedor
 */
export const fornecedorParamsSchema = Joi.object({
  codigo: secureAlphanumericSchema(1, 16).required().messages({
    'any.required': 'Código do fornecedor é obrigatório',
    'string.min': 'Código deve ter pelo menos 1 caractere',
    'string.max': 'Código não pode ter mais de 16 caracteres',
  }),
});

/**
 * Schema para busca de fornecedores
 */
export const fornecedorSearchSchema = Joi.object({
  razaoSocial: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Razão social deve ter pelo menos 3 caracteres',
    'string.max': 'Razão social não pode ter mais de 100 caracteres',
  }),
  cnpj: Joi.string()
    .pattern(/^\d{14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'CNPJ deve conter 14 dígitos',
    }),
});

/**
 * Interface de resultado de validação
 */
export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Valida parâmetros de entrada para consulta de fornecedor
 */
export function validateFornecedorParams(params: unknown): ValidationResult {
  const { error, value } = fornecedorParamsSchema.validate(params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return {
      valid: false,
      error: message,
    };
  }

  return {
    valid: true,
    data: value,
  };
}
