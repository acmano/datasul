// src/item/extensao/routes.ts

import { Router } from 'express';
import { ItemExtensaoController } from './controller';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

const router = Router();

const listCache = cacheMiddleware({
  ttl: 3600, // 1 hora (dados mudam pouco)
  keyGenerator: () => 'item:extensao:list:all',
  condition: (req, res) => res.statusCode === 200,
});

const extensaoCache = cacheMiddleware({
  ttl: 600, // 10 minutos (dados de dimensões mudam raramente)
  keyGenerator: (req) => `item:extensao:${req.params.itemCodigo}`,
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Listar todas as extensões de itens
 *     description: |
 *       Retorna a lista completa de todos os itens com extensão cadastrados no ERP Datasul.
 *
 *       **Características:**
 *       - Cache de 1 hora para otimização
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Dados ordenados por código do item
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~500-2000ms (depende da quantidade de registros)
 *
 *       **Casos de Uso:**
 *       - Exportação em massa de dados de dimensões
 *       - Sincronização com sistemas WMS
 *       - Relatórios de cubagem completos
 *       - Análises de logística
 *     tags:
 *       - Item - Extensão
 *     parameters:
 *       - name: X-Correlation-ID
 *         in: header
 *         required: false
 *         description: ID de correlação para rastreamento
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: X-API-Key
 *         in: header
 *         required: false
 *         description: API Key para autenticação
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de extensões retornada com sucesso
 *         headers:
 *           X-Correlation-ID:
 *             description: ID de correlação
 *             schema:
 *               type: string
 *           X-Cache:
 *             description: Status do cache
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
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
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemcod:
 *                         type: string
 *                         example: '7530110'
 *                       pecaaltura:
 *                         type: number
 *                         example: 15.5
 *                       pecalargura:
 *                         type: number
 *                         example: 20.0
 *                 total:
 *                   type: number
 *                   description: Quantidade total de itens
 *                   example: 1500
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', optionalApiKeyAuth, userRateLimit, listCache, ItemExtensaoController.listarTodos);

/**
 * @openapi
 * /{itemCodigo}:
 *   get:
 *     summary: Obter dados de extensão do item
 *     description: |
 *       Retorna informações completas de extensão de um item específico, incluindo:
 *       - Dimensões da peça (altura, largura, profundidade, peso)
 *       - Dados da embalagem do item
 *       - Dados IVV (Item Volume/Variante)
 *       - Dados da embalagem do produto
 *       - Códigos de barras (EAN/GTIN-13, DUN/GTIN-14)
 *       - Dimensões SKU
 *       - Quantidades e organização (lastro, camada, etc.)
 *
 *       **Características:**
 *       - Cache de 10 minutos
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~50-200ms
 *
 *       **Casos de Uso:**
 *       - Sistemas de logística e expedição
 *       - Cálculo de frete e cubagem
 *       - Planejamento de armazenagem
 *       - Geração de etiquetas com código de barras
 *       - Integração com WMS
 *     tags:
 *       - Item - Extensão
 *     parameters:
 *       - name: itemCodigo
 *         in: path
 *         required: true
 *         description: Código do item
 *         schema:
 *           type: string
 *           example: '7530110'
 *       - name: X-Correlation-ID
 *         in: header
 *         required: false
 *         description: ID de correlação para rastreamento
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: X-API-Key
 *         in: header
 *         required: false
 *         description: API Key para autenticação
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados de extensão retornados com sucesso
 *         headers:
 *           X-Correlation-ID:
 *             description: ID de correlação
 *             schema:
 *               type: string
 *           X-Cache:
 *             description: Status do cache
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
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
 *                     itemcod:
 *                       type: string
 *                       description: Código do item
 *                       example: '7530110'
 *                     pecaaltura:
 *                       type: number
 *                       description: Altura da peça (cm)
 *                       example: 15.5
 *                     pecalargura:
 *                       type: number
 *                       description: Largura da peça (cm)
 *                       example: 20.0
 *                     pecaprof:
 *                       type: number
 *                       description: Profundidade da peça (cm)
 *                       example: 10.0
 *                     pecapeso:
 *                       type: number
 *                       description: Peso da peça (kg)
 *                       example: 2.5
 *                     itembalt:
 *                       type: number
 *                       description: Altura da embalagem do item (cm)
 *                       example: 16.0
 *                     itemblarg:
 *                       type: number
 *                       description: Largura da embalagem do item (cm)
 *                       example: 21.0
 *                     itembprof:
 *                       type: number
 *                       description: Profundidade da embalagem do item (cm)
 *                       example: 11.0
 *                     itembpeso:
 *                       type: number
 *                       description: Peso da embalagem do item (kg)
 *                       example: 2.8
 *                     itemvalt:
 *                       type: number
 *                       description: Altura IVV (cm)
 *                       example: 16.5
 *                     itemvlarg:
 *                       type: number
 *                       description: Largura IVV (cm)
 *                       example: 21.5
 *                     itemvprof:
 *                       type: number
 *                       description: Profundidade IVV (cm)
 *                       example: 11.5
 *                     itemvpeso:
 *                       type: number
 *                       description: Peso IVV (kg)
 *                       example: 3.0
 *                     pecasitem:
 *                       type: number
 *                       description: Quantidade de peças por item
 *                       example: 1
 *                     prodebalt:
 *                       type: number
 *                       description: Altura da embalagem do produto (cm)
 *                       example: 50.0
 *                     prodeblarg:
 *                       type: number
 *                       description: Largura da embalagem do produto (cm)
 *                       example: 60.0
 *                     prodebprof:
 *                       type: number
 *                       description: Profundidade da embalagem do produto (cm)
 *                       example: 40.0
 *                     prodebpeso:
 *                       type: number
 *                       description: Peso da embalagem do produto (kg)
 *                       example: 15.0
 *                     prodgtin13:
 *                       type: string
 *                       description: Código de barras EAN (GTIN-13)
 *                       example: '7891234567890'
 *                     caixagtin14:
 *                       type: string
 *                       description: Código de barras DUN (GTIN-14)
 *                       example: '17891234567897'
 *                     prodvalt:
 *                       type: number
 *                       description: Altura do SKU (cm)
 *                       example: 17.0
 *                     prodvlarg:
 *                       type: number
 *                       description: Largura do SKU (cm)
 *                       example: 22.0
 *                     prodvprof:
 *                       type: number
 *                       description: Profundidade do SKU (cm)
 *                       example: 12.0
 *                     prodvpeso:
 *                       type: number
 *                       description: Peso do SKU (kg)
 *                       example: 3.2
 *                     itensprod:
 *                       type: number
 *                       description: Quantidade de itens por produto
 *                       example: 6
 *                     prodscaixa:
 *                       type: number
 *                       description: Quantidade de produtos por caixa
 *                       example: 4
 *                     lastro:
 *                       type: number
 *                       description: Produtos por camada (lastro)
 *                       example: 8
 *                     camada:
 *                       type: number
 *                       description: Número de camadas
 *                       example: 5
 *                     embcod:
 *                       type: string
 *                       description: Código da embalagem
 *                       example: 'CX01'
 *                 correlationId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:itemCodigo',
  optionalApiKeyAuth,
  userRateLimit,
  extensaoCache,
  ItemExtensaoController.getByCodigo
);

export default router;
