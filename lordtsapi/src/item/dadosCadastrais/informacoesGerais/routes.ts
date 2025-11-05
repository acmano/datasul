// src/api/item/dadosCadastrais/informacoesGerais/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { itemParamsSchema } from './validators';
import { log } from '@shared/utils/logger';

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
 * @openapi
 * /:itemCodigo:
 *   get:
 *     summary: Buscar informações gerais completas de um item
 *     description: |
 *       Retorna todas as informações cadastrais gerais de um item do ERP Datasul,
 *       incluindo dados do item, família, família comercial, grupo de estoque e estabelecimentos.
 *
 *       **Características:**
 *       - Cache de 10 minutos para otimização
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Validação e sanitização automática de parâmetros
 *       - Estrutura de dados aninhada para fácil consumo
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~100-600ms (depende da carga do banco)
 *
 *       **Casos de Uso:**
 *       - Visualização completa de dados cadastrais do item
 *       - Integração com sistemas de estoque
 *       - Relatórios e análises de produtos
 *       - Sincronização de dados entre sistemas
 *     tags:
 *       - Itens - Dados Cadastrais
 *     parameters:
 *       - name: itemCodigo
 *         in: path
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
 *                   properties:
 *                     item:
 *                       type: object
 *                       description: Dados básicos do item
 *                       properties:
 *                         codigo:
 *                           type: string
 *                           description: Código do item
 *                           example: '7530110'
 *                         descricao:
 *                           type: string
 *                           description: Descrição do item
 *                           example: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                         unidade:
 *                           type: string
 *                           description: Unidade de medida padrão
 *                           example: 'UN'
 *                         status:
 *                           type: string
 *                           description: Status do item
 *                           example: 'Ativo'
 *                         estabelecimentoPadraoCodigo:
 *                           type: string
 *                           description: Código do estabelecimento padrão
 *                           example: '101'
 *                         dataImplantacao:
 *                           type: string
 *                           nullable: true
 *                           description: Data de implantação (formato DD/MM/YYYY)
 *                           example: '01/01/2024'
 *                         dataLiberacao:
 *                           type: string
 *                           nullable: true
 *                           description: Data de liberação (formato DD/MM/YYYY)
 *                           example: '01/01/2024'
 *                         dataObsolescencia:
 *                           type: string
 *                           nullable: true
 *                           description: Data de obsolescência (formato DD/MM/YYYY)
 *                           example: null
 *                         endereco:
 *                           type: string
 *                           description: Endereço/localização física do item
 *                           example: 'A-12-34'
 *                         descricaoResumida:
 *                           type: string
 *                           description: Descrição resumida do item
 *                           example: 'VALVULA 1/2"'
 *                         descricaoAlternativa:
 *                           type: string
 *                           description: Descrição alternativa do item
 *                           example: 'ESFERA BRONZE'
 *                         contenedor:
 *                           type: object
 *                           nullable: true
 *                           description: Dados do contenedor/embalagem
 *                           properties:
 *                             codigo:
 *                               type: string
 *                               description: Código do tipo de contenedor
 *                               example: '001'
 *                             descricao:
 *                               type: string
 *                               description: Descrição do tipo de contenedor
 *                               example: 'CAIXA PAPELAO'
 *                     familia:
 *                       type: object
 *                       nullable: true
 *                       description: Dados da família (null se não vinculado)
 *                       properties:
 *                         codigo:
 *                           type: string
 *                           example: '450000'
 *                         descricao:
 *                           type: string
 *                           example: 'VALVULAS'
 *                     familiaComercial:
 *                       type: object
 *                       nullable: true
 *                       description: Dados da família comercial (null se não vinculado)
 *                       properties:
 *                         codigo:
 *                           type: string
 *                           example: 'A02001'
 *                         descricao:
 *                           type: string
 *                           example: 'PRODUTOS INDUSTRIAIS'
 *                     grupoDeEstoque:
 *                       type: object
 *                       nullable: true
 *                       description: Dados do grupo de estoque (null se não vinculado)
 *                       properties:
 *                         codigo:
 *                           type: string
 *                           example: '40'
 *                         descricao:
 *                           type: string
 *                           example: 'MATERIAIS HIDRAULICOS'
 *                     estabelecimentos:
 *                       type: array
 *                       description: Lista de estabelecimentos onde o item existe
 *                       items:
 *                         type: object
 *                         properties:
 *                           codigo:
 *                             type: string
 *                             example: '01'
 *                           nome:
 *                             type: string
 *                             example: 'LORENZETTI SA'
 *             examples:
 *               itemCompleto:
 *                 summary: Item com todos os vínculos e dados completos
 *                 value:
 *                   success: true
 *                   data:
 *                     item:
 *                       codigo: '7530110'
 *                       descricao: 'MAXI DUCHA 127V 3200W C/21'
 *                       unidade: 'PC'
 *                       status: 'Ativo'
 *                       estabelecimentoPadraoCodigo: '101'
 *                       dataImplantacao: '01/01/2024'
 *                       dataLiberacao: '01/01/2024'
 *                       dataObsolescencia: null
 *                       endereco: 'A-12-34'
 *                       descricaoResumida: 'MAXI DUCHA 127V'
 *                       descricaoAlternativa: 'DUCHA ELETRICA'
 *                       contenedor:
 *                         codigo: '001'
 *                         descricao: 'CAIXA PAPELAO'
 *                     familia:
 *                       codigo: '400102'
 *                       descricao: 'MAXI DUCHA'
 *                     familiaComercial:
 *                       codigo: 'A02001'
 *                       descricao: 'MAXI DUCHA'
 *                     grupoDeEstoque:
 *                       codigo: '40'
 *                       descricao: 'PRODUTOS ACABADOS'
 *                     estabelecimentos:
 *                       - codigo: '101'
 *                         nome: 'LORENZETTI SA IND BRAS ELETROMETALURGICA'
 *                       - codigo: '121'
 *                         nome: 'LORENZETTI SA IND BRAS ELETROMETALURGICA'
 *               itemSemVinculos:
 *                 summary: Item sem vínculos opcionais
 *                 value:
 *                   success: true
 *                   data:
 *                     item:
 *                       codigo: '7530110'
 *                       descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                       unidade: 'UN'
 *                       status: 'Ativo'
 *                     familia: null
 *                     familiaComercial: null
 *                     grupoDeEstoque: null
 *                     estabelecimentos: []
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: 'ItemNotFoundError'
 *               message: 'Item 7530110 não encontrado no sistema'
 *               timestamp: '2025-10-13T12:00:00.000Z'
 *               path: '/api/item/dadosCadastrais/informacoesGerais/7530110'
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
 *               path: '/api/item/dadosCadastrais/informacoesGerais/7530110'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/:itemCodigo',
  validate(itemParamsSchema, 'params'),
  optionalApiKeyAuth,
  userRateLimit,
  itemCache,
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
