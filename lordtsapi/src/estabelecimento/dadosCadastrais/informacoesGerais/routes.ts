// src/api/estabelecimento/dadosCadastrais/informacoesGerais/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { estabelecimentoParamsSchema } from './validators';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const estabelecimentoCache = cacheMiddleware({
  ttl: 900, // 15 minutos (dados mudam menos)
  keyGenerator: (req) => `estabelecimento:${req.params.estabelecimentoCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * GET /:estabelecimentoCodigo - Busca informações do estabelecimento
 */
router.get(
  '/:estabelecimentoCodigo',
  validate(estabelecimentoParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  estabelecimentoCache,
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