// src/item/dadosCadastrais/manufatura/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const manufaturaParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16),
}).required();
