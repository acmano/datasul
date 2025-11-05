// src/shared/logging/routes.ts

/**
 * Rotas para logging do frontend
 * @module shared/logging/routes
 */

import { Router } from 'express';
import { logFromFrontendController, logBatchFromFrontendController } from './controller';
import { validate } from '@shared/middlewares/validate.middleware';
import { frontendLogSchema, frontendLogBatchSchema } from './validators';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { createCustomRateLimiter } from '@shared/middlewares/rateLimiter.middleware';

const router = Router();

/**
 * Rate limiter específico para logs do frontend
 * Mais permissivo que o padrão (1000 req/15min ao invés de 100 req/15min)
 */
const loggingRateLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requisições por IP
  message: 'Limite de logging excedido. Aguarde alguns minutos.',
  skipInDev: true,
});

/**
 * POST /api/logs/frontend
 * Recebe log individual do frontend
 *
 * - Autenticação opcional (API Key)
 * - Rate limit: 1000 req/15min
 * - Validação: frontendLogSchema
 *
 * @swagger
 * /api/logs/frontend:
 *   post:
 *     summary: Registra log individual do frontend
 *     tags: [Logging]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - message
 *               - timestamp
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [debug, info, warn, error]
 *                 description: Nível do log
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Mensagem do log
 *               context:
 *                 type: object
 *                 description: Contexto adicional (objeto livre)
 *               correlationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de correlação para rastreamento
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp ISO 8601
 *               url:
 *                 type: string
 *                 maxLength: 500
 *                 description: URL da página
 *               userAgent:
 *                 type: string
 *                 maxLength: 500
 *                 description: User agent do browser
 *     responses:
 *       201:
 *         description: Log registrado com sucesso
 *       400:
 *         description: Erro de validação
 *       429:
 *         description: Rate limit excedido
 */
router.post(
  '/frontend',
  loggingRateLimiter,
  optionalApiKeyAuth,
  validate(frontendLogSchema),
  logFromFrontendController
);

/**
 * POST /api/logs/frontend/batch
 * Recebe batch de logs do frontend
 *
 * - Autenticação opcional (API Key)
 * - Rate limit: 1000 req/15min
 * - Validação: frontendLogBatchSchema
 *
 * @swagger
 * /api/logs/frontend/batch:
 *   post:
 *     summary: Registra múltiplos logs do frontend (batch)
 *     tags: [Logging]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logs
 *             properties:
 *               logs:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - level
 *                     - message
 *                     - timestamp
 *                   properties:
 *                     level:
 *                       type: string
 *                       enum: [debug, info, warn, error]
 *                     message:
 *                       type: string
 *                       maxLength: 1000
 *                     context:
 *                       type: object
 *                     correlationId:
 *                       type: string
 *                       format: uuid
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     url:
 *                       type: string
 *                       maxLength: 500
 *                     userAgent:
 *                       type: string
 *                       maxLength: 500
 *     responses:
 *       201:
 *         description: Batch de logs registrado com sucesso
 *       400:
 *         description: Erro de validação
 *       429:
 *         description: Rate limit excedido
 */
router.post(
  '/frontend/batch',
  loggingRateLimiter,
  optionalApiKeyAuth,
  validate(frontendLogBatchSchema),
  logBatchFromFrontendController
);

export default router;
