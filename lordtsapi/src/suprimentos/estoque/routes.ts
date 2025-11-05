/**
 * Routes - Suprimentos Estoque
 *
 * Definição de rotas para endpoints de estoque/inventário
 *
 * Em desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { estoqueParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const estoqueCache = cacheMiddleware({
  ttl: 300, // 5 minutos (dados de estoque mudam com frequência)
  keyGenerator: (req) =>
    `suprimentos:estoque:${req.params.itemCodigo}:${req.query.estabelecimento || 'all'}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /api/suprimentos/estoque/{itemCodigo}:
 *   get:
 *     summary: Buscar dados de estoque por código do item
 *     description: |
 *       Retorna dados completos de estoque de um item no ERP Datasul.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Definir estrutura de dados e query após levantamento de requisitos
 *     tags:
 *       - Suprimentos - Estoque
 *     parameters:
 *       - name: itemCodigo
 *         in: path
 *         required: true
 *         description: Código do item (1-16 caracteres alfanuméricos)
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
 *         description: Dados de estoque encontrados com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Estoque não encontrado
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:itemCodigo',
  validate(estoqueParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  estoqueCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { EstoqueController } = await import('./controller');
      await EstoqueController.getEstoque(req, res, next);
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
 * /api/suprimentos/estoque/{itemCodigo}/saldo:
 *   get:
 *     summary: Buscar saldos de estoque por item
 *     description: |
 *       Retorna saldos de estoque de um item por estabelecimento.
 *
 *       **Status:** Em desenvolvimento
 *     tags:
 *       - Suprimentos - Estoque
 *     parameters:
 *       - name: itemCodigo
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: estabelecimento
 *         in: query
 *         required: false
 *         description: Filtra por estabelecimento específico
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saldos retornados com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:itemCodigo/saldo',
  validate(estoqueParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  estoqueCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { EstoqueController } = await import('./controller');
      await EstoqueController.getSaldo(req, res, next);
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
