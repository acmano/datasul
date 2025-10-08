// src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import Joi from 'joi';
import { secureNumericSchema } from '@shared/validators/secureCode.validator';

export const grupoDeEstoqueParamsSchema = Joi.object({
  grupoDeEstoqueCodigo: secureNumericSchema(1, 2)
    .required()
    .messages({
      'any.required': 'Código do grupo de estoque é obrigatório',
      'string.empty': 'Código do grupo de estoque não pode estar vazio',
      'string.min': 'Código do grupo de estoque deve ter exatamente dois dígitos',
      'string.max': 'Código do grupo de estoque deve ter exatamente dois dígitos',
      'string.pattern.base': 'Código do grupo de estoque deve conter apenas números',
    }),
});