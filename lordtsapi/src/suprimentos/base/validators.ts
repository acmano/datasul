/**
 * Validators - Suprimentos Base
 *
 * Validação de entrada para endpoints de dados básicos de suprimentos
 *
 * Em desenvolvimento
 */

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema para validação de parâmetros de consulta
 * TODO: Ajustar após definição de requisitos
 */
export const suprimentosBaseParamsSchema = Joi.object({
  codigo: secureAlphanumericSchema(1, 16).optional().messages({
    'string.min': 'Código deve ter pelo menos 1 caractere',
    'string.max': 'Código não pode ter mais de 16 caracteres',
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
 * Valida parâmetros de entrada
 * TODO: Implementar validação específica após requisitos
 */
export function validateSuprimentosBaseParams(params: unknown): ValidationResult {
  const { error, value } = suprimentosBaseParamsSchema.validate(params, {
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
