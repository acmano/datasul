// src/item/search/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ItemSearchService } from './service';
import { ItemSearchParams } from './types';

export class ItemSearchController {
  static async searchItems(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // Normalizar tipoItem: converter string única para array
      const params: ItemSearchParams = {
        ...req.query,
        tipoItem: req.query.tipoItem
          ? Array.isArray(req.query.tipoItem)
            ? (req.query.tipoItem as string[])
            : [req.query.tipoItem as string]
          : undefined,
      };

      const result = await ItemSearchService.searchItems(params);

      res.status(200).json(result);
    } catch (error) {
      _next(error);
    }
  }
}
