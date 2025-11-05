// src/estabelecimento/dadosCadastrais/informacoesGerais/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { estabelecimentoParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

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
 * @openapi
 * /:estabelecimentoCodigo:
 *   get:
 *     summary: Buscar informações gerais de um estabelecimento
 *     description: |
 *       Retorna todas as informações cadastrais de um estabelecimento (empresa/filial) do ERP Datasul.
 *
 *       **Características:**
 *       - Cache de 15 minutos para otimização (dados mudam com menos frequência)
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Validação e sanitização automática de parâmetros
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~50-300ms (depende da carga do banco)
 *
 *       **Casos de Uso:**
 *       - Consulta de dados da empresa/filial
 *       - Integração com sistemas de gestão multi-empresa
 *       - Relatórios corporativos
 *       - Sincronização de dados cadastrais
 *     tags:
 *       - Estabelecimentos - Dados Cadastrais
 *     parameters:
 *       - name: estabelecimentoCodigo
 *         in: path
 *         required: true
 *         description: Código do estabelecimento no ERP (1-8 caracteres alfanuméricos)
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 8
 *           pattern: '^[A-Za-z0-9]+$'
 *         example: '01'
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
 *         description: Informações do estabelecimento retornadas com sucesso
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
 *                   description: Dados do estabelecimento
 *             examples:
 *               estabelecimentoMatriz:
 *                 summary: Estabelecimento - Matriz
 *                 value:
 *                   success: true
 *                   data:
 *                     codigo: '01'
 *                     nome: 'Matriz São Paulo'
 *                     cnpj: '12.345.678/0001-90'
 *                     endereco:
 *                       logradouro: 'Rua Principal'
 *                       numero: '1000'
 *                       complemento: 'Edifício Central'
 *                       bairro: 'Centro'
 *                       cidade: 'São Paulo'
 *                       estado: 'SP'
 *                       cep: '01310-100'
 *               estabelecimentoFilial:
 *                 summary: Estabelecimento - Filial
 *                 value:
 *                   success: true
 *                   data:
 *                     codigo: '02'
 *                     nome: 'Filial Rio de Janeiro'
 *                     cnpj: '12.345.678/0002-71'
 *                     endereco:
 *                       logradouro: 'Avenida Atlântica'
 *                       numero: '2000'
 *                       complemento: ''
 *                       bairro: 'Copacabana'
 *                       cidade: 'Rio de Janeiro'
 *                       estado: 'RJ'
 *                       cep: '22021-001'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Estabelecimento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: 'EstabelecimentoNotFoundError'
 *               message: 'Estabelecimento 01 não encontrado no sistema'
 *               timestamp: '2025-10-13T12:00:00.000Z'
 *               path: '/api/estabelecimento/dadosCadastrais/informacoesGerais/01'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
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
 *               path: '/api/estabelecimento/dadosCadastrais/informacoesGerais/01'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/:estabelecimentoCodigo',
  validate(estabelecimentoParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  estabelecimentoCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { InformacoesGeraisController } = await import('./controller');

      await InformacoesGeraisController.getInformacoesGerais(req, res, next);
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
