/**
 * Validators - Suprimentos Programação de Entrega
 *
 * Validação de entrada para endpoints de programação de entregas
 *
 * Em desenvolvimento
 */

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema para validação de parâmetros de programação de entrega
 */
export const programacaoEntregaParamsSchema = Joi.object({
  numero: Joi.number().integer().positive().optional().messages({
    'number.base': 'Número deve ser um valor numérico',
    'number.integer': 'Número deve ser um valor inteiro',
    'number.positive': 'Número deve ser positivo',
  }),
  fornecedorCodigo: secureAlphanumericSchema(1, 16).optional(),
  itemCodigo: secureAlphanumericSchema(1, 16).optional(),
  dataInicio: Joi.date().iso().optional().messages({
    'date.format': 'Data de início deve estar no formato ISO (YYYY-MM-DD)',
  }),
  dataFim: Joi.date().iso().optional().messages({
    'date.format': 'Data fim deve estar no formato ISO (YYYY-MM-DD)',
  }),
  status: Joi.string()
    .valid('programada', 'confirmada', 'entregue', 'cancelada', 'pendente')
    .optional()
    .messages({
      'any.only': 'Status inválido. Use: programada, confirmada, entregue, cancelada ou pendente',
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
 * Valida parâmetros de entrada para consulta de programação
 */
export function validateProgramacaoEntregaParams(params: unknown): ValidationResult {
  const { error, value } = programacaoEntregaParamsSchema.validate(params, {
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
