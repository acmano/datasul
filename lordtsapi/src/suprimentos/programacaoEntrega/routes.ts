/**
 * Routes - Suprimentos Programação de Entrega
 *
 * Definição de rotas para endpoints de programação de entregas
 *
 * Em desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { programacaoEntregaParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const programacaoCache = cacheMiddleware({
  ttl: 300, // 5 minutos (dados de programação mudam com frequência)
  keyGenerator: (req) => {
    const params = new URLSearchParams(req.query as Record<string, string>).toString();
    return `suprimentos:programacao:${req.params.numero || 'list'}:${params}`;
  },
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /api/suprimentos/programacaoEntrega:
 *   get:
 *     summary: Buscar programações de entrega
 *     description: |
 *       Retorna programações de entrega do ERP Datasul com filtros opcionais.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Definir estrutura de dados e query após levantamento de requisitos
 *     tags:
 *       - Suprimentos - Programação de Entrega
 *     parameters:
 *       - name: itemCodigo
 *         in: query
 *         required: false
 *         description: Filtrar por código do item
 *         schema:
 *           type: string
 *       - name: fornecedorCodigo
 *         in: query
 *         required: false
 *         description: Filtrar por código do fornecedor
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
 *       - name: status
 *         in: query
 *         required: false
 *         description: Status da programação
 *         schema:
 *           type: string
 *           enum: [programada, confirmada, entregue, cancelada, pendente]
 *     responses:
 *       200:
 *         description: Programações encontradas com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/',
  validate(programacaoEntregaParamsSchema, 'query'),
  optionalApiKeyAuth,
  userRateLimit,
  programacaoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ProgramacaoEntregaController } = await import('./controller');
      await ProgramacaoEntregaController.getProgramacoes(req, res, next);
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
 * /api/suprimentos/programacaoEntrega/resumo:
 *   get:
 *     summary: Buscar resumo de programações
 *     description: Retorna resumo consolidado de programações por período
 *     tags:
 *       - Suprimentos - Programação de Entrega
 *     parameters:
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
  '/resumo',
  optionalApiKeyAuth,
  userRateLimit,
  programacaoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ProgramacaoEntregaController } = await import('./controller');
      await ProgramacaoEntregaController.getResumo(req, res, next);
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
 * /api/suprimentos/programacaoEntrega/porFornecedor:
 *   get:
 *     summary: Buscar programações por fornecedor
 *     description: Retorna programações agrupadas por fornecedor
 *     tags:
 *       - Suprimentos - Programação de Entrega
 *     parameters:
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
 *         description: Programações por fornecedor retornadas com sucesso
 */
router.get(
  '/porFornecedor',
  optionalApiKeyAuth,
  userRateLimit,
  programacaoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ProgramacaoEntregaController } = await import('./controller');
      await ProgramacaoEntregaController.getPorFornecedor(req, res, next);
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
 * /api/suprimentos/programacaoEntrega/{numero}:
 *   get:
 *     summary: Buscar detalhes de uma programação
 *     description: Retorna detalhes completos de uma programação específica
 *     tags:
 *       - Suprimentos - Programação de Entrega
 *     parameters:
 *       - name: numero
 *         in: path
 *         required: true
 *         description: Número da programação
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes retornados com sucesso
 */
router.get(
  '/:numero',
  optionalApiKeyAuth,
  userRateLimit,
  programacaoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ProgramacaoEntregaController } = await import('./controller');
      await ProgramacaoEntregaController.getDetalhes(req, res, next);
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
