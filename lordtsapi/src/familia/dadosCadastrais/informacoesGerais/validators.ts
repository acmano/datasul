// src/familia/dadosCadastrais/informacoesGerais/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const familiaParamsSchema = Joi.object({
  familiaCodigo: secureAlphanumericSchema(1, 16)
    .messages({
      'any.required': 'Código da família é obrigatório',
      'string.min': 'Código da família deve ter pelo menos 1 caractere',
      'string.max': 'Código da família não pode ter mais de 16 caracteres',
    }),
});

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateFamiliaInformacoesGeraisRequest(
  params: any
): ValidationResult<{ familiaCodigo: string }> {
  // Trata string vazia ANTES do Joi
  if (params && params.familiaCodigo === '') {
    return {
      valid: false,
      error: 'Código da família é obrigatório'
    };
  }

  const { error, value } = familiaParamsSchema.validate(params, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const message = error.details.map(d => d.message).join('; ');
    return {
      valid: false,
      error: message
    };
  }

  return {
    valid: true,
    data: value
  };
}