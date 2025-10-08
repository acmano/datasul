// src/api/lor0138/familiaComercial/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const familiaComercialParamsSchema = Joi.object({
  familiaComercialCodigo: secureAlphanumericSchema(1, 8)
    .required()
    .messages({
      'any.required': 'Código da familia comercial é obrigatório',
      'string.empty': 'Código da familia comercial não pode estar vazio',
      'string.min': 'Código da familia comercial não pode ter menos de 1 caractere',
      'string.max': 'Código da familia comercial não pode ter mais de 8 caracteres',
      'string.alphanum': 'Código da familia comercial deve conter apenas letras e números',
    }),
});