// src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { itemParamsSchema } from './validators';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const itemCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `item:${req.params.itemCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * GET /:itemCodigo - Busca informações gerais do item com estrutura aninhada
 * 
 * Retorna:
 * {
 *   item: { codigo, descricao, unidade },
 *   familia: { codigo, descricao } | null,
 *   familiaComercial: { codigo, descricao } | null,
 *   grupoDeEstoque: { codigo, descricao } | null,
 *   estabelecimentos: [{ codigo }]
 * }
 */
router.get(
  '/:itemCodigo',
  validate(itemParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  itemCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { InformacoesGeraisController } = await import(
        './controller'
      );

      await InformacoesGeraisController.getInformacoesGerais(req, res, next);
    } catch (error) {
      console.error('Erro ao carregar controller:', error);
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