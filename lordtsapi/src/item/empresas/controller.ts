// src/item/itemEmpresas/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ItemEmpresasService } from './service';
import { ItemEmpresasParams } from './types';

export class ItemEmpresasController {
  static async getItemEmpresas(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const params: ItemEmpresasParams = {
        codigo: req.query.codigo as string,
      };

      const result = await ItemEmpresasService.getItemEmpresas(params);

      res.status(200).json(result);
    } catch (error) {
      _next(error);
    }
  }
}
