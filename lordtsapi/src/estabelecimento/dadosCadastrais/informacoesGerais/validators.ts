// src/estabelecimento/dadosCadastrais/informacoesGerais/validators.ts

import Joi from 'joi';
import { secureNumericSchema } from '@shared/validators/secureCode.validator';

export const estabelecimentoParamsSchema = Joi.object({
  estabelecimentoCodigo: secureNumericSchema(1, 5).messages({
    'any.required': 'Código do estabelecimento é obrigatório',
    'string.min': 'Código do estabelecimento deve ter pelo menos 1 dígito',
    'string.max': 'Código do estabelecimento não pode ter mais de 5 dígitos',
  }),
});

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateEstabelecimentoInformacoesGeraisRequest(
  params: unknown
): ValidationResult<{ estabelecimentoCodigo: string }> {
  if (
    params &&
    typeof params === 'object' &&
    'estabelecimentoCodigo' in params &&
    (params as { estabelecimentoCodigo: string }).estabelecimentoCodigo === ''
  ) {
    return {
      valid: false,
      error: 'Código do estabelecimento é obrigatório',
    };
  }

  const { error, value } = estabelecimentoParamsSchema.validate(params, {
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
