// src/item/empresas/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '@shared/middlewares/validate.middleware';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { itemEmpresasSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const itemEmpresasCache = cacheMiddleware({
  ttl: 600,
  keyGenerator: (req) => {
    const { codigo } = req.query;
    return `itemEmpresas:${codigo}`;
  },
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /empresas:
 *   get:
 *     summary: Buscar empresas onde o item está cadastrado
 *     description: |
 *       Retorna todas as empresas (estabelecimentos) onde um item específico está cadastrado no ERP Datasul.
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
 *
 *       **Casos de Uso:**
 *       - Verificar disponibilidade do item em diferentes empresas
 *       - Integração com sistemas de estoque multi-empresa
 *       - Relatórios de distribuição de itens
 *     tags:
 *       - Itens - Dados Cadastrais
 *     parameters:
 *       - name: codigo
 *         in: query
 *         required: true
 *         description: Código único do item no ERP (1-16 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 16
 *           pattern: '^[A-Za-z0-9]+$'
 *         example: '7530110'
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
 *         description: Lista de empresas retornada com sucesso
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
 *                   properties:
 *                     codigo:
 *                       type: string
 *                       description: Código do item consultado
 *                       example: '7530110'
 *                     empresas:
 *                       type: array
 *                       description: Lista de empresas onde o item existe
 *                       items:
 *                         type: object
 *                         properties:
 *                           codigo:
 *                             type: string
 *                             description: Código da empresa
 *                             example: '01'
 *                           nome:
 *                             type: string
 *                             description: Nome da empresa
 *                             example: 'Matriz São Paulo'
 *                 total:
 *                   type: number
 *                   description: Quantidade total de empresas encontradas
 *                   example: 3
 *             examples:
 *               itemComEmpresas:
 *                 summary: Item cadastrado em múltiplas empresas
 *                 value:
 *                   success: true
 *                   data:
 *                     codigo: '7530110'
 *                     empresas:
 *                       - codigo: '01'
 *                         nome: 'Matriz São Paulo'
 *                       - codigo: '02'
 *                         nome: 'Filial Rio de Janeiro'
 *                       - codigo: '03'
 *                         nome: 'Filial Belo Horizonte'
 *                   total: 3
 *               itemSemEmpresas:
 *                 summary: Item não cadastrado em nenhuma empresa
 *                 value:
 *                   success: true
 *                   data:
 *                     codigo: '7530110'
 *                     empresas: []
 *                   total: 0
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
 *               timestamp: '2025-10-13T12:00:00.000Z'
 *               path: '/api/item/empresas'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/empresas',
  validate(itemEmpresasSchema, 'query'),
  optionalApiKeyAuth,
  userRateLimit,
  itemEmpresasCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ItemEmpresasController } = await import('./controller');
      await ItemEmpresasController.getItemEmpresas(req, res, next);
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
