// src/item/dadosCadastrais/informacoesGerais/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const itemParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16)
    .messages({
      'any.required': 'Código do item é obrigatório',
      'string.min': 'Código do item deve ter pelo menos 1 caractere',
      'string.max': 'Código do item não pode ter mais de 16 caracteres',
    }),
});

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateItemInformacoesGeraisRequest(
  params: any
): ValidationResult<{ itemCodigo: string }> {
  // Trata string vazia ANTES do Joi
  if (params && params.itemCodigo === '') {
    return {
      valid: false,
      error: 'Código do item é obrigatório'
    };
  }

  const { error, value } = itemParamsSchema.validate(params, {
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