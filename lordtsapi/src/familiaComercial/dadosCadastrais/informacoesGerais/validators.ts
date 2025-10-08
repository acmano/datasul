// src/familiaComercial/dadosCadastrais/informacoesGerais/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const familiaComercialParamsSchema = Joi.object({
  familiaComercialCodigo: secureAlphanumericSchema(1, 16)
    .messages({
      'any.required': 'Código da família comercial é obrigatório',
      'string.min': 'Código da família comercial deve ter pelo menos 1 caractere',
      'string.max': 'Código da família comercial não pode ter mais de 16 caracteres',
    }),
});

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateFamiliaComercialInformacoesGeraisRequest(
  params: any
): ValidationResult<{ familiaComercialCodigo: string }> {
  if (params && params.familiaComercialCodigo === '') {
    return {
      valid: false,
      error: 'Código da família comercial é obrigatório'
    };
  }

  const { error, value } = familiaComercialParamsSchema.validate(params, {
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