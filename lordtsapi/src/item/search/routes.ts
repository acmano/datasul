// src/item/search/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '@shared/middlewares/validate.middleware';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { itemSearchSchema } from './validators';
import { log } from '@shared/utils/logger';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const itemSearchCache = cacheMiddleware({
  ttl: 600,
  keyGenerator: (req) => {
    const params = req.query;
    const sortedKeys = Object.keys(params).sort();
    const keyParts = sortedKeys.map((key) => `${key}=${params[key]}`);
    return `itemSearch:${keyParts.join('|')}`;
  },
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Buscar itens por múltiplos critérios
 *     description: |
 *       Permite buscar itens no ERP Datasul usando diferentes critérios de pesquisa.
 *       Pelo menos um critério de busca deve ser informado.
 *
 *       **Características:**
 *       - Cache de 10 minutos para otimização
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Validação e sanitização automática de parâmetros
 *       - Suporta busca por código, família, família comercial, grupo de estoque e GTIN
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~100-800ms (depende dos filtros e quantidade de resultados)
 *
 *       **Casos de Uso:**
 *       - Buscar itens de uma família específica
 *       - Localizar item por código de barras (GTIN/EAN)
 *       - Filtrar itens por grupo de estoque
 *       - Combinar múltiplos critérios para busca refinada
 *     tags:
 *       - Itens - Dados Cadastrais
 *     parameters:
 *       - name: codigo
 *         in: query
 *         required: false
 *         description: Código do item (1-16 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 16
 *           pattern: '^[A-Za-z0-9]+$'
 *         example: '7530110'
 *       - name: familia
 *         in: query
 *         required: false
 *         description: Código da família (1-8 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 8
 *           pattern: '^[A-Za-z0-9]+$'
 *         example: '450000'
 *       - name: familiaComercial
 *         in: query
 *         required: false
 *         description: Código da família comercial (1-8 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 8
 *           pattern: '^[A-Za-z0-9]+$'
 *         example: 'A02001'
 *       - name: grupoEstoque
 *         in: query
 *         required: false
 *         description: Código do grupo de estoque (1-8 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 8
 *           pattern: '^[A-Za-z0-9]+$'
 *         example: '40'
 *       - name: gtin
 *         in: query
 *         required: false
 *         description: Código GTIN/EAN (13 ou 14 dígitos numéricos)
 *         schema:
 *           type: string
 *           minLength: 13
 *           maxLength: 14
 *           pattern: '^[0-9]{13,14}$'
 *         example: '7896451824813'
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
 *         description: Itens encontrados com sucesso
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
 *                 criteriosDeBusca:
 *                   type: object
 *                   description: Critérios de busca utilizados
 *                   properties:
 *                     codigo:
 *                       type: string
 *                       example: ''
 *                     familia:
 *                       type: string
 *                       example: '450000'
 *                     familiaComercial:
 *                       type: string
 *                       example: ''
 *                     grupoEstoque:
 *                       type: string
 *                       example: ''
 *                     gtin:
 *                       type: string
 *                       example: ''
 *                 data:
 *                   type: array
 *                   description: Lista de itens encontrados
 *                   items:
 *                     type: object
 *                     properties:
 *                       item:
 *                         type: object
 *                         properties:
 *                           codigo:
 *                             type: string
 *                             example: '7530110'
 *                           descricao:
 *                             type: string
 *                             example: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                           unidade:
 *                             type: string
 *                             example: 'UN'
 *                           gtin13:
 *                             type: string
 *                             nullable: true
 *                             example: '7896451824813'
 *                           gtin14:
 *                             type: string
 *                             nullable: true
 *                             example: '17896451824813'
 *                           familia:
 *                             type: object
 *                             properties:
 *                               codigo:
 *                                 type: string
 *                                 example: '450000'
 *                               descricao:
 *                                 type: string
 *                                 example: 'VALVULAS'
 *                           familiaComercial:
 *                             type: object
 *                             properties:
 *                               codigo:
 *                                 type: string
 *                                 example: 'A02001'
 *                               descricao:
 *                                 type: string
 *                                 example: 'PRODUTOS INDUSTRIAIS'
 *                           grupoDeEstoque:
 *                             type: object
 *                             properties:
 *                               codigo:
 *                                 type: string
 *                                 example: '40'
 *                               descricao:
 *                                 type: string
 *                                 example: 'MATERIAIS HIDRAULICOS'
 *                 total:
 *                   type: number
 *                   description: Quantidade total de itens encontrados
 *                   example: 3
 *             examples:
 *               buscaPorFamilia:
 *                 summary: Busca por família
 *                 value:
 *                   success: true
 *                   criteriosDeBusca:
 *                     codigo: ''
 *                     familia: '450000'
 *                     familiaComercial: ''
 *                     grupoEstoque: ''
 *                     gtin: ''
 *                   data:
 *                     - item:
 *                         codigo: '7530110'
 *                         descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                         unidade: 'UN'
 *                         gtin13: '7896451824813'
 *                         gtin14: null
 *                         familia:
 *                           codigo: '450000'
 *                           descricao: 'VALVULAS'
 *                         familiaComercial:
 *                           codigo: 'A02001'
 *                           descricao: 'PRODUTOS INDUSTRIAIS'
 *                         grupoDeEstoque:
 *                           codigo: '40'
 *                           descricao: 'MATERIAIS HIDRAULICOS'
 *                     - item:
 *                         codigo: '7530120'
 *                         descricao: 'VALVULA DE ESFERA 3/4" BRONZE'
 *                         unidade: 'UN'
 *                         gtin13: '7896451824820'
 *                         gtin14: null
 *                         familia:
 *                           codigo: '450000'
 *                           descricao: 'VALVULAS'
 *                         familiaComercial:
 *                           codigo: 'A02001'
 *                           descricao: 'PRODUTOS INDUSTRIAIS'
 *                         grupoDeEstoque:
 *                           codigo: '40'
 *                           descricao: 'MATERIAIS HIDRAULICOS'
 *                   total: 2
 *               buscaPorGTIN:
 *                 summary: Busca por código de barras
 *                 value:
 *                   success: true
 *                   criteriosDeBusca:
 *                     codigo: ''
 *                     familia: ''
 *                     familiaComercial: ''
 *                     grupoEstoque: ''
 *                     gtin: '7896451824813'
 *                   data:
 *                     - item:
 *                         codigo: '7530110'
 *                         descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                         unidade: 'UN'
 *                         gtin13: '7896451824813'
 *                         gtin14: null
 *                         familia:
 *                           codigo: '450000'
 *                           descricao: 'VALVULAS'
 *                         familiaComercial:
 *                           codigo: 'A02001'
 *                           descricao: 'PRODUTOS INDUSTRIAIS'
 *                         grupoDeEstoque:
 *                           codigo: '40'
 *                           descricao: 'MATERIAIS HIDRAULICOS'
 *                   total: 1
 *               nenhumResultado:
 *                 summary: Nenhum item encontrado
 *                 value:
 *                   success: true
 *                   criteriosDeBusca:
 *                     codigo: 'INEXISTENTE'
 *                     familia: ''
 *                     familiaComercial: ''
 *                     grupoEstoque: ''
 *                     gtin: ''
 *                   data: []
 *                   total: 0
 *       400:
 *         description: Requisição inválida - Parâmetros faltando ou inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               nenhumParametro:
 *                 summary: Nenhum parâmetro informado
 *                 value:
 *                   error: 'ValidationError'
 *                   message: 'Pelo menos um parâmetro de busca deve ser informado'
 *                   timestamp: '2025-10-13T12:00:00.000Z'
 *                   path: '/api/item/search'
 *                   correlationId: '550e8400-e29b-41d4-a716-446655440000'
 *               gtinInvalido:
 *                 summary: GTIN com formato inválido
 *                 value:
 *                   error: 'ValidationError'
 *                   message: 'GTIN deve ter 13 ou 14 dígitos numéricos'
 *                   timestamp: '2025-10-13T12:00:00.000Z'
 *                   path: '/api/item/search'
 *                   correlationId: '550e8400-e29b-41d4-a716-446655440000'
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
 *               path: '/api/item/search'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/search',
  validate(itemSearchSchema, 'query'),
  optionalApiKeyAuth,
  userRateLimit,
  itemSearchCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ItemSearchController } = await import('./controller');
      await ItemSearchController.searchItems(req, res, next);
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
