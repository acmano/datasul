// src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { grupoDeEstoqueParamsSchema } from '../validators/informacoesGerais.validators';

/**
 * Rotas de Informações Gerais de Grupos de Estoque
 * @module InformacoesGeraisRoutes
 * @category Routes
 */

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const grupoDeEstoqueCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `grupoDeEstoque:${req.params.grupoDeEstoqueCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /:grupoDeEstoqueCodigo:
 *   get:
 *     summary: Buscar informações gerais de um grupo de estoque
 *     description: |
 *       Retorna todas as informações cadastrais de um grupo de estoque do ERP Datasul.
 *
 *       **Características:**
 *       - Cache de 10 minutos para otimização
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Validação e sanitização automática de parâmetros
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~50-500ms (depende da carga do banco)
 *     tags:
 *       - Grupos de Estoque - Dados Cadastrais
 *     parameters:
 *       - name: grupoDeEstoqueCodigo
 *         in: path
 *         required: true
 *         description: Código do grupo de estoque no ERP (2 dígitos numéricos)
 *         schema:
 *           type: numeric
 *           minLength: 2
 *           maxLength: 2
 *           pattern: '^[0-9]+$'
 *           example: '45'
 *       - name: X-Correlation-ID
 *         in: header
 *         required: false
 *         description: ID de correlação para rastreamento (gerado automaticamente se omitido)
 *         schema:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *       - name: X-API-Key
 *         in: header
 *         required: false
 *         description: API Key para autenticação e rate limiting personalizado
 *         schema:
 *           type: string
 *           example: 'api_key_premium_abc123xyz789'
 *     responses:
 *       200:
 *         description: Informações gerais do grupo de estoque retornadas com sucesso
 *         headers:
 *           X-Correlation-ID:
 *             description: ID de correlação para rastreamento
 *             schema:
 *               type: string
 *               format: uuid
 *           X-Cache:
 *             description: Status do cache (HIT ou MISS)
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
 *                   description: Dados do grupo de estoque
 *             examples:
 *               grupoDeEstoqueCompleto:
 *                 summary: Grupo de Estoque com todos os dados
 *                 value:
 *                   success: true
 *                   data:
 *                     identificacaoGrupoDeEstoqueCodigo: '45'
 *                     identificacaoGrupoDeEstoqueDescricao: 'GRUPO TESTE'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *       504:
 *         description: Gateway Timeout - Requisição excedeu o tempo limite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: 'Timeout da requisição'
 *               message: 'A consulta ao banco de dados demorou mais de 30 segundos'
 *               timestamp: '2025-10-04T17:00:00.000Z'
 *               path: '/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/45'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/:grupoDeEstoqueCodigo',
  validate(grupoDeEstoqueParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  grupoDeEstoqueCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { InformacoesGeraisController } = await import(
        '../controller/informacoesGerais.controller'
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