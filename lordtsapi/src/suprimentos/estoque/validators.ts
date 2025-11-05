/**
 * Validators - Suprimentos Estoque
 *
 * Validação de entrada para endpoints de estoque
 *
 * Em desenvolvimento
 */

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema para validação de parâmetros de consulta de estoque
 */
export const estoqueParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16).required().messages({
    'any.required': 'Código do item é obrigatório',
    'string.min': 'Código do item deve ter pelo menos 1 caractere',
    'string.max': 'Código do item não pode ter mais de 16 caracteres',
  }),
  estabelecimento: secureAlphanumericSchema(1, 5).optional().messages({
    'string.min': 'Código do estabelecimento deve ter pelo menos 1 caractere',
    'string.max': 'Código do estabelecimento não pode ter mais de 5 caracteres',
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
 * Valida parâmetros de entrada para consulta de estoque
 */
export function validateEstoqueParams(params: unknown): ValidationResult {
  const { error, value } = estoqueParamsSchema.validate(params, {
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
