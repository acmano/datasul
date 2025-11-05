// src/estabelecimento/listar/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { log } from '@shared/utils/logger';

const router = Router();

const listCache = cacheMiddleware({
  ttl: 3600, // 1 hora (dados mudam pouco)
  keyGenerator: () => 'estabelecimento:list:all',
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Listar todos os estabelecimentos
 *     description: |
 *       Retorna a lista completa de todos os estabelecimentos cadastrados no ERP Datasul.
 *
 *       **Características:**
 *       - Cache de 1 hora para otimização (dados cadastrais mudam pouco)
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Dados ordenados por código
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~200-1000ms (depende da quantidade de registros)
 *
 *       **Casos de Uso:**
 *       - Popular dropdowns/selects em interfaces
 *       - Sincronização de dados cadastrais
 *       - Relatórios multi-empresa
 *       - Integração com sistemas externos
 *       - Dashboards corporativos
 *     tags:
 *       - Estabelecimentos - Dados Cadastrais
 *     parameters:
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
 *         description: Lista de estabelecimentos retornada com sucesso
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
 *                   type: array
 *                   description: Lista de estabelecimentos
 *                   items:
 *                     type: object
 *                     properties:
 *                       codigo:
 *                         type: string
 *                         description: Código do estabelecimento
 *                         example: '01'
 *                       nome:
 *                         type: string
 *                         description: Nome do estabelecimento
 *                         example: 'MATRIZ LORENZETTI'
 *                 total:
 *                   type: number
 *                   description: Quantidade total de estabelecimentos
 *                   example: 15
 *             examples:
 *               listaCompleta:
 *                 summary: Lista de estabelecimentos
 *                 value:
 *                   success: true
 *                   data:
 *                     - codigo: '01'
 *                       nome: 'MATRIZ LORENZETTI'
 *                     - codigo: '02'
 *                       nome: 'FILIAL CEARA'
 *                     - codigo: '03'
 *                       nome: 'FILIAL SAO PAULO'
 *                   total: 3
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
 *               timestamp: '2025-10-24T12:00:00.000Z'
 *               path: '/api/estabelecimento/listar'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/',
  optionalApiKeyAuth,
  userRateLimit,
  listCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ListarController } = await import('./controller');
      await ListarController.listarTodos(req, res, next);
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
        correlationId: (req as any).id,
      });
    }
  }
);

export default router;
