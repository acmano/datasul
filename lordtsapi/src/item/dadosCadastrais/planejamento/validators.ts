// src/item/dadosCadastrais/planejamento/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

export const planejamentoParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16),
}).required();
