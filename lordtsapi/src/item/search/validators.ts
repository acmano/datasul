import Joi from 'joi';
import {
  secureAlphanumericSchema,
  secureNumericSchema,
} from '@shared/validators/secureCode.validator';

/**
 * Schema de validação para busca de itens
 *
 * Suporta wildcards (* e %) para codigo e descricao
 * Validação de segurança para prevenir SQL injection
 */
export const itemSearchSchema = Joi.object({
  codigo: Joi.string()
    .min(1)
    .max(16)
    .pattern(/^[a-zA-Z0-9*%]+$/)
    .optional()
    .messages({
      'string.empty': 'Código não pode ser vazio',
      'string.min': 'Código deve ter no mínimo 1 caractere',
      'string.max': 'Código deve ter no máximo 16 caracteres',
      'string.pattern.base': 'Código deve conter apenas letras, números e wildcards (* ou %)',
    }),
  descricao: Joi.string()
    .min(1)
    .max(200)
    .pattern(/^[a-zA-Z0-9\sáéíóúàèìòùâêîôûãõäëïöüçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÇÑ_.*%/\\()&"-]+$/)
    .optional()
    .messages({
      'string.empty': 'Descrição não pode ser vazia',
      'string.min': 'Descrição deve ter no mínimo 1 caractere',
      'string.max': 'Descrição deve ter no máximo 200 caracteres',
      'string.pattern.base':
        'Descrição contém caracteres inválidos. Use apenas letras, números, espaços, hífens e wildcards (* ou %)',
    }),
  familia: secureAlphanumericSchema(1, 8).optional(),
  familiaComercial: secureAlphanumericSchema(1, 8).optional(),
  grupoEstoque: secureAlphanumericSchema(1, 8).optional(),
  gtin: secureNumericSchema(13, 14).optional(),
  tipoItem: Joi.alternatives()
    .try(
      // Aceita string única (convertida para array)
      Joi.string().valid('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '99').messages({
        'any.only': 'Tipo do item deve ser um dos valores válidos: 0-10 ou 99',
      }),
      // Aceita array de strings
      Joi.array()
        .items(
          Joi.string()
            .valid('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '99')
            .messages({
              'any.only': 'Tipo do item deve ser um dos valores válidos: 0-10 ou 99',
            })
        )
        .messages({
          'array.base': 'Tipo do item deve ser um array de strings',
        })
    )
    .optional()
    .messages({
      'alternatives.match': 'Tipo do item deve ser uma string ou array de strings válidos',
    }),
})
  .min(1)
  .messages({
    'object.min': 'Pelo menos um parâmetro de busca deve ser informado',
  });
