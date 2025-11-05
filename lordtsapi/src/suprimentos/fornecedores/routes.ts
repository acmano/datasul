/**
 * Routes - Suprimentos Fornecedores
 *
 * Definição de rotas para endpoints de fornecedores
 *
 * Em desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { fornecedorParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const fornecedorCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `suprimentos:fornecedor:${req.params.codigo || 'list'}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /api/suprimentos/fornecedores/{codigo}:
 *   get:
 *     summary: Buscar dados de fornecedor por código
 *     description: |
 *       Retorna dados completos de um fornecedor do ERP Datasul.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Definir estrutura de dados e query após levantamento de requisitos
 *     tags:
 *       - Suprimentos - Fornecedores
 *     parameters:
 *       - name: codigo
 *         in: path
 *         required: true
 *         description: Código do fornecedor
 *         schema:
 *           type: string
 *       - name: X-Correlation-ID
 *         in: header
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados do fornecedor encontrados com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Fornecedor não encontrado
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:codigo',
  validate(fornecedorParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  fornecedorCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { FornecedorController } = await import('./controller');
      await FornecedorController.getFornecedor(req, res, next);
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
 * /api/suprimentos/fornecedores:
 *   get:
 *     summary: Listar todos os fornecedores
 *     description: |
 *       Retorna listagem de fornecedores.
 *
 *       **Status:** Em desenvolvimento
 *
 *       **TODO:** Implementar paginação e filtros
 *     tags:
 *       - Suprimentos - Fornecedores
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
  fornecedorCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { FornecedorController } = await import('./controller');
      await FornecedorController.listFornecedores(req, res, next);
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
 * /api/suprimentos/fornecedores/{codigo}/itens:
 *   get:
 *     summary: Buscar itens fornecidos por um fornecedor
 *     description: Retorna lista de itens que o fornecedor pode fornecer
 *     tags:
 *       - Suprimentos - Fornecedores
 *     parameters:
 *       - name: codigo
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itens retornados com sucesso
 */
router.get(
  '/:codigo/itens',
  validate(fornecedorParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  fornecedorCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { FornecedorController } = await import('./controller');
      await FornecedorController.getItensFornecidos(req, res, next);
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
