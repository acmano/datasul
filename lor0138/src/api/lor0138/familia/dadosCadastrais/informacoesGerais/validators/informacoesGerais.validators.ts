// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import { ExtendedJoi } from '@shared/validators/joi';

/**
 * Validators para Informações Gerais de Famílias
 * Usa Joi com extensão secureCode para validação e sanitização
 * @module InformacoesGeraisValidators
 * @category Validators
 */

export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(8)
    .required()
    .messages({
      'any.required': 'Código da familia é obrigatório',
      'string.empty': 'Código da familia não pode estar vazio',
      'string.min': 'Código da familia não pode estar vazio',
      'string.max': 'Código da familia não pode ter mais de 8 caracteres',
      'secureCode.invalidChars': 'Código da familia deve conter apenas letras e números',
    }),
});