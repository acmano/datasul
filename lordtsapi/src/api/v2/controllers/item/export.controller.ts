/**
 * Export Controller - API v2
 * NOTA: Requer instalação de: npm install exceljs csv-stringify
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { ExportService } from '../../services/item/export.service';
import { SearchFilters } from '../../services/item/advancedSearch.service';

export class ExportController {
  /**
   * GET /api/v2/item/export/excel
   * Exporta itens para Excel
   */
  static exportExcel = asyncHandler(async (req: Request, res: Response) => {
    const filters: SearchFilters = {
      q: req.query.q as string | undefined,
      familia: req.query.familia as string | undefined,
      grupoEstoque: req.query.grupoEstoque as string | undefined,
      situacao: req.query.situacao as 'A' | 'I' | undefined,
      limit: parseInt(req.query.limit as string) || 1000,
    };

    const buffer = await ExportService.exportToExcel(filters, req.id);

    // Define headers para download
    const filename = `itens_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  });

  /**
   * GET /api/v2/item/export/csv
   * Exporta itens para CSV
   */
  static exportCSV = asyncHandler(async (req: Request, res: Response) => {
    const filters: SearchFilters = {
      q: req.query.q as string | undefined,
      familia: req.query.familia as string | undefined,
      grupoEstoque: req.query.grupoEstoque as string | undefined,
      situacao: req.query.situacao as 'A' | 'I' | undefined,
      limit: parseInt(req.query.limit as string) || 1000,
    };

    const csv = await ExportService.exportToCSV(filters, req.id);

    // Define headers para download
    const filename = `itens_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Adiciona BOM para Excel reconhecer UTF-8
    res.write('\uFEFF');
    res.send(csv);
  });
}
