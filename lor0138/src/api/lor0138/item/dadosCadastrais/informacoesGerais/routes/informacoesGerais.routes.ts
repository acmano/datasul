// src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

/**
 * @fileoverview Rotas de Informações Gerais de Itens
 *
 * Define os endpoints para consulta de informações cadastrais de itens
 * do ERP Totvs Datasul/Progress através do SQL Server com Linked Server.
 *
 * **Arquitetura da Rota:**
 * ```
 * Camada de Proteção e Otimização:
 * 1. optionalApiKeyAuth    → Autentica se tiver API Key (opcional)
 * 2. userRateLimit         → Rate limit por usuário/tier ou IP
 * 3. itemCache             → Cache HTTP de resposta
 * 4. Controller            → Lógica de negócio
 * ```
 *
 * **Endpoints Disponíveis:**
 * - GET /:itemCodigo - Busca informações gerais de um item
 *
 * **Middlewares Aplicados:**
 * - **optionalApiKeyAuth**: Autenticação opcional por API Key
 *   - Se presente: autentica e aplica rate limit por tier
 *   - Se ausente: permite acesso com rate limit por IP
 *
 * - **userRateLimit**: Rate limiting inteligente
 *   - Com API Key: limit baseado no tier do usuário
 *   - Sem API Key: limit padrão por IP
 *
 * - **itemCache**: Cache HTTP de respostas
 *   - TTL: 10 minutos (600s)
 *   - Chave: GET:/api/.../:itemCodigo
 *   - Invalida automaticamente após TTL
 *
 * **Integração com Swagger:**
 * Documentação OpenAPI completa com:
 * - Parâmetros (itemCodigo)
 * - Headers (X-Correlation-ID, X-API-Key)
 * - Respostas (200, 400, 404, 429, 500, 504)
 * - Exemplos de request/response
 *
 * @module InformacoesGeraisRoutes
 * @category Routes
 */

// ============================================================================
// CONFIGURAÇÃO DO ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// MIDDLEWARES ESPECÍFICOS
// ============================================================================

/**
 * Middleware de cache para rotas de item
 *
 * Configuração:
 * - TTL: 600 segundos (10 minutos)
 * - Chave: GET:/api/.../itemCodigo
 * - Condição: Apenas status 200
 *
 * @constant
 * @private
 */
const itemCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => `item:${req.params.itemCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * GET /:itemCodigo - Busca informações gerais de um item
 *
 * Endpoint principal que retorna todas as informações cadastrais de um item:
 * - Dados gerais (código, descrição, unidade, pesos)
 * - Unidades de medida alternativas
 * - Estabelecimentos onde o item está cadastrado
 * - Estoque por estabelecimento
 *
 * **Fluxo de Requisição:**
 * ```
 * Cliente → optionalApiKeyAuth → userRateLimit → itemCache → Controller
 *                                                     ↓
 *                                                  Service
 *                                                     ↓
 *                                                Repository
 *                                                     ↓
 *                                              DatabaseManager
 *                                                     ↓
 *                                          SQL Server (Linked Server)
 *                                                     ↓
 *                                              Progress/Datasul
 * ```
 *
 * **Validações Aplicadas:**
 * 1. itemCodigo é obrigatório
 * 2. itemCodigo é string
 * 3. itemCodigo ≤ 16 caracteres
 * 4. itemCodigo contém apenas A-Z, a-z, 0-9
 * 5. Sanitização contra SQL injection
 * 6. Sanitização contra XSS
 *
 * **Rate Limiting:**
 * - Com API Key Free: 10 req/min
 * - Com API Key Premium: 60 req/min
 * - Com API Key Enterprise: 300 req/min
 * - Sem API Key: 10 req/min por IP
 *
 * **Cache:**
 * - Cache HIT: < 1ms (resposta instantânea)
 * - Cache MISS: ~50-500ms (depende do banco)
 * - Invalidação: Automática após 10 minutos
 *
 * @route GET /:itemCodigo
 * @group Itens - Dados Cadastrais
 * @param {string} itemCodigo.path.required - Código do item (1-16 caracteres)
 * @returns {object} 200 - Informações gerais do item
 * @returns {Error} 400 - Código inválido
 * @returns {Error} 404 - Item não encontrado
 * @returns {Error} 429 - Rate limit excedido
 * @returns {Error} 500 - Erro interno
 * @returns {Error} 504 - Timeout
 *
 * @openapi
 * /:itemCodigo:
 *   get:
 *     summary: Buscar informações gerais de um item
 *     description: |
 *       Retorna todas as informações cadastrais de um item do ERP Datasul,
 *       incluindo dados gerais, unidades de medida e estabelecimentos.
 *
 *       **Características:**
 *       - Cache de 10 minutos para otimização
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~50-500ms (depende da carga do banco)
 *     tags:
 *       - Itens - Dados Cadastrais
 *     parameters:
 *       - name: itemCodigo
 *         in: path
 *         required: true
 *         description: Código do item no ERP (1-16 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 16
 *           pattern: '^[A-Za-z0-9]+$'
 *           example: '7530110'
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
 *         description: Informações gerais do item retornadas com sucesso
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
 *                   description: Dados do item
 *             examples:
 *               itemCompleto:
 *                 summary: Item com todos os dados e estabelecimentos
 *                 value:
 *                   success: true
 *                   data:
 *                     identificacaoItemCodigo: '7530110'
 *                     identificacaoItemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                     identificacaoItemUnidade: 'UN'
 *                     identificacaoItemPesoLiquido: 0.150
 *                     identificacaoItemPesoBruto: 0.200
 *                     identificacaoItensUnidadesMedida:
 *                       - unidade: 'UN'
 *                         fatorConversao: 1.0
 *                         descricao: 'Unidade'
 *                       - unidade: 'CX'
 *                         fatorConversao: 12.0
 *                         descricao: 'Caixa com 12 unidades'
 *                     identificacaoItensEstabelecimentos:
 *                       - codigo: '01.01'
 *                         nome: 'CD São Paulo'
 *                         ativo: true
 *                         estoqueAtual: 1500.0
 *                         estoqueMinimo: 100.0
 *                         localEstoque: 'A-12-03'
 *                       - codigo: '02.01'
 *                         nome: 'Fábrica Joinville'
 *                         ativo: true
 *                         estoqueAtual: 3200.0
 *                         estoqueMinimo: 500.0
 *                         localEstoque: 'B-05-12'
 *               itemSemEstabelecimentos:
 *                 summary: Item sem estabelecimentos cadastrados
 *                 value:
 *                   success: true
 *                   data:
 *                     identificacaoItemCodigo: '7530110'
 *                     identificacaoItemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                     identificacaoItemUnidade: 'UN'
 *                     identificacaoItemPesoLiquido: 0.150
 *                     identificacaoItemPesoBruto: 0.200
 *                     identificacaoItensUnidadesMedida:
 *                       - unidade: 'UN'
 *                         fatorConversao: 1.0
 *                         descricao: 'Unidade'
 *                     identificacaoItensEstabelecimentos: []
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
 *               path: '/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/:itemCodigo',
  optionalApiKeyAuth, // Autenticação opcional por API Key
  userRateLimit, // Rate limit por usuário/tier ou IP
  itemCache, // Cache HTTP de resposta
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Importação dinâmica do controller
      // Evita problemas de dependências circulares
      const { InformacoesGeraisController } = await import(
        '../controller/informacoesGerais.controller'
      );

      // Delega para o controller
      // Controller usa asyncHandler que captura erros automaticamente
      await InformacoesGeraisController.getInformacoesGerais(req, res, next);
    } catch (error) {
      // Erro inesperado no carregamento do controller
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

// ============================================================================
// EXPORT
// ============================================================================

export default router;