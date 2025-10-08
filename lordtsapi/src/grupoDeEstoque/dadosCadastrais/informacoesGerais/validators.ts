// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const grupoDeEstoqueParamsSchema = Joi.object({
  grupoDeEstoqueCodigo: secureAlphanumericSchema(1, 16)
    .messages({
      'any.required': 'Código do grupo de estoque é obrigatório',
      'string.min': 'Código do grupo de estoque deve ter pelo menos 1 caractere',
      'string.max': 'Código do grupo de estoque não pode ter mais de 16 caracteres',
    }),
});

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateGrupoDeEstoqueInformacoesGeraisRequest(
  params: any
): ValidationResult<{ grupoDeEstoqueCodigo: string }> {
  if (params && params.grupoDeEstoqueCodigo === '') {
    return {
      valid: false,
      error: 'Código do grupo de estoque é obrigatório'
    };
  }

  const { error, value } = grupoDeEstoqueParamsSchema.validate(params, {
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