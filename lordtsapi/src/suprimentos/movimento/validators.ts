/**
 * Validators - Suprimentos Movimento
 *
 * Validação de entrada para endpoints de movimentação de estoque
 *
 * Em desenvolvimento
 */

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema para validação de parâmetros de consulta de movimentação
 */
export const movimentoParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16).required().messages({
    'any.required': 'Código do item é obrigatório',
    'string.min': 'Código do item deve ter pelo menos 1 caractere',
    'string.max': 'Código do item não pode ter mais de 16 caracteres',
  }),
  dataInicio: Joi.date().iso().optional().messages({
    'date.format': 'Data de início deve estar no formato ISO (YYYY-MM-DD)',
  }),
  dataFim: Joi.date().iso().optional().messages({
    'date.format': 'Data fim deve estar no formato ISO (YYYY-MM-DD)',
  }),
  tipoMovimento: Joi.string()
    .valid('entrada', 'saida', 'transferencia', 'ajuste')
    .optional()
    .messages({
      'any.only': 'Tipo de movimento inválido. Use: entrada, saida, transferencia ou ajuste',
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
 * Valida parâmetros de entrada para consulta de movimentação
 */
export function validateMovimentoParams(params: unknown): ValidationResult {
  const { error, value } = movimentoParamsSchema.validate(params, {
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
