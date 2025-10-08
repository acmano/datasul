// src/api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema de validação para parâmetros de rota do item
 */
export const itemParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16)
    .required()
    .messages({
      'any.required': 'Código do item é obrigatório',
      'string.empty': 'Código do item não pode estar vazio',
      'string.min': 'Código do item deve ter pelo menos 1 caractere',
      'string.max': 'Código do item não pode ter mais de 16 caracteres',
      'string.alphanum': 'Código do item deve conter apenas letras e números',
    }),
});