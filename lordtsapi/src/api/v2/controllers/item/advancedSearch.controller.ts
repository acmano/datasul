/**
 * Advanced Search Controller - API v2
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { AdvancedSearchService, SearchFilters } from '../../services/item/advancedSearch.service';

export class AdvancedSearchController {
  static search = asyncHandler(async (req: Request, res: Response) => {
    const filters: SearchFilters = {
      q: req.query.q as string | undefined,
      familia: req.query.familia as string | undefined,
      grupoEstoque: req.query.grupoEstoque as string | undefined,
      situacao: req.query.situacao as 'A' | 'I' | undefined,
      sort: (req.query.sort as string) || 'codigo',
      order: (req.query.order as 'asc' | 'desc') || 'asc',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await AdvancedSearchService.search(filters, req.id);

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });
  });
}
