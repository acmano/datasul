// src/api/lor0138/estabelecimento/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import Joi from 'joi';
import { secureNumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema de validação para código de estabelecimento
 * Regra de negócio: 3 dígitos numéricos (101, 102, etc)
 */
export const estabelecimentoParamsSchema = Joi.object({
  estabelecimentoCodigo: secureNumericSchema(1, 3)
    .required()
    .messages({
      'any.required': 'Código do estabelecimento é obrigatório',
      'string.empty': 'Código do estabelecimento não pode estar vazio',
      'string.min': 'Código do estabelecimento deve ter pelo menos 1 dígito',
      'string.max': 'Código do estabelecimento não pode ter mais de 3 dígitos',
      'string.pattern.base': 'Código do estabelecimento deve conter apenas números',
    }),
});