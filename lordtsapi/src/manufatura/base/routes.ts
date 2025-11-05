/**
 * Routes - Manufatura Base
 *
 * Definição de rotas para endpoints de dados básicos de manufatura
 *
 * Em desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { manufaturaBaseParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const baseCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `manufatura:base:${req.params.codigo || 'list'}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /api/manufatura/base/{codigo}:
 *   get:
 *     summary: Buscar dados básicos de manufatura por código
 *     description: |
 *       Retorna dados básicos de manufatura do ERP Datasul.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Definir estrutura de dados e query após levantamento de requisitos
 *     tags:
 *       - Manufatura - Base
 *     parameters:
 *       - name: codigo
 *         in: path
 *         required: true
 *         description: Código do registro (1-16 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 16
 *       - name: X-Correlation-ID
 *         in: header
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados encontrados com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Registro não encontrado
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:codigo',
  validate(manufaturaBaseParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  baseCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ManufaturaBaseController } = await import('./controller');
      await ManufaturaBaseController.getBase(req, res, next);
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

/**
 * @openapi
 * /api/manufatura/base:
 *   get:
 *     summary: Listar todos os dados básicos de manufatura
 *     description: |
 *       Retorna listagem de dados básicos de manufatura.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Implementar paginação e filtros
 *     tags:
 *       - Manufatura - Base
 *     responses:
 *       200:
 *         description: Listagem retornada com sucesso
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/',
  optionalApiKeyAuth,
  userRateLimit,
  baseCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ManufaturaBaseController } = await import('./controller');
      await ManufaturaBaseController.listBase(req, res, next);
    } catch (error) {
      log.error('Erro ao carregar controller:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        success: false,
        error: 'Erro interno ao processar requisição',
        timestamp: new Date().toISOString(),
        path: req.path,
        correlationId: req.id,
      });
    }
  }
);

export default router;
