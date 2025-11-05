// src/item/itemEmpresas/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const itemEmpresasSchema = Joi.object({
  codigo: secureAlphanumericSchema(1, 16).required(),
}).messages({
  'any.required': 'O código do item é obrigatório',
});
