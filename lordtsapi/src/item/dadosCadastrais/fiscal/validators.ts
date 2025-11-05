// src/item/dadosCadastrais/fiscal/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const fiscalParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16),
}).required();
