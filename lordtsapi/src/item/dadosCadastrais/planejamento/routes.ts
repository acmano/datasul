// src/item/dadosCadastrais/planejamento/routes.ts

import express, { Request, Response, NextFunction } from 'express';
import { validate } from '@shared/middlewares/validate.middleware';
import { planejamentoParamsSchema } from './validators';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { log } from '@shared/utils/logger';

const router = express.Router();

const planejamentoCache = cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => `itemPlanejamento:${req.params.itemCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @swagger
 * /api/item/dadosCadastrais/planejamento/{itemCodigo}:
 *   get:
 *     tags:
 *       - Item - Planejamento
 *     summary: Retorna dados de planejamento do item
 *     description: Busca informações de planejamento, produção, reposição e MRP do item por estabelecimento
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
 *         description: Planejamento do item retornado com sucesso
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
 *                   description: Dados de planejamento do item
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
  validate(planejamentoParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  planejamentoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { PlanejamentoController } = await import('./controller');
      await PlanejamentoController.getPlanejamento(req, res, next);
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
