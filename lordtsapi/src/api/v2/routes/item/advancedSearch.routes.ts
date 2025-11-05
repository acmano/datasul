/**
 * Advanced Search Routes - API v2
 * Busca avançada com filtros múltiplos, paginação e ordenação
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { handleValidationErrors } from '@shared/middlewares/validationErrors.middleware';
import { AdvancedSearchController } from '../../controllers/item/advancedSearch.controller';

const router = Router();

/**
 * @openapi
 * /api/v2/item/advanced-search:
 *   get:
 *     summary: Busca avançada de itens com múltiplos filtros
 *     description: |
 *       Permite buscar itens com:
 *       - Texto livre (busca em código e descrição)
 *       - Filtros por família, grupo de estoque, situação
 *       - Ordenação customizada
 *       - Paginação
 *     tags:
 *       - Item - Search (v2)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto para buscar (código ou descrição)
 *         example: "parafuso"
 *       - in: query
 *         name: familia
 *         schema:
 *           type: string
 *         description: Código da família
 *         example: "FAM001"
 *       - in: query
 *         name: grupoEstoque
 *         schema:
 *           type: string
 *         description: Código do grupo de estoque
 *         example: "GRP001"
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [A, I]
 *         description: Situação (A=Ativo, I=Inativo)
 *         example: "A"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [codigo, descricao, familia, grupoEstoque]
 *         description: Campo para ordenação
 *         example: "descricao"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Direção da ordenação
 *         example: "asc"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Itens por página (máx 100)
 *         example: 20
 *     responses:
 *       200:
 *         description: Busca realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *                       description: Filtros aplicados
 *                 correlationId:
 *                   type: string
 *             example:
 *               success: true
 *               data:
 *                 items:
 *                   - codigo: "ITEM001"
 *                     descricao: "Parafuso M8"
 *                     unidade: "UN"
 *                     familia: "FAM001"
 *                   - codigo: "ITEM002"
 *                     descricao: "Parafuso M10"
 *                     unidade: "UN"
 *                     familia: "FAM001"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 45
 *                   totalPages: 3
 *                   hasMore: true
 *                 filters:
 *                   q: "parafuso"
 *                   familia: "FAM001"
 *                   situacao: "A"
 *                   sort: "descricao"
 *                   order: "asc"
 *               correlationId: "req-xyz-789"
 *       400:
 *         description: Parâmetros inválidos
 */
router.get(
  '/',
  [
    query('q')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Busca deve ter entre 2 e 100 caracteres'),

    query('familia')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 16 })
      .withMessage('Código da família inválido'),

    query('grupoEstoque')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 16 })
      .withMessage('Código do grupo de estoque inválido'),

    query('situacao')
      .optional()
      .isIn(['A', 'I'])
      .withMessage('Situação deve ser A (Ativo) ou I (Inativo)'),

    query('sort')
      .optional()
      .isIn(['codigo', 'descricao', 'familia', 'grupoEstoque'])
      .withMessage('Campo de ordenação inválido'),

    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Ordem deve ser asc ou desc'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser número >= 1')
      .toInt(),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
      .toInt(),
  ],
  handleValidationErrors,
  AdvancedSearchController.search
);

export default router;
