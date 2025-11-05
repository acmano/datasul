/**
 * Routes - Fiscal Base
 *
 * Definição de rotas para endpoints de dados básicos de fiscal
 *
 * Em desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { fiscalBaseParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const baseCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `fiscal:base:${req.params.codigo || 'list'}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /api/fiscal/base/{codigo}:
 *   get:
 *     summary: Buscar dados básicos de fiscal por código
 *     description: |
 *       Retorna dados básicos de fiscal do ERP Datasul.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Definir estrutura de dados e query após levantamento de requisitos
 *     tags:
 *       - Fiscal - Base
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
  validate(fiscalBaseParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  baseCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { FiscalBaseController } = await import('./controller');
      await FiscalBaseController.getBase(req, res, next);
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
 * /api/fiscal/base:
 *   get:
 *     summary: Listar todos os dados básicos de fiscal
 *     description: |
 *       Retorna listagem de dados básicos de fiscal.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Implementar paginação e filtros
 *     tags:
 *       - Fiscal - Base
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
      const { FiscalBaseController } = await import('./controller');
      await FiscalBaseController.listBase(req, res, next);
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
