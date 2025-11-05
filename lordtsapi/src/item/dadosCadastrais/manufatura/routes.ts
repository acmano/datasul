// src/item/dadosCadastrais/manufatura/routes.ts

import express, { Request, Response, NextFunction } from 'express';
import { validate } from '@shared/middlewares/validate.middleware';
import { manufaturaParamsSchema } from './validators';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { log } from '@shared/utils/logger';

const router = express.Router();

const manufaturaCache = cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => `itemManufatura:${req.params.itemCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @swagger
 * /api/item/dadosCadastrais/manufatura/{itemCodigo}:
 *   get:
 *     tags:
 *       - Item - Manufatura
 *     summary: Retorna dados de manufatura do item
 *     description: Busca informações de configurações gerais, reposição, MRP, PV/MPS/CRP e MES do item
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
 *         description: Dados de manufatura do item retornados com sucesso
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
 *                   description: Dados de manufatura do item
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
  validate(manufaturaParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  manufaturaCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ManufaturaController } = await import('./controller');
      await ManufaturaController.getManufatura(req, res, next);
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
