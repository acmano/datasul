// src/item/dadosCadastrais/fiscal/routes.ts

import express, { Request, Response, NextFunction } from 'express';
import { validate } from '@shared/middlewares/validate.middleware';
import { fiscalParamsSchema } from './validators';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { log } from '@shared/utils/logger';

const router = express.Router();

const fiscalCache = cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => `itemFiscal:${req.params.itemCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @swagger
 * /api/item/dadosCadastrais/fiscal/{itemCodigo}:
 *   get:
 *     tags:
 *       - Item - Fiscal
 *     summary: Retorna dados fiscais do item
 *     description: Busca informações fiscais, tributárias e de PIS/COFINS do item
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 16
 *           pattern: '^[A-Za-z0-9]+$'
 *         description: Código do item
 *         example: '7530110'
 *     responses:
 *       200:
 *         description: Dados fiscais do item retornados com sucesso
 *         headers:
 *           X-Cache:
 *             description: Indica se a resposta veio do cache (HIT) ou não (MISS)
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
 *           X-Cache-Key:
 *             description: Chave usada no cache
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Dados fiscais do item
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:itemCodigo',
  validate(fiscalParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  fiscalCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { FiscalController } = await import('./controller');
      await FiscalController.getFiscal(req, res, next);
    } catch (error) {
      log.error('Erro ao carregar controller:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        success: false,
        error: 'Erro interno ao processar requisição',
        message: 'Falha ao carregar módulo do controller',
        timestamp: new Date().toISOString(),
        path: req.path,
        correlationId: req.id,
      });
    }
  }
);

export default router;
