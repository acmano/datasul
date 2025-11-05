// src/shared/logging/validators.ts

/**
 * Validadores Joi para endpoints de logging frontend
 * @module shared/logging/validators
 */

import { Joi } from '@shared/validators/joi';

/**
 * Níveis de log válidos
 */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/**
 * Schema para um único log do frontend
 */
export const frontendLogSchema = Joi.object({
  level: Joi.string()
    .valid(...LOG_LEVELS)
    .required()
    .messages({
      'any.required': 'O campo "level" é obrigatório',
      'any.only': 'O campo "level" deve ser um de: debug, info, warn, error',
    }),

  message: Joi.string().max(1000).required().messages({
    'any.required': 'O campo "message" é obrigatório',
    'string.max': 'A mensagem não pode ter mais de 1000 caracteres',
  }),

  context: Joi.object().unknown(true).optional().messages({
    'object.base': 'O campo "context" deve ser um objeto',
  }),

  correlationId: Joi.string().uuid().optional().messages({
    'string.uuid': 'O campo "correlationId" deve ser um UUID válido',
  }),

  timestamp: Joi.string().isoDate().required().messages({
    'any.required': 'O campo "timestamp" é obrigatório',
    'string.isoDate': 'O campo "timestamp" deve estar no formato ISO 8601',
  }),

  url: Joi.string().uri({ allowRelative: true }).max(500).optional().messages({
    'string.uri': 'O campo "url" deve ser uma URL válida',
    'string.max': 'A URL não pode ter mais de 500 caracteres',
  }),

  userAgent: Joi.string().max(500).optional().messages({
    'string.max': 'O campo "userAgent" não pode ter mais de 500 caracteres',
  }),
}).options({
  stripUnknown: true,
  abortEarly: false,
});

/**
 * Schema para batch de logs do frontend
 */
export const frontendLogBatchSchema = Joi.object({
  logs: Joi.array().items(frontendLogSchema).min(1).max(100).required().messages({
    'any.required': 'O campo "logs" é obrigatório',
    'array.min': 'Deve haver pelo menos 1 log no batch',
    'array.max': 'Não é permitido enviar mais de 100 logs por batch',
  }),
}).options({
  stripUnknown: true,
  abortEarly: false,
});

/**
 * Tipo TypeScript inferido do schema
 */
export type FrontendLog = {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
};

/**
 * Tipo TypeScript para batch de logs
 */
export type FrontendLogBatch = {
  logs: FrontendLog[];
};
