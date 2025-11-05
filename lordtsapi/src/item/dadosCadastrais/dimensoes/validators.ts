// src/item/dadosCadastrais/dimensoes/validators.ts

import Joi from 'joi';
import { secureAlphanumericSchema } from '@shared/validators/secureCode.validator';

/**
 * Schema de validação para parâmetros de rota
 */
export const dimensoesParamsSchema = Joi.object({
  itemCodigo: secureAlphanumericSchema(1, 16), // ← corrigido
}).required();
