/**
 * Export Routes - API v2
 * Exportação de dados para Excel e CSV
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { handleValidationErrors } from '@shared/middlewares/validationErrors.middleware';
import { ExportController } from '../../controllers/item/export.controller';

const router = Router();

/**
 * @openapi
 * /api/v2/item/export/excel:
 *   get:
 *     summary: Exporta itens para Excel
 *     description: |
 *       Gera arquivo Excel (.xlsx) com dados dos itens.
 *       Suporta filtros similares ao advanced-search.
 *     tags:
 *       - Item - Export (v2)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Filtro de busca
 *       - in: query
 *         name: familia
 *         schema:
 *           type: string
 *         description: Filtro de família
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 10000
 *         description: Máximo de registros (padrão 1000, máx 10000)
 *     responses:
 *       200:
 *         description: Arquivo Excel gerado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/excel',
  [
    query('q').optional().isString().trim(),
    query('familia').optional().isString().trim(),
    query('grupoEstoque').optional().isString().trim(),
    query('situacao').optional().isIn(['A', 'I']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Limite deve ser entre 1 e 10000')
      .toInt(),
  ],
  handleValidationErrors,
  ExportController.exportExcel
);

/**
 * @openapi
 * /api/v2/item/export/csv:
 *   get:
 *     summary: Exporta itens para CSV
 *     description: Gera arquivo CSV com dados dos itens
 *     tags:
 *       - Item - Export (v2)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: familia
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 10000
 *     responses:
 *       200:
 *         description: Arquivo CSV gerado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/csv',
  [
    query('q').optional().isString().trim(),
    query('familia').optional().isString().trim(),
    query('grupoEstoque').optional().isString().trim(),
    query('situacao').optional().isIn(['A', 'I']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .toInt(),
  ],
  handleValidationErrors,
  ExportController.exportCSV
);

export default router;
