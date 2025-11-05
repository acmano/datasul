/**
 * Routes - Suprimentos Movimento
 *
 * Definição de rotas para endpoints de movimentação de estoque
 *
 * Em desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { movimentoParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const movimentoCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => {
    const params = new URLSearchParams(req.query as Record<string, string>).toString();
    return `suprimentos:movimento:${req.params.itemCodigo || req.params.numero}:${params}`;
  },
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /api/suprimentos/movimento/{itemCodigo}:
 *   get:
 *     summary: Buscar movimentações de estoque por item
 *     description: |
 *       Retorna movimentações de estoque de um item (entradas/saídas).
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Definir estrutura de dados e query após levantamento de requisitos
 *     tags:
 *       - Suprimentos - Movimento
 *     parameters:
 *       - name: itemCodigo
 *         in: path
 *         required: true
 *         description: Código do item
 *         schema:
 *           type: string
 *       - name: dataInicio
 *         in: query
 *         required: false
 *         description: Data de início (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: dataFim
 *         in: query
 *         required: false
 *         description: Data fim (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: tipoMovimento
 *         in: query
 *         required: false
 *         description: Tipo de movimentação
 *         schema:
 *           type: string
 *           enum: [entrada, saida, transferencia, ajuste]
 *     responses:
 *       200:
 *         description: Movimentações encontradas com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:itemCodigo',
  validate(movimentoParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  movimentoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { MovimentoController } = await import('./controller');
      await MovimentoController.getMovimentacoes(req, res, next);
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

/**
 * @openapi
 * /api/suprimentos/movimento/{itemCodigo}/resumo:
 *   get:
 *     summary: Buscar resumo de movimentações
 *     description: Retorna resumo consolidado de movimentações por período
 *     tags:
 *       - Suprimentos - Movimento
 *     parameters:
 *       - name: itemCodigo
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dataInicio
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: dataFim
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resumo retornado com sucesso
 */
router.get(
  '/:itemCodigo/resumo',
  optionalApiKeyAuth,
  userRateLimit,
  movimentoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { MovimentoController } = await import('./controller');
      await MovimentoController.getResumo(req, res, next);
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

/**
 * @openapi
 * /api/suprimentos/movimento/detalhes/{numero}:
 *   get:
 *     summary: Buscar detalhes de uma movimentação
 *     tags:
 *       - Suprimentos - Movimento
 *     parameters:
 *       - name: numero
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes retornados com sucesso
 */
router.get(
  '/detalhes/:numero',
  optionalApiKeyAuth,
  userRateLimit,
  movimentoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { MovimentoController } = await import('./controller');
      await MovimentoController.getDetalhes(req, res, next);
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
