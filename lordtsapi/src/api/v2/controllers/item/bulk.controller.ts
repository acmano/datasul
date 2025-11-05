/**
 * Bulk Item Controller - API v2
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { BulkItemService } from '../../services/item/bulk.service';
import { log } from '@shared/utils/logger';

interface BulkItemRequest {
  codigos: string[];
  fields?: string[];
}

interface BulkItemResponse {
  success: boolean;
  data: {
    items: any[];
    notFound: string[];
    count: number;
  };
  correlationId: string;
  cached?: boolean;
}

export class BulkItemController {
  /**
   * POST /api/v2/item/bulk
   * Busca múltiplos itens em uma requisição
   */
  static getBulk = asyncHandler(
    async (req: Request<{}, any, BulkItemRequest>, res: Response<BulkItemResponse>) => {
      const { codigos, fields } = req.body;

      log.info('Bulk item request', {
        correlationId: req.id,
        count: codigos.length,
        fields: fields || 'all',
      });

      const result = await BulkItemService.getBulk(codigos, fields, req.id);

      const response: BulkItemResponse = {
        success: true,
        data: result,
        correlationId: req.id,
      };

      res.json(response);
    }
  );
}
