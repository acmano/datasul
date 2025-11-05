/**
 * Bulk Operations for Items - API v2
 * Permite buscar múltiplos itens em uma única requisição
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidationErrors } from '@shared/middlewares/validationErrors.middleware';
import { BulkItemController } from '../../controllers/item/bulk.controller';

const router = Router();

/**
 * @openapi
 * /api/v2/item/bulk:
 *   post:
 *     summary: Busca múltiplos itens em uma requisição
 *     description: |
 *       Retorna dados de múltiplos itens de uma vez.
 *       Máximo: 100 itens por requisição.
 *     tags:
 *       - Item - Bulk Operations (v2)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigos
 *             properties:
 *               codigos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 100
 *                 example: ["ITEM001", "ITEM002", "ITEM003"]
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Campos específicos a retornar (opcional)
 *                 example: ["codigo", "descricao", "unidade"]
 *     responses:
 *       200:
 *         description: Itens retornados com sucesso
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     notFound:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Códigos não encontrados
 *                     count:
 *                       type: integer
 *                       description: Total de itens encontrados
 *                 correlationId:
 *                   type: string
 *             example:
 *               success: true
 *               data:
 *                 items:
 *                   - codigo: "ITEM001"
 *                     descricao: "Produto A"
 *                     unidade: "UN"
 *                   - codigo: "ITEM002"
 *                     descricao: "Produto B"
 *                     unidade: "KG"
 *                 notFound: ["ITEM999"]
 *                 count: 2
 *               correlationId: "req-abc-123"
 *       400:
 *         description: Validação falhou
 *       429:
 *         description: Rate limit excedido
 */
router.post(
  '/',
  [
    body('codigos')
      .isArray({ min: 1, max: 100 })
      .withMessage('codigos deve ser array com 1-100 itens'),
    body('codigos.*')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Cada código deve ser string não-vazia')
      .isLength({ max: 16 })
      .withMessage('Código não pode ter mais de 16 caracteres'),
    body('fields')
      .optional()
      .isArray()
      .withMessage('fields deve ser array'),
    body('fields.*')
      .optional()
      .isString()
      .withMessage('Cada field deve ser string'),
  ],
  handleValidationErrors,
  BulkItemController.getBulk
);

export default router;
