// src/deposito/dadosCadastrais/informacoesGerais/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const depositoParamsSchema = Joi.object({
  depositoCodigo: secureAlphanumericSchema(1, 8).messages({
    'any.required': 'Código do depósito é obrigatório',
    'string.min': 'Código do depósito deve ter pelo menos 1 caractere',
    'string.max': 'Código do depósito não pode ter mais de 8 caracteres',
  }),
});

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateDepositoInformacoesGeraisRequest(
  params: unknown
): ValidationResult<{ depositoCodigo: string }> {
  // Trata string vazia ANTES do Joi
  if (
    params &&
    typeof params === 'object' &&
    'depositoCodigo' in params &&
    params.depositoCodigo === ''
  ) {
    return {
      valid: false,
      error: 'Código do depósito é obrigatório',
    };
  }

  const { error, value } = depositoParamsSchema.validate(params, {
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
