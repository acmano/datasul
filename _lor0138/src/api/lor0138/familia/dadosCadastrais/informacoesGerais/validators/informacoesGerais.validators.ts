// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const familiaParamsSchema = Joi.object({
  familiaCodigo: secureAlphanumericSchema(1, 8)
    .required()
    .messages({
      'any.required': 'Código da familia é obrigatório',
      'string.empty': 'Código da familia não pode estar vazio',
      'string.min': 'Código da familia não pode estar vazio',
      'string.max': 'Código da familia não pode ter mais de 8 caracteres',
      'string.alphanum': 'Código da familia deve conter apenas letras e números',
    }),
});