// src/familiaComercial/listar/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ListarService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class ListarController {
  static listarTodas = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const familiasComerciais = await ListarService.listarTodas();

    res.json({
      success: true,
      data: familiasComerciais,
      total: familiasComerciais.length,
    });
  });
}
